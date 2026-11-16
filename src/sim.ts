// Logique pure du jeu (sans DOM) : testable avec vitest.

export const FIELD = 100; // largeur du terrain, en unités
export const BLOCK_H = 9; // hauteur d'un mochi
export const START_W = 44;
export const PERFECT_TOL = 1.4; // écart toléré pour un « pile »
export const REGAIN = 2.5; // largeur regagnée par pile
export const MIN_W = 1; // en dessous, la tour est considérée finie

export interface Block {
  x: number; // bord gauche
  w: number;
  color: number; // index de palette
}

export interface Debris extends Block {
  y: number; // niveau (index de rangée), fixe
  fall: number; // chute accumulée, en unités
  vy: number;
  vx: number;
}

export interface State {
  tower: Block[];
  cur: Block; // mochi qui glisse (au niveau tower.length)
  dir: 1 | -1;
  score: number;
  combo: number;
  over: boolean;
  debris: Debris[];
  lastPerfect: boolean;
}

export const PALETTE = 6;

export function speedFor(score: number): number {
  return Math.min(34 + score * 1.6, 95);
}

function spawn(top: Block, level: number): Block {
  return { x: -top.w / 2, w: top.w, color: level % PALETTE };
}

export function newGame(): State {
  const base: Block = { x: (FIELD - START_W) / 2, w: START_W, color: 0 };
  return {
    tower: [base],
    cur: spawn(base, 1),
    dir: 1,
    score: 0,
    combo: 0,
    over: false,
    debris: [],
    lastPerfect: false,
  };
}

export function update(s: State, dt: number): void {
  for (const d of s.debris) {
    d.vy += 260 * dt;
    d.fall += d.vy * dt;
    d.x += d.vx * dt;
  }
  s.debris = s.debris.filter((d) => d.fall < 400);
  if (s.over) return;
  const c = s.cur;
  c.x += s.dir * speedFor(s.score) * dt;
  const lo = -c.w / 2;
  const hi = FIELD - c.w / 2;
  if (c.x > hi) {
    c.x = hi - (c.x - hi);
    s.dir = -1;
  } else if (c.x < lo) {
    c.x = lo + (lo - c.x);
    s.dir = 1;
  }
}

/** Lâche le mochi. Retourne 'perfect' | 'cut' | 'miss'. */
export function drop(s: State): 'perfect' | 'cut' | 'miss' | 'over' {
  if (s.over) return 'over';
  const top = s.tower[s.tower.length - 1];
  const c = s.cur;
  const level = s.tower.length;
  const left = Math.max(c.x, top.x);
  const right = Math.min(c.x + c.w, top.x + top.w);
  const overlap = right - left;
  if (overlap < MIN_W) {
    s.debris.push({ ...c, y: level, fall: 0, vy: 0, vx: 0 });
    s.over = true;
    s.combo = 0;
    s.lastPerfect = false;
    return 'miss';
  }
  let placed: Block;
  let result: 'perfect' | 'cut';
  if (Math.abs(c.x - top.x) <= PERFECT_TOL) {
    // Pile : on s'aligne sur la tour et on regagne de la largeur (plafonnée à la largeur de départ)
    s.combo++;
    const w = Math.min(START_W, top.w + REGAIN);
    const x = Math.max(0, Math.min(FIELD - w, top.x - (w - top.w) / 2));
    placed = { x, w, color: c.color };
    result = 'perfect';
    s.lastPerfect = true;
  } else {
    s.combo = 0;
    s.lastPerfect = false;
    placed = { x: left, w: overlap, color: c.color };
    result = 'cut';
    // la partie qui dépasse tombe
    if (c.x < left) s.debris.push({ x: c.x, w: left - c.x, color: c.color, y: level, fall: 0, vy: 0, vx: -6 });
    if (c.x + c.w > right) s.debris.push({ x: right, w: c.x + c.w - right, color: c.color, y: level, fall: 0, vy: 0, vx: 6 });
  }
  s.tower.push(placed);
  s.score++;
  s.cur = spawn(placed, s.tower.length);
  s.dir = 1;
  return result;
}
