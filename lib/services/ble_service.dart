import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter_reactive_ble/flutter_reactive_ble.dart';
import 'package:permission_handler/permission_handler.dart';

enum BleStatus { ready, unauthorized, unsupported, poweredOff, unknown }

class BleDeviceLite {
  final String id;
  final String name;
  final int? rssi;

  const BleDeviceLite({required this.id, required this.name, required this.rssi});
}

class BleService {
  BleService._();
  static final BleService instance = BleService._();

  static final Uuid nusService = Uuid.parse('6E400001-B5A3-F393-E0A9-E50E24DCCA9E');
  static final Uuid nusTx = Uuid.parse('6E400002-B5A3-F393-E0A9-E50E24DCCA9E'); // write
  static final Uuid nusRx = Uuid.parse('6E400003-B5A3-F393-E0A9-E50E24DCCA9E'); // notify

  final FlutterReactiveBle _ble = FlutterReactiveBle();
  StreamSubscription<DiscoveredDevice>? _scanSub;
  StreamSubscription<ConnectionStateUpdate>? _connSub;
  StreamSubscription<List<int>>? _rxSub;

  String? _connectedDeviceId;
  bool _isBluetoothOn = false;
  final _incomingController = StreamController<String>.broadcast();
  final _statusController = StreamController<BleStatus>.broadcast();

  Stream<String> get incomingMessages => _incomingController.stream;
  Stream<BleStatus> get statusStream => _statusController.stream;
  String? get connectedDeviceId => _connectedDeviceId;
  bool get isBluetoothOn => _isBluetoothOn;
  bool get isConnected => _connectedDeviceId != null;

  Future<bool> checkBluetoothState() async {
    try {
      debugPrint('Проверка состояния Bluetooth...');
      // Пытаемся инициализировать и проверить состояние
      await _ble.initialize();
      debugPrint('Bluetooth инициализирован успешно');
      _isBluetoothOn = true;
      _statusController.add(BleStatus.ready);
      return true;
    } catch (e) {
      debugPrint('Ошибка инициализации Bluetooth: $e');
      _isBluetoothOn = false;
      _statusController.add(BleStatus.poweredOff);
      return false;
    }
  }

  Future<bool> requestPermissions() async {
    debugPrint('Запрос разрешений...');
    
    // На iOS разрешения запрашиваются системой автоматически при первом использовании
    // Проверяем текущий статус
    final bluetoothScan = await Permission.bluetoothScan.status;
    final bluetoothConnect = await Permission.bluetoothConnect.status;
    final location = await Permission.locationWhenInUse.status;
    
    debugPrint('Статус разрешений: bluetoothScan=$bluetoothScan, connect=$bluetoothConnect, location=$location');
    
    // Если что-то не разрешено - пробуем запросить
    if (!bluetoothScan.isGranted || !bluetoothConnect.isGranted || !location.isGranted) {
      // Пробуем запросить
      await Permission.bluetoothScan.request();
      await Permission.bluetoothConnect.request();
      await Permission.locationWhenInUse.request();
      
      // Проверяем снова
      final newBluetoothScan = await Permission.bluetoothScan.status;
      final newBluetoothConnect = await Permission.bluetoothConnect.status;
      final newLocation = await Permission.locationWhenInUse.status;
      
      debugPrint('После запроса: bluetoothScan=$newBluetoothScan, connect=$newBluetoothConnect, location=$newLocation');
      
      // Если по-прежнему denied - открываем настройки
      if (newBluetoothScan.isPermanentlyDenied || newBluetoothConnect.isPermanentlyDenied || newLocation.isPermanentlyDenied) {
        await openAppSettings();
        return false;
      }
      
      return newBluetoothScan.isGranted && newBluetoothConnect.isGranted && newLocation.isGranted;
    }
    
    return true;
  }

  Stream<BleDeviceLite> scan({Duration timeout = const Duration(seconds: 12)}) {
    final controller = StreamController<BleDeviceLite>();
    final seen = <String>{};

    debugPrint('Начало сканирования BLE устройств...');
    
    _scanSub?.cancel();
    _scanSub = _ble
        .scanForDevices(withServices: [])
        .timeout(timeout)
        .listen((device) {
      debugPrint('Найдено BLE устройство: name=${device.name}, id=${device.id}, rssi=${device.rssi}');
      if (seen.contains(device.id)) return;
      final name = device.name.trim();
      if (name.isEmpty) return; // показываем только устройства с именем

      seen.add(device.id);
      controller.add(BleDeviceLite(
        id: device.id,
        name: name,
        rssi: device.rssi,
      ));
    }, onError: (e) {
      debugPrint('Ошибка при сканировании: $e');
      controller.addError(e);
    }, onDone: () async {
      debugPrint('Сканирование завершено');
      await controller.close();
    });

    return controller.stream;
  }

  Future<void> stopScan() async {
    await _scanSub?.cancel();
    _scanSub = null;
  }

  Future<bool> connect(String deviceId) async {
    final completer = Completer<bool>();
    
    try {
      await _connSub?.cancel();
      
      final stream = _ble.connectToDevice(
        id: deviceId, 
        connectionTimeout: const Duration(seconds: 10)
      );
      
      _connSub = stream.listen((event) async {
        if (event.connectionState == DeviceConnectionState.connected) {
          debugPrint('Подключено к $deviceId, discovering services...');
          _connectedDeviceId = deviceId;
          
          // На iOS нужно явно обнаружить сервисы
          try {
            await _ble.discoverServices(deviceId);
            debugPrint('Services discovered');
          } catch (e) {
            debugPrint('Discover services error: $e');
          }
          
          // Небольшая задержка для iOS
          await Future.delayed(const Duration(milliseconds: 500));
          
          _subscribeNusRx(deviceId);
          if (!completer.isCompleted) {
            completer.complete(true);
          }
        }
        if (event.connectionState == DeviceConnectionState.disconnected) {
          _connectedDeviceId = null;
          if (!completer.isCompleted) {
            completer.complete(false);
          }
        }
      });

      // Ждём подключение или таймаут
      final result = await completer.future.timeout(
        const Duration(seconds: 10),
        onTimeout: () => _connectedDeviceId != null,
      );
      return result;
    } catch (e) {
      debugPrint('BLE connect error: $e');
      _connectedDeviceId = null;
      return false;
    }
  }

  Future<void> _subscribeNusRx(String deviceId) async {
    await _rxSub?.cancel();
    final rx = QualifiedCharacteristic(
      serviceId: nusService,
      characteristicId: nusRx,
      deviceId: deviceId,
    );

    _rxSub = _ble.subscribeToCharacteristic(rx).listen((bytes) {
      final text = utf8.decode(bytes, allowMalformed: true);
      if (text.isNotEmpty) {
        _incomingController.add(text);
      }
    });
  }

  Future<bool> sendRaw(String data) async {
    final id = _connectedDeviceId;
    if (id == null) return false;

    try {
      final tx = QualifiedCharacteristic(
        serviceId: nusService,
        characteristicId: nusTx,
        deviceId: id,
      );
      final bytes = utf8.encode(data);

      const mtuChunk = 180;
      for (var i = 0; i < bytes.length; i += mtuChunk) {
        final end = (i + mtuChunk > bytes.length) ? bytes.length : i + mtuChunk;
        await _ble.writeCharacteristicWithResponse(tx, value: bytes.sublist(i, end));
      }
      return true;
    } catch (_) {
      return false;
    }
  }
}
