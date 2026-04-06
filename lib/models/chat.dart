class ChatModel {
  final String id;
  final String friendId;
  final String friendNickname;
  final String lastMessage;
  final int lastMessageAt;
  final int unread;

  const ChatModel({
    required this.id,
    required this.friendId,
    required this.friendNickname,
    required this.lastMessage,
    required this.lastMessageAt,
    required this.unread,
  });

  ChatModel copyWith({
    String? lastMessage,
    int? lastMessageAt,
    int? unread,
  }) =>
      ChatModel(
        id: id,
        friendId: friendId,
        friendNickname: friendNickname,
        lastMessage: lastMessage ?? this.lastMessage,
        lastMessageAt: lastMessageAt ?? this.lastMessageAt,
        unread: unread ?? this.unread,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'friendId': friendId,
        'friendNickname': friendNickname,
        'lastMessage': lastMessage,
        'lastMessageAt': lastMessageAt,
        'unread': unread,
      };

  factory ChatModel.fromJson(Map<dynamic, dynamic> json) => ChatModel(
        id: json['id'] as String,
        friendId: json['friendId'] as String,
        friendNickname: json['friendNickname'] as String,
        lastMessage: (json['lastMessage'] as String?) ?? '',
        lastMessageAt: (json['lastMessageAt'] as num?)?.toInt() ?? 0,
        unread: (json['unread'] as num?)?.toInt() ?? 0,
      );
}
