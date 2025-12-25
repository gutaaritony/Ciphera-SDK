import nacl from "tweetnacl";

export interface KeyPair {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
}

export function generateKeyPair(): KeyPair {
  return nacl.box.keyPair();
}

export function generateNonce(): Uint8Array {
  return nacl.randomBytes(24);
}

// Encrypt for self (notes) - uses secretbox
export function encryptNote(
  plaintext: string,
  secretKey: Uint8Array
): { ciphertext: Uint8Array; nonce: Uint8Array } {
  const nonce = generateNonce();
  const messageBytes = new TextEncoder().encode(plaintext);
  
  // Derive symmetric key from secret key
  const symmetricKey = nacl.hash(secretKey).slice(0, 32);
  const ciphertext = nacl.secretbox(messageBytes, nonce, symmetricKey);

  return { ciphertext, nonce };
}

export function decryptNote(
  ciphertext: Uint8Array,
  nonce: Uint8Array,
  secretKey: Uint8Array
): string | null {
  const symmetricKey = nacl.hash(secretKey).slice(0, 32);
  const decrypted = nacl.secretbox.open(ciphertext, nonce, symmetricKey);

  if (!decrypted) return null;
  return new TextDecoder().decode(decrypted);
}

// Encrypt for recipient (messages) - uses box with ephemeral key
export function encryptMessage(
  plaintext: string,
  recipientPublicKey: Uint8Array
): {
  ciphertext: Uint8Array;
  nonce: Uint8Array;
  ephemeralPublicKey: Uint8Array;
} {
  const ephemeral = nacl.box.keyPair();
  const nonce = generateNonce();
  const messageBytes = new TextEncoder().encode(plaintext);

  const ciphertext = nacl.box(
    messageBytes,
    nonce,
    recipientPublicKey,
    ephemeral.secretKey
  );

  return {
    ciphertext,
    nonce,
    ephemeralPublicKey: ephemeral.publicKey,
  };
}

export function decryptMessage(
  ciphertext: Uint8Array,
  nonce: Uint8Array,
  ephemeralPublicKey: Uint8Array,
  recipientSecretKey: Uint8Array
): string | null {
  const decrypted = nacl.box.open(
    ciphertext,
    nonce,
    ephemeralPublicKey,
    recipientSecretKey
  );

  if (!decrypted) return null;
  return new TextDecoder().decode(decrypted);
}
