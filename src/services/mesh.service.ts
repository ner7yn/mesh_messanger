// src/services/mesh.service.ts
// Mesh network protocol layer
// Handles routing, packet framing, dedup, and relay logic over BLE+LoRa

import { bleService } from './ble.service';
import {
  encryptMessage,
  decryptMessage,
  serializeEncrypted,
  deserializeEncrypted,
  EncryptedMessage,
} from './crypto.service';

// Packet types
export enum PacketType {
  MESSAGE = 'MSG',       // Encrypted chat message
  ACK = 'ACK',           // Delivery acknowledgement
  HELLO = 'HLO',         // Node announcement (broadcast publicKey + nickname)
  PING = 'PNG',          // Keep-alive / route discovery
  FRIEND_REQ = 'FRQ',    // Friend request
  READ = 'RD',           // Read receipt
}

export interface MeshPacket {
  type: PacketType;
  id: string;            // unique packet ID (uuid)
  src: string;           // sender nodeId
  dst: string;           // recipient nodeId ('*' = broadcast)
  ttl: number;           // time-to-live (max hops), decremented by relays
  ts: number;            // unix timestamp ms
  payload: string;       // JSON-stringified payload
}

export interface MessagePayload {
  encrypted: EncryptedMessage;
  chatId: string;
}

export interface HelloPayload {
  nickname: string;
  publicKey: string;
  nodeId: string;
}

export type PacketReceivedCallback = (packet: MeshPacket) => void;

const MAX_TTL = 7;
const PACKET_CACHE_SIZE = 200; // dedup buffer

class MeshService {
  private myNodeId: string = '';
  private myNickname: string = '';
  private myPublicKey: string = '';
  private mySecretKey: string = '';

  private packetCallbacks: Set<PacketReceivedCallback> = new Set();
  private seenPackets: string[] = []; // circular dedup buffer

  private unsubscribeBLE: (() => void) | null = null;

  // ─── Init ──────────────────────────────────────────────────────────────────

  init(nodeId: string, nickname: string, publicKey: string, secretKey: string): void {
    this.myNodeId = nodeId;
    this.myNickname = nickname;
    this.myPublicKey = publicKey;
    this.mySecretKey = secretKey;

    // Subscribe to raw BLE messages
    if (this.unsubscribeBLE) this.unsubscribeBLE();
    this.unsubscribeBLE = bleService.onMessage(raw => this.handleRawPacket(raw));
  }

  // ─── Send ──────────────────────────────────────────────────────────────────

  async sendMessage(
    recipientNodeId: string,
    recipientPublicKey: string,
    text: string,
    chatId: string,
  ): Promise<string | null> {
    const encrypted = encryptMessage(
      text,
      recipientPublicKey,
      this.mySecretKey,
      this.myPublicKey,
    );

    const payload: MessagePayload = { encrypted, chatId };
    const packetId = this.generatePacketId();

    const packet: MeshPacket = {
      type: PacketType.MESSAGE,
      id: packetId,
      src: this.myNodeId,
      dst: recipientNodeId,
      ttl: MAX_TTL,
      ts: Date.now(),
      payload: JSON.stringify(payload),
    };

    const success = await this.transmitPacket(packet);
    return success ? packetId : null;
  }

  async sendHello(): Promise<void> {
    const payload: HelloPayload = {
      nickname: this.myNickname,
      publicKey: this.myPublicKey,
      nodeId: this.myNodeId,
    };

    const packet: MeshPacket = {
      type: PacketType.HELLO,
      id: this.generatePacketId(),
      src: this.myNodeId,
      dst: '*',
      ttl: MAX_TTL,
      ts: Date.now(),
      payload: JSON.stringify(payload),
    };

    await this.transmitPacket(packet);
  }

  async sendAck(originalPacketId: string, recipientNodeId: string): Promise<void> {
    const packet: MeshPacket = {
      type: PacketType.ACK,
      id: this.generatePacketId(),
      src: this.myNodeId,
      dst: recipientNodeId,
      ttl: MAX_TTL,
      ts: Date.now(),
      payload: JSON.stringify({ ackId: originalPacketId }),
    };

    await this.transmitPacket(packet);
  }

  async sendReadReceipt(originalPacketId: string, recipientNodeId: string): Promise<void> {
    const packet: MeshPacket = {
      type: PacketType.READ,
      id: this.generatePacketId(),
      src: this.myNodeId,
      dst: recipientNodeId,
      ttl: 3,
      ts: Date.now(),
      payload: JSON.stringify({ readId: originalPacketId }),
    };

    await this.transmitPacket(packet);
  }

  async sendPing(): Promise<void> {
    const packet: MeshPacket = {
      type: PacketType.PING,
      id: this.generatePacketId(),
      src: this.myNodeId,
      dst: '*',
      ttl: 3,
      ts: Date.now(),
      payload: '{}',
    };
    await this.transmitPacket(packet);
  }

  // ─── Receive ───────────────────────────────────────────────────────────────

  private handleRawPacket(raw: string): void {
    try {
      const packet: MeshPacket = JSON.parse(raw);

      // Dedup check
      if (this.seenPackets.includes(packet.id)) return;
      this.addToSeen(packet.id);

      // Relay if not for us and TTL > 0
      if (packet.dst !== this.myNodeId && packet.dst !== '*') {
        if (packet.ttl > 1) {
          const relayed = { ...packet, ttl: packet.ttl - 1 };
          this.transmitPacket(relayed); // relay without awaiting
        }
        return; // Don't process packets not for us
      }

      // Notify listeners
      this.packetCallbacks.forEach(cb => cb(packet));

      // Auto-ACK for messages addressed to us
      if (packet.type === PacketType.MESSAGE && packet.dst === this.myNodeId) {
        this.sendAck(packet.id, packet.src);
      }
    } catch (e) {
      console.warn('[Mesh] Failed to parse packet:', e);
    }
  }

  decryptPacketMessage(packet: MeshPacket): string | null {
    if (packet.type !== PacketType.MESSAGE) return null;
    try {
      const { encrypted }: MessagePayload = JSON.parse(packet.payload);
      return decryptMessage(encrypted, this.mySecretKey);
    } catch {
      return null;
    }
  }

  // ─── Transmit ──────────────────────────────────────────────────────────────

  private async transmitPacket(packet: MeshPacket): Promise<boolean> {
    const raw = JSON.stringify(packet);
    return bleService.sendRawMessage(raw);
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private generatePacketId(): string {
    return `${this.myNodeId.slice(0, 6)}-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 7)}`;
  }

  private addToSeen(id: string): void {
    this.seenPackets.push(id);
    if (this.seenPackets.length > PACKET_CACHE_SIZE) {
      this.seenPackets.shift();
    }
  }

  // ─── Callbacks ─────────────────────────────────────────────────────────────

  onPacket(callback: PacketReceivedCallback): () => void {
    this.packetCallbacks.add(callback);
    return () => this.packetCallbacks.delete(callback);
  }

  // ─── Getters ───────────────────────────────────────────────────────────────

  getMyNodeId(): string {
    return this.myNodeId;
  }

  destroy(): void {
    if (this.unsubscribeBLE) this.unsubscribeBLE();
  }
}

export const meshService = new MeshService();
