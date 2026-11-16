import { describe, expect, it } from 'vitest';
import { parseBest } from '../src/save';

describe('save', () => {
  it('lit un record valide', () => {
    expect(parseBest('12')).toBe(12);
  });
  it('ignore les valeurs invalides', () => {
    expect(parseBest(null)).toBe(0);
    expect(parseBest('abc')).toBe(0);
    expect(parseBest('-3')).toBe(0);
    expect(parseBest('1e9')).toBe(0);
  });
});
