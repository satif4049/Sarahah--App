import crypto from "node:crypto";
import envConfig from "../../Configs/env.config.js";
const ENCRYPTION_KEY = Buffer.from(envConfig.encryption.key, "hex");
const IV_LENGTH = envConfig.encryption.iV;
export function encryption(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const chipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
  let textEncryption = chipher.update(text, "utf8", "hex");
  textEncryption += chipher.final("hex");
  return `${iv.toString("hex")}:${textEncryption}`;
}

export function decryption(chipher) {
  const [iv, textEncryption] = chipher.split(":");
  const ivHex = Buffer.from(iv, "hex");
  const dechiphertext = crypto.createDecipheriv(
    "aes-256-cbc",
    ENCRYPTION_KEY,
    ivHex,
  );
  let chipherDecrypted = dechiphertext.update(textEncryption, "hex", "utf8");
  chipherDecrypted += dechiphertext.final("utf8");
  return chipherDecrypted;
}
