class FriendModel {
  final String nodeId;
  final String nickname;
  final String publicKey;
  final int addedAt;
  final bool online;

  const FriendModel({
    required this.nodeId,
    required this.nickname,
    required this.publicKey,
    required this.addedAt,
    this.online = false,
  });

  Map<String, dynamic> toJson() => {
        'nodeId': nodeId,
        'nickname': nickname,
        'publicKey': publicKey,
        'addedAt': addedAt,
        'online': online,
      };

  factory FriendModel.fromJson(Map<dynamic, dynamic> json) => FriendModel(
        nodeId: json['nodeId'] as String,
        nickname: json['nickname'] as String,
        publicKey: json['publicKey'] as String,
        addedAt: (json['addedAt'] as num).toInt(),
        online: (json['online'] as bool?) ?? false,
      );
}
