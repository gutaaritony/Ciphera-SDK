import { PublicKey } from "@solana/web3.js";
import { PROGRAM_ID, SEEDS } from "./constants";

export function getProfilePDA(wallet: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(SEEDS.PROFILE), wallet.toBuffer()],
    PROGRAM_ID
  );
}

export function getNotePDA(
  creator: PublicKey,
  timestamp: number
): [PublicKey, number] {
  const timestampBuffer = Buffer.alloc(8);
  timestampBuffer.writeBigInt64LE(BigInt(timestamp));

  return PublicKey.findProgramAddressSync(
    [Buffer.from(SEEDS.NOTE), creator.toBuffer(), timestampBuffer],
    PROGRAM_ID
  );
}

export function getMessagePDA(
  sender: PublicKey,
  recipient: PublicKey,
  timestamp: number
): [PublicKey, number] {
  const timestampBuffer = Buffer.alloc(8);
  timestampBuffer.writeBigInt64LE(BigInt(timestamp));

  return PublicKey.findProgramAddressSync(
    [
      Buffer.from(SEEDS.MESSAGE),
      sender.toBuffer(),
      recipient.toBuffer(),
      timestampBuffer,
    ],
    PROGRAM_ID
  );
}
