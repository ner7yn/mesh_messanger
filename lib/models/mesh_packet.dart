enum PacketType { msg, ack, read, hello, ping }

class MeshPacket {
  final PacketType type;
  final String id;
  final String src;
  final String dst;
  final int ts;
  final String payload;
  final String? refPacketId;

  const MeshPacket({
    required this.type,
    required this.id,
    required this.src,
    required this.dst,
    required this.ts,
    required this.payload,
    this.refPacketId,
  });

  Map<String, dynamic> toJson() => {
        'type': type.name,
        'id': id,
        'src': src,
        'dst': dst,
        'ts': ts,
        'payload': payload,
        'refPacketId': refPacketId,
      };

  factory MeshPacket.fromJson(Map<String, dynamic> json) => MeshPacket(
        type: PacketType.values.firstWhere((e) => e.name == json['type']),
        id: json['id'] as String,
        src: json['src'] as String,
        dst: json['dst'] as String,
        ts: (json['ts'] as num).toInt(),
        payload: json['payload'] as String,
        refPacketId: json['refPacketId'] as String?,
      );
}
