import 'dart:convert';

import 'package:cryptography/cryptography.dart';

class KeyPairEnvelope {
  final String publicKeyBase64;
  final String privateKeyBase64;

  const KeyPairEnvelope({required this.publicKeyBase64, required this.privateKeyBase64});
}

class EncryptedEnvelope {
  final String nonce;
  final String cipherText;
  final String mac;
  final String senderPublicKey;

  const EncryptedEnvelope({
    required this.nonce,
    required this.cipherText,
    required this.mac,
    required this.senderPublicKey,
  });

  Map<String, dynamic> toJson() => {
        'nonce': nonce,
        'cipherText': cipherText,
        'mac': mac,
        'senderPublicKey': senderPublicKey,
      };

  factory EncryptedEnvelope.fromJson(Map<dynamic, dynamic> json) => EncryptedEnvelope(
        nonce: json['nonce'] as String,
        cipherText: json['cipherText'] as String,
        mac: json['mac'] as String,
        senderPublicKey: json['senderPublicKey'] as String,
      );
}

class CryptoService {
  static final X25519 _x25519 = X25519();
  static final Chacha20 _chacha = Chacha20.poly1305Aead();

  static Future<KeyPairEnvelope> generateKeyPair() async {
    final keyPair = await _x25519.newKeyPair();
    final private = await keyPair.extractPrivateKeyBytes();
    final public = await keyPair.extractPublicKey();

    return KeyPairEnvelope(
      publicKeyBase64: base64Encode(public.bytes),
      privateKeyBase64: base64Encode(private),
    );
  }

  static Future<EncryptedEnvelope> encryptForRecipient({
    required String plainText,
    required String recipientPublicKeyBase64,
    required String senderPrivateKeyBase64,
    required String senderPublicKeyBase64,
  }) async {
    final recipientPublic = SimplePublicKey(base64Decode(recipientPublicKeyBase64), type: KeyPairType.x25519);
    final senderPrivate = SimpleKeyPairData(
      base64Decode(senderPrivateKeyBase64),
      publicKey: SimplePublicKey(base64Decode(senderPublicKeyBase64), type: KeyPairType.x25519),
      type: KeyPairType.x25519,
    );

    final sharedSecret = await _x25519.sharedSecretKey(keyPair: senderPrivate, remotePublicKey: recipientPublic);
    final nonce = _chacha.newNonce();

    final secretBox = await _chacha.encrypt(
      utf8.encode(plainText),
      secretKey: sharedSecret,
      nonce: nonce,
    );

    return EncryptedEnvelope(
      nonce: base64Encode(secretBox.nonce),
      cipherText: base64Encode(secretBox.cipherText),
      mac: base64Encode(secretBox.mac.bytes),
      senderPublicKey: senderPublicKeyBase64,
    );
  }

  static Future<String?> decryptFromSender({
    required EncryptedEnvelope envelope,
    required String recipientPrivateKeyBase64,
    required String recipientPublicKeyBase64,
  }) async {
    try {
      final recipientPrivate = SimpleKeyPairData(
        base64Decode(recipientPrivateKeyBase64),
        publicKey: SimplePublicKey(base64Decode(recipientPublicKeyBase64), type: KeyPairType.x25519),
        type: KeyPairType.x25519,
      );

      final senderPublic = SimplePublicKey(base64Decode(envelope.senderPublicKey), type: KeyPairType.x25519);

      final sharedSecret = await _x25519.sharedSecretKey(
        keyPair: recipientPrivate,
        remotePublicKey: senderPublic,
      );

      final box = SecretBox(
        base64Decode(envelope.cipherText),
        nonce: base64Decode(envelope.nonce),
        mac: Mac(base64Decode(envelope.mac)),
      );

      final clear = await _chacha.decrypt(box, secretKey: sharedSecret);
      return utf8.decode(clear);
    } catch (_) {
      return null;
    }
  }

}
