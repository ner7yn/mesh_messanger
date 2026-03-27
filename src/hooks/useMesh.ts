// src/hooks/useMesh.ts
import { useEffect, useCallback } from 'react';
import { useAppStore } from '../store/index';
import { meshService, PacketType, MeshPacket, HelloPayload } from '../services/mesh.service';
import { storageService } from '../services/storage.service';
import { bleService, BLEConnectionState } from '../services/ble.service';
import { isValidPublicKey } from '../services/crypto.service';
import { v4 as uuidv4 } from 'uuid';

export function useMesh() {
  const {
    nodeId,
    nickname,
    publicKey,
    secretKey,
    addMessage,
    updateMessageStatus,
    updateFriendPresence,
    getOrCreateChat,
    friends,
    setBleState,
    setConnectedDevice,
  } = useAppStore();

  // Init mesh service when profile is ready
  useEffect(() => {
    if (!nodeId || !publicKey || !secretKey) return;

    meshService.init(nodeId, nickname, publicKey, secretKey);

    // Announce ourselves when connected
    const unsub = bleService.onConnectionStateChange(
      (state: BLEConnectionState, deviceId?: string) => {
        setBleState(state);
        if (state === 'connected') {
          setConnectedDevice(
            deviceId ?? null,
            storageService.getConnectedDeviceName() ?? null,
          );
          // Broadcast our presence
          setTimeout(() => meshService.sendHello(), 1000);
        } else if (state === 'disconnected') {
          setConnectedDevice(null, null);
        }
      },
    );

    return () => unsub();
  }, [nodeId, nickname, publicKey, secretKey]);

  // Handle incoming packets
  useEffect(() => {
    const unsub = meshService.onPacket((packet: MeshPacket) => {
      handlePacket(packet);
    });

    return () => unsub();
  }, [friends]);

  const handlePacket = useCallback(
    (packet: MeshPacket) => {
      switch (packet.type) {
        case PacketType.MESSAGE: {
          const friend = friends.find(f => f.id === packet.src);
          if (!friend) return; // Only accept messages from friends

          const text = meshService.decryptPacketMessage(packet);
          if (!text) {
            // Store as failed-to-decrypt
            const chat = getOrCreateChat(friend);
            addMessage(chat.id, {
              id: uuidv4(),
              chatId: chat.id,
              senderId: packet.src,
              senderNickname: friend.nickname,
              text: '[Ошибка расшифровки]',
              timestamp: packet.ts,
              status: 'delivered',
              isOutgoing: false,
              packetId: packet.id,
            });
            return;
          }

          const chat = getOrCreateChat(friend);
          addMessage(chat.id, {
            id: uuidv4(),
            chatId: chat.id,
            senderId: packet.src,
            senderNickname: friend.nickname,
            text,
            timestamp: packet.ts,
            status: 'delivered',
            isOutgoing: false,
            packetId: packet.id,
          });

          // Send read receipt
          meshService.sendReadReceipt(packet.id, packet.src);
          break;
        }

        case PacketType.ACK: {
          const { ackId } = JSON.parse(packet.payload);
          // Find which chat this ack belongs to
          const friend = friends.find(f => f.id === packet.src);
          if (friend) {
            // Find message by packetId across all chats
            const allChats = useAppStore.getState().chats;
            for (const chat of allChats) {
              const msgs = storageService.getMessages(chat.id);
              const msg = msgs.find(m => m.packetId === ackId);
              if (msg) {
                updateMessageStatus(chat.id, msg.id, 'delivered');
                break;
              }
            }
          }
          break;
        }

        case PacketType.READ: {
          const { readId } = JSON.parse(packet.payload);
          const allChats = useAppStore.getState().chats;
          for (const chat of allChats) {
            const msgs = storageService.getMessages(chat.id);
            const msg = msgs.find(m => m.packetId === readId);
            if (msg) {
              updateMessageStatus(chat.id, msg.id, 'read');
              break;
            }
          }
          break;
        }

        case PacketType.HELLO: {
          const payload: HelloPayload = JSON.parse(packet.payload);
          // Update friend presence if known
          const friend = friends.find(f => f.id === payload.nodeId);
          if (friend) {
            updateFriendPresence(payload.nodeId, true, undefined, undefined);
          }
          break;
        }

        case PacketType.PING: {
          updateFriendPresence(packet.src, true);
          break;
        }
      }
    },
    [friends],
  );

  const sendMessage = useCallback(
    async (friendId: string, text: string): Promise<string | null> => {
      const friend = friends.find(f => f.id === friendId);
      if (!friend) return null;

      const tempId = uuidv4();
      const chat = getOrCreateChat(friend);

      // Optimistic: add as sending immediately
      addMessage(chat.id, {
        id: tempId,
        chatId: chat.id,
        senderId: nodeId,
        senderNickname: nickname,
        text,
        timestamp: Date.now(),
        status: 'sending',
        isOutgoing: true,
      });

      const packetId = await meshService.sendMessage(
        friend.id,
        friend.publicKey,
        text,
        chat.id,
      );

      if (packetId) {
        // Update with packetId for ACK tracking
        storageService.updateMessageStatus(chat.id, tempId, 'sent');
        updateMessageStatus(chat.id, tempId, 'sent');
        return packetId;
      } else {
        updateMessageStatus(chat.id, tempId, 'failed');
        return null;
      }
    },
    [friends, nodeId, nickname],
  );

  return { sendMessage };
}
