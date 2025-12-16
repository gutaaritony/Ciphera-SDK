import {
  PublicKey,
  TransactionInstruction,
  SystemProgram,
} from "@solana/web3.js";
import { PROGRAM_ID } from "./constants";
import { getProfilePDA, getNotePDA, getMessagePDA } from "./pda";

// Anchor discriminators (first 8 bytes of sha256("global:<instruction_name>"))
const DISCRIMINATOR = {
  register: Buffer.from([211, 124, 67, 15, 211, 194, 178, 240]),
  createNote: Buffer.from([22, 91, 100, 67, 234, 65, 98, 47]),
  updateNote: Buffer.from([103, 54, 172, 34, 231, 104, 87, 21]),
  deleteNote: Buffer.from([214, 184, 181, 100, 253, 58, 221, 130]),
  sendMessage: Buffer.from([57, 40, 34, 178, 189, 10, 65, 26]),
};

export function createRegisterInstruction(
  user: PublicKey,
  encryptionPubkey: Uint8Array
): TransactionInstruction {
  const [profilePDA] = getProfilePDA(user);

  const data = Buffer.concat([
    DISCRIMINATOR.register,
    Buffer.from(encryptionPubkey),
  ]);

  return new TransactionInstruction({
    keys: [
      { pubkey: user, isSigner: true, isWritable: true },
      { pubkey: profilePDA, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId: PROGRAM_ID,
    data,
  });
}

export function createNoteInstruction(
  user: PublicKey,
  ciphertext: Uint8Array,
  nonce: Uint8Array,
  timestamp: number
): TransactionInstruction {
  const [notePDA] = getNotePDA(user, timestamp);

  const timestampBuffer = Buffer.alloc(8);
  timestampBuffer.writeBigInt64LE(BigInt(timestamp));

  const ciphertextLen = Buffer.alloc(4);
  ciphertextLen.writeUInt32LE(ciphertext.length);

  const data = Buffer.concat([
    DISCRIMINATOR.createNote,
    ciphertextLen,
    Buffer.from(ciphertext),
    Buffer.from(nonce),
    timestampBuffer,
  ]);

  return new TransactionInstruction({
    keys: [
      { pubkey: user, isSigner: true, isWritable: true },
      { pubkey: notePDA, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId: PROGRAM_ID,
    data,
  });
}

export function updateNoteInstruction(
  user: PublicKey,
  notePDA: PublicKey,
  ciphertext: Uint8Array,
  nonce: Uint8Array
): TransactionInstruction {
  const ciphertextLen = Buffer.alloc(4);
  ciphertextLen.writeUInt32LE(ciphertext.length);

  const data = Buffer.concat([
    DISCRIMINATOR.updateNote,
    ciphertextLen,
    Buffer.from(ciphertext),
    Buffer.from(nonce),
  ]);

  return new TransactionInstruction({
    keys: [
      { pubkey: user, isSigner: true, isWritable: true },
      { pubkey: notePDA, isSigner: false, isWritable: true },
    ],
    programId: PROGRAM_ID,
    data,
  });
}

export function deleteNoteInstruction(
  user: PublicKey,
  notePDA: PublicKey
): TransactionInstruction {
  return new TransactionInstruction({
    keys: [
      { pubkey: user, isSigner: true, isWritable: true },
      { pubkey: notePDA, isSigner: false, isWritable: true },
    ],
    programId: PROGRAM_ID,
    data: DISCRIMINATOR.deleteNote,
  });
}

export function sendMessageInstruction(
  sender: PublicKey,
  recipient: PublicKey,
  ciphertext: Uint8Array,
  nonce: Uint8Array,
  ephemeralPubkey: Uint8Array,
  timestamp: number
): TransactionInstruction {
  const [recipientProfile] = getProfilePDA(recipient);
  const [messagePDA] = getMessagePDA(sender, recipient, timestamp);

  const timestampBuffer = Buffer.alloc(8);
  timestampBuffer.writeBigInt64LE(BigInt(timestamp));

  const ciphertextLen = Buffer.alloc(4);
  ciphertextLen.writeUInt32LE(ciphertext.length);

  const data = Buffer.concat([
    DISCRIMINATOR.sendMessage,
    ciphertextLen,
    Buffer.from(ciphertext),
    Buffer.from(nonce),
    Buffer.from(ephemeralPubkey),
    timestampBuffer,
  ]);

  return new TransactionInstruction({
    keys: [
      { pubkey: sender, isSigner: true, isWritable: true },
      { pubkey: recipient, isSigner: false, isWritable: false },
      { pubkey: recipientProfile, isSigner: false, isWritable: false },
      { pubkey: messagePDA, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId: PROGRAM_ID,
    data,
  });
}
