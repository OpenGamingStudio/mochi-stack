import { describe, expect, it } from 'vitest';
import { FIELD, START_W, drop, newGame, speedFor, update } from '../src/sim';

describe('sim', () => {
  it('démarre avec une base centrée', () => {
    const s = newGame();
    expect(s.tower).toHaveLength(1);
    expect(s.tower[0].x + s.tower[0].w / 2).toBeCloseTo(FIELD / 2);
    expect(s.score).toBe(0);
  });

  it('le mochi rebondit dans le terrain', () => {
    const s = newGame();
    for (let i = 0; i < 2000; i++) {
      update(s, 0.016);
      expect(s.cur.x).toBeGreaterThanOrEqual(-s.cur.w / 2 - 0.01);
      expect(s.cur.x).toBeLessThanOrEqual(FIELD - s.cur.w / 2 + 0.01);
    }
  });

  it('un lâcher pile garde la largeur et compte un combo', () => {
    const s = newGame();
    s.cur.x = s.tower[0].x + 0.5;
    expect(drop(s)).toBe('perfect');
    expect(s.score).toBe(1);
    expect(s.combo).toBe(1);
    expect(s.tower[1].w).toBeCloseTo(START_W);
    expect(s.debris).toHaveLength(0);
  });

  it('la largeur regagnée est plafonnée à la largeur de départ', () => {
    const s = newGame();
    for (let i = 0; i < 5; i++) {
      s.cur.x = s.tower[s.tower.length - 1].x;
      drop(s);
    }
    expect(Math.max(...s.tower.map((b) => b.w))).toBeLessThanOrEqual(START_W);
  });

  it('un lâcher décalé coupe le dépassement', () => {
    const s = newGame();
    const top = s.tower[0];
    s.cur.x = top.x + 10;
    expect(drop(s)).toBe('cut');
    expect(s.tower[1].w).toBeCloseTo(START_W - 10);
    expect(s.tower[1].x).toBeCloseTo(top.x + 10);
    expect(s.debris).toHaveLength(1);
    expect(s.debris[0].w).toBeCloseTo(10);
    expect(s.combo).toBe(0);
  });

  it('un lâcher dans le vide termine la partie', () => {
    const s = newGame();
    s.cur.x = -s.cur.w;
    expect(drop(s)).toBe('miss');
    expect(s.over).toBe(true);
    expect(drop(s)).toBe('over');
    expect(s.score).toBe(0);
  });

  it('la vitesse augmente puis plafonne', () => {
    expect(speedFor(10)).toBeGreaterThan(speedFor(0));
    expect(speedFor(1000)).toBe(speedFor(500));
  });

  it('la tour rétrécit jusqu’à la fin', () => {
    const s = newGame();
    let n = 0;
    while (!s.over && n < 200) {
      s.cur.x = s.tower[s.tower.length - 1].x + 3;
      drop(s);
      n++;
    }
    expect(s.over).toBe(true);
    expect(n).toBeLessThan(40);
  });
});
