// TOTP (RFC 6238) Implementation using native Web Crypto API
// This allows real-time generation and verification of Google Authenticator codes.

function base32ToBytes(base32: string): Uint8Array {
  const base32chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const cleanBase32 = base32.replace(/=+$/, "").toUpperCase();
  const len = cleanBase32.length;
  const bytes = new Uint8Array(Math.floor((len * 5) / 8));
  
  let bits = 0;
  let value = 0;
  let index = 0;
  
  for (let i = 0; i < len; i++) {
    const val = base32chars.indexOf(cleanBase32.charAt(i));
    if (val === -1) {
      throw new Error("Invalid base32 character: " + cleanBase32.charAt(i));
    }
    value = (value << 5) | val;
    bits += 5;
    if (bits >= 8) {
      bytes[index++] = (value >>> (bits - 8)) & 255;
      bits -= 8;
    }
  }
  return bytes;
}

async function generateTOTPForCounter(secret: string, counter: number): Promise<string> {
  const keyBytes = base32ToBytes(secret);
  const counterBytes = new Uint8Array(8);
  let temp = counter;
  for (let i = 7; i >= 0; i--) {
    counterBytes[i] = temp & 0xff;
    temp = temp >>> 8;
  }
  
  const cryptoKey = await window.crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: { name: "SHA-1" } },
    false,
    ["sign"]
  );
  
  const signature = await window.crypto.subtle.sign("HMAC", cryptoKey, counterBytes);
  const hmac = new Uint8Array(signature);
  
  const offset = hmac[hmac.length - 1] & 0xf;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
    
  const otp = binary % 1000000;
  return otp.toString().padStart(6, "0");
}

export async function generateTOTP(secret: string, timeStepSeconds: number = 30): Promise<string> {
  try {
    const epoch = Math.round(Date.now() / 1000);
    const counter = Math.floor(epoch / timeStepSeconds);
    return await generateTOTPForCounter(secret, counter);
  } catch (e) {
    console.error("Error generating TOTP:", e);
    return "000000";
  }
}

export async function verifyTOTP(secret: string, token: string, windowSize: number = 1): Promise<boolean> {
  try {
    const epoch = Math.round(Date.now() / 1000);
    const currentCounter = Math.floor(epoch / 30);
    
    // Check multiple windows to handle minor drift
    for (let i = -windowSize; i <= windowSize; i++) {
      const calculatedToken = await generateTOTPForCounter(secret, currentCounter + i);
      if (calculatedToken === token.trim()) {
        return true;
      }
    }
    return false;
  } catch (e) {
    console.error("Error verifying TOTP:", e);
    return false;
  }
}

export function generateSecret(length: number = 16): string {
  const base32chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let secret = "";
  const randomValues = new Uint8Array(length);
  window.crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    secret += base32chars.charAt(randomValues[i] % 32);
  }
  return secret;
}
