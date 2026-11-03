// Side-view roller coaster ride. Hold = speed up, release = brake. Collect coins, slow down in red zones.
const Coaster = (() => {
  let raf = 0, cleanup = null;

  function stop() {
    cancelAnimationFrame(raf);
    raf = 0;
    if (cleanup) { cleanup(); cleanup = null; }
  }

  const NIGHT = { flagermus: 1, lyn: 1, midgard: 0 };

  function start(root, ride, av, year, onEnd) {
    stop();
    const c = ride.coaster;
    root.innerHTML = '<canvas class="ccanvas"></canvas>';
    const cv = root.querySelector('canvas'), ctx = cv.getContext('2d');
    let Wd = 0, Ht = 0, S = 1;
    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      Wd = root.clientWidth || 800; Ht = root.clientHeight || 600;
      cv.width = Wd * dpr; cv.height = Ht * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      S = Ht / 760;
    };
    resize();
    window.addEventListener('resize', resize);

    // ---------- track ----------
    const STATION = 500, END_PAD = 700;
    const seq = [...c.hills, ...c.hills.slice(1).map((h, i) => h * (i % 2 ? 0.9 : 1.08))];
    const segW = Math.max(900, (c.len * 3.2) / seq.length);
    const LEN = STATION + seq.length * segW + END_PAD;
    const HK = 1.7, LIFT = c.hang ? 60 : 0;
    function hAt(x) {
      if (x < STATION || x > LEN - END_PAD) return LIFT;
      const f = (x - STATION) / segW, i = Math.floor(f), u = f - i;
      return LIFT + seq[i] * HK * (1 - Math.cos(2 * Math.PI * u)) / 2;
    }
    const slope = x => (hAt(x + 2) - hAt(x - 2)) / 4;
    const crestX = seq.map((_, i) => STATION + (i + 0.5) * segW);
    const valleys = seq.slice(1).map((_, i) => STATION + (i + 1) * segW);

    // difficulty by school year
    const limitAdj = { 1: 2, 2: 1, 3: 0, 4: -0.3 }[year] || 0;
    const nRed = Math.max(1, Math.min(valleys.length - (c.loops || 0), { 1: Math.ceil(c.red / 2), 2: c.red - 1, 3: c.red, 4: c.red + 1 }[year] || c.red));
    const LIMIT = (c.limit + limitAdj) * 50;
    const RED_W = year === 1 ? 300 : 360;

    // loops take some valleys, red zones the rest
    const loopIdx = new Set();
    for (let k = 0; k < (c.loops || 0); k++) loopIdx.add(Math.min(valleys.length - 1, Math.floor(((k + 1) * valleys.length) / ((c.loops || 0) + 1))));
    const freeV = valleys.filter((_, i) => !loopIdx.has(i));
    const red = [];
    const step = freeV.length / nRed;
    for (let k = 0; k < nRed; k++) red.push({ x: freeV[Math.min(freeV.length - 1, Math.floor(step * k + step / 2))], hit: false, warned: false });
    const loops = [...loopIdx].map(i => ({ x: valleys[i], done: false }));
    const LOOP_R = 115;
    const tunnels = [];
    for (let k = 0; k < (c.tunnels || 0); k++) {
      const ci = Math.min(crestX.length - 1, 2 + k * 3);
      tunnels.push({ x: crestX[ci] - segW * 0.3, w: segW * 0.28 });
    }
    const inRed = x => red.find(z => Math.abs(x - z.x) < RED_W / 2);

    // coins: along the track, plus high bonus coins after crests
    const coins = [];
    for (let x = STATION + 250; x < LEN - END_PAD - 100; x += 300) {
      if (inRed(x) || loops.some(l => Math.abs(l.x - x) < 120)) continue;
      coins.push({ x, off: 24, got: false });
    }
    crestX.slice(1).forEach(x => { [[40, 80], [100, 95], [160, 80]].forEach(([dx, off]) => coins.push({ x: x + dx, off, got: false, high: true })); });
    const total = coins.length + loops.length * 3;

    // ---------- state ----------
    const st = { x: 160, v: 0, air: 0, vy: 0, hold: false, got: 0, pen: 0, airs: 0, loopsDone: 0, t: 0, done: false, msg: [], launch: !!c.launch, shake: 0, finished: 0, loop: null };
    const parts = [];
    const say = (text, color = '#fff') => st.msg.push({ text, color, t: 0 });
    const down = e => { e.preventDefault(); st.hold = true; };
    const up = () => { st.hold = false; };
    const key = e => { if (e.code === 'Space') { e.preventDefault(); st.hold = e.type === 'keydown'; } };
    cv.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    window.addEventListener('keydown', key);
    window.addEventListener('keyup', key);
    cleanup = () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      window.removeEventListener('keydown', key);
      window.removeEventListener('keyup', key);
    };

    const G = 620, firstTop = crestX[0];
    let camY = 0;
    say(c.launch ? 'Klar... parat... AF STED!' : 'Kæden trækker jer op...', '#ffe066');

    const clack = dt => { if (Math.random() < dt * 8) Sfx.tone(140, 0.03, 'square', 0.03); };

    function update(dt) {
      st.t += dt;
      // inside a loop
      if (st.loop) {
        const L = st.loop;
        const hRel = LOOP_R * (1 - Math.cos(L.th));
        const ve = Math.sqrt(Math.max(st.v * st.v - 2 * G * hRel, 220 * 220));
        L.th += (ve / LOOP_R) * dt;
        if (L.th >= Math.PI * 2) {
          st.loop = null;
          st.x = L.x + 1;
          if (L.bonus) { st.got += 3; st.loopsDone++; say('LOOP! +3 🪙', '#7df9ff'); Sfx.good(); } else say('Puh! Boosteren hjalp jer rundt', '#ffe066');
        }
        tick(dt);
        return;
      }
      const s = slope(st.x);
      const sin = s / Math.sqrt(1 + s * s);
      if (st.x < firstTop && !c.launch) {
        st.v += (st.x < STATION ? 160 : 150 - st.v) * dt * 2;
        st.v = Math.min(st.v, 170);
        clack(dt);
      } else if (st.launch && st.x < STATION + 40) {
        st.v = Math.min(820, st.v + 900 * dt);
        if (st.v > 780) { st.launch = false; Sfx.whoosh(); }
      } else if (st.x > LEN - END_PAD - 150) {
        st.v = Math.max(st.x > LEN - 260 ? 0 : 90, st.v - 520 * dt);
        if (st.v === 0 && !st.finished) { st.finished = st.t; finishFx(); }
      } else {
        let a = -G * sin - 0.00064 * st.v * st.v;
        if (st.hold) a += 200; else if (st.v > 140) { a -= 520; if (Math.random() < 0.6) spark(); }
        st.v = Math.max(st.v + a * dt, 0);
        if (st.v < 70 && s > 0) { st.v = 70; clack(dt); }
      }
      const px = st.x;
      st.x += st.v * dt;

      // enter a loop
      for (const L of loops) {
        if (!L.done && px < L.x && st.x >= L.x) {
          L.done = true;
          const bonus = st.v >= 460;
          if (!bonus) st.v = 470;
          st.loop = { x: L.x, th: 0, bonus };
          st.x = L.x;
          st.air = 0;
          Sfx.whoosh();
        }
      }
      // tunnels
      for (const T of tunnels) {
        if (px < T.x && st.x >= T.x) say('Tunnel!', '#ffd6a5');
      }

      // airtime over crests
      if (st.air <= 0 && px > STATION && crestX.some(cx => px < cx && st.x >= cx) && st.v > 430) {
        st.vy = Math.min(420, 240 + (st.v - 430) * 0.9);
        st.air = 0.01;
        st.airs++;
        say(['Wiii!', 'Juhuu!', 'Sus!'][st.airs % 3], '#7df9ff');
        st.shake = 0.25;
        Sfx.whoosh();
      }
      if (st.air > 0) {
        st.vy -= 900 * dt;
        st.air += st.vy * dt;
        if (st.air <= 0) { st.air = 0; st.vy = 0; }
      }

      // red zones
      for (const z of red) {
        const d = z.x - st.x;
        if (!z.warned && d < RED_W / 2 + st.v * 1.4 && d > 0) { z.warned = true; say('Skarpt sving! Slip for at bremse!', '#ff6b6b'); Sfx.tone(880, 0.12, 'square', 0.05); Sfx.tone(880, 0.12, 'square', 0.05, 0.2); }
        if (!z.hit && Math.abs(d) < RED_W / 2 && st.v > LIMIT) {
          z.hit = true;
          st.pen++;
          const lose = Math.min(3, st.got);
          st.got -= lose;
          st.v *= 0.6;
          st.shake = 0.6;
          say(lose ? `Uha! For hurtigt! −${lose} mønter` : 'Uha! For hurtigt!', '#ff6b6b');
          Sfx.bad();
        }
      }

      // coins
      const y = hAt(st.x) + st.air;
      for (const k of coins) {
        if (k.got || Math.abs(k.x - st.x) > 26) continue;
        const ky = hAt(k.x) + k.off;
        if (Math.abs(ky - (y + 26)) < (k.high ? 40 : 34)) {
          k.got = true;
          st.got++;
          burst(k.x, ky, '#ffd23f', 8);
          Sfx.tone(k.high ? 1568 : 1175, 0.12, 'triangle', 0.1);
        }
      }
      tick(dt);
    }
    function tick(dt) {
      st.shake = Math.max(0, st.shake - dt);
      st.msg.forEach(m => { m.t += dt; });
      st.msg = st.msg.filter(m => m.t < 1.8);
      for (const q of parts) { q.t += dt; q.x += q.vx * dt; q.h += q.vh * dt; q.vh -= 500 * dt; }
      for (let i = parts.length - 1; i >= 0; i--) if (parts[i].t > parts[i].life) parts.splice(i, 1);
      if (st.finished && st.t - st.finished > 1.6 && !st.done) {
        st.done = true;
        stop();
        onEnd({ coins: Math.max(0, st.got), total, pen: st.pen, airs: st.airs, loops: st.loopsDone });
      }
    }
    function burst(x, h, col, n) {
      for (let i = 0; i < n; i++) parts.push({ x, h, vx: (Math.random() - 0.5) * 300, vh: Math.random() * 300, t: 0, life: 0.6, col, r: 4 });
    }
    function spark() {
      if (st.loop) return;
      parts.push({ x: st.x - 30 - Math.random() * 60, h: hAt(st.x) - 2, vx: -st.v * 0.3 - Math.random() * 100, vh: Math.random() * 150, t: 0, life: 0.35, col: Math.random() < 0.5 ? '#ffd23f' : '#ff9f1c', r: 2.5 });
    }
    function finishFx() {
      Sfx.fanfare();
      for (let i = 0; i < 60; i++) parts.push({ x: st.x + (Math.random() - 0.3) * 500, h: 400 + Math.random() * 200, vx: (Math.random() - 0.5) * 120, vh: -Math.random() * 60, t: 0, life: 2.5, col: ['#ff5a5f', '#3a86ff', '#ffd23f', '#0ead69', '#ff70a6'][i % 5], r: 5, conf: true });
    }

    // cart position (handles loops). Returns world x, height and track angle
    function carPos(i) {
      const back = i * 46;
      if (st.loop) {
        const L = st.loop, th = L.th - back / LOOP_R;
        if (th >= 0) return { x: L.x + LOOP_R * Math.sin(th), h: LIFT + LOOP_R * (1 - Math.cos(th)), ang: -th };
        const x = L.x + th * LOOP_R;
        return { x, h: hAt(x), ang: Math.atan(-slope(x)) };
      }
      const x = st.x - back;
      const after = loops.find(L => L.done && x < L.x && st.x >= L.x);
      if (after) {
        const th = Math.PI * 2 - (L => (L.x - x) / LOOP_R)(after);
        return { x: after.x + LOOP_R * Math.sin(th), h: LIFT + LOOP_R * (1 - Math.cos(th)), ang: -th };
      }
      return { x, h: hAt(x) + (i === 0 ? st.air : st.air * 0.8), ang: Math.atan(-slope(x)) };
    }

    // ---------- drawing ----------
    const clouds = Array.from({ length: 10 }, (_, i) => ({ x: i * 700 + Math.random() * 300, y: 60 + Math.random() * 180, s: 0.6 + Math.random() * 0.8 }));
    const flyers = Array.from({ length: 6 }, (_, i) => ({ x: Math.random() * 3000, y: 80 + Math.random() * 200, p: i }));
    const stars = Array.from({ length: 60 }, () => [Math.random(), Math.random() * 0.6]);
    const night = !!NIGHT[c.theme];
    const skyline = Array.from({ length: 40 }, (_, i) => ({ x: i * 160, h: 40 + ((i * 53) % 90), k: i % 5 }));

    function draw() {
      const camX = st.x - Wd * 0.3 / S;
      const head = carPos(0);
      camY += (Math.max(0, head.h - 430) - camY) * 0.08;
      const sx = x => (x - camX) * S;
      const sy = h => Ht - 90 * S - (h - camY) * S;
      const shake = st.shake > 0 ? (Math.random() - 0.5) * 12 * st.shake : 0;

      // sky + sun glow
      const g = ctx.createLinearGradient(0, 0, 0, Ht);
      g.addColorStop(0, c.sky[0]); g.addColorStop(1, c.sky[1]);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, Wd, Ht);
      if (night) {
        ctx.fillStyle = '#fff';
        for (const [a, b] of stars) { ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(st.t + a * 20)); ctx.fillRect(a * Wd, b * Ht, 2, 2); }
        ctx.globalAlpha = 1;
      }
      ctx.save();
      ctx.translate(shake, shake * 0.5);
      const sunX = Wd * 0.82, sunY = Ht * 0.16;
      const sg = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 140 * S);
      sg.addColorStop(0, night ? 'rgba(255,255,230,.9)' : 'rgba(255,250,200,1)');
      sg.addColorStop(0.3, night ? 'rgba(255,255,230,.25)' : 'rgba(255,240,150,.5)');
      sg.addColorStop(1, 'rgba(255,240,150,0)');
      ctx.fillStyle = sg; ctx.fillRect(sunX - 150 * S, sunY - 150 * S, 300 * S, 300 * S);
      ctx.fillStyle = night ? '#fdf6c3' : '#fff6b0';
      ctx.beginPath(); ctx.arc(sunX, sunY, 38 * S, 0, 7); ctx.fill();
      if (c.theme === 'lyn' && Math.floor(st.t * 2) % 7 === 0) { ctx.fillStyle = 'rgba(255,255,220,.25)'; ctx.fillRect(0, 0, Wd, Ht); }
      // clouds
      ctx.fillStyle = c.theme === 'storm' ? 'rgba(80,90,110,.7)' : night ? 'rgba(255,255,255,.18)' : 'rgba(255,255,255,.85)';
      for (const cl of clouds) {
        const x = ((cl.x - camX * 0.12) % 7000 + 7000) % 7000 - 300;
        ctx.beginPath();
        ctx.ellipse(x * S, cl.y * S, 70 * cl.s * S, 26 * cl.s * S, 0, 0, 7);
        ctx.ellipse((x + 50 * cl.s) * S, (cl.y - 14) * S, 50 * cl.s * S, 24 * cl.s * S, 0, 0, 7);
        ctx.ellipse((x - 40 * cl.s) * S, (cl.y + 4) * S, 40 * cl.s * S, 18 * cl.s * S, 0, 0, 7);
        ctx.fill();
      }
      // flying theme creatures
      const flyer = { flagermus: '🦇', drage: '🐉', valkyrie: '🦅', storm: '🌪️', viking: '🐦', midgard: '🐟' }[c.theme];
      if (flyer) {
        ctx.font = `${28 * S}px serif`;
        for (const b of flyers) {
          const x = ((b.x - camX * 0.4 + st.t * 60) % 3000 + 3000) % 3000;
          ctx.fillText(flyer, x * S, (b.y + Math.sin(st.t * 3 + b.p) * 14) * S);
        }
      }
      if (c.theme === 'ild') {
        for (let i = 0; i < 20; i++) {
          const x = ((i * 211 - st.t * 40) % Wd + Wd) % Wd, y = Ht - ((st.t * 60 + i * 97) % Ht);
          ctx.fillStyle = `rgba(255,${120 + (i % 5) * 20},40,.7)`;
          ctx.beginPath(); ctx.arc(x, y, 2.5, 0, 7); ctx.fill();
        }
      }
      // distant park skyline (parallax)
      ctx.fillStyle = night ? 'rgba(30,30,70,.75)' : 'rgba(90,120,170,.35)';
      for (const b of skyline) {
        const x = ((b.x - camX * 0.08) % 6400 + 6400) % 6400 - 200;
        const X = x * S, base = Ht - 200 * S;
        if (b.k === 0) { ctx.beginPath(); ctx.arc(X, base - 60 * S, 50 * S, 0, 7); ctx.lineWidth = 4 * S; ctx.strokeStyle = ctx.fillStyle; ctx.stroke(); ctx.fillRect(X - 3 * S, base - 60 * S, 6 * S, 60 * S); }
        else if (b.k === 2) { ctx.fillRect(X, base - b.h * 1.6 * S, 10 * S, b.h * 1.6 * S); }
        else if (b.k === 3) { ctx.beginPath(); ctx.moveTo(X, base); ctx.lineTo(X + 40 * S, base - b.h * S); ctx.lineTo(X + 80 * S, base); ctx.fill(); }
        else ctx.fillRect(X, base - b.h * 0.5 * S, 50 * S, b.h * 0.5 * S);
      }
      // far hills
      ctx.fillStyle = night ? 'rgba(20,50,40,.8)' : 'rgba(40,110,60,.45)';
      ctx.beginPath(); ctx.moveTo(0, Ht);
      for (let x = 0; x <= Wd; x += 20) ctx.lineTo(x, Ht - 150 * S - Math.sin((x / S + camX * 0.3) / 180) * 40 * S);
      ctx.lineTo(Wd, Ht); ctx.fill();
      // tree row (parallax)
      ctx.fillStyle = night ? '#1b3a2a' : '#3f8f3a';
      for (let i = -1; i < Wd / (70 * S) + 2; i++) {
        const off = (camX * 0.6) % 70;
        const X = (i * 70 - off) * S, Y = Ht - 110 * S;
        ctx.beginPath(); ctx.arc(X, Y, 26 * S, 0, 7); ctx.arc(X + 22 * S, Y + 8 * S, 20 * S, 0, 7); ctx.fill();
      }
      // ground
      const gy = sy(-30);
      ctx.fillStyle = c.theme === 'midgard' ? '#1e88e5' : night ? '#2e6b2e' : '#5fb84a';
      ctx.fillRect(0, gy, Wd, Ht - gy);
      ctx.fillStyle = c.theme === 'midgard' ? 'rgba(255,255,255,.35)' : night ? '#255a25' : '#4c9c3a';
      for (let x = Math.floor(camX / 90) * 90; x < camX + Wd / S + 90; x += 90) ctx.fillRect(sx(x), gy + 4 * S, 40 * S, 5 * S);

      const x0 = camX - 50, x1 = camX + Wd / S + 50;
      // supports
      const wood = c.theme === 'trae' || c.theme === 'viking';
      ctx.strokeStyle = wood ? '#a87a4a' : '#9aa3ad';
      ctx.lineWidth = (wood ? 5 : 6) * S;
      for (let x = Math.floor(x0 / 70) * 70; x < x1; x += 70) {
        const h = hAt(x);
        if (h < 8) continue;
        ctx.beginPath(); ctx.moveTo(sx(x), sy(h)); ctx.lineTo(sx(x), gy); ctx.stroke();
        if (wood) { ctx.beginPath(); ctx.moveTo(sx(x), sy(h * 0.5)); ctx.lineTo(sx(x + 70), sy(hAt(x + 70) * 0.9)); ctx.stroke(); }
      }
      // stations
      [[0, STATION - 40, 'START'], [LEN - END_PAD + 60, LEN, 'MÅL']].forEach(([a, b, t]) => {
        ctx.fillStyle = '#e63946'; ctx.fillRect(sx(a), sy(0) + 14 * S, (b - a) * S, 16 * S);
        ctx.fillStyle = '#ffd23f'; ctx.fillRect(sx(a + 40), sy(0) - 110 * S, 10 * S, 124 * S); ctx.fillRect(sx(b - 50), sy(0) - 110 * S, 10 * S, 124 * S);
        ctx.fillStyle = '#e63946'; ctx.fillRect(sx(a + 30), sy(0) - 130 * S, (b - a - 60) * S, 26 * S);
        ctx.fillStyle = '#fff'; ctx.font = `900 ${18 * S}px system-ui, sans-serif`; ctx.textAlign = 'center';
        ctx.fillText(t, sx((a + b) / 2), sy(0) - 111 * S); ctx.textAlign = 'left';
      });
      // red zones
      for (const z of red) {
        if (z.x < x0 - RED_W || z.x > x1 + RED_W) continue;
        for (let x = z.x - RED_W / 2; x < z.x + RED_W / 2; x += 20) {
          ctx.strokeStyle = Math.floor(x / 20) % 2 ? '#fff' : '#e63946';
          ctx.lineWidth = 16 * S;
          ctx.beginPath(); ctx.moveTo(sx(x), sy(hAt(x))); ctx.lineTo(sx(x + 20), sy(hAt(x + 20))); ctx.stroke();
        }
        ctx.font = `${34 * S}px serif`;
        ctx.fillText('⚠️', sx(z.x - RED_W / 2) - 16 * S, sy(hAt(z.x)) - 40 * S);
      }
      // rails
      const rail = (col, w, off) => {
        ctx.strokeStyle = col; ctx.lineWidth = w * S; ctx.lineJoin = 'round';
        ctx.beginPath();
        for (let x = x0; x <= x1; x += 10) { const X = sx(x), Y = sy(hAt(x)) + off * S; if (x === x0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y); }
        ctx.stroke();
      };
      rail('#2b2b2b', 12, 2);
      rail(c.track, 7, 0);
      rail('rgba(255,255,255,.35)', 2, -2);
      ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 2 * S;
      for (let x = Math.floor(x0 / 24) * 24; x < x1; x += 24) { const X = sx(x), Y = sy(hAt(x)); ctx.beginPath(); ctx.moveTo(X, Y - 5 * S); ctx.lineTo(X, Y + 7 * S); ctx.stroke(); }
      // loops
      for (const L of loops) {
        if (L.x < x0 - 300 || L.x > x1 + 300) continue;
        const X = sx(L.x), Y = sy(LIFT + LOOP_R);
        ctx.strokeStyle = '#9aa3ad'; ctx.lineWidth = 6 * S;
        ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(X, gy); ctx.stroke();
        ctx.lineWidth = 12 * S; ctx.strokeStyle = '#2b2b2b';
        ctx.beginPath(); ctx.arc(X, Y, LOOP_R * S, 0, 7); ctx.stroke();
        ctx.lineWidth = 7 * S; ctx.strokeStyle = c.track;
        ctx.beginPath(); ctx.arc(X, Y, LOOP_R * S, 0, 7); ctx.stroke();
      }
      // chain marks on first hill
      if (!c.launch) {
        ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 2 * S; ctx.setLineDash([4 * S, 6 * S]);
        ctx.lineDashOffset = -st.t * 40;
        ctx.beginPath();
        for (let x = STATION; x < firstTop; x += 10) { const X = sx(x), Y = sy(hAt(x)) - 4 * S; if (x === STATION) ctx.moveTo(X, Y); else ctx.lineTo(X, Y); }
        ctx.stroke(); ctx.setLineDash([]);
      }
      // coins
      for (const k of coins) {
        if (k.got || k.x < x0 || k.x > x1) continue;
        const X = sx(k.x), Y = sy(hAt(k.x) + k.off), wob = Math.abs(Math.cos(st.t * 4 + k.x)) * 0.7 + 0.3;
        if (k.high) { ctx.fillStyle = 'rgba(255,255,200,.35)'; ctx.beginPath(); ctx.arc(X, Y, 22 * S, 0, 7); ctx.fill(); }
        ctx.fillStyle = k.high ? '#ffe066' : '#ffc300';
        ctx.strokeStyle = '#b8860b'; ctx.lineWidth = 2 * S;
        ctx.beginPath(); ctx.ellipse(X, Y, 12 * S * wob, 12 * S, 0, 0, 7); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.ellipse(X - 3 * S * wob, Y - 4 * S, 3 * S * wob, 3 * S, 0, 0, 7); ctx.fill();
      }
      // speed lines
      if (st.v > 520 && !st.finished) {
        ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2;
        for (let i = 0; i < 14; i++) {
          const y = ((i * 97 + st.t * 50) % (Ht * 0.8)) + 20, x = ((i * 233 - st.t * st.v * 2) % Wd + Wd) % Wd;
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 40 + (st.v - 520) * 0.2, y); ctx.stroke();
        }
      }
      // train
      const hang = !!c.hang;
      const fast = st.v > 420 || st.air > 0 || st.loop;
      const emblem = { orm: '🐛', drage: '🐉', midgard: '🐍', viking: '🛶', flagermus: '🦇', valkyrie: '🛡️', lyn: '⚡', ild: '🔥', storm: '🌪️' }[c.theme];
      for (let i = 2; i >= 0; i--) {
        const cp = carPos(i);
        ctx.save();
        ctx.translate(sx(cp.x), sy(cp.h));
        ctx.rotate(cp.ang);
        ctx.scale(S, S);
        ctx.strokeStyle = '#111'; ctx.lineWidth = 2;
        if (hang) {
          ctx.fillStyle = '#555'; ctx.fillRect(-3, 0, 6, 10);
          ctx.fillStyle = c.car; roundRect(ctx, -22, 8, 44, 22, 8); ctx.fill(); ctx.stroke();
          ctx.fillStyle = 'rgba(255,255,255,.35)'; roundRect(ctx, -18, 10, 36, 5, 3); ctx.fill();
          ctx.font = '22px serif'; ctx.textAlign = 'center';
          ctx.fillText(i === 0 ? av.animal : ['🙂', '😃', '😆', '😮'][(i + Math.floor(st.t)) % 4], 0, 27);
          ctx.strokeStyle = '#ffd9b0'; ctx.lineWidth = 4; ctx.lineCap = 'round';
          const sw = Math.sin(st.t * 8 + i) * (fast ? 6 : 2);
          ctx.beginPath(); ctx.moveTo(-7, 30); ctx.lineTo(-7 + sw, 44); ctx.moveTo(7, 30); ctx.lineTo(7 - sw, 44); ctx.stroke();
        } else {
          ctx.fillStyle = c.car;
          roundRect(ctx, -22, -30, 44, 24, 8); ctx.fill(); ctx.stroke();
          ctx.fillStyle = 'rgba(255,255,255,.35)'; roundRect(ctx, -18, -28, 36, 6, 3); ctx.fill();
          ctx.fillStyle = '#222';
          ctx.beginPath(); ctx.arc(-12, -4, 5, 0, 7); ctx.arc(12, -4, 5, 0, 7); ctx.fill();
          ctx.fillStyle = '#bbb'; ctx.beginPath(); ctx.arc(-12, -4, 2, 0, 7); ctx.arc(12, -4, 2, 0, 7); ctx.fill();
          ctx.font = '24px serif'; ctx.textAlign = 'center';
          ctx.fillText(i === 0 ? av.animal : ['🙂', '😃', '😆', '😮'][(i + Math.floor(st.t)) % 4], 0, -32);
          if (fast) {
            ctx.strokeStyle = '#ffd9b0'; ctx.lineWidth = 4; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(-8, -40); ctx.lineTo(-14, -56); ctx.moveTo(8, -40); ctx.lineTo(14, -56); ctx.stroke();
          }
          if (i === 0 && emblem) { ctx.font = '20px serif'; ctx.fillText(emblem, 30, -10); }
        }
        ctx.restore();
      }
      // tunnels drawn over the train
      for (const T of tunnels) {
        if (T.x + T.w < x0 || T.x > x1) continue;
        const a = T.x, b = T.x + T.w, top = Math.max(hAt(a), hAt(b), hAt((a + b) / 2)) + 90;
        ctx.fillStyle = '#7d6b5d'; ctx.strokeStyle = '#5a4a3d'; ctx.lineWidth = 4 * S;
        ctx.beginPath(); ctx.moveTo(sx(a - 60), gy);
        ctx.quadraticCurveTo(sx(a - 20), sy(top), sx((a + b) / 2), sy(top + 20));
        ctx.quadraticCurveTo(sx(b + 20), sy(top), sx(b + 60), gy);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#4caf50'; ctx.beginPath(); ctx.ellipse(sx((a + b) / 2), sy(top + 16), (b - a) * 0.3 * S, 14 * S, 0, 0, 7); ctx.fill();
        [a, b].forEach(x => { ctx.fillStyle = '#2a2420'; ctx.beginPath(); ctx.ellipse(sx(x), sy(hAt(x) + 22), 26 * S, 40 * S, 0, 0, 7); ctx.fill(); });
      }
      // particles
      for (const q of parts) {
        ctx.globalAlpha = Math.max(0, 1 - q.t / q.life);
        ctx.fillStyle = q.col;
        if (q.conf) ctx.fillRect(sx(q.x), sy(q.h), 7 * S, 11 * S);
        else { ctx.beginPath(); ctx.arc(sx(q.x), sy(q.h), q.r * S, 0, 7); ctx.fill(); }
      }
      ctx.globalAlpha = 1;
      ctx.restore();

      // ---------- HUD ----------
      ctx.textAlign = 'left';
      ctx.font = `800 ${30 * Math.max(.8, S)}px system-ui, sans-serif`;
      pill(14, 14, 150, 50);
      ctx.fillStyle = '#fff'; ctx.fillText(`🪙 ${st.got}`, 28, 50);
      pill(Wd / 2 - 160, 22, 320, 26);
      ctx.fillStyle = '#ffd23f';
      roundRect(ctx, Wd / 2 - 156, 26, 312 * Math.min(1, st.x / LEN), 18, 9); ctx.fill();
      ctx.font = '26px serif';
      ctx.fillText(av.animal, Wd / 2 - 170 + 320 * Math.min(1, st.x / LEN), 50);
      const sw = 260, shx = 16, shy = Ht - 70;
      pill(shx, shy, sw + 20, 54);
      const sp = st.v / 50, frac = Math.min(1, sp / 18), lim = Math.min(1, LIMIT / 50 / 18);
      const nearRed = red.some(z => z.x - st.x < 900 && z.x - st.x > -RED_W / 2);
      ctx.fillStyle = 'rgba(255,255,255,.2)'; roundRect(ctx, shx + 10, shy + 26, sw, 18, 9); ctx.fill();
      ctx.fillStyle = st.v > LIMIT && nearRed ? '#ff4d4d' : '#3bceac';
      roundRect(ctx, shx + 10, shy + 26, sw * frac, 18, 9); ctx.fill();
      ctx.fillStyle = nearRed ? '#ff4d4d' : 'rgba(255,255,255,.6)';
      ctx.fillRect(shx + 10 + sw * lim - 2, shy + 20, 4, 30);
      ctx.font = '700 16px system-ui, sans-serif';
      ctx.fillStyle = '#fff';
      ctx.fillText(`Fart ${Math.round(sp * 8)} km/t`, shx + 12, shy + 19);
      if (st.t < 9 || nearRed) {
        ctx.textAlign = 'center';
        pill(Wd - 290, Ht - 76, 274, 60);
        ctx.fillStyle = '#fff';
        ctx.font = '800 20px system-ui, sans-serif';
        ctx.fillText(st.hold ? '🚀 Fart på!' : '✋ Bremser', Wd - 153, Ht - 50);
        ctx.font = '600 15px system-ui, sans-serif';
        ctx.fillText('Hold = fart · Slip = brems', Wd - 153, Ht - 28);
      }
      ctx.textAlign = 'center';
      st.msg.forEach((m, i) => {
        ctx.globalAlpha = Math.min(1, 2 - m.t);
        const sc = 1 + Math.max(0, 0.3 - m.t);
        ctx.font = `900 ${Math.round(40 * sc * Math.max(.8, S))}px system-ui, sans-serif`;
        ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(0,0,0,.6)';
        const y = Ht * 0.24 + i * 50 - m.t * 20;
        ctx.strokeText(m.text, Wd / 2, y);
        ctx.fillStyle = m.color; ctx.fillText(m.text, Wd / 2, y);
        ctx.globalAlpha = 1;
      });
      ctx.textAlign = 'left';
    }
    function pill(x, y, w, h) { ctx.fillStyle = 'rgba(0,0,0,.45)'; roundRect(ctx, x, y, w, h, h / 2); ctx.fill(); }

    let last = performance.now();
    const loop = now => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      update(dt);
      if (!st.done) { draw(); raf = requestAnimationFrame(loop); }
    };
    raf = requestAnimationFrame(loop);
    return { state: st, LEN, total, red, step: dt => { update(dt); if (!st.done) draw(); } };
  }

  function roundRect(ctx, x, y, w, h, r) {
    w = Math.max(0, w);
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  return { start, stop, roundRect };
})();
