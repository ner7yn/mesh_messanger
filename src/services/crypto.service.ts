// src/services/crypto.service.ts
// End-to-end encryption using NaCl (curve25519-xsalsa20-poly1305)
// Each user has a keypair. Messages are encrypted with recipient's public key.
// Only the recipient (holder of private key) can decrypt.

import 'react-native-get-random-values';
import nacl from 'tweetnacl';
import { encodeBase64, decodeBase64, encodeUTF8, decodeUTF8 } from 'tweetnacl-util';

export interface KeyPair {
  publicKey: string;   // base64
  secretKey: string;   // base64 — NEVER share this
}

export interface EncryptedMessage {
  ciphertext: string;  // base64
  nonce: string;       // base64
  senderPublicKey: string; // base64 — so recipient can verify/decrypt
}

/**
 * Generate a new X25519 keypair for a user.
 * Called once during onboarding.
 */
export function generateKeyPair(): KeyPair {
  const kp = nacl.box.keyPair();
  return {
    publicKey: encodeBase64(kp.publicKey),
    secretKey: encodeBase64(kp.secretKey),
  };
}

/**
 * Encrypt a message for a specific recipient.
 * Uses NaCl box (curve25519-xsalsa20-poly1305).
 *
 * @param plaintext   - the message string to encrypt
 * @param recipientPublicKeyB64 - recipient's public key (base64)
 * @param senderSecretKeyB64    - sender's secret key (base64)
 * @param senderPublicKeyB64    - sender's public key (base64), embedded for recipient
 */
export function encryptMessage(
  plaintext: string,
  recipientPublicKeyB64: string,
  senderSecretKeyB64: string,
  senderPublicKeyB64: string,
): EncryptedMessage {
  const recipientPublicKey = decodeBase64(recipientPublicKeyB64);
  const senderSecretKey = decodeBase64(senderSecretKeyB64);

  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const message = encodeUTF8(plaintext);

  const ciphertext = nacl.box(message, nonce, recipientPublicKey, senderSecretKey);

  if (!ciphertext) {
    throw new Error('Encryption failed');
  }

  return {
    ciphertext: encodeBase64(ciphertext),
    nonce: encodeBase64(nonce),
    senderPublicKey: senderPublicKeyB64,
  };
}

/**
 * Decrypt a message. Only the intended recipient can decrypt.
 *
 * @param encrypted   - the encrypted message object
 * @param recipientSecretKeyB64 - recipient's own secret key (base64)
 */
export function decryptMessage(
  encrypted: EncryptedMessage,
  recipientSecretKeyB64: string,
): string | null {
  try {
    const senderPublicKey = decodeBase64(encrypted.senderPublicKey);
    const recipientSecretKey = decodeBase64(recipientSecretKeyB64);
    const ciphertext = decodeBase64(encrypted.ciphertext);
    const nonce = decodeBase64(encrypted.nonce);

    const decrypted = nacl.box.open(ciphertext, nonce, senderPublicKey, recipientSecretKey);

    if (!decrypted) {
      return null; // Decryption failed — wrong key or tampered message
    }

    return decodeUTF8(decrypted);
  } catch {
    return null;
  }
}

/**
 * Serialize an EncryptedMessage to a compact JSON string for BLE transmission.
 */
export function serializeEncrypted(msg: EncryptedMessage): string {
  return JSON.stringify({
    c: msg.ciphertext,
    n: msg.nonce,
    s: msg.senderPublicKey,
  });
}

/**
 * Deserialize a compact JSON string back to EncryptedMessage.
 */
export function deserializeEncrypted(raw: string): EncryptedMessage | null {
  try {
    const obj = JSON.parse(raw);
    return {
      ciphertext: obj.c,
      nonce: obj.n,
      senderPublicKey: obj.s,
    };
  } catch {
    return null;
  }
}

/**
 * Get a short fingerprint of a public key for UI display.
 */
export function getKeyFingerprint(publicKeyB64: string): string {
  const bytes = decodeBase64(publicKeyB64);
  const hex = Array.from(bytes.slice(0, 8))
    .map(b => b.toString(16).padStart(2, '0').toUpperCase())
    .join(':');
  return hex;
}

/**
 * Verify that a public key is valid base64 and correct length.
 */
export function isValidPublicKey(publicKeyB64: string): boolean {
  try {
    const bytes = decodeBase64(publicKeyB64);
    return bytes.length === nacl.box.publicKeyLength;
  } catch {
    return false;
  }
}
