import { describe, it, expect } from 'vitest';

import { generateApiKey, hashApiKey, verifyApiKeyHash } from './api-key.model.js';

describe('API key hashing', () => {
  it('generates prefixed keys with at least 192 bits of entropy', () => {
    const { rawKey } = generateApiKey('sf_live_');

    expect(rawKey).toMatch(/^sf_live_[0-9a-f]{48}$/);
  });

  it('generates a different key every time', () => {
    const keys = new Set(Array.from({ length: 50 }, () => generateApiKey().rawKey));

    expect(keys.size).toBe(50);
  });

  it('returns a SHA-256 hex hash that does not contain the raw key', () => {
    const { rawKey, keyHash } = generateApiKey();

    expect(keyHash).toMatch(/^[0-9a-f]{64}$/);
    expect(keyHash).toBe(hashApiKey(rawKey));
    expect(keyHash).not.toContain(rawKey);
  });

  it('hashing is deterministic', () => {
    expect(hashApiKey('sf_live_abc')).toBe(hashApiKey('sf_live_abc'));
    expect(hashApiKey('sf_live_abc')).not.toBe(hashApiKey('sf_live_abd'));
  });
});

describe('verifyApiKeyHash', () => {
  it('accepts the matching raw key', () => {
    const { rawKey, keyHash } = generateApiKey();

    expect(verifyApiKeyHash(rawKey, keyHash)).toBe(true);
  });

  it('rejects a different key', () => {
    const { keyHash } = generateApiKey();

    expect(verifyApiKeyHash(generateApiKey().rawKey, keyHash)).toBe(false);
  });

  it('rejects the stored hash presented as if it were the key', () => {
    const { keyHash } = generateApiKey();

    expect(verifyApiKeyHash(keyHash, keyHash)).toBe(false);
  });

  it('rejects malformed or empty stored hashes without throwing', () => {
    const { rawKey } = generateApiKey();

    expect(verifyApiKeyHash(rawKey, '')).toBe(false);
    expect(verifyApiKeyHash(rawKey, 'not-hex')).toBe(false);
    expect(verifyApiKeyHash(rawKey, 'ab')).toBe(false);
  });
});
