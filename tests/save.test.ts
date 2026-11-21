import { describe, expect, it } from 'vitest';
import { isNewRecord, parseBest } from '../src/save';

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
  it('isNewRecord : strictement supérieur, pas sur une égalité', () => {
    expect(isNewRecord(10, 10)).toBe(false);
    expect(isNewRecord(9, 10)).toBe(false);
    expect(isNewRecord(11, 10)).toBe(true);
    expect(isNewRecord(1, 0)).toBe(true);
    expect(isNewRecord(0, 0)).toBe(false);
  });
});
