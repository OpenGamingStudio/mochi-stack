// Sons ASMR de clavier mécanique, synthétisés en Web Audio (aucun fichier, aucune licence à noter).
// Chaque frappe = un « clic » aigu très bref (bruit filtré) + un « thock » grave et rond (sinusoïde
// qui chute) : doux, tactile. La hauteur monte avec le combo, sur une gamme pentatonique.

const SCALE = [0, 2, 4, 7, 9]; // pentatonique majeure, demi-tons
export const DEFAULT_VOLUME = 0.22; // volume bas par défaut

/** Fréquence du thock pour un rang de combo (0 = grave de base), en Hz entier. */
export function thockFreq(step: number): number {
  const n = Math.max(0, Math.min(step, 14));
  const semis = SCALE[n % SCALE.length] + 12 * Math.floor(n / SCALE.length);
  return Math.round(150 * Math.pow(2, semis / 12));
}

export class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  enabled = true;

  unlock(): void {
    if (!this.ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = DEFAULT_VOLUME;
      this.master.connect(this.ctx.destination);
      const len = Math.floor(this.ctx.sampleRate * 0.05);
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    this.resume();
  }

  /** Reprend le contexte audio (suspendu par le navigateur ou « interrupted » sous iOS). */
  resume(): void {
    const c = this.ctx;
    if (c && (c.state === 'suspended' || (c.state as string) === 'interrupted')) void c.resume().catch(() => {});
  }

  /** Onglet caché : on libère l'audio. */
  suspend(): void {
    if (this.ctx && this.ctx.state === 'running') void this.ctx.suspend().catch(() => {});
  }

  /** Une frappe de touche : clic (bruit) + thock (corps). */
  private key(freq: number, vol = 1, delay = 0, clickHz = 3200): void {
    const c = this.ctx;
    if (!c || !this.master || !this.noise || !this.enabled) return;
    const t = c.currentTime + delay;
    // clic : bruit passe-bande, 18 ms
    const n = c.createBufferSource();
    n.buffer = this.noise;
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = clickHz * (0.9 + Math.random() * 0.2);
    bp.Q.value = 1.1;
    const ng = c.createGain();
    ng.gain.setValueAtTime(0.55 * vol, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.018);
    n.connect(bp).connect(ng).connect(this.master);
    n.start(t);
    n.stop(t + 0.05);
    // thock : sinusoïde qui chute, enveloppe courte et ronde
    const o = c.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(freq * 1.5, t);
    o.frequency.exponentialRampToValueAtTime(freq, t + 0.03);
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1400;
    const og = c.createGain();
    og.gain.setValueAtTime(0.0001, t);
    og.gain.linearRampToValueAtTime(0.95 * vol, t + 0.004);
    og.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    o.connect(lp).connect(og).connect(this.master);
    o.start(t);
    o.stop(t + 0.14);
  }

  /** Tranche coupée : même frappe, un cran au-dessus. */
  land(): void {
    this.key(thockFreq(1), 0.85);
  }
  /** Empilement réussi : la hauteur monte avec le combo. */
  perfect(combo: number): void {
    const step = combo + 1;
    this.key(thockFreq(step), 1, 0, 3600);
    if (combo >= 3) this.key(thockFreq(step + 2), 0.6, 0.06, 4200);
  }
  /** Record battu : trois frappes montantes. */
  record(): void {
    [4, 6, 9].forEach((s, i) => this.key(thockFreq(s), 0.9, 0.09 + i * 0.075, 4000));
  }
  /** Raté : grosse touche (barre d'espace) très grave. */
  over(): void {
    this.key(95, 1.2, 0, 1800);
    this.key(70, 0.9, 0.09, 1500);
  }
}
