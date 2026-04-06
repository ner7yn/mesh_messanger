enum MessageStatus { sending, sent, delivered, read, failed }

class MessageModel {
  final String id;
  final String chatId;
  final String senderId;
  final String text;
  final int timestamp;
  final bool isOutgoing;
  final MessageStatus status;
  final String? packetId;

  const MessageModel({
    required this.id,
    required this.chatId,
    required this.senderId,
    required this.text,
    required this.timestamp,
    required this.isOutgoing,
    required this.status,
    this.packetId,
  });

  MessageModel copyWith({MessageStatus? status, String? packetId}) => MessageModel(
        id: id,
        chatId: chatId,
        senderId: senderId,
        text: text,
        timestamp: timestamp,
        isOutgoing: isOutgoing,
        status: status ?? this.status,
        packetId: packetId ?? this.packetId,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'chatId': chatId,
        'senderId': senderId,
        'text': text,
        'timestamp': timestamp,
        'isOutgoing': isOutgoing,
        'status': status.name,
        'packetId': packetId,
      };

  factory MessageModel.fromJson(Map<dynamic, dynamic> json) => MessageModel(
        id: json['id'] as String,
        chatId: json['chatId'] as String,
        senderId: json['senderId'] as String,
        text: json['text'] as String,
        timestamp: (json['timestamp'] as num).toInt(),
        isOutgoing: json['isOutgoing'] as bool,
        status: MessageStatus.values.firstWhere(
          (s) => s.name == json['status'],
          orElse: () => MessageStatus.sent,
        ),
        packetId: json['packetId'] as String?,
      );
}
