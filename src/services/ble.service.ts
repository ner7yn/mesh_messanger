// src/services/ble.service.ts
// BLE service using react-native-ble-plx
// Handles connection to LoRa BLE controller (e.g. Heltec, TTGO T-Beam, RAK4631)

import {
  BleManager,
  Device,
  State,
  Characteristic,
  BleError,
  LogLevel,
} from 'react-native-ble-plx';
import { Platform, PermissionsAndroid } from 'react-native';
import { Buffer } from 'buffer';

// Standard Nordic UART Service (NUS) - commonly used for LoRa BLE modules
const UART_SERVICE_UUID = '6E400001-B5A3-F393-E0A9-E50E24DCCA9E';
const UART_TX_CHAR_UUID = '6E400002-B5A3-F393-E0A9-E50E24DCCA9E'; // Write
const UART_RX_CHAR_UUID = '6E400003-B5A3-F393-E0A9-E50E24DCCA9E'; // Notify/Read

// Alternative service UUIDs for various LoRa BLE controllers
const LORA_SERVICE_UUID = '4FAFC201-1FB5-459E-8FCC-C5C9C331914B';
const LORA_CHAR_UUID = 'BEB5483E-36E1-4688-B7F5-EA07361B26A8';

export type BLEConnectionState =
  | 'idle'
  | 'scanning'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error';

export interface BLEDevice {
  id: string;
  name: string | null;
  rssi: number | null;
  isLoRa: boolean;
}

export type MessageReceivedCallback = (raw: string) => void;
export type ConnectionStateCallback = (state: BLEConnectionState, deviceId?: string) => void;

class BLEService {
  private manager: BleManager;
  private connectedDevice: Device | null = null;
  private connectionState: BLEConnectionState = 'idle';
  private messageCallbacks: Set<MessageReceivedCallback> = new Set();
  private stateCallbacks: Set<ConnectionStateCallback> = new Set();
  private scanTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.manager = new BleManager();
    if (__DEV__) {
      this.manager.setLogLevel(LogLevel.Verbose);
    }
  }

  // ─── Permissions ───────────────────────────────────────────────────────────

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      return true; // iOS handles permissions via Info.plist
    }

    if (Platform.OS === 'android') {
      const apiLevel = parseInt(Platform.Version as string, 10);

      if (apiLevel >= 31) {
        // Android 12+
        const results = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        return (
          results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === 'granted' &&
          results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === 'granted'
        );
      } else {
        // Android < 12
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        return result === 'granted';
      }
    }

    return false;
  }

  // ─── BLE State ─────────────────────────────────────────────────────────────

  async waitForPoweredOn(): Promise<boolean> {
    return new Promise(resolve => {
      this.manager.onStateChange(state => {
        if (state === State.PoweredOn) {
          resolve(true);
        } else if (state === State.PoweredOff || state === State.Unauthorized) {
          resolve(false);
        }
      }, true);
    });
  }

  // ─── Scanning ──────────────────────────────────────────────────────────────

  async startScan(
    onDeviceFound: (device: BLEDevice) => void,
    timeout = 15000,
  ): Promise<void> {
    this.setConnectionState('scanning');

    const found = new Map<string, BLEDevice>();

    // Scan for all devices or specifically for UART service
    this.manager.startDeviceScan(
      null, // null = all services; pass [UART_SERVICE_UUID] to filter
      { allowDuplicates: false },
      (error: BleError | null, device: Device | null) => {
        if (error) {
          console.error('[BLE] Scan error:', error);
          this.setConnectionState('error');
          return;
        }

        if (device && device.name) {
          const bleDevice: BLEDevice = {
            id: device.id,
            name: device.name,
            rssi: device.rssi,
            isLoRa: this.isLoRaDevice(device),
          };

          if (!found.has(device.id)) {
            found.set(device.id, bleDevice);
            onDeviceFound(bleDevice);
          }
        }
      },
    );

    // Auto-stop scan after timeout
    this.scanTimeout = setTimeout(() => {
      this.stopScan();
    }, timeout);
  }

  stopScan(): void {
    if (this.scanTimeout) {
      clearTimeout(this.scanTimeout);
      this.scanTimeout = null;
    }
    this.manager.stopDeviceScan();
    if (this.connectionState === 'scanning') {
      this.setConnectionState('idle');
    }
  }

  private isLoRaDevice(device: Device): boolean {
    const name = (device.name || '').toLowerCase();
    // Common LoRa BLE module names
    const loraKeywords = [
      'meshtastic', 'heltec', 'ttgo', 't-beam', 'rak',
      'lora', 'lorap2p', 'mesh', 'sx127', 'sx126',
    ];
    return loraKeywords.some(kw => name.includes(kw));
  }

  // ─── Connection ────────────────────────────────────────────────────────────

  async connect(deviceId: string): Promise<boolean> {
    this.stopScan();
    this.setConnectionState('connecting');

    try {
      const device = await this.manager.connectToDevice(deviceId, {
        requestMTU: 512,
        timeout: 10000,
      });

      await device.discoverAllServicesAndCharacteristics();

      this.connectedDevice = device;
      this.setConnectionState('connected', deviceId);

      // Setup disconnect handler
      device.onDisconnected(() => {
        this.connectedDevice = null;
        this.setConnectionState('disconnected');
      });

      // Subscribe to incoming messages (RX characteristic)
      await this.subscribeToRX(device);

      return true;
    } catch (error) {
      console.error('[BLE] Connection error:', error);
      this.setConnectionState('error');
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.connectedDevice) {
      try {
        await this.connectedDevice.cancelConnection();
      } catch (e) {
        // Ignore errors on disconnect
      }
      this.connectedDevice = null;
      this.setConnectionState('disconnected');
    }
  }

  // ─── RX (Receive) ──────────────────────────────────────────────────────────

  private async subscribeToRX(device: Device): Promise<void> {
    // Try UART service first
    const services = await device.services();

    let serviceUUID = UART_SERVICE_UUID;
    let rxCharUUID = UART_RX_CHAR_UUID;

    for (const service of services) {
      const suuid = service.uuid.toUpperCase();
      if (suuid === UART_SERVICE_UUID.toUpperCase()) {
        serviceUUID = UART_SERVICE_UUID;
        rxCharUUID = UART_RX_CHAR_UUID;
        break;
      }
      if (suuid === LORA_SERVICE_UUID.toUpperCase()) {
        serviceUUID = LORA_SERVICE_UUID;
        rxCharUUID = LORA_CHAR_UUID;
        break;
      }
    }

    device.monitorCharacteristicForService(
      serviceUUID,
      rxCharUUID,
      (error: BleError | null, characteristic: Characteristic | null) => {
        if (error) {
          console.error('[BLE] RX monitor error:', error);
          return;
        }
        if (characteristic?.value) {
          const raw = Buffer.from(characteristic.value, 'base64').toString('utf8');
          this.onMessageReceived(raw);
        }
      },
    );
  }

  private onMessageReceived(raw: string): void {
    this.messageCallbacks.forEach(cb => cb(raw));
  }

  // ─── TX (Send) ─────────────────────────────────────────────────────────────

  async sendRawMessage(data: string): Promise<boolean> {
    if (!this.connectedDevice) {
      console.warn('[BLE] Not connected, cannot send');
      return false;
    }

    try {
      const services = await this.connectedDevice.services();
      let serviceUUID = UART_SERVICE_UUID;
      let txCharUUID = UART_TX_CHAR_UUID;

      for (const service of services) {
        const suuid = service.uuid.toUpperCase();
        if (suuid === LORA_SERVICE_UUID.toUpperCase()) {
          serviceUUID = LORA_SERVICE_UUID;
          txCharUUID = LORA_CHAR_UUID;
          break;
        }
      }

      const base64Data = Buffer.from(data, 'utf8').toString('base64');

      // BLE MTU limit: chunk large messages
      const CHUNK_SIZE = 200;
      for (let i = 0; i < base64Data.length; i += CHUNK_SIZE) {
        const chunk = base64Data.slice(i, i + CHUNK_SIZE);
        await this.connectedDevice.writeCharacteristicWithResponseForService(
          serviceUUID,
          txCharUUID,
          chunk,
        );
        // Small delay between chunks
        if (i + CHUNK_SIZE < base64Data.length) {
          await new Promise(r => setTimeout(r, 50));
        }
      }

      return true;
    } catch (error) {
      console.error('[BLE] Send error:', error);
      return false;
    }
  }

  // ─── Callbacks ─────────────────────────────────────────────────────────────

  onMessage(callback: MessageReceivedCallback): () => void {
    this.messageCallbacks.add(callback);
    return () => this.messageCallbacks.delete(callback);
  }

  onConnectionStateChange(callback: ConnectionStateCallback): () => void {
    this.stateCallbacks.add(callback);
    return () => this.stateCallbacks.delete(callback);
  }

  private setConnectionState(state: BLEConnectionState, deviceId?: string): void {
    this.connectionState = state;
    this.stateCallbacks.forEach(cb => cb(state, deviceId));
  }

  // ─── Getters ───────────────────────────────────────────────────────────────

  getConnectionState(): BLEConnectionState {
    return this.connectionState;
  }

  getConnectedDevice(): Device | null {
    return this.connectedDevice;
  }

  isConnected(): boolean {
    return this.connectionState === 'connected' && this.connectedDevice !== null;
  }

  destroy(): void {
    this.stopScan();
    this.manager.destroy();
  }
}

// Singleton
export const bleService = new BLEService();
