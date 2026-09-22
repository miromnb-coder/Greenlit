import crypto from "crypto";

function key() {
  const raw = process.env.APP_ENCRYPTION_KEY;
  if (!raw) throw new Error("APP_ENCRYPTION_KEY is required to store OAuth credentials");
  const value = Buffer.from(raw, "base64");
  if (value.length !== 32) throw new Error("APP_ENCRYPTION_KEY must be a base64-encoded 32-byte key");
  return value;
}

export function encryptJson(value: unknown) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const plaintext = Buffer.from(JSON.stringify(value), "utf8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { v: 1, alg: "aes-256-gcm", iv: iv.toString("base64url"), tag: tag.toString("base64url"), data: ciphertext.toString("base64url") };
}

export function decryptJson<T>(value: unknown): T {
  if (!value || typeof value !== "object") throw new Error("Invalid encrypted secret");
  const input = value as { v?: number; iv?: string; tag?: string; data?: string };
  if (input.v !== 1 || !input.iv || !input.tag || !input.data) throw new Error("Invalid encrypted secret format");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key(), Buffer.from(input.iv, "base64url"));
  decipher.setAuthTag(Buffer.from(input.tag, "base64url"));
  const plaintext = Buffer.concat([decipher.update(Buffer.from(input.data, "base64url")), decipher.final()]);
  return JSON.parse(plaintext.toString("utf8")) as T;
}
