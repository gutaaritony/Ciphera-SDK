import { PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey(
  "CPHRneHpHq6HcBKAqVcSy4bCkL6Y3BBQnLN9qQ4itQMC"
);

export const SEEDS = {
  PROFILE: "profile",
  NOTE: "note",
  MESSAGE: "message",
} as const;

export const MAX_NOTE_CONTENT = 1024;
export const MAX_MESSAGE_CONTENT = 2048;
