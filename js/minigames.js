// Small ride games: bumper cars, boats and the drop tower (with a math target)
const MiniGames = (() => {
  let raf = 0, cleanup = null;
  function stop() {
    cancelAnimationFrame(raf);
    raf = 0;
    if (cleanup) { cleanup(); cleanup = null; }
  }
  const rnd = (a, b) => a + Math.random() * (b - a);
  const rr = (ctx, x, y, w, h, r) => Coaster.roundRect(ctx, x, y, w, h, r);

  function setup(root) {
    root.innerHTML = '<canvas class="ccanvas"></canvas>';
    const cv = root.querySelector('canvas'), ctx = cv.getContext('2d');
    const view = { W: 800, H: 600 };
    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      view.W = root.clientWidth || 800; view.H = root.clientHeight || 600;
      cv.width = view.W * dpr; cv.height = view.H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);
    const ptr = { x: null, y: null, down: false };
    const pos = e => { const r = cv.getBoundingClientRect(); ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top; };
    const dn = e => { e.preventDefault(); ptr.down = true; pos(e); };
    const mv = e => { if (ptr.down || e.pointerType === 'mouse') pos(e); };
    const upf = () => { ptr.down = false; };
    cv.addEventListener('pointerdown', dn);
    cv.addEventListener('pointermove', mv);
    window.addEventListener('pointerup', upf);
    cleanup = () => { window.removeEventListener('resize', resize); window.removeEventListener('pointerup', upf); };
    return { cv, ctx, view, ptr };
  }

  function hud(ctx, view, coins, time, text) {
    ctx.fillStyle = 'rgba(0,0,0,.45)';
    rr(ctx, 14, 14, 150, 50, 25); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '800 28px system-ui, sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(`🪙 ${coins}`, 28, 50);
    if (time !== null) {
      ctx.fillStyle = 'rgba(0,0,0,.45)'; rr(ctx, view.W / 2 - 60, 14, 120, 44, 22); ctx.fill();
      ctx.fillStyle = time < 6 ? '#ff6b6b' : '#fff'; ctx.textAlign = 'center';
      ctx.fillText(`⏱️ ${Math.ceil(time)}`, view.W / 2, 46);
    }
    if (text) {
      ctx.textAlign = 'center'; ctx.font = '700 18px system-ui, sans-serif';
      ctx.fillStyle = 'rgba(0,0,0,.45)'; rr(ctx, view.W / 2 - 200, view.H - 56, 400, 40, 20); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillText(text, view.W / 2, view.H - 30);
    }
    ctx.textAlign = 'left';
  }
  function floats(ctx, list, dt) {
    ctx.textAlign = 'center';
    for (const f of list) {
      f.t += dt;
      ctx.globalAlpha = Math.max(0, 1 - f.t);
      ctx.font = '900 30px system-ui, sans-serif';
      ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,.5)';
      ctx.strokeText(f.text, f.x, f.y - f.t * 40);
      ctx.fillStyle = f.col || '#ffd23f'; ctx.fillText(f.text, f.x, f.y - f.t * 40);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
    for (let i = list.length - 1; i >= 0; i--) if (list[i].t > 1) list.splice(i, 1);
  }
  function runLoop(fn) {
    let last = performance.now();
    const loop = now => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (fn(dt) !== false) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
  }

  // ---------- bumper cars / go-karts ----------
  function bump(root, ride, av, year, onEnd) {
    stop();
    const { ctx, view, ptr } = setup(root);
    const kart = ride.id === 'gokart';
    const COLS = ['#ff5a5f', '#3a86ff', '#ffd23f', '#0ead69', '#ff70a6', '#8338ec'];
    const me = { x: view.W / 2, y: view.H / 2, vx: 0, vy: 0, ang: 0, col: av.color, me: true };
    const ai = Array.from({ length: 5 + (year > 2 ? 1 : 0) }, (_, i) => ({ x: rnd(80, view.W - 80), y: rnd(120, view.H - 80), vx: rnd(-80, 80), vy: rnd(-80, 80), ang: 0, col: COLS[i % 6], cd: 0, face: ['🙂', '😃', '😆', '😮', '😜', '🤠'][i] }));
    const st = { t: 35, coins: 0, fx: [], done: false };
    const R = 32;
    runLoop(dt => {
      const { W, H } = view;
      const pad = 40;
      st.t -= dt;
      // player steers toward the finger
      if (ptr.x !== null) {
        const dx = ptr.x - me.x, dy = ptr.y - me.y, d = Math.hypot(dx, dy);
        if (d > 8) { me.vx += (dx / d) * 900 * dt; me.vy += (dy / d) * 900 * dt; }
      }
      const all = [me, ...ai];
      for (const c of all) {
        if (!c.me) {
          c.vx += rnd(-200, 200) * dt; c.vy += rnd(-200, 200) * dt;
          c.cd = Math.max(0, c.cd - dt);
        }
        const sp = Math.hypot(c.vx, c.vy), max = c.me ? 330 : 170;
        if (sp > max) { c.vx *= max / sp; c.vy *= max / sp; }
        c.vx *= 1 - dt * 0.8; c.vy *= 1 - dt * 0.8;
        c.x += c.vx * dt; c.y += c.vy * dt;
        if (c.x < pad + R) { c.x = pad + R; c.vx = Math.abs(c.vx); }
        if (c.x > W - pad - R) { c.x = W - pad - R; c.vx = -Math.abs(c.vx); }
        if (c.y < pad + 60 + R) { c.y = pad + 60 + R; c.vy = Math.abs(c.vy); }
        if (c.y > H - pad - R) { c.y = H - pad - R; c.vy = -Math.abs(c.vy); }
        if (sp > 20) c.ang = Math.atan2(c.vy, c.vx);
      }
      for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
        const a = all[i], b = all[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
        if (d < R * 2 && d > 0) {
          const nx = dx / d, ny = dy / d, push = (R * 2 - d) / 2;
          a.x -= nx * push; a.y -= ny * push; b.x += nx * push; b.y += ny * push;
          const rel = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
          if (rel > 0) { a.vx -= rel * nx; a.vy -= rel * ny; b.vx += rel * nx * 1.3; b.vy += rel * ny * 1.3; }
          if (a.me && !b.cd && rel > 80) {
            b.cd = 1;
            st.coins++;
            st.fx.push({ text: 'BUMP! +1', x: b.x, y: b.y - 20, t: 0 });
            Sfx.hit();
          }
        }
      }
      // draw
      ctx.fillStyle = kart ? '#2e7d32' : '#26263a';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = kart ? '#555' : '#4a4f5c';
      rr(ctx, pad, pad + 60, W - pad * 2, H - pad * 2 - 60, 30); ctx.fill();
      ctx.lineWidth = 10;
      ctx.strokeStyle = kart ? '#fff' : '#ffd23f';
      if (kart) ctx.setLineDash([30, 30]);
      rr(ctx, pad, pad + 60, W - pad * 2, H - pad * 2 - 60, 30); ctx.stroke();
      ctx.setLineDash([]);
      if (!kart) {
        ctx.strokeStyle = 'rgba(255,255,255,.06)'; ctx.lineWidth = 2;
        for (let x = pad; x < W - pad; x += 40) { ctx.beginPath(); ctx.moveTo(x, pad + 60); ctx.lineTo(x, H - pad); ctx.stroke(); }
        for (let i = 0; i < 12; i++) { ctx.fillStyle = `hsl(${(i * 30 + performance.now() / 10) % 360},90%,60%)`; ctx.beginPath(); ctx.arc(pad + ((W - 2 * pad) * i) / 11, pad + 60, 5, 0, 7); ctx.fill(); }
      }
      for (const c of all) {
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.ang);
        ctx.fillStyle = 'rgba(0,0,0,.25)'; rr(ctx, -R + 3, -R * 0.75 + 4, R * 2, R * 1.5, 12); ctx.fill();
        ctx.fillStyle = '#222'; rr(ctx, -R - 3, -R * 0.5, R * 2 + 6, R, 10); ctx.fill();
        ctx.fillStyle = c.col; rr(ctx, -R, -R * 0.75, R * 2, R * 1.5, 12); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.35)'; rr(ctx, -R + 4, -R * 0.7, R * 2 - 8, 6, 3); ctx.fill();
        ctx.rotate(-c.ang);
        ctx.font = '32px serif'; ctx.textAlign = 'center';
        ctx.fillText(c.me ? av.animal : c.face, 0, 11);
        if (c.me) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, R + 8, 0, 7); ctx.stroke(); }
        ctx.restore();
      }
      floats(ctx, st.fx, dt);
      hud(ctx, view, st.coins, st.t, st.t > 30 ? 'Træk fingeren dit du vil køre. Bump de andre!' : '');
      if (st.t <= 0) { stop(); onEnd({ coins: st.coins, game: 'bump' }); return false; }
    });
    return { st };
  }

  // ---------- boats: collect ducks ----------
  function boat(root, ride, av, year, onEnd) {
    stop();
    const { ctx, view, ptr } = setup(root);
    const river = ride.id === 'rafting';
    const me = { x: view.W / 2, y: view.H * 0.7, vx: 0, vy: 0 };
    const items = [];
    const st = { t: 35, coins: 0, fx: [], spawn: 0, flow: 0 };
    runLoop(dt => {
      const { W, H } = view;
      st.t -= dt;
      st.flow += dt;
      st.spawn -= dt;
      if (st.spawn <= 0) {
        st.spawn = river ? 0.55 : 0.9;
        const rock = river && Math.random() < 0.3 + year * 0.05;
        items.push({ x: rnd(60, W - 60), y: river ? -30 : rnd(110, H - 60), vy: river ? rnd(120, 180) : 0, life: river ? 99 : 6, rock, wob: rnd(0, 6) });
      }
      if (ptr.x !== null) {
        const dx = ptr.x - me.x, dy = ptr.y - me.y, d = Math.hypot(dx, dy);
        if (d > 6) { me.vx += (dx / d) * 700 * dt; me.vy += (dy / d) * 700 * dt; }
      }
      me.vx *= 1 - dt * 1.6; me.vy *= 1 - dt * 1.6;
      me.x = Math.max(40, Math.min(W - 40, me.x + me.vx * dt));
      me.y = Math.max(100, Math.min(H - 40, me.y + me.vy * dt));
      for (const it of items) {
        it.y += it.vy * dt;
        it.life -= dt;
        if (!it.gone && Math.hypot(it.x - me.x, it.y - me.y) < 40) {
          it.gone = true;
          if (it.rock) { st.coins = Math.max(0, st.coins - 1); st.fx.push({ text: 'Av! −1', x: me.x, y: me.y - 30, t: 0, col: '#ff6b6b' }); Sfx.bad(); }
          else { st.coins++; st.fx.push({ text: '+1', x: it.x, y: it.y - 20, t: 0 }); Sfx.tone(1175, 0.12, 'triangle', 0.1); }
        }
      }
      for (let i = items.length - 1; i >= 0; i--) if (items[i].gone || items[i].life <= 0 || items[i].y > H + 40) items.splice(i, 1);
      // draw water
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, river ? '#1e88e5' : '#48cae4'); g.addColorStop(1, river ? '#0d47a1' : '#0096c7');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      if (river) { ctx.fillStyle = '#4f7942'; ctx.fillRect(0, 0, 30, H); ctx.fillRect(W - 30, 0, 30, H); }
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 3;
      for (let i = 0; i < 18; i++) {
        const x = (i * 157) % W, y = river ? ((i * 89 + st.flow * 200) % H) : (i * 89) % H;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 15, y - 6 + Math.sin(st.flow * 2 + i) * 3, x + 30, y); ctx.stroke();
      }
      ctx.textAlign = 'center';
      for (const it of items) {
        ctx.font = it.rock ? '46px serif' : '44px serif';
        ctx.globalAlpha = Math.min(1, it.life);
        ctx.fillText(it.rock ? '🪨' : '🦆', it.x, it.y + Math.sin(st.flow * 3 + it.wob) * 4 + 12);
      }
      ctx.globalAlpha = 1;
      // player boat
      ctx.save(); ctx.translate(me.x, me.y);
      ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.beginPath(); ctx.ellipse(0, 18, 44, 12, 0, 0, 7); ctx.fill();
      if (river) {
        ctx.fillStyle = '#ff9f1c'; ctx.beginPath(); ctx.arc(0, 0, 32, 0, 7); ctx.fill();
        ctx.fillStyle = '#ffe8cc'; ctx.beginPath(); ctx.arc(0, 0, 20, 0, 7); ctx.fill();
        ctx.font = '28px serif'; ctx.fillText(av.animal, 0, 10);
      } else {
        ctx.font = '64px serif'; ctx.fillText('🦢', 0, 18);
        ctx.font = '26px serif'; ctx.fillText(av.animal, 14, -6);
      }
      ctx.restore();
      ctx.textAlign = 'left';
      floats(ctx, st.fx, dt);
      hud(ctx, view, st.coins, st.t, st.t > 30 ? (river ? 'Saml ænderne. Pas på stenene!' : 'Træk fingeren. Saml ænderne!') : '');
      if (st.t <= 0) { stop(); onEnd({ coins: st.coins, game: 'boat' }); return false; }
    });
    return { st };
  }

  // ---------- drop tower: stop the seat at the answer ----------
  function dropTarget(year) {
    const r = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
    if (year === 1) { const a = r(1, 5), b = r(1, 10 - a); return { text: `${a} + ${b}`, ans: a + b, max: 10, step: 1 }; }
    if (year === 2) { const a = r(2, 12), b = r(1, 20 - a); return Math.random() < 0.5 ? { text: `${a} + ${b}`, ans: a + b, max: 20, step: 2 } : { text: `${a + b} − ${b}`, ans: a, max: 20, step: 2 }; }
    if (year === 3) { const a = r(2, 9), b = r(2, 10); return { text: `${a} × ${b}`, ans: a * b, max: 100, step: 10 }; }
    const a = r(2, 9), b = r(2, 9), c = r(1, 9);
    return { text: `${a} × ${b} + ${c}`, ans: a * b + c, max: 100, step: 10 };
  }
  function drop(root, ride, av, year, onEnd) {
    stop();
    const { cv, ctx, view } = setup(root);
    const thor = ride.id === 'thor';
    const st = { round: 0, coins: 0, fx: [], phase: 'move', t: 0, pos: 0, dir: 1, speed: year === 1 ? 0.14 : 0.2, tgt: dropTarget(year), wait: 0, fall: 0, result: '' };
    Speech.say(`Stop ved ${st.tgt.text}`);
    const btn = { x: 0, y: 0, r: 60 };
    cv.addEventListener('pointerdown', e => {
      if (st.phase !== 'move') return;
      const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      if (Math.hypot(x - btn.x, y - btn.y) > btn.r + 30) return;
      const val = st.pos * st.tgt.max, tol = st.tgt.max / 20;
      const hit = Math.abs(val - st.tgt.ans) <= tol;
      st.phase = 'stop'; st.wait = 1.4;
      if (hit) { st.coins += 3; st.result = 'ok'; st.fx.push({ text: 'Præcis! +3', x: view.W * 0.4, y: view.H * 0.3, t: 0 }); Sfx.good(); Speech.say(`Rigtigt! ${st.tgt.text} er ${st.tgt.ans}`); }
      else { st.result = 'bad'; st.fx.push({ text: `Det var ${st.tgt.ans}`, x: view.W * 0.4, y: view.H * 0.3, t: 0, col: '#ff6b6b' }); Sfx.bad(); Speech.say(`${st.tgt.text} er ${st.tgt.ans}`); }
    });
    runLoop(dt => {
      const { W, H } = view;
      st.t += dt;
      if (st.phase === 'move') {
        st.pos += st.dir * st.speed * dt;
        if (st.pos > 1) { st.pos = 1; st.dir = -1; }
        if (st.pos < 0) { st.pos = 0; st.dir = 1; }
      } else if (st.phase === 'stop') {
        st.wait -= dt;
        if (st.wait <= 0) { st.phase = 'fall'; st.fall = 0; Sfx.whoosh(); }
      } else if (st.phase === 'fall') {
        st.fall += dt;
        st.pos = Math.max(0, st.pos - st.fall * 2.4 * dt * 10);
        if (st.pos <= 0) {
          st.round++;
          if (st.round >= 5) { stop(); onEnd({ coins: st.coins, game: 'drop' }); return false; }
          st.tgt = dropTarget(year); st.speed += 0.04; st.phase = 'move'; st.pos = 0; st.dir = 1;
          Speech.say(`Stop ved ${st.tgt.text}`);
        }
      }
      // background
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, thor ? '#37474f' : '#64b5f6'); g.addColorStop(1, thor ? '#90a4ae' : '#e3f2fd');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      if (thor && Math.floor(st.t * 1.5) % 6 === 0) { ctx.fillStyle = 'rgba(255,255,200,.2)'; ctx.fillRect(0, 0, W, H); }
      ctx.fillStyle = '#5fb84a'; ctx.fillRect(0, H - 50, W, 50);
      // tower + scale
      const tx = W * 0.4, top = 110, bot = H - 70, hgt = bot - top;
      ctx.fillStyle = thor ? '#78909c' : '#adb5bd'; ctx.fillRect(tx - 16, top - 20, 32, hgt + 30);
      if (thor) { ctx.fillStyle = '#546e7a'; rr(ctx, tx - 50, top - 70, 100, 44, 8); ctx.fill(); ctx.fillStyle = '#6d4c41'; ctx.fillRect(tx - 7, top - 30, 14, 20); }
      else { ctx.fillStyle = '#e63946'; ctx.beginPath(); ctx.moveTo(tx - 30, top - 20); ctx.lineTo(tx, top - 60); ctx.lineTo(tx + 30, top - 20); ctx.fill(); }
      const marks = st.tgt.max / st.tgt.step;
      ctx.font = '800 18px system-ui, sans-serif'; ctx.textAlign = 'left';
      for (let i = 0; i <= marks; i++) {
        const v = i * st.tgt.step, y = bot - (v / st.tgt.max) * hgt;
        ctx.fillStyle = '#1d3557'; ctx.fillRect(tx + 76, y - 1.5, 18, 3);
        ctx.fillText(String(v), tx + 100, y + 6);
        if (st.tgt.step > 1 && i < marks) for (let k = 1; k < 5; k++) ctx.fillRect(tx + 76, y - (k * hgt) / marks / 5, 8, 1.5);
      }
      // seat
      const sy = bot - st.pos * hgt;
      ctx.fillStyle = thor ? '#c62828' : '#3a86ff';
      rr(ctx, tx - 70, sy - 18, 140, 32, 10); ctx.fill();
      ctx.font = '26px serif'; ctx.textAlign = 'center';
      ctx.fillText(av.animal, tx - 40, sy + 4); ctx.fillText('😃', tx, sy + 4); ctx.fillText('😮', tx + 40, sy + 4);
      if (st.phase === 'fall') { ctx.font = '900 34px system-ui, sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText('AAAH!', tx + 110, sy); }
      // pointer arrow at the seat
      ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.moveTo(tx + 76, sy); ctx.lineTo(tx + 62, sy - 10); ctx.lineTo(tx + 62, sy + 10); ctx.fill();
      // target + stop button
      ctx.fillStyle = 'rgba(255,255,255,.9)'; rr(ctx, W * 0.62, 90, W * 0.34, 110, 20); ctx.fill();
      ctx.fillStyle = '#1d3557'; ctx.font = '700 20px system-ui, sans-serif';
      ctx.fillText(`Runde ${Math.min(5, st.round + 1)} af 5 · Stop ved:`, W * 0.79, 125);
      ctx.font = '900 44px system-ui, sans-serif'; ctx.fillStyle = '#e63946';
      ctx.fillText(st.tgt.text, W * 0.79, 180);
      btn.x = W * 0.79; btn.y = H * 0.62; btn.r = Math.min(80, W * 0.12);
      ctx.fillStyle = st.phase === 'move' ? '#e63946' : '#999';
      ctx.beginPath(); ctx.arc(btn.x, btn.y + 6, btn.r, 0, 7); ctx.fillStyle = '#8a1414'; ctx.fill();
      ctx.beginPath(); ctx.arc(btn.x, btn.y, btn.r, 0, 7); ctx.fillStyle = st.phase === 'move' ? '#e63946' : '#999'; ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = '900 34px system-ui, sans-serif'; ctx.fillText('STOP', btn.x, btn.y + 12);
      floats(ctx, st.fx, dt);
      hud(ctx, view, st.coins, null, st.round === 0 && st.phase === 'move' ? 'Tryk STOP, når stolen er ud for svaret' : '');
    });
    return { st };
  }

  return { bump, boat, drop, stop };
})();
