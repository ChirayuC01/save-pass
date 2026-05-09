// All cryptographic operations run in the browser via the Web Crypto API.
// The server never sees plaintext credentials — only AES-256-GCM ciphertext.

const PBKDF2_ITERATIONS = 600_000; // OWASP recommended minimum for PBKDF2-SHA256

const hexToBytes = (hex: string): Uint8Array<ArrayBuffer> => {
  const buffer = new ArrayBuffer(hex.length / 2);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
};

const bytesToHex = (bytes: Uint8Array): string =>
  Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

export const deriveKey = async (password: string, keySaltHex: string): Promise<CryptoKey> => {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: hexToBytes(keySaltHex),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
};

export const exportKey = async (cryptoKey: CryptoKey): Promise<string> => {
  const raw = await crypto.subtle.exportKey('raw', cryptoKey);
  return bytesToHex(new Uint8Array(raw));
};

export const importKey = async (keyHex: string): Promise<CryptoKey> => {
  return crypto.subtle.importKey(
    'raw',
    hexToBytes(keyHex),
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
};

export const encryptData = async (
  keyHex: string,
  plaintext: string
): Promise<{ encryptedData: string; iv: string }> => {
  const key = await importKey(keyHex);
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(plaintext)
  );

  return {
    encryptedData: bytesToHex(new Uint8Array(ciphertext)),
    iv: bytesToHex(iv),
  };
};

export const decryptData = async (
  keyHex: string,
  encryptedDataHex: string,
  ivHex: string
): Promise<string> => {
  const key = await importKey(keyHex);
  const dec = new TextDecoder();

  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: hexToBytes(ivHex) },
    key,
    hexToBytes(encryptedDataHex)
  );

  return dec.decode(plaintext);
};

export const checkBreached = async (password: string): Promise<boolean> => {
  try {
    const enc = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-1', enc.encode(password));
    const hash = bytesToHex(new Uint8Array(hashBuffer)).toUpperCase();
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);

    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { 'Add-Padding': 'true' },
    });
    if (!res.ok) return false;

    const text = await res.text();
    return text.split('\n').some((line) => line.split(':')[0] === suffix);
  } catch {
    return false;
  }
};

export const generatePassword = (
  length = 20,
  opts = { upper: true, lower: true, numbers: true, symbols: true }
): string => {
  const charsets = [
    opts.upper ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' : '',
    opts.lower ? 'abcdefghijklmnopqrstuvwxyz' : '',
    opts.numbers ? '0123456789' : '',
    opts.symbols ? '!@#$%^&*()_+-=[]{}|;:,.<>?' : '',
  ].filter(Boolean);

  if (charsets.length === 0) return '';
  const pool = charsets.join('');
  const arr = crypto.getRandomValues(new Uint32Array(length));
  return Array.from(arr)
    .map((n) => pool[n % pool.length])
    .join('');
};
