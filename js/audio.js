const Speech = {
  voices: [],
  init() {
    if (!('speechSynthesis' in window)) return;
    const load = () => { this.voices = speechSynthesis.getVoices(); if (this.onChange) this.onChange(); };
    load();
    speechSynthesis.onvoiceschanged = load;
  },
  prefs: {},
  listFor(l2) {
    return this.voices.filter(v => v.lang.replace('_', '-').toLowerCase().startsWith(l2));
  },
  // Picks the user's chosen voice, otherwise the best-sounding one available
  voice(lang) {
    const l = lang.toLowerCase(), l2 = l.slice(0, 2);
    const list = this.listFor(l2);
    const chosen = this.prefs[l2] && list.find(v => v.voiceURI === this.prefs[l2]);
    if (chosen) return chosen;
    const score = v => {
      const id = v.name + ' ' + v.voiceURI;
      let s = 0;
      if (/natural|neural|premium|enhanced|forbedret/i.test(id)) s += 20;
      if (/online|google|siri/i.test(id)) s += 8;
      if (/compact/i.test(id)) s -= 5;
      if (v.lang.replace('_', '-').toLowerCase() === l) s += 3;
      return s;
    };
    return [...list].sort((a, b) => score(b) - score(a))[0];
  },
  clean(text) {
    return String(text).replace(/\p{Extended_Pictographic}|\uFE0F/gu, '').replace(/×/g, ' gange ').replace(/÷/g, ' delt med ').replace(/−/g, ' minus ').replace(/\+/g, ' plus ');
  },
  utter(text, lang) {
    const u = new SpeechSynthesisUtterance(this.clean(text));
    u.lang = lang;
    const v = this.voice(lang);
    if (v) u.voice = v;
    u.rate = lang.startsWith('en') ? 0.8 : 0.95;
    return u;
  },
  say(text, lang = 'da-DK') {
    if (!('speechSynthesis' in window) || !text) return;
    speechSynthesis.cancel();
    speechSynthesis.speak(this.utter(text, lang));
  },
  queue(text, lang = 'da-DK') {
    if (!('speechSynthesis' in window) || !text) return;
    speechSynthesis.speak(this.utter(text, lang));
  },
  // Some browsers drop utterances queued right after cancel(), so chain on onend instead
  sayThen(text, lang, next, nextLang) {
    if (!('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const u = this.utter(text, lang);
    let done = false;
    const go = () => { if (!done) { done = true; speechSynthesis.speak(this.utter(next, nextLang)); } };
    u.onend = go;
    u.onerror = go;
    setTimeout(go, 600 + String(text).length * 90);
    speechSynthesis.speak(u);
  },
  stop() {
    if ('speechSynthesis' in window) speechSynthesis.cancel();
  },
};

const Listen = {
  supported() { return !!(window.SpeechRecognition || window.webkitSpeechRecognition); },
  start(lang, onResult, onFail) {
    const R = window.SpeechRecognition || window.webkitSpeechRecognition;
    let done = false;
    try {
      const r = new R();
      r.lang = lang;
      r.interimResults = false;
      r.maxAlternatives = 5;
      r.onresult = e => {
        if (done) return;
        done = true;
        onResult([...e.results[0]].map(a => a.transcript));
      };
      r.onerror = () => { if (!done) { done = true; onFail(); } };
      r.onend = () => { if (!done) { done = true; onFail(); } };
      r.start();
    } catch (e) {
      if (!done) { done = true; onFail(); }
    }
  },
  matches(alts, target) {
    const norm = s => s.toLowerCase()
      .replace(/\b(10|[1-9])\b/g, d => EN_NUMBERS[+d - 1])
      .replace(/[^a-z' ]/g, ' ').split(/\s+/).filter(Boolean);
    const want = norm(target);
    return alts.some(alt => {
      const got = norm(alt);
      const hits = want.filter(w => got.includes(w)).length;
      return hits >= Math.ceil(want.length * 0.6);
    });
  },
};

const Sfx = {
  ctx: null,
  get() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  },
  tone(freq, dur, type = 'sine', vol = 0.15, delay = 0) {
    const c = this.get();
    if (!c) return;
    const o = c.createOscillator(), g = c.createGain();
    const t = c.currentTime + delay;
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + dur + 0.05);
  },
  noise(dur, vol, freq = 1200, q = 0.7, delay = 0) {
    const c = this.get();
    if (!c) return;
    const len = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    src.buffer = buf;
    f.type = 'bandpass';
    f.frequency.value = freq;
    f.Q.value = q;
    g.gain.value = vol;
    src.connect(f).connect(g).connect(c.destination);
    src.start(c.currentTime + delay);
  },
  click() { this.tone(560, 0.06, 'square', 0.04); },
  good() { [660, 880, 1320].forEach((f, i) => this.tone(f, 0.25, 'triangle', 0.14, i * 0.08)); },
  bad() { this.tone(230, 0.22, 'sawtooth', 0.06); this.tone(180, 0.28, 'sawtooth', 0.06, 0.1); },
  magic() { [523, 659, 784, 1046, 1318].forEach((f, i) => this.tone(f, 0.4, 'sine', 0.1, i * 0.07)); },
  fanfare() { [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.4, 'triangle', 0.15, i * 0.15)); },
  whoosh() { this.noise(0.35, 0.5, 900, 1.5); },
  hit() { this.tone(110, 0.25, 'square', 0.12); this.noise(0.15, 0.6, 400); },
  whistle() { this.tone(2100, 0.5, 'sine', 0.08); this.tone(2150, 0.5, 'sine', 0.05); },
  cheer() { this.noise(1.6, 1.2, 1500, 0.4); this.noise(1.2, 0.8, 2500, 0.6, 0.2); this.good(); },
  groan() { this.noise(0.8, 0.6, 500, 0.5); },
};
