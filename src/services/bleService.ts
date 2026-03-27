import {BleManager, Device} from 'react-native-ble-plx';

const bleManager = new BleManager();

export const scanAndConnectController = async (): Promise<Device> => {
  return new Promise((resolve, reject) => {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    const stopWithError = (error: Error) => {
      bleManager.stopDeviceScan();
      if (timeout) {
        clearTimeout(timeout);
      }
      reject(error);
    };

    timeout = setTimeout(() => {
      stopWithError(new Error('BLE controller not found'));
    }, 12000);

    bleManager.startDeviceScan(null, null, async (error, device) => {
      if (error) {
        stopWithError(error);
        return;
      }

      if (!device?.name?.toLowerCase().includes('lora')) {
        return;
      }

      bleManager.stopDeviceScan();
      if (timeout) {
        clearTimeout(timeout);
      }

      try {
        const connected = await device.connect();
        await connected.discoverAllServicesAndCharacteristics();
        resolve(connected);
      } catch (connectError) {
        reject(connectError as Error);
      }
    });
  });
};
