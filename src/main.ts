import './style.css';
import { Sfx } from './audio';
import { draw, follow, type View } from './render';
import { isNewRecord, loadBest, loadSound, parseBest, saveBest, saveSound, setBest } from './save';
import { drop, newGame, update, type State } from './sim';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const canvas = $<HTMLCanvasElement>('stage');
const hud = $('hud');
const startEl = $('start');
const overEl = $('over');
const hudScore = $('hud-score');
const sfx = new Sfx();
sfx.enabled = loadSound();

if (matchMedia('(prefers-reduced-motion: reduce)').matches) document.documentElement.classList.add('reduce');

let state: State = newGame();
let view: View = { cam: 0 };
let running = false;
let best = loadBest();
let bestAtStart = best;
let recordSung = false;
let last = performance.now();

function fit(): void {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(canvas.clientWidth * dpr);
  canvas.height = Math.round(canvas.clientHeight * dpr);
}
addEventListener('resize', fit);
fit();

function showBest(): void {
  $('start-best').textContent = String(best);
  $('hud-best').textContent = String(best);
}
showBest();

function paintSound(): void {
  const b = $('sound');
  $('sound-on').hidden = !sfx.enabled;
  $('sound-off').hidden = sfx.enabled;
  b.setAttribute('aria-pressed', String(sfx.enabled));
  b.setAttribute('aria-label', sfx.enabled ? 'Couper le son' : 'Activer le son');
}
paintSound();
$('version').textContent = 'v' + __APP_VERSION__;
$('sound').addEventListener('click', (e) => {
  e.stopPropagation();
  sfx.enabled = !sfx.enabled;
  saveSound(sfx.enabled);
  if (sfx.enabled) sfx.unlock();
  paintSound();
});

function start(): void {
  sfx.unlock();
  state = newGame();
  bestAtStart = best;
  recordSung = false;
  view = { cam: 0 };
  running = true;
  startEl.hidden = true;
  overEl.hidden = true;
  hud.hidden = false;
  hudScore.textContent = '0';
  window.OGSAccount?.show(false);
}

function tap(): void {
  if (!running || state.over) return;
  sfx.unlock();
  const r = drop(state);
  hudScore.textContent = String(state.score);
  hudScore.classList.remove('bump');
  void hudScore.offsetWidth;
  hudScore.classList.add('bump');
  // le record est gardé à chaque lâcher (onglet fermé en pleine partie = score conservé)
  if (r !== 'miss' && state.score > best) {
    best = saveBest(state.score);
    showBest();
  }
  const beatRecord = r !== 'miss' && !recordSung && bestAtStart > 0 && isNewRecord(state.score, bestAtStart);
  if (beatRecord) {
    recordSung = true;
    sfx.record();
  } else if (r === 'perfect') sfx.perfect(state.combo);
  else if (r === 'cut') sfx.land();
  else if (r === 'miss') {
    sfx.over();
    best = saveBest(state.score);
    showBest();
    const record = isNewRecord(state.score, bestAtStart);
    setTimeout(() => {
      $('over-score').textContent = String(state.score);
      $('over-best').textContent = record ? 'Nouveau record !' : `Meilleur : ${best}`;
      overEl.hidden = false;
      window.OGSAccount?.show(true);
      $('replay').focus();
    }, 700);
  }
}

canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  tap();
});
addEventListener('keydown', (e) => {
  if (e.code !== 'Space' && e.code !== 'Enter') return;
  const t = e.target as HTMLElement;
  if (t.tagName === 'BUTTON') return;
  e.preventDefault();
  if (e.repeat) return;
  if (!running || (state.over && !overEl.hidden)) start();
  else tap();
});
$('play').addEventListener('click', start);
$('replay').addEventListener('click', start);

function frame(now: number): void {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (running) {
    update(state, dt);
    follow(view, state, dt);
  } else {
    // décor de l'accueil : une petite tour immobile
    view.cam = 0;
  }
  draw(canvas, state, view, now / 1000, running);
  raf = document.hidden ? 0 : requestAnimationFrame(frame);
}
let raf = requestAnimationFrame(frame);

// onglet caché : plus de rendu, audio suspendu ; au retour on reprend (même sans geste, iOS « interrupted »)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    sfx.suspend();
    return;
  }
  last = performance.now();
  if (sfx.enabled && running) sfx.resume();
  if (!raf) raf = requestAnimationFrame(frame);
});

// ---- compte OpenGamingStudio (facultatif) : record sur tous les appareils ----------------------------
declare global { interface Window { OGSAccount?: { init(c: Record<string, unknown>): void; show(on: boolean): void; notifyChange?(): void } } }
window.OGSAccount?.init({
  game: 'mochi-stack', version: __APP_VERSION__, color: '#FF8FB1', anchor: 'top-left', offset: [8, 8],
  getSave: () => ({ best: loadBest(), sound: loadSound() }),
  applySave: (d: { best?: unknown; sound?: unknown }) => {
    if (!d || typeof d !== 'object') return;
    setBest(parseBest(String(d.best ?? 0)));
    if (typeof d.sound === 'boolean') saveSound(d.sound);
    location.reload();
  },
  isEmpty: (d: { best?: unknown }) => !d || !(Number(d.best) > 0),
  describe: (d: { best?: unknown }) => `record ${Number(d?.best) || 0}`,
});
