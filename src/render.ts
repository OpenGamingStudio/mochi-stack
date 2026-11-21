import { BLOCK_H, FIELD, PALETTE, type Block, type State } from './sim';

// Chocolats : [fond, relief]. Aplats uniquement, aucun dégradé.
const COLORS: [string, string][] = [
  ['#7b4021', '#9a5a33'], // noir
  ['#c98a52', '#dba670'], // au lait
  ['#fff0d2', '#ffffff'], // blanc
  ['#e0a055', '#f0bd7c'], // caramel
  ['#5a2d17', '#7b4a2e'], // cacao
  ['#e58fa3', '#f4b0c0'], // rubis
];
const BGS = ['#f6e2c4', '#efd3ad', '#e4bf91', '#d9ae80', '#f9ead2'];
const INK = '#2a140a';

export interface View {
  /** hauteur de caméra en niveaux (lissée) */
  cam: number;
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const k = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, k);
    return;
  }
  // repli (Safari < 16, Chrome < 99) : coins arrondis à la main
  ctx.moveTo(x + k, y);
  ctx.arcTo(x + w, y, x + w, y + h, k);
  ctx.arcTo(x + w, y + h, x, y + h, k);
  ctx.arcTo(x, y + h, x, y, k);
  ctx.arcTo(x, y, x + w, y, k);
  ctx.closePath();
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
    ctx.fillStyle = '#b87a47';
    rr(ctx, ox - 4, floorY, colW + 8, H - floorY + 40, 0);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fff0d2';
    ctx.fillRect(ox + 6, floorY + 3, colW - 12, u * 1.6);
  }

  const block = (b: Block, lvl: number, dy = 0, face = false) => {
    const x = ox + b.x * u;
    const y = levelY(lvl) + dy * u;
    if (y > H + 40 || y < -BLOCK_H * u * 2) return;
    const [base, shine] = COLORS[b.color % PALETTE];
    const bw = b.w * u;
    const bh = BLOCK_H * u;
    ctx.fillStyle = base;
    rr(ctx, x, y, bw, bh, bh * 0.2);
    ctx.fill();
    ctx.stroke();
    // relief de la tablette : un carré en retrait par segment, un reflet plat en haut
    if (bw > 24) {
      ctx.fillStyle = shine;
      const seg = Math.max(1, Math.round(bw / (bh * 1.1)));
      const sw = bw / seg;
      const pad = bh * 0.16;
      for (let k = 0; k < seg; k++) {
        rr(ctx, x + k * sw + pad, y + pad, sw - pad * 2, bh * 0.28, bh * 0.1);
        ctx.fill();
      }
    }
    if (face && b.w * u > 28) {
      const cx = x + (b.w * u) / 2;
      const cy = y + BLOCK_H * u * 0.5;
      ctx.fillStyle = INK;
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.arc(cx - u * 3.2, cy + u * 1.2, u * 0.9, 0, 7);
      ctx.arc(cx + u * 3.2, cy + u * 1.2, u * 0.9, 0, 7);
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
