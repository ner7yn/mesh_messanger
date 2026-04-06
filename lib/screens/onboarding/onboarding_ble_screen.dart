import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/i18n/app_i18n.dart';
import '../../services/ble_service.dart';

class OnboardingBleScreen extends StatefulWidget {
  const OnboardingBleScreen({super.key});

  @override
  State<OnboardingBleScreen> createState() => _OnboardingBleScreenState();
}

class _OnboardingBleScreenState extends State<OnboardingBleScreen> {
  final _ble = BleService.instance;
  final List<BleDeviceLite> _devices = [];
  StreamSubscription<BleDeviceLite>? _scanSub;
  bool _scanning = false;
  String? _connectingId;

  @override
  void dispose() {
    _scanSub?.cancel();
    _ble.stopScan();
    super.dispose();
  }

  Future<void> _startScan() async {
    final t = AppI18n.of(context);
    
    // Проверяем Bluetooth
    final isOn = await _ble.checkBluetoothState();
    debugPrint('Bluetooth включён: $isOn');
    
    if (!isOn) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${t.t('not_connected')} - включите Bluetooth'),
          duration: const Duration(seconds: 3),
        ),
      );
      return;
    }

    final granted = true;
    debugPrint('Разрешения получены: $granted');
    
    if (!granted) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${t.t('not_connected')} - нужны разрешения'),
          duration: const Duration(seconds: 3),
        ),
      );
      return;
    }

    setState(() {
      _devices.clear();
      _scanning = true;
    });

    _scanSub?.cancel();
    _scanSub = _ble.scan().listen((d) {
      debugPrint('Найдено устройство: ${d.name} (${d.id}) RSSI: ${d.rssi}');
      if (!mounted) return;
      if (_devices.any((e) => e.id == d.id)) return;
      setState(() => _devices.add(d));
    }, onDone: () {
      debugPrint('Сканирование завершено');
      if (!mounted) return;
      setState(() => _scanning = false);
    }, onError: (e) {
      debugPrint('Ошибка сканирования: $e');
      if (!mounted) return;
      setState(() => _scanning = false);
    });
  }

  Future<void> _connect(BleDeviceLite d) async {
    setState(() => _connectingId = d.id);
    final ok = await _ble.connect(d.id);
    if (!mounted) return;
    if (ok) {
      context.go('/onboarding/nickname?deviceId=${Uri.encodeComponent(d.id)}');
    } else {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Не удалось подключиться')));
      setState(() => _connectingId = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AppI18n.of(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 40),
              // Logo
              Center(
                child: Container(
                  width: 100,
                  height: 100,
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.primary,
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.3),
                        blurRadius: 20,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.hub,
                    size: 50,
                    color: Colors.white,
                  ),
                ),
              ),
              const SizedBox(height: 32),
              Center(
                child: Text(
                  'MeshTalk',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
              ),
              const SizedBox(height: 8),
              Center(
                child: Text(
                  'Защищённый мессенджер\nчерез LoRa mesh сеть',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        color: isDark ? const Color(0xFF8E8E93) : const Color(0xFF8E8E93),
                      ),
                ),
              ),
              const SizedBox(height: 48),
              Text(
                'Подключение устройства',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
              ),
              const SizedBox(height: 8),
              Text(
                'Выберите BLE контроллер с LoRa модулем',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: isDark ? const Color(0xFF8E8E93) : const Color(0xFF8E8E93),
                    ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: _scanning ? null : _startScan,
                  icon: _scanning
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : const Icon(Icons.bluetooth_searching),
                  label: Text(_scanning ? 'Сканирование...' : 'Сканировать устройства'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Theme.of(context).colorScheme.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              // Device list
              Expanded(
                child: _devices.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.bluetooth_disabled,
                              size: 48,
                              color: isDark ? const Color(0xFF4A5568) : const Color(0xFFCBD5E0),
                            ),
                            const SizedBox(height: 12),
                            Text(
                              _scanning ? 'Поиск устройств...' : 'Нажмите "Сканировать"',
                              style: TextStyle(
                                color: isDark ? const Color(0xFF8E8E93) : const Color(0xFF8E8E93),
                              ),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        itemCount: _devices.length,
                        itemBuilder: (context, i) {
                          final d = _devices[i];
                          final connecting = _connectingId == d.id;
                          return Container(
                            margin: const EdgeInsets.only(bottom: 8),
                            decoration: BoxDecoration(
                              color: isDark ? const Color(0xFF17212C) : Colors.white,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: isDark ? const Color(0xFF2B3A4A) : const Color(0xFFE0E0E0),
                              ),
                            ),
                            child: ListTile(
                              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                              leading: Container(
                                width: 44,
                                height: 44,
                                decoration: BoxDecoration(
                                  color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Icon(
                                  Icons.memory,
                                  color: Theme.of(context).colorScheme.primary,
                                ),
                              ),
                              title: Text(
                                d.name,
                                style: const TextStyle(fontWeight: FontWeight.w600),
                              ),
                              subtitle: Text(
                                'Сигнал: ${_signalStrength(d.rssi ?? -100)}',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: isDark ? const Color(0xFF8E8E93) : const Color(0xFF8E8E93),
                                ),
                              ),
                              trailing: connecting
                                  ? const SizedBox(
                                      width: 24,
                                      height: 24,
                                      child: CircularProgressIndicator(strokeWidth: 2),
                                    )
                                  : Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                      decoration: BoxDecoration(
                                        color: Theme.of(context).colorScheme.primary,
                                        borderRadius: BorderRadius.circular(20),
                                      ),
                                      child: const Text(
                                        'Подкл.',
                                        style: TextStyle(
                                          color: Colors.white,
                                          fontWeight: FontWeight.w600,
                                          fontSize: 13,
                                        ),
                                      ),
                                    ),
                              onTap: connecting ? null : () => _connect(d),
                            ),
                          );
                        },
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _signalStrength(int rssi) {
    if (rssi > -50) return 'Отлично';
    if (rssi > -70) return 'Хорошо';
    if (rssi > -85) return 'Средне';
    return 'Слабый';
  }
}
