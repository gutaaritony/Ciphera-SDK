import { Connection, PublicKey } from "@solana/web3.js";
import { PROGRAM_ID } from "./constants";
import { Profile, Note, Message } from "./types";
import { getProfilePDA } from "./pda";

// Account discriminators (first 8 bytes of sha256("account:<AccountName>"))
const ACCOUNT_DISCRIMINATOR = {
  profile: Buffer.from([184, 101, 165, 188, 95, 63, 127, 188]),
  note: Buffer.from([203, 75, 252, 196, 81, 210, 122, 126]),
  message: Buffer.from([110, 151, 23, 110, 198, 6, 125, 181]),
};

export async function fetchProfile(
  connection: Connection,
  wallet: PublicKey
): Promise<Profile | null> {
  const [profilePDA] = getProfilePDA(wallet);
  const accountInfo = await connection.getAccountInfo(profilePDA);

  if (!accountInfo) return null;

  const data = accountInfo.data;
  // Skip 8-byte discriminator
  const walletPubkey = new PublicKey(data.slice(8, 40));
  const encryptionPubkey = data.slice(40, 72);
  const createdAt = Number(data.readBigInt64LE(72));

  return {
    wallet: walletPubkey,
    encryptionPubkey,
    createdAt,
  };
}

export async function fetchNote(
  connection: Connection,
  notePDA: PublicKey
): Promise<Note | null> {
  const accountInfo = await connection.getAccountInfo(notePDA);

  if (!accountInfo) return null;

  const data = accountInfo.data;
  // Skip 8-byte discriminator
  // Layout: creator(32) + ciphertext_len(4) + ciphertext(var) + nonce(24)
  const creator = new PublicKey(data.slice(8, 40));
  const ciphertextLen = data.readUInt32LE(40);
  const ciphertext = data.slice(44, 44 + ciphertextLen);
  const nonce = data.slice(44 + ciphertextLen, 44 + ciphertextLen + 24);

  return {
    creator,
    ciphertext,
    nonce,
  };
}

export async function fetchMessage(
  connection: Connection,
  messagePDA: PublicKey
): Promise<Message | null> {
  const accountInfo = await connection.getAccountInfo(messagePDA);

  if (!accountInfo) return null;

  const data = accountInfo.data;
  // Skip 8-byte discriminator
  const from = new PublicKey(data.slice(8, 40));
  const to = new PublicKey(data.slice(40, 72));
  const timestamp = Number(data.readBigInt64LE(72));
  const ephemeralPubkey = data.slice(80, 112);
  const nonce = data.slice(112, 136);
  const ciphertextLen = data.readUInt32LE(136);
  const ciphertext = data.slice(140, 140 + ciphertextLen);

  return {
    from,
    to,
    timestamp,
    ephemeralPubkey,
    nonce,
    ciphertext,
  };
}

export async function fetchNotesByCreator(
  connection: Connection,
  creator: PublicKey
): Promise<{ pubkey: PublicKey; account: Note }[]> {
  const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
    filters: [
      { memcmp: { offset: 0, bytes: ACCOUNT_DISCRIMINATOR.note.toString("base64") } },
      { memcmp: { offset: 8, bytes: creator.toBase58() } },
    ],
  });

  return accounts.map(({ pubkey, account }) => {
    const data = account.data;
    const ciphertextLen = data.readUInt32LE(40);
    const ciphertext = data.slice(44, 44 + ciphertextLen);
    const nonce = data.slice(44 + ciphertextLen, 44 + ciphertextLen + 24);

    return {
      pubkey,
      account: {
        creator,
        ciphertext,
        nonce,
      },
    };
  });
}

export async function fetchMessagesByRecipient(
  connection: Connection,
  recipient: PublicKey
): Promise<{ pubkey: PublicKey; account: Message }[]> {
  const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
    filters: [
      { memcmp: { offset: 0, bytes: ACCOUNT_DISCRIMINATOR.message.toString("base64") } },
      { memcmp: { offset: 40, bytes: recipient.toBase58() } },
    ],
  });

  return accounts.map(({ pubkey, account }) => {
    const data = account.data;
    const from = new PublicKey(data.slice(8, 40));
    const to = new PublicKey(data.slice(40, 72));
    const timestamp = Number(data.readBigInt64LE(72));
    const ephemeralPubkey = data.slice(80, 112);
    const nonce = data.slice(112, 136);
    const ciphertextLen = data.readUInt32LE(136);
    const ciphertext = data.slice(140, 140 + ciphertextLen);

    return {
      pubkey,
      account: { from, to, timestamp, ephemeralPubkey, nonce, ciphertext },
    };
  });
}
