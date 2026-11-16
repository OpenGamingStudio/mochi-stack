import { BLOCK_H, FIELD, PALETTE, type Block, type State } from './sim';

const COLORS = ['#ffb3c7', '#b8e6c9', '#ffe29a', '#b9d8ff', '#d9c2ff', '#ffc9a8'];
const BGS = ['#fff4e0', '#e8f6ff', '#f1ebff', '#e9f8ee', '#ffeef2'];
const INK = '#16110f';

export interface View {
  /** hauteur de caméra en niveaux (lissée) */
  cam: number;
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2));
}

export function bgFor(score: number): string {
  return BGS[Math.floor(score / 10) % BGS.length];
}

export function draw(canvas: HTMLCanvasElement, s: State, v: View, time: number, running: boolean): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const W = canvas.width;
  const H = canvas.height;
  // le terrain tient dans une colonne de format téléphone, centrée
  const colW = Math.min(W, (H * 9) / 16);
  const u = colW / FIELD;
  const ox = (W - colW) / 2;
  ctx.fillStyle = bgFor(s.score);
  ctx.fillRect(0, 0, W, H);
  // sol de la tour : niveau 0 posé à baseY quand cam = 0
  const baseY = H * 0.82;
  const levelY = (lvl: number) => baseY - (lvl - v.cam) * BLOCK_H * u - BLOCK_H * u;
  const lw = Math.max(2, u * 0.7);
  ctx.lineWidth = lw;
  ctx.strokeStyle = INK;
  ctx.lineJoin = 'round';

  // plateau
  const floorY = levelY(0) + BLOCK_H * u;
  if (floorY < H + 20) {
    ctx.fillStyle = '#f0dfbf';
    rr(ctx, ox - 4, floorY, colW + 8, H - floorY + 40, 0);
    ctx.fill();
    ctx.stroke();
  }

  const block = (b: Block, lvl: number, dy = 0, face = false) => {
    const x = ox + b.x * u;
    const y = levelY(lvl) + dy * u;
    if (y > H + 40 || y < -BLOCK_H * u * 2) return;
    ctx.fillStyle = COLORS[b.color % PALETTE];
    rr(ctx, x, y, b.w * u, BLOCK_H * u, BLOCK_H * u * 0.42);
    ctx.fill();
    ctx.stroke();
    if (face && b.w * u > 28) {
      const cx = x + (b.w * u) / 2;
      const cy = y + BLOCK_H * u * 0.5;
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.arc(cx - u * 3.2, cy, u * 0.9, 0, 7);
      ctx.arc(cx + u * 3.2, cy, u * 0.9, 0, 7);
      ctx.fill();
    }
  };

  s.tower.forEach((b, i) => block(b, i, 0, i === s.tower.length - 1));
  for (const d of s.debris) block(d, d.y, d.fall);
  if (running && !s.over) {
    const wob = Math.sin(time * 9) * 0.25;
    block(s.cur, s.tower.length, wob, true);
  }
}

/** Avance la caméra vers la hauteur de la tour (haut à ~55 % de l'écran). */
export function follow(v: View, s: State, dt: number): void {
  const target = Math.max(0, s.tower.length - 6);
  v.cam += (target - v.cam) * Math.min(1, dt * 5);
}
