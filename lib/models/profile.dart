class UserProfile {
  final String nodeId;
  final String nickname;
  final String publicKey;

  const UserProfile({
    required this.nodeId,
    required this.nickname,
    required this.publicKey,
  });

  Map<String, dynamic> toJson() => {
        'nodeId': nodeId,
        'nickname': nickname,
        'publicKey': publicKey,
      };

  factory UserProfile.fromJson(Map<dynamic, dynamic> json) => UserProfile(
        nodeId: json['nodeId'] as String,
        nickname: json['nickname'] as String,
        publicKey: json['publicKey'] as String,
      );
}
