import { describe, expect, it } from 'vitest';
import { thockFreq } from '../src/audio';

describe('thockFreq', () => {
  it('monte avec le combo', () => {
    for (let i = 1; i <= 14; i++) expect(thockFreq(i)).toBeGreaterThan(thockFreq(i - 1));
  });
  it('est plafonné et entier', () => {
    expect(thockFreq(99)).toBe(thockFreq(14));
    expect(Number.isInteger(thockFreq(3))).toBe(true);
  });
});
