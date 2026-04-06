import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../services/ble_service.dart';

class OnboardingBleRequiredScreen extends StatefulWidget {
  const OnboardingBleRequiredScreen({super.key});

  @override
  State<OnboardingBleRequiredScreen> createState() => _OnboardingBleRequiredScreenState();
}

class _OnboardingBleRequiredScreenState extends State<OnboardingBleRequiredScreen> {
  StreamSubscription<BleStatus>? _statusSub;
  bool _isBluetoothOn = false;
  bool _isChecking = true;

  @override
  void initState() {
    super.initState();
    _checkBluetooth();
  }

  @override
  void dispose() {
    _statusSub?.cancel();
    super.dispose();
  }

  Future<void> _checkBluetooth() async {
    final ble = BleService.instance;
    
    // Слушаем изменения статуса Bluetooth
    _statusSub = ble.statusStream.listen((status) {
      if (!mounted) return;
      final isOn = status == BleStatus.ready;
      setState(() {
        _isBluetoothOn = isOn;
        _isChecking = false;
      });
      
      // Если включился - переходим к сканированию
      if (isOn) {
        Future.delayed(const Duration(milliseconds: 500), () {
          if (mounted) {
            context.go('/onboarding/ble');
          }
        });
      }
    });

    // Проверяем текущее состояние
    final isOn = await ble.checkBluetoothState();
    if (!mounted) return;
    setState(() {
      _isBluetoothOn = isOn;
      _isChecking = false;
    });

    // Если уже включен - переходим
    if (isOn) {
      Future.delayed(const Duration(milliseconds: 500), () {
        if (mounted) {
          context.go('/onboarding/ble');
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Spacer(),
              // Bluetooth иконка
              Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  color: _isBluetoothOn 
                      ? const Color(0xFF4CAF50).withValues(alpha: 0.1)
                      : const Color(0xFFEF4444).withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.bluetooth,
                  size: 60,
                  color: _isBluetoothOn 
                      ? const Color(0xFF4CAF50)
                      : const Color(0xFFEF4444),
                ),
              ),
              const SizedBox(height: 32),
              Text(
                _isChecking 
                    ? 'Проверка...'
                    : _isBluetoothOn 
                        ? 'Bluetooth включён'
                        : 'Bluetooth выключен',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                _isBluetoothOn 
                    ? 'Подключаемся к устройству...'
                    : 'Включите Bluetooth для работы с LoRa модулем',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: isDark ? const Color(0xFF8E8E93) : const Color(0xFF8E8E93),
                ),
              ),
              const Spacer(),
              if (!_isBluetoothOn && !_isChecking) ...[
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () {
                      // Проверяем снова
                      _checkBluetooth();
                    },
                    icon: const Icon(Icons.refresh),
                    label: const Text('Проверить снова'),
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
                const SizedBox(height: 12),
                Text(
                  'Также можно включить Bluetooth\nв настройках устройства',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: isDark ? const Color(0xFF4A5568) : const Color(0xFFA0AEC0),
                  ),
                ),
              ],
              if (_isChecking || _isBluetoothOn)
                const Padding(
                  padding: EdgeInsets.all(20),
                  child: CircularProgressIndicator(),
                ),
              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }
}
