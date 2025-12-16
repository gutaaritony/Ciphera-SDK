import { PublicKey } from "@solana/web3.js";

export interface Profile {
  wallet: PublicKey;
  encryptionPubkey: Uint8Array; // 32 bytes - X25519 public key
  createdAt: number;
}

export interface Note {
  creator: PublicKey;
  ciphertext: Uint8Array;
  nonce: Uint8Array; // 24 bytes - XSalsa20-Poly1305 nonce
}

export interface Message {
  from: PublicKey;
  to: PublicKey;
  timestamp: number;
  ephemeralPubkey: Uint8Array; // 32 bytes - for ECDH
  nonce: Uint8Array; // 24 bytes
  ciphertext: Uint8Array;
}
