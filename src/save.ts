const BEST = 'mochi-stack:best';
const SOUND = 'mochi-stack:sound';

function get(k: string): string | null {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
}
function set(k: string, v: string): void {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* stockage indisponible : on joue sans sauvegarde */
  }
}

export function parseBest(raw: string | null): number {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 && n < 1e6 ? Math.floor(n) : 0;
}

export function loadBest(): number {
  return parseBest(get(BEST));
}

/** Enregistre le score s'il bat le record ; retourne le meilleur score. */
export function saveBest(score: number): number {
  const best = loadBest();
  if (score > best) {
    set(BEST, String(score));
    return score;
  }
  return best;
}

/** Remplace le record (progression venant du compte). */
export function setBest(n: number): void {
  set(BEST, String(n));
}

/** Un record n'est « nouveau » que s'il bat strictement le meilleur du début de partie. */
export function isNewRecord(score: number, bestAtStart: number): boolean {
  return score > 0 && score > bestAtStart;
}

export function loadSound(): boolean {
  return get(SOUND) !== '0';
}
export function saveSound(on: boolean): void {
  set(SOUND, on ? '1' : '0');
}
