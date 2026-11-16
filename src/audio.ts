// Sons synthétisés (Web Audio) : aucun fichier. Le contexte naît au premier geste du joueur.

export class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  enabled = true;

  unlock(): void {
    if (!this.ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.4;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  private tone(freq: number, dur: number, type: OscillatorType, vol: number, slideTo?: number, delay = 0): void {
    const c = this.ctx;
    if (!c || !this.master || !this.enabled) return;
    const t = c.currentTime + delay;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  /** Mochi posé : un « pof » mou. */
  land(): void {
    this.tone(220, 0.12, 'sine', 0.6, 110);
  }
  /** Pile : gamme montante selon le combo. */
  perfect(combo: number): void {
    const base = 523 * Math.pow(2, Math.min(combo - 1, 7) / 12 * 2);
    this.tone(base, 0.18, 'triangle', 0.5);
    this.tone(base * 1.5, 0.22, 'triangle', 0.35, undefined, 0.07);
  }
  over(): void {
    this.tone(330, 0.5, 'sawtooth', 0.25, 90);
  }
}
