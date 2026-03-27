import nacl from 'tweetnacl';
import {decodeUTF8, encodeBase64, decodeBase64, encodeUTF8} from 'tweetnacl-util';
import {EncryptedPayload} from '../types/models';
import {v4 as uuidv4} from 'uuid';

export const createIdentityKeys = () => {
  const pair = nacl.box.keyPair();
  return {
    publicKey: encodeBase64(pair.publicKey),
    privateKey: encodeBase64(pair.secretKey)
  };
};

export const encryptForRecipient = (
  message: string,
  senderId: string,
  senderPublicKey: string,
  senderPrivateKey: string,
  recipientId: string,
  recipientPublicKey: string
): EncryptedPayload => {
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const payload = nacl.box(
    decodeUTF8(message),
    nonce,
    decodeBase64(recipientPublicKey),
    decodeBase64(senderPrivateKey)
  );

  return {
    id: uuidv4(),
    senderId,
    recipientId,
    senderPublicKey,
    nonce: encodeBase64(nonce),
    cipherText: encodeBase64(payload),
    sentAt: new Date().toISOString()
  };
};

export const decryptFromSender = (
  payload: EncryptedPayload,
  recipientPrivateKey: string
): string | null => {
  const decrypted = nacl.box.open(
    decodeBase64(payload.cipherText),
    decodeBase64(payload.nonce),
    decodeBase64(payload.senderPublicKey),
    decodeBase64(recipientPrivateKey)
  );

  if (!decrypted) {
    return null;
  }

  return encodeUTF8(decrypted);
};
