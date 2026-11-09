const MUTE_KEY = "quietzone.muted";

function readMuted(): boolean {
  try { return localStorage.getItem(MUTE_KEY) === "1"; } catch { return false; }
}

export class AudioSystem {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private windGain: GainNode | null = null;
  private humGain: GainNode | null = null;
  private radioGain: GainNode | null = null;
  private started = false;
  private disposed = false;
  private stepTimer = 0;
  private birdTimer = 4;
  muted = readMuted();

  private ensureContext(): AudioContext | null {
    if (this.disposed || this.muted) return null;
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.55;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  startAmbience(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.master || this.started) return;
    this.started = true;
    const length = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      last = last * 0.985 + white * 0.015;
      data[i] = last * 4.2;
    }
    const wind = ctx.createBufferSource();
    wind.buffer = buffer; wind.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass"; filter.frequency.value = 720;
    this.windGain = ctx.createGain(); this.windGain.gain.value = 0.16;
    wind.connect(filter).connect(this.windGain).connect(this.master);
    wind.start();

    const hum = ctx.createOscillator();
    hum.type = "sine"; hum.frequency.value = 50;
    const humUpper = ctx.createOscillator();
    humUpper.type = "sine"; humUpper.frequency.value = 100;
    this.humGain = ctx.createGain(); this.humGain.gain.value = 0;
    const upperGain = ctx.createGain(); upperGain.gain.value = 0.18;
    hum.connect(this.humGain);
    humUpper.connect(upperGain).connect(this.humGain);
    this.humGain.connect(this.master);
    hum.start(); humUpper.start();

    const radio = ctx.createBufferSource();
    radio.buffer = buffer; radio.loop = true; radio.playbackRate.value = 1.7;
    const radioFilter = ctx.createBiquadFilter();
    radioFilter.type = "bandpass"; radioFilter.frequency.value = 1700; radioFilter.Q.value = 0.8;
    this.radioGain = ctx.createGain(); this.radioGain.gain.value = 0;
    radio.connect(radioFilter).connect(this.radioGain).connect(this.master);
    radio.start();
  }

  update(dt: number, insideLab: boolean, moving: boolean, radioOn: boolean): void {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    this.windGain?.gain.setTargetAtTime(insideLab ? 0.035 : 0.16, t, 0.35);
    this.humGain?.gain.setTargetAtTime(insideLab ? 0.032 : 0, t, 0.25);
    this.radioGain?.gain.setTargetAtTime(radioOn && insideLab ? 0.075 : 0, t, 0.2);
    this.stepTimer -= dt;
    if (moving && this.stepTimer <= 0) {
      this.step(insideLab);
      this.stepTimer = 0.43;
    }
    this.birdTimer -= dt;
    if (this.birdTimer <= 0) {
      if (!insideLab) this.bird();
      this.birdTimer = 7 + Math.random() * 11;
    }
  }

  private step(inside: boolean): void {
    const ctx = this.ensureContext(); if (!ctx || !this.master) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(inside ? 105 : 82, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.07);
    gain.gain.setValueAtTime(0.055, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
    osc.connect(gain).connect(this.master);
    osc.start(); osc.stop(ctx.currentTime + 0.1);
  }

  private bird(): void {
    const ctx = this.ensureContext(); if (!ctx || !this.master) return;
    const now = ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1450 + i * 240, now + i * 0.12);
      osc.frequency.exponentialRampToValueAtTime(2300 + i * 170, now + i * 0.12 + 0.08);
      gain.gain.setValueAtTime(0.0001, now + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.018, now + i * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.12 + 0.11);
      osc.connect(gain).connect(this.master);
      osc.start(now + i * 0.12); osc.stop(now + i * 0.12 + 0.12);
    }
  }

  sfx(id: "ui" | "door" | "switch"): void {
    const ctx = this.ensureContext(); if (!ctx || !this.master) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.type = id === "door" ? "sawtooth" : "sine";
    const from = id === "door" ? 95 : id === "switch" ? 480 : 380;
    const to = id === "door" ? 48 : 620;
    osc.frequency.setValueAtTime(from, now);
    osc.frequency.exponentialRampToValueAtTime(to, now + (id === "door" ? 0.38 : 0.07));
    gain.gain.setValueAtTime(id === "door" ? 0.055 : 0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (id === "door" ? 0.42 : 0.09));
    osc.connect(gain).connect(this.master);
    osc.start(); osc.stop(now + (id === "door" ? 0.43 : 0.1));
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    try { localStorage.setItem(MUTE_KEY, this.muted ? "1" : "0"); } catch { /* session-only setting */ }
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(this.muted ? 0 : 0.55, this.ctx.currentTime, 0.05);
    if (!this.muted && this.started) void this.ctx?.resume();
    return this.muted;
  }

  dispose(): void {
    this.disposed = true;
    if (this.ctx && this.ctx.state !== "closed") void this.ctx.close();
    this.ctx = null;
    this.master = null;
  }
}
