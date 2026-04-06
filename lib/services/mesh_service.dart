import 'dart:convert';

import 'package:uuid/uuid.dart';

import '../models/friend.dart';
import '../models/mesh_packet.dart';
import 'ble_service.dart';
import 'crypto_service.dart';

typedef PacketHandler = Future<void> Function(MeshPacket packet);

class MeshService {
  MeshService._();
  static final MeshService instance = MeshService._();

  final _uuid = const Uuid();
  PacketHandler? _handler;

  void startListening(PacketHandler handler) {
    _handler = handler;
    BleService.instance.incomingMessages.listen((raw) async {
      try {
        final packet = MeshPacket.fromJson(jsonDecode(raw) as Map<String, dynamic>);
        if (_handler != null) {
          await _handler!(packet);
        }
      } catch (_) {
        // ignore malformed
      }
    });
  }

  Future<MeshPacket?> createMessagePacket({
    required String myNodeId,
    required String myPublicKey,
    required String myPrivateKey,
    required FriendModel friend,
    required String plainText,
  }) async {
    final envelope = await CryptoService.encryptForRecipient(
      plainText: plainText,
      recipientPublicKeyBase64: friend.publicKey,
      senderPrivateKeyBase64: myPrivateKey,
      senderPublicKeyBase64: myPublicKey,
    );

    final packet = MeshPacket(
      type: PacketType.msg,
      id: _uuid.v4(),
      src: myNodeId,
      dst: friend.nodeId,
      ts: DateTime.now().millisecondsSinceEpoch,
      payload: jsonEncode(envelope.toJson()),
    );

    return packet;
  }

  Future<bool> sendPacket(MeshPacket packet) {
    return BleService.instance.sendRaw(jsonEncode(packet.toJson()));
  }

  Future<void> sendAck({required String myNodeId, required String toNodeId, required String refPacketId}) {
    final packet = MeshPacket(
      type: PacketType.ack,
      id: _uuid.v4(),
      src: myNodeId,
      dst: toNodeId,
      ts: DateTime.now().millisecondsSinceEpoch,
      payload: '{}',
      refPacketId: refPacketId,
    );
    return sendPacket(packet);
  }

  Future<void> sendRead({required String myNodeId, required String toNodeId, required String refPacketId}) {
    final packet = MeshPacket(
      type: PacketType.read,
      id: _uuid.v4(),
      src: myNodeId,
      dst: toNodeId,
      ts: DateTime.now().millisecondsSinceEpoch,
      payload: '{}',
      refPacketId: refPacketId,
    );
    return sendPacket(packet);
  }

  Future<String?> decryptIncomingPayload({
    required String rawPayload,
    required String myPrivateKey,
    required String myPublicKey,
  }) async {
    try {
      final env = EncryptedEnvelope.fromJson(jsonDecode(rawPayload) as Map<String, dynamic>);
      return CryptoService.decryptFromSender(
        envelope: env,
        recipientPrivateKeyBase64: myPrivateKey,
        recipientPublicKeyBase64: myPublicKey,
      );
    } catch (_) {
      return null;
    }
  }
}
