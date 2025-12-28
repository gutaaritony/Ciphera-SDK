# @ciphera/sdk

SDK for [Ciphera](https://cipheralab.com/) - Secure Encryption Protocol on Solana.

End-to-end encrypted messaging and notes storage on Solana blockchain. Uses X25519 for key exchange and XSalsa20-Poly1305 for symmetric encryption.

## Installation

```bash
npm install @ciphera/sdk
```

## Quick Start

```typescript
import {
  generateKeyPair,
  createRegisterInstruction,
  createNoteInstruction,
  sendMessageInstruction,
  encryptNote,
  encryptMessage,
  decryptNote,
  decryptMessage,
  fetchProfile,
  fetchNotesByCreator,
  fetchMessagesByRecipient,
  getProfilePDA,
  getNotePDA,
} from "@ciphera/sdk";
import { Connection, Keypair, Transaction } from "@solana/web3.js";

const connection = new Connection("https://api.mainnet-beta.solana.com");
```

### Register Profile

```typescript
const encryptionKeys = generateKeyPair();

const ix = createRegisterInstruction(
  wallet.publicKey,
  encryptionKeys.publicKey
);

const tx = new Transaction().add(ix);
```

### Create Encrypted Note

```typescript
const { ciphertext, nonce } = encryptNote("My secret note", encryptionKeys.secretKey);
const timestamp = Date.now();

const ix = createNoteInstruction(
  wallet.publicKey,
  ciphertext,
  nonce,
  timestamp
);
```

### Send Encrypted Message

```typescript
const recipientProfile = await fetchProfile(connection, recipientWallet);

const { ciphertext, nonce, ephemeralPublicKey } = encryptMessage(
  "Hello!",
  recipientProfile.encryptionPubkey
);

const ix = sendMessageInstruction(
  wallet.publicKey,
  recipientWallet,
  ciphertext,
  nonce,
  ephemeralPublicKey,
  Date.now()
);
```

### Fetch & Decrypt

```typescript
// Fetch notes
const notes = await fetchNotesByCreator(connection, wallet.publicKey);
for (const { account } of notes) {
  const text = decryptNote(account.ciphertext, account.nonce, encryptionKeys.secretKey);
  console.log(text);
}

// Fetch messages
const messages = await fetchMessagesByRecipient(connection, wallet.publicKey);
for (const { account } of messages) {
  const text = decryptMessage(
    account.ciphertext,
    account.nonce,
    account.ephemeralPubkey,
    encryptionKeys.secretKey
  );
  console.log(text);
}
```

---

## API Reference

### Constants

```typescript
import { PROGRAM_ID, MAX_NOTE_CONTENT, MAX_MESSAGE_CONTENT, SEEDS } from "@ciphera/sdk";
```

| Constant | Value | Description |
|----------|-------|-------------|
| `PROGRAM_ID` | `CPHRneHpHq6HcBKAqVcSy4bCkL6Y3BBQnLN9qQ4itQMC` | Ciphera program address on Solana |
| `MAX_NOTE_CONTENT` | `1024` | Maximum note ciphertext size in bytes |
| `MAX_MESSAGE_CONTENT` | `2048` | Maximum message ciphertext size in bytes |
| `SEEDS.PROFILE` | `"profile"` | PDA seed for profile accounts |
| `SEEDS.NOTE` | `"note"` | PDA seed for note accounts |
| `SEEDS.MESSAGE` | `"message"` | PDA seed for message accounts |

---

### Types

```typescript
interface Profile {
  wallet: PublicKey;           // Owner wallet address
  encryptionPubkey: Uint8Array; // 32 bytes - X25519 public key
  createdAt: number;           // Unix timestamp
}

interface Note {
  creator: PublicKey;          // Creator wallet address
  ciphertext: Uint8Array;      // Encrypted content
  nonce: Uint8Array;           // 24 bytes - XSalsa20-Poly1305 nonce
}

interface Message {
  from: PublicKey;             // Sender wallet address
  to: PublicKey;               // Recipient wallet address
  timestamp: number;           // Unix timestamp
  ephemeralPubkey: Uint8Array; // 32 bytes - Ephemeral X25519 key for ECDH
  nonce: Uint8Array;           // 24 bytes - XSalsa20-Poly1305 nonce
  ciphertext: Uint8Array;      // Encrypted content
}

interface KeyPair {
  publicKey: Uint8Array;       // 32 bytes - X25519 public key
  secretKey: Uint8Array;       // 32 bytes - X25519 secret key
}
```

---

### PDA Functions

#### `getProfilePDA(wallet)`

Derives the Profile PDA for a wallet.

```typescript
const [profilePDA, bump] = getProfilePDA(walletPublicKey);
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `wallet` | `PublicKey` | User's wallet address |

**Returns:** `[PublicKey, number]` - PDA address and bump seed

---

#### `getNotePDA(creator, timestamp)`

Derives the Note PDA for a creator and timestamp.

```typescript
const [notePDA, bump] = getNotePDA(creatorPublicKey, Date.now());
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `creator` | `PublicKey` | Note creator's wallet |
| `timestamp` | `number` | Creation timestamp (milliseconds) |

**Returns:** `[PublicKey, number]` - PDA address and bump seed

---

#### `getMessagePDA(sender, recipient, timestamp)`

Derives the Message PDA.

```typescript
const [messagePDA, bump] = getMessagePDA(senderPubkey, recipientPubkey, Date.now());
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `sender` | `PublicKey` | Sender's wallet |
| `recipient` | `PublicKey` | Recipient's wallet |
| `timestamp` | `number` | Send timestamp (milliseconds) |

**Returns:** `[PublicKey, number]` - PDA address and bump seed

---

### Instructions

#### `createRegisterInstruction(user, encryptionPubkey)`

Creates instruction to register a new user profile.

```typescript
const ix = createRegisterInstruction(wallet.publicKey, keyPair.publicKey);
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `user` | `PublicKey` | User's wallet (signer, payer) |
| `encryptionPubkey` | `Uint8Array` | 32-byte X25519 public key |

**Returns:** `TransactionInstruction`

---

#### `createNoteInstruction(user, ciphertext, nonce, timestamp)`

Creates instruction to store an encrypted note.

```typescript
const ix = createNoteInstruction(wallet.publicKey, ciphertext, nonce, timestamp);
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `user` | `PublicKey` | Creator's wallet (signer, payer) |
| `ciphertext` | `Uint8Array` | Encrypted note content (max 1024 bytes) |
| `nonce` | `Uint8Array` | 24-byte encryption nonce |
| `timestamp` | `number` | Creation timestamp |

**Returns:** `TransactionInstruction`

---

#### `updateNoteInstruction(user, notePDA, ciphertext, nonce)`

Creates instruction to update an existing note.

```typescript
const ix = updateNoteInstruction(wallet.publicKey, notePDA, newCiphertext, newNonce);
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `user` | `PublicKey` | Note creator (signer) |
| `notePDA` | `PublicKey` | Note account address |
| `ciphertext` | `Uint8Array` | New encrypted content |
| `nonce` | `Uint8Array` | New 24-byte nonce |

**Returns:** `TransactionInstruction`

---

#### `deleteNoteInstruction(user, notePDA)`

Creates instruction to delete a note and reclaim rent.

```typescript
const ix = deleteNoteInstruction(wallet.publicKey, notePDA);
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `user` | `PublicKey` | Note creator (signer, receives rent) |
| `notePDA` | `PublicKey` | Note account to delete |

**Returns:** `TransactionInstruction`

---

#### `sendMessageInstruction(sender, recipient, ciphertext, nonce, ephemeralPubkey, timestamp)`

Creates instruction to send an encrypted message.

```typescript
const ix = sendMessageInstruction(
  senderWallet,
  recipientWallet,
  ciphertext,
  nonce,
  ephemeralPublicKey,
  timestamp
);
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `sender` | `PublicKey` | Sender's wallet (signer, payer) |
| `recipient` | `PublicKey` | Recipient's wallet |
| `ciphertext` | `Uint8Array` | Encrypted message (max 2048 bytes) |
| `nonce` | `Uint8Array` | 24-byte encryption nonce |
| `ephemeralPubkey` | `Uint8Array` | 32-byte ephemeral public key |
| `timestamp` | `number` | Send timestamp |

**Returns:** `TransactionInstruction`

---

### Encryption

#### `generateKeyPair()`

Generates a new X25519 key pair for encryption.

```typescript
const { publicKey, secretKey } = generateKeyPair();
```

**Returns:** `KeyPair` - Object with `publicKey` and `secretKey` (both 32 bytes)

---

#### `generateNonce()`

Generates a random 24-byte nonce.

```typescript
const nonce = generateNonce();
```

**Returns:** `Uint8Array` - 24 random bytes

---

#### `encryptNote(plaintext, secretKey)`

Encrypts a note for personal storage using secretbox.

```typescript
const { ciphertext, nonce } = encryptNote("My secret", secretKey);
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `plaintext` | `string` | Text to encrypt |
| `secretKey` | `Uint8Array` | Your secret key |

**Returns:** `{ ciphertext: Uint8Array, nonce: Uint8Array }`

---

#### `decryptNote(ciphertext, nonce, secretKey)`

Decrypts a note.

```typescript
const text = decryptNote(ciphertext, nonce, secretKey);
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `ciphertext` | `Uint8Array` | Encrypted data |
| `nonce` | `Uint8Array` | 24-byte nonce |
| `secretKey` | `Uint8Array` | Your secret key |

**Returns:** `string | null` - Decrypted text or null if decryption fails

---

#### `encryptMessage(plaintext, recipientPublicKey)`

Encrypts a message for a recipient using box (ECDH + secretbox).

```typescript
const { ciphertext, nonce, ephemeralPublicKey } = encryptMessage("Hello!", recipientPubkey);
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `plaintext` | `string` | Message to encrypt |
| `recipientPublicKey` | `Uint8Array` | Recipient's X25519 public key |

**Returns:** `{ ciphertext: Uint8Array, nonce: Uint8Array, ephemeralPublicKey: Uint8Array }`

---

#### `decryptMessage(ciphertext, nonce, ephemeralPublicKey, secretKey)`

Decrypts a received message.

```typescript
const text = decryptMessage(ciphertext, nonce, ephemeralPubkey, mySecretKey);
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `ciphertext` | `Uint8Array` | Encrypted message |
| `nonce` | `Uint8Array` | 24-byte nonce |
| `ephemeralPublicKey` | `Uint8Array` | Sender's ephemeral public key |
| `secretKey` | `Uint8Array` | Your secret key |

**Returns:** `string | null` - Decrypted text or null if decryption fails

---

### Client (Fetchers)

#### `fetchProfile(connection, wallet)`

Fetches a user's profile from chain.

```typescript
const profile = await fetchProfile(connection, walletPublicKey);
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `connection` | `Connection` | Solana RPC connection |
| `wallet` | `PublicKey` | User's wallet address |

**Returns:** `Promise<Profile | null>`

---

#### `fetchNote(connection, notePDA)`

Fetches a single note by PDA.

```typescript
const note = await fetchNote(connection, notePDA);
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `connection` | `Connection` | Solana RPC connection |
| `notePDA` | `PublicKey` | Note account address |

**Returns:** `Promise<Note | null>`

---

#### `fetchMessage(connection, messagePDA)`

Fetches a single message by PDA.

```typescript
const message = await fetchMessage(connection, messagePDA);
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `connection` | `Connection` | Solana RPC connection |
| `messagePDA` | `PublicKey` | Message account address |

**Returns:** `Promise<Message | null>`

---

#### `fetchNotesByCreator(connection, creator)`

Fetches all notes created by a user.

```typescript
const notes = await fetchNotesByCreator(connection, walletPublicKey);
// notes = [{ pubkey: PublicKey, account: Note }, ...]
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `connection` | `Connection` | Solana RPC connection |
| `creator` | `PublicKey` | Creator's wallet address |

**Returns:** `Promise<{ pubkey: PublicKey, account: Note }[]>`

---

#### `fetchMessagesByRecipient(connection, recipient)`

Fetches all messages sent to a user.

```typescript
const messages = await fetchMessagesByRecipient(connection, walletPublicKey);
// messages = [{ pubkey: PublicKey, account: Message }, ...]
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `connection` | `Connection` | Solana RPC connection |
| `recipient` | `PublicKey` | Recipient's wallet address |

**Returns:** `Promise<{ pubkey: PublicKey, account: Message }[]>`

---

## SOL Program

```
CPHRneHpHq6HcBKAqVcSy4bCkL6Y3BBQnLN9qQ4itQMC
```

## Links

- Website: https://cipheralab.com/
- X: https://x.com/CipheraLabs

## License

MIT
