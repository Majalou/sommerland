(() => {
  const app = document.getElementById('app');
  const KEY = 'sommerpark-v1';
  const { pick } = Tasks;

  let state = load();
  let cur = null;
  let token = 0;

  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY));
      if (s && Array.isArray(s.profiles)) return s;
    } catch (e) { /* corrupt data starts fresh */ }
    return { profiles: [], tts: true };
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage full or blocked */ }
  }

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $ = s => app.querySelector(s);
  const $$ = s => [...app.querySelectorAll(s)];
  const today = () => new Date().toLocaleDateString('sv');

  function show(html, cls = '') {
    token++;
    Coaster.stop();
    MiniGames.stop();
    Speech.stop();
    app.className = 'screen ' + cls;
    app.innerHTML = html;
    window.scrollTo(0, 0);
  }
  function later(fn, ms) {
    const t = token;
    setTimeout(() => { if (t === token) fn(); }, ms);
  }
  function say(text, lang) { if (state.tts) Speech.say(text, lang); }

  app.addEventListener('click', e => {
    const b = e.target.closest('[data-say]');
    if (b) Speech.say(b.dataset.say, b.dataset.lang || 'da-DK');
  });

  function ensure(p) {
    p.built = p.built || ['ormen'];
    p.skill = p.skill || {};
    p.money = p.money || 0;
    p.tickets = p.tickets ?? 1;
    p.points = p.points || 0;
    p.lessons = p.lessons || 0;
    p.rides = p.rides || 0;
    p.up = p.up || {};
    p.pos = p.pos || {};
    p.badges = p.badges || [];
    p.stats = { coasterRides: 0, perfect: 0, perfectLynet: false, games: [], ice: 0, helped: 0, night: false, ...(p.stats || {}) };
    p.area = p.area || 'sommer';
    if (!p.day || p.day.date !== today()) p.day = { date: today(), pts: 0, guestTasks: 0 };
    if (p.area === 'viking' && !vikingOpen(p)) p.area = 'sommer';
    return p;
  }
  function newProfile(name, year) {
    return ensure({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name, year, avatar: { animal: pick(ANIMALS), color: pick(COLORS) }, parkName: `${name}s Sommerland`, money: 20, tickets: 2,
    });
  }
  const builtRides = p => RIDES.filter(r => p.built.includes(r.id));
  const vikingOpen = p => RIDES.filter(r => areaOf(r) === 'sommer').every(r => p.built.includes(r.id));
  const guestCount = p => 20 + builtRides(p).length * 45 + DECOS.filter(d => p.built.includes(d.id)).length * 12 + Object.values(p.up || {}).reduce((a, b) => a + b, 0) * 10;
  const parkStars = p => { const n = builtRides(p).length; return n >= 20 ? 5 : n >= 14 ? 4 : n >= 8 ? 3 : n >= 4 ? 2 : 1; };
  const kr = n => `${n} kr`;
  let nightMode = new Date().getHours() >= 19 || new Date().getHours() < 7;
  let moveSel = null, moveMode = false;
  let playStart = Date.now();
  const ICE_AFTER_MS = 9 * 60 * 1000;

  // Weather is fixed per day and player
  function weather(p) {
    let h = 0;
    for (const ch of today() + p.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const k = h % 10;
    return k < 6 ? 'sol' : k < 8 ? 'sky' : 'regn';
  }

  function toast(html) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = html;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add('out'), 3200);
    setTimeout(() => t.remove(), 3800);
  }

  function stats(p) {
    const s = p.stats;
    return {
      built: p.built.length, coasterRides: s.coasterRides, perfect: s.perfect, perfectLynet: s.perfectLynet, games: s.games.length,
      guests: guestCount(p), lessons: p.lessons, upgrades: Object.keys(p.up).length, maxUp: Math.max(0, ...Object.values(p.up)),
      ice: s.ice, helped: s.helped, night: s.night, money: p.money, area2: vikingOpen(p),
    };
  }
  function checkBadges(p) {
    const s = stats(p);
    const fresh = BADGES.filter(b => !p.badges.includes(b.id) && b.t(s));
    fresh.forEach((b, i) => {
      p.badges.push(b.id);
      setTimeout(() => { toast(`<b>${b.icon} Nyt mærke!</b><br>${esc(b.name)}`); Sfx.magic(); }, 600 + i * 900);
    });
    if (fresh.length) save();
  }

  function fireworks(el, n = 6) {
    if (!el) return;
    let html = '';
    for (let k = 0; k < n; k++) {
      const x = 10 + Math.random() * 80, y = 10 + Math.random() * 45, col = pick(COLORS), d = (Math.random() * 1.6).toFixed(2);
      html += `<div class="fw" style="left:${x}%;top:${y}%;--c:${col};animation-delay:${d}s">${Array.from({ length: 12 }, (_, i) => `<i style="--a:${i * 30}deg;animation-delay:${d}s"></i>`).join('')}</div>`;
    }
    el.insertAdjacentHTML('beforeend', html);
  }

  function modal(html, onClose, cls = '') {
    const m = document.createElement('div');
    m.className = 'pmodal ' + cls;
    m.innerHTML = `<div class="pmodal-box">${html}</div>`;
    app.appendChild(m);
    const close = () => { m.remove(); if (onClose) onClose(); };
    m.querySelectorAll('[data-close]').forEach(b => { b.onclick = close; });
    return { el: m, close };
  }

  function confetti(el) {
    if (!el) return;
    let html = '';
    for (let k = 0; k < 70; k++) {
      html += `<i style="left:${Math.random() * 100}%;background:${pick(COLORS)};animation-delay:${(Math.random() * 1.2).toFixed(2)}s;animation-duration:${(2 + Math.random() * 2).toFixed(2)}s"></i>`;
    }
    el.innerHTML = html;
  }

  // ---------- Profiles ----------
  function screenProfiles() {
    cur = null;
    const cards = state.profiles.map(p => `
      <div class="profile-card" data-id="${p.id}">
        <div class="pc-avatar">${ParkArt.avatar(p.avatar, 'big')}</div>
        <div class="pc-name">${esc(p.name)}${p.test ? ' 🧪' : ''}</div>
        <div class="pc-house">${esc(p.parkName)} · ${p.year}. år</div>
        <button class="pc-del" data-del="${p.id}" aria-label="Slet">✕</button>
      </div>`).join('');
    show(`
      <h1 class="title">Min Sommerpark</h1>
      <p class="subtitle">Byg din egen forlystelsespark. Hvem skal spille?</p>
      <div class="profile-grid">
        ${cards}
        <button class="profile-card new" id="newBtn"><div class="plus">+</div><div class="pc-name">Ny parkdirektør</div></button>
      </div>
      <button class="btn ghost guide-btn" id="guideBtn">📖 Sådan virker spillet (for børn og forældre)</button>`, 'profiles');
    $('#guideBtn').onclick = screenGuide;
    $('#newBtn').onclick = () => { Sfx.click(); screenNew(); };
    $$('.profile-card[data-id]').forEach(el => {
      el.onclick = e => {
        if (e.target.closest('.pc-del')) return;
        Sfx.click();
        cur = ensure(state.profiles.find(p => p.id === el.dataset.id));
        playStart = Date.now();
        screenPark(true);
      };
    });
    $$('.pc-del').forEach(b => {
      b.onclick = () => {
        const p = state.profiles.find(x => x.id === b.dataset.del);
        if (p && confirm(`Vil du slette ${p.name}?`)) {
          state.profiles = state.profiles.filter(x => x !== p);
          save();
          screenProfiles();
        }
      };
    });
  }

  // ---------- Guide ----------
  function screenGuide() {
    const row = (a, b) => `<tr><td><b>${a}</b></td><td>${b}</td></tr>`;
    show(`
      <div class="card guide">
        <h2>📖 Velkommen til Min Sommerpark</h2>
        <p>Barnet er direktør for sin egen forlystelsespark. Man tjener penge ved at løse opgaver i matematik, dansk og engelsk i parkens boder, og bruger pengene til at bygge forlystelser. Til sidst har man en kæmpe park med rutsjebaner, vandland og pariserhjul.</p>
        <h3>Sådan starter man</h3>
        <p>Tryk på <b>Ny parkdirektør</b>, skriv navn og vælg årgang. Vælg et dyr og en farve, og giv parken et navn. Parken starter med den lille rutsjebane <b>Ormen</b>.</p>
        <h3>Boderne (her lærer man)</h3>
        <table>
          ${row('🎟️ Billetlugen', 'Plus og minus, tekststykker og ligninger.')}
          ${row('🍦 Isbaren', 'Tælle, gange, division og brøker.')}
          ${row('🔧 Værkstedet', 'Figurer, areal, omkreds og sandsynlighed.')}
          ${row('🗺️ Turistinfo', 'Engelsk: ord, sætninger, grammatik og læsning.')}
          ${row('🪧 Skiltemaleren', 'Dansk: bogstaver, rim, stavning, sætninger og tekstforståelse.')}
        </table>
        <p>Hver bod har 8 opgaver. Rigtigt svar giver 5 kr (2 kr i andet forsøg). En færdig bod giver 10 kr ekstra og 1 🎟️ turbillet. Sværhedsgraden tilpasser sig automatisk. Alle tekster kan læses højt (🔊).</p>
        <h3>Årgange</h3>
        <table>
          ${row('1. år (5-6 år)', 'Tal til 10 med prikker, tælle, figurer. Bogstaver og rim. Engelske ord med billeder.')}
          ${row('2. år (7-8 år)', 'Plus og minus til 100, tabeller, areal og omkreds på tern. Stavelser og stavning.')}
          ${row('3. år (9-10 år)', 'Tal til 1000, gange, division, brøker, tekststykker. Korte sætninger på dansk og engelsk.')}
          ${row('4. år (10-11 år)', 'Ligninger, regnehierarki, division med rest. Tekstforståelse, ordklasser, engelsk grammatik.')}
        </table>
        <h3>Forlystelserne</h3>
        <table>
          ${RIDES.filter(r => r.cost).map(r => row(`${r.name} (${r.cost} kr)`, r.desc + (r.coaster ? ' 🎢' : r.game ? ' 🕹️' : ''))).join('')}
        </table>
        <p>Rutsjebanerne kan man køre i som et lille spil (koster 1 🎟️): <b>Hold fingeren på skærmen for at give fart, slip for at bremse.</b> Saml mønter, kør langsomt i de røde sving og hurtigt ind i loops. De røde sving er færre og nemmere for de yngste. Radiobiler, gokart, både og faldtårne har deres egne små spil. I faldtårnet skal man stoppe stolen ud for svaret på et regnestykke.</p>
        <h3>Mere i parken</h3>
        <table>
          ${row('⭐ Opgraderinger', 'Hver forlystelse kan få lys, ny farve og en guld-stjerne. Det giver flere gæster og mere entré.')}
          ${row('⚔️ Vikingeland', 'Et helt nyt område med 12 nye forlystelser. Åbner når Sommerland er bygget færdigt.')}
          ${row('👧 Gæster', 'Tryk på en gæst i parken. Nogle gæster har et regnestykke og giver 3 kr for hjælpen.')}
          ${row('🌙 Dag og nat', 'Skift mellem dag og nat. Om natten lyser parken, og der er fyrværkeri.')}
          ${row('☀️ Vejr', 'Vejret skifter hver dag. Når det regner, kommer der færre gæster.')}
          ${row('🍦 Is-pause', 'Efter ca. 9 minutter er der is-pause: vælg kugler og regn prisen ud.')}
          ${row('🏅 Mærker', `${BADGES.length} mærker at samle, fx første tur, perfekt tur og 1000 gæster.`)}
          ${row('✋ Flyt', 'Byt rundt på forlystelserne i parken.')}
        </table>
        <p>Hver dag betaler gæsterne også lidt entré for hver forlystelse.</p>
        <h3>Til forældre</h3>
        <p>Alt gemmes kun på denne enhed. Der sendes ingen data nogen steder hen. Brug ikonet på hjemmeskærmen. Under 🗣️ kan I vælge en bedre dansk stemme.</p>
        <div class="test-setup">
          <h3>🧪 Testtilstand (for forældre)</h3>
          <p>Lav en testprofil med penge, så I kan prøve det hele med det samme. Testprofiler får en værktøjslinje i parken.</p>
          <div class="row-opts" id="tYear">${YEARS.map(([y]) => `<button class="opt-btn ${y === 1 ? 'sel' : ''}" data-y="${y}">${y}. år</button>`).join('')}</div>
          <div class="row-opts" id="tStage">${[['Helt ny', 0], ['Lidt penge', 300], ['Mange penge', 1500], ['Rig', 5000]].map(([n, v], i) => `<button class="opt-btn ${i === 0 ? 'sel' : ''}" data-p="${v}">${n}</button>`).join('')}</div>
          <button class="btn gold" id="tGo">Lav testprofil</button>
        </div>
        <div class="end-actions"><button class="btn gold big" id="back">Tilbage</button></div>
      </div>`, 'guide-screen');
    $('#back').onclick = screenProfiles;
    let ty = 1, tp = 0;
    $$('#tYear .opt-btn').forEach(b => { b.onclick = () => { ty = +b.dataset.y; $$('#tYear .opt-btn').forEach(x => x.classList.toggle('sel', x === b)); }; });
    $$('#tStage .opt-btn').forEach(b => { b.onclick = () => { tp = +b.dataset.p; $$('#tStage .opt-btn').forEach(x => x.classList.toggle('sel', x === b)); }; });
    $('#tGo').onclick = () => {
      const p = newProfile(`Test ${ty}. år`, ty);
      p.test = true;
      p.money = tp;
      p.tickets = 5;
      state.profiles.push(p);
      save();
      cur = p;
      screenPark(true);
    };
  }

  // ---------- New player ----------
  function screenNew() {
    let year = null;
    const intro = 'Hej! Vil du være direktør for din egen forlystelsespark? Hvad hedder du? Og hvilket år går du i?';
    show(`
      <div class="card">
        <div class="crest-big">🎢</div>
        <h2>Ny parkdirektør</h2>
        <p>Vil du bygge din egen forlystelsespark? <button class="speak" data-say="${intro}">🔊</button></p>
        <label class="field">Hvad hedder du?<input id="name" maxlength="16" autocomplete="off" placeholder="Skriv dit navn"></label>
        <p class="label">Hvilket år går du i?</p>
        <div class="year-row">
          ${YEARS.map(([y, age]) => `<button class="year-btn" data-y="${y}"><b>${y}. år</b><span>${age}</span></button>`).join('')}
        </div>
        <div class="end-actions"><button class="btn ghost" id="back">⬅ Tilbage</button><button class="btn gold big" id="go" disabled>Videre ➜</button></div>
      </div>`, 'new-screen');
    say(intro);
    const upd = () => { $('#go').disabled = !($('#name').value.trim() && year); };
    $('#name').oninput = upd;
    $('#back').onclick = screenProfiles;
    $$('.year-btn').forEach(b => {
      b.onclick = () => {
        year = +b.dataset.y;
        $$('.year-btn').forEach(x => x.classList.toggle('sel', x === b));
        Sfx.click();
        upd();
      };
    });
    $('#go').onclick = () => {
      const p = newProfile($('#name').value.trim().slice(0, 16), year);
      state.profiles.push(p);
      save();
      cur = p;
      screenAvatar(true);
    };
  }

  // ---------- Avatar / park name ----------
  function screenAvatar(isNew) {
    const av = { ...cur.avatar };
    let year = cur.year, parkName = cur.parkName;
    show(`<h1 class="title small">${isNew ? 'Vælg din figur' : 'Skift figur'}</h1><div class="builder" id="builder"></div>`, 'avatar');
    if (isNew) say('Vælg et dyr og en farve. Og giv din park et navn.');
    const render = () => {
      const opt = (k, v, html, sel) => `<button class="opt-btn ${sel ? 'sel' : ''}" data-k="${k}" data-v="${v}">${html}</button>`;
      const rows = [
        ['Dyr', ANIMALS.map(a => opt('animal', a, `<span class="emo-opt">${a}</span>`, av.animal === a))],
        ['Farve', COLORS.map(c => opt('color', c, `<span class="sw" style="background:${c}"></span>`, av.color === c))],
      ];
      if (!isNew) rows.push(['År', YEARS.map(([y]) => opt('year', y, `${y}. år`, year === y))]);
      $('#builder').innerHTML = `
        <div class="preview">${ParkArt.avatar(av, 'huge')}<div class="pv-name">${esc(cur.name)}</div></div>
        <div class="rows">
          ${rows.map(([label, btns]) => `<div class="row"><div class="row-label">${label}</div><div class="row-opts">${btns.join('')}</div></div>`).join('')}
          <div class="row"><div class="row-label">Parkens navn</div><input id="pname" class="pname" maxlength="24" value="${esc(parkName)}"></div>
          <div class="builder-actions">
            ${isNew ? '' : '<button class="btn ghost" id="cancel">Annuller</button>'}
            <button class="btn gold big" id="done">${isNew ? 'Åbn min park ➜' : 'Gem ✓'}</button>
          </div>
        </div>`;
      $('#pname').oninput = e => { parkName = e.target.value; };
      $$('.opt-btn').forEach(b => {
        b.onclick = () => {
          const k = b.dataset.k, v = b.dataset.v;
          if (k === 'year') year = +v; else av[k] = v;
          Sfx.click();
          render();
        };
      });
      if (!isNew) $('#cancel').onclick = () => screenPark();
      $('#done').onclick = () => {
        cur.avatar = av;
        cur.year = year;
        cur.parkName = (parkName || '').trim().slice(0, 24) || `${cur.name}s Sommerland`;
        save();
        Sfx.magic();
        screenPark(isNew ? 'first' : false);
      };
    };
    render();
  }

  // ---------- Park (hub) ----------
  function testBar(p) {
    if (!p.test) return '';
    const b = (id, label) => `<button class="btn small" data-t="${id}">${label}</button>`;
    return `<div class="test-bar"><b>🧪 Testværktøjer</b>${b('money', '💰 +100 kr')}${b('rich', '💰 +1000 kr')}${b('tickets', '🎟️ +5')}${b('sommer', '🎡 Byg Sommerland')}${b('all', '🏗️ Byg alt')}${b('none', '🧹 Nulstil park')}${b('day', '☀️ Ny dag')}${b('ice', '🍦 Is-pause')}${b('year', `📅 Skift år (${p.year}.)`)}</div>`;
  }
  function bindTestBar(p) {
    $$('[data-t]').forEach(btn => {
      btn.onclick = () => {
        const t = btn.dataset.t;
        if (t === 'money') p.money += 100;
        if (t === 'rich') p.money += 1000;
        if (t === 'tickets') p.tickets += 5;
        if (t === 'sommer') p.built = [...new Set([...p.built, ...[...RIDES, ...DECOS].filter(r => areaOf(r) === 'sommer').map(r => r.id)])];
        if (t === 'all') p.built = [...RIDES, ...DECOS].map(r => r.id);
        if (t === 'none') { p.built = ['ormen']; p.up = {}; p.pos = {}; p.area = 'sommer'; }
        if (t === 'day') { p.lastIncome = '2000-01-01'; p.day.guestTasks = 0; }
        if (t === 'year') p.year = (p.year % 4) + 1;
        save();
        if (t === 'ice') { screenIce(); return; }
        screenPark(t === 'day');
      };
    });
  }

  function screenPark(greet) {
    const p = cur;
    const stars = parkStars(p);
    const income = dailyIncome(p);
    const wx = weather(p), [wIcon, wName] = WEATHER[wx];
    const vOpen = vikingOpen(p);
    if (!vOpen) p.area = 'sommer';
    if (nightMode && !p.stats.night) { p.stats.night = true; save(); }
    show(`
      <header class="park-top" style="--pc:${p.avatar.color}">
        <button class="btn small" id="back">⬅</button>
        <div class="me">
          ${ParkArt.avatar(p.avatar)}
          <div><div class="me-name">${esc(p.name)}</div><div class="me-park">${esc(p.parkName)} <span class="stars">${'★'.repeat(stars)}<span class="dim">${'★'.repeat(5 - stars)}</span></span></div></div>
        </div>
        <div class="chips">
          <span class="chip money" id="money">💰 ${kr(p.money)}</span>
          <span class="chip">🎟️ ${p.tickets}</span>
          <span class="chip">👥 ${Math.round(guestCount(p) * WEATHER[wx][2])}</span>
          <span class="chip">${wIcon} ${wName}</span>
          <span class="chip">⭐ ${p.day.pts}</span>
        </div>
        <div class="top-btns">
          <button class="btn small" id="badges">🏅 ${p.badges.length}</button>
          <button class="btn small" id="dress">👕</button>
          <button class="btn small" id="voice">🗣️</button>
          <button class="btn small" id="tts" aria-label="Oplæsning">${state.tts ? '🔊' : '🔇'}</button>
        </div>
      </header>
      ${testBar(p)}
      <div class="map-bar">
        <div class="area-tabs">
          ${AREAS.map(a => {
            const locked = a.id === 'viking' && !vOpen;
            return `<button class="area-tab ${p.area === a.id ? 'sel' : ''} ${locked ? 'locked' : ''}" data-area="${a.id}">${locked ? '🔒' : a.icon} ${a.name}</button>`;
          }).join('')}
        </div>
        <div class="map-tools">
          <button class="btn small ${moveMode ? 'gold' : ''}" id="move">${moveMode ? '✅ Færdig' : '✋ Flyt'}</button>
          <button class="btn small" id="night">${nightMode ? '☀️ Dag' : '🌙 Nat'}</button>
        </div>
      </div>
      <div class="map-wrap ${nightMode ? 'is-night' : ''}" id="mapwrap">${ParkArt.map(p, { area: p.area, night: nightMode, weather: wx, moveSel })}<div class="guest-bubble" id="gbub" hidden></div></div>
      <p class="map-hint">${moveMode ? (moveSel ? 'Tryk nu der, hvor den skal stå.' : 'Tryk på den forlystelse, du vil flytte.') : 'Tryk på en byggegrund for at bygge. Tryk på en forlystelse for at køre eller opgradere. Tryk på en gæst for at snakke.'}</p>
      <h2 class="sec-title">💰 Tjen penge i boderne</h2>
      <div class="stations">
        ${Object.entries(CLASSES).map(([id, c]) => `
          <button class="station-card" data-c="${id}" style="--cc:${c.color}">
            <div class="sc-icon">${c.icon}</div><div class="sc-name">${c.name}</div><div class="sc-host">${c.tIcon} ${c.teacher}</div>
          </button>`).join('')}
      </div>`, 'park');
    bindTestBar(p);
    if (nightMode) fireworks($('#mapwrap'), 4);
    $('#back').onclick = screenProfiles;
    $('#dress').onclick = () => screenAvatar(false);
    $('#voice').onclick = screenVoices;
    $('#badges').onclick = screenBadges;
    $('#tts').onclick = () => { state.tts = !state.tts; save(); $('#tts').textContent = state.tts ? '🔊' : '🔇'; };
    $('#night').onclick = () => { nightMode = !nightMode; Sfx.magic(); screenPark(); checkBadges(p); };
    $('#move').onclick = () => { moveMode = !moveMode; moveSel = null; Sfx.click(); screenPark(); };
    $$('.area-tab').forEach(b => {
      b.onclick = () => {
        if (b.classList.contains('locked')) {
          modal(`<div class="m-big">⚔️</div><h2>Vikingeland</h2><p>Et helt nyt område med vikingeskib, drage-rutsjebane og meget mere!</p><p class="m-miss">Det åbner, når du har bygget alle forlystelser i Sommerland.</p><button class="btn gold big" data-close>OK</button>`);
          say('Vikingeland åbner, når du har bygget alle forlystelser i Sommerland.');
          return;
        }
        p.area = b.dataset.area; moveSel = null; save(); Sfx.click(); screenPark();
      };
    });
    $$('.station-card').forEach(b => { b.onclick = () => { Sfx.click(); startLesson(b.dataset.c); }; });
    $$('.plot').forEach(g => { g.addEventListener('click', () => clickPlot(g.dataset.plot)); });
    $$('.guest').forEach(g => { g.addEventListener('click', e => { e.stopPropagation(); talkGuest(e); }); });
    checkBadges(p);
    if (income) {
      modal(`<div class="m-big">${wIcon}</div><h2>Godmorgen, direktør!</h2>
        <p>Siden sidst har gæsterne betalt <b>${kr(income)}</b> i entré til dine ${builtRides(p).length} forlystelser.${wx === 'regn' ? ' Det regner i dag, så der kom lidt færre gæster.' : ''}</p>
        <button class="btn gold big" data-close>Tak!</button>`);
      Sfx.fanfare();
      say(`Godmorgen, direktør! Gæsterne har betalt ${income} kroner i entré.`);
    } else if (greet === 'first') {
      say(`Velkommen til ${p.parkName}! Tjen penge i boderne, og byg nye forlystelser. Du kan også prøve rutsjebanen Ormen.`);
    } else if (greet) {
      const next = nextGoal(p);
      say(`Hej ${p.name}! ${next ? `Du har ${p.money} kroner. ${next.name} koster ${next.cost} kroner.` : 'Din park er helt færdig. Flot!'}`);
    }
  }

  function dailyIncome(p) {
    const t = today();
    if (!p.lastIncome) { p.lastIncome = t; save(); return 0; }
    if (p.lastIncome === t) return 0;
    p.lastIncome = t;
    const ups = Object.values(p.up).reduce((a, b) => a + b, 0);
    const n = Math.round((builtRides(p).length * PAY.perRideDaily + ups) * WEATHER[weather(p)][2]);
    p.money += n;
    save();
    return n;
  }
  const nextGoal = p => RIDES.filter(r => !p.built.includes(r.id) && (areaOf(r) === 'sommer' || vikingOpen(p))).sort((a, b) => a.cost - b.cost)[0];
  const occupant = (p, slotId) => rideById(((p.pos || {})[p.area] || {})[slotId] || slotId);

  // ---------- guests ----------
  function guestTask(p) {
    const y = p.year, r = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
    const ice = pick(FLAVORS)[0].toLowerCase();
    if (y === 1) { const a = r(1, 4), b = r(1, 4); return { q: `Jeg har ${a} kr, og mor giver mig ${b} kr. Hvor mange kr har jeg nu?`, a: a + b }; }
    if (y === 2) { const have = r(10, 20), cost = r(3, have - 2); return { q: `Jeg har ${have} kr. En ${ice}is koster ${cost} kr. Hvor mange kr har jeg tilbage?`, a: have - cost }; }
    if (y === 3) { const n = r(2, 6), pr = r(3, 9); return { q: `Vi er ${n} børn, og en billet koster ${pr} kr. Hvad koster det for os alle?`, a: n * pr }; }
    const n = r(2, 5), pr = r(12, 25), pay = Math.ceil((n * pr) / 50) * 50 + (Math.random() < 0.5 ? 50 : 0);
    return { q: `Vi køber ${n} armbånd til ${pr} kr og betaler med ${pay} kr. Hvor mange kr får vi tilbage?`, a: pay - n * pr };
  }
  function talkGuest(e) {
    const p = cur, bub = $('#gbub'), wrap = $('#mapwrap');
    if (!bub || moveMode) return;
    const rect = wrap.getBoundingClientRect();
    const x = Math.min(rect.width - 260, Math.max(10, e.clientX - rect.left - 120)), y = Math.max(10, e.clientY - rect.top - 150);
    const face = pick(GUEST_FACES);
    const here = builtRides(p).filter(r => areaOf(r) === p.area);
    const next = nextGoal(p);
    const doTask = (p.day.guestTasks || 0) < 5 && Math.random() < 0.4;
    bub.style.left = x + 'px'; bub.style.top = y + 'px';
    bub.hidden = false;
    Sfx.click();
    if (doTask) {
      const t = guestTask(p);
      const opts = Tasks.shuffle([t.a, ...[t.a + 1, t.a - 1, t.a + 2, t.a - 2, t.a + 10].filter(v => v >= 0 && v !== t.a).slice(0, 3)]);
      bub.innerHTML = `<button class="gb-x" aria-label="Luk">✕</button><div class="gb-face">${face}</div><p>${esc(t.q)}</p><div class="gb-opts">${opts.map(v => `<button class="btn small" data-v="${v}">${v}</button>`).join('')}</div><small>Hjælp gæsten og få 3 kr</small>`;
      say(t.q);
      bub.querySelectorAll('[data-v]').forEach(b => {
        b.onclick = ev => {
          ev.stopPropagation();
          if (+b.dataset.v === t.a) {
            p.money += 3; p.stats.helped++; p.day.guestTasks = (p.day.guestTasks || 0) + 1; save();
            bub.innerHTML = `<div class="gb-face">${face}</div><p><b>Tak for hjælpen! 🪙 +3 kr</b></p>`;
            Sfx.good(); say('Tak for hjælpen!');
            const m = $('#money'); if (m) m.textContent = `💰 ${kr(p.money)}`;
            checkBadges(p);
            setTimeout(() => { bub.hidden = true; }, 1600);
          } else { b.disabled = true; b.classList.add('wrong'); Sfx.bad(); say('Ikke helt. Prøv igen.'); }
        };
      });
    } else {
      const line = pick(GUEST_SAY).replace('{ride}', here.length ? pick(here).name : 'parken').replace('{next}', next ? next.name : 'en ny rutsjebane');
      bub.innerHTML = `<button class="gb-x" aria-label="Luk">✕</button><div class="gb-face">${face}</div><p>${esc(line)}</p>`;
      say(line);
      setTimeout(() => { if (!bub.querySelector('.gb-opts')) bub.hidden = true; }, 3500);
    }
    bub.querySelector('.gb-x')?.addEventListener('click', ev => { ev.stopPropagation(); bub.hidden = true; });
  }

  // ---------- plots ----------
  function clickPlot(slotId) {
    const p = cur;
    Sfx.click();
    if (moveMode) {
      const kindOf = id => (DECOS.some(d => d.id === id) ? 'deco' : 'ride');
      if (!moveSel) {
        if (!p.built.includes(occupant(p, slotId).id)) { say('Vælg en forlystelse, der er bygget.'); return; }
        moveSel = slotId; screenPark(); return;
      }
      if (moveSel !== slotId) {
        if (kindOf(moveSel) !== kindOf(slotId)) { say('Pynt kan kun bytte plads med pynt, og forlystelser med forlystelser.'); moveSel = null; screenPark(); return; }
        const pos = p.pos[p.area] = p.pos[p.area] || {};
        const a = occupant(p, moveSel).id, b = occupant(p, slotId).id;
        pos[moveSel] = b; pos[slotId] = a;
        save();
        Sfx.whoosh();
      }
      moveSel = null;
      screenPark();
      return;
    }
    const r = occupant(p, slotId);
    if (p.built.includes(r.id)) {
      if (r.coaster) rideDialog(r); else if (r.game) gameDialog(r); else flatRide(r);
      return;
    }
    const can = p.money >= r.cost;
    const m = modal(`
      ${ParkArt.rideSvg(r.id)}
      <h2>${esc(r.name)}</h2>
      <p>${esc(r.desc || 'Gør parken hyggeligere.')}${r.coaster ? ' 🎢' : r.game ? ' 🕹️' : ''}</p>
      <p class="m-price">Pris: <b>${kr(r.cost)}</b> · Du har <b>${kr(p.money)}</b></p>
      ${can ? `<div class="end-actions"><button class="btn ghost" data-close>Ikke nu</button><button class="btn gold big" id="buy">🏗️ Byg for ${kr(r.cost)}</button></div>`
        : `<p class="m-miss">Du mangler <b>${kr(r.cost - p.money)}</b>. Tjen penge i boderne!</p><div class="big-eq">${r.cost} − ${p.money} = ${r.cost - p.money}</div>
        <div class="end-actions"><button class="btn gold big" data-close>OK</button></div>`}`);
    say(can ? `${r.name}. Den koster ${r.cost} kroner. Du har ${p.money} kroner. Vil du bygge den?` : `${r.name} koster ${r.cost} kroner. Du har ${p.money} kroner. Du mangler ${r.cost - p.money} kroner.`);
    if (can) m.el.querySelector('#buy').onclick = () => { m.el.remove(); build(r); };
  }

  function build(r) {
    const p = cur, before = p.money, wasOpen = vikingOpen(p);
    p.money -= r.cost;
    p.built.push(r.id);
    const opened = !wasOpen && vikingOpen(p);
    if (opened) RIDES.concat(DECOS).filter(x => areaOf(x) === 'viking' && x.cost === 0).forEach(x => { if (!p.built.includes(x.id)) p.built.push(x.id); });
    save();
    screenPark();
    const big = r.cost >= 300;
    const m = modal(`<div class="confetti" id="conf"></div>
      <div class="m-big">🏗️</div>
      <h2>${esc(r.name)} er bygget!</h2>
      ${ParkArt.rideSvg(r.id, 'ride-pic built-pop')}
      <div class="big-eq">${before} − ${r.cost} = ${p.money}</div>
      <p>Du havde ${kr(before)}. Nu har du <b>${kr(p.money)}</b>.</p>
      ${r.coaster ? '<p>🎢 Tryk på den i parken for at køre en tur!</p>' : r.game ? '<p>🕹️ Tryk på den i parken for at spille!</p>' : ''}
      ${opened ? '<p class="end-unlock">⚔️ Vikingeland er åbnet! Du har fået Vikingetoget gratis.</p>' : ''}
      <button class="btn gold big" data-close>Super!</button>`, () => checkBadges(p), 'built');
    confetti(m.el.querySelector('#conf'));
    if (big || opened) fireworks(m.el.querySelector('.pmodal-box'), 8);
    Sfx.fanfare();
    later(() => Sfx.magic(), 500);
    say(`${r.name} er bygget! Du havde ${before} kroner. ${r.name} kostede ${r.cost} kroner. Nu har du ${p.money} kroner.${opened ? ' Vikingeland er åbnet!' : ''}`);
  }

  function upgradeHtml(r) {
    const p = cur, lvl = p.up[r.id] || 0;
    if (!RIDES.includes(r)) return '';
    const steps = UPGRADES.map(([ic, name], i) => `<span class="up-step ${i < lvl ? 'on' : ''}">${ic} ${name}</span>`).join('');
    if (lvl >= UPGRADES.length) return `<div class="up-box"><div class="up-steps">${steps}</div><p>⭐ Fuldt opgraderet!</p></div>`;
    const cost = upgradeCost(r, lvl), can = p.money >= cost;
    return `<div class="up-box"><div class="up-steps">${steps}</div>
      <button class="btn ${can ? 'gold' : ''}" id="upg" ${can ? '' : 'disabled'}>${UPGRADES[lvl][0]} ${UPGRADES[lvl][1]} for ${kr(cost)}</button>
      ${can ? '' : `<small>Du mangler ${kr(cost - p.money)}</small>`}</div>`;
  }
  function bindUpgrade(m, r, reopen) {
    const b = m.el.querySelector('#upg');
    if (!b) return;
    b.onclick = () => {
      const p = cur, lvl = p.up[r.id] || 0, cost = upgradeCost(r, lvl);
      if (p.money < cost) return;
      const before = p.money;
      p.money -= cost;
      p.up[r.id] = lvl + 1;
      save();
      m.el.remove();
      screenPark();
      const mm = modal(`<div class="confetti" id="conf"></div><h2>${UPGRADES[lvl][0]} ${esc(r.name)} fik ${UPGRADES[lvl][1].toLowerCase()}!</h2>
        ${ParkArt.rideSvg(r.id, 'ride-pic built-pop', lvl + 1)}
        <div class="big-eq">${before} − ${cost} = ${p.money}</div>
        <p>Flere gæster vil komme og køre i ${esc(r.name)}.</p>
        <button class="btn gold big" data-close>Flot!</button>`, () => checkBadges(p));
      confetti(mm.el.querySelector('#conf'));
      if (lvl + 1 === 3) fireworks(mm.el.querySelector('.pmodal-box'), 6);
      Sfx.fanfare();
      say(`${r.name} fik ${UPGRADES[lvl][1]}! Du havde ${before} kroner. Nu har du ${p.money} kroner.`);
    };
  }

  function flatRide(r) {
    const p = cur;
    const m = modal(`${ParkArt.rideSvg(r.id, 'ride-pic ride-go', p.up[r.id] || 0)}
      <h2>${esc(r.name)}</h2><p>${esc(r.desc || '')}</p>
      ${upgradeHtml(r)}
      <button class="btn gold big" data-close>Fedt!</button>`, null, 'flat');
    bindUpgrade(m, r);
    Sfx.whoosh();
    say(`${r.name}. ${r.desc || ''}`);
  }

  const GAME_HELP = {
    bump: '👆 Træk fingeren dit du vil køre<br>💥 Bump ind i de andre biler og få mønter<br>⏱️ Du har 35 sekunder',
    boat: '👆 Træk fingeren for at styre båden<br>🦆 Saml ænderne<br>🪨 Pas på stenene i elven',
    drop: '🔢 Regn regnestykket ud<br>🛑 Tryk STOP, når stolen er ud for svaret<br>😱 Så falder du!',
  };
  function gameDialog(r) {
    const p = cur, has = p.tickets > 0;
    const m = modal(`${ParkArt.rideSvg(r.id, 'ride-pic', p.up[r.id] || 0)}
      <h2>🕹️ ${esc(r.name)}</h2>
      <p>${esc(r.desc)}</p>
      <div class="howto"><b>Sådan spiller du:</b><br>${GAME_HELP[r.game]}</div>
      ${upgradeHtml(r)}
      <p class="m-price">Du har ${p.tickets} 🎟️.</p>
      ${has ? `<div class="end-actions"><button class="btn ghost" data-close>Ikke nu</button><button class="btn gold big" id="go">Spil! (1 🎟️)</button></div>`
        : `<p class="m-miss">Du har ingen turbilletter. Du får en billet, hver gang du gør en bod færdig.</p><button class="btn gold big" data-close>OK</button>`}`);
    bindUpgrade(m, r);
    say(has ? `${r.name}. Vil du spille? Det koster en turbillet.` : 'Du har ingen turbilletter. Du får en billet, når du gør en bod færdig.');
    if (has) m.el.querySelector('#go').onclick = () => { m.el.remove(); playGame(r); };
  }
  function playGame(r) {
    const p = cur;
    p.tickets--;
    save();
    show('<div class="coaster-root" id="croot"></div><button class="btn small c-exit" id="cexit">✕</button>', 'coaster');
    $('#cexit').onclick = () => screenPark();
    Speech.say(r.game === 'drop' ? '' : `${r.name}. Klar, parat, start!`);
    window.__game = MiniGames[r.game]($('#croot'), r, p.avatar, p.year, res => gameResult(r, res));
  }
  function gameResult(r, res) {
    const p = cur;
    const money = Math.ceil(res.coins * PAY.coin * 2);
    p.money += money;
    if (!p.stats.games.includes(res.game)) p.stats.games.push(res.game);
    save();
    show(`
      <div class="card ride-end">
        <div class="confetti" id="conf"></div>
        <h2>${esc(r.name)} er slut!</h2>
        <div class="m-big">${res.coins >= 10 ? '🏆' : '🎉'}</div>
        <p class="end-pts">Du fik <b>${res.coins}</b> mønter = <b>${kr(money)}</b> til parken!</p>
        <p>Du har nu <b>${kr(p.money)}</b> og ${p.tickets} 🎟️.</p>
        <div class="end-actions">
          ${p.tickets > 0 ? '<button class="btn big" id="again">🔁 Igen (1 🎟️)</button>' : ''}
          <button class="btn gold big" id="park">Til parken</button>
        </div>
      </div>`, 'ride-done');
    confetti($('#conf'));
    Sfx.fanfare();
    say(`Godt spillet! Du fik ${money} kroner til parken.`);
    $('#park').onclick = () => screenPark();
    if ($('#again')) $('#again').onclick = () => playGame(r);
    checkBadges(p);
  }

  function rideDialog(r) {
    const p = cur, has = p.tickets > 0;
    const m = modal(`${ParkArt.rideSvg(r.id, 'ride-pic', p.up[r.id] || 0)}
      <h2>🎢 ${esc(r.name)}</h2>
      <p>${esc(r.desc)}</p>
      <div class="howto"><b>Sådan kører du:</b><br>👆 Hold fingeren nede = mere fart<br>✋ Slip = bremse<br>🪙 Saml mønter. Med god fart over bakketoppene letter toget og tager de høje mønter.<br>⚠️ Kør langsomt i de <span style="color:#e63946;font-weight:800">røde</span> sving!${r.coaster.loops ? '<br>🔄 Kør hurtigt ind i loopet for at få bonus!' : ''}</div>
      ${upgradeHtml(r)}
      <p class="m-price">Du har ${p.tickets} 🎟️ turbillet${p.tickets === 1 ? '' : 'ter'}.</p>
      ${has ? `<div class="end-actions"><button class="btn ghost" data-close>Ikke nu</button><button class="btn gold big" id="go">Kør! (1 🎟️)</button></div>`
        : `<p class="m-miss">Du har ingen turbilletter. Du får en billet, hver gang du gør en bod færdig.</p><button class="btn gold big" data-close>OK</button>`}`);
    bindUpgrade(m, r);
    say(has ? `${r.name}. Hold fingeren nede for at give fart. Slip for at bremse. Kør langsomt i de røde sving.` : 'Du har ingen turbilletter. Du får en billet, når du gør en bod færdig.');
    if (has) m.el.querySelector('#go').onclick = () => { m.el.remove(); playRide(r); };
  }

  function playRide(r) {
    const p = cur;
    p.tickets--;
    save();
    show('<div class="coaster-root" id="croot"></div><button class="btn small c-exit" id="cexit">✕</button>', 'coaster');
    $('#cexit').onclick = () => screenPark();
    Speech.say(r.coaster.launch ? 'Klar, parat, af sted!' : `Velkommen om bord på ${r.name}. Hold godt fast!`);
    window.__ride = Coaster.start($('#croot'), r, p.avatar, p.year, res => rideResult(r, res));
  }

  function rideResult(r, res) {
    const p = cur;
    const money = Math.ceil(res.coins * PAY.coin);
    p.money += money;
    p.rides++;
    p.stats.coasterRides++;
    if (!res.pen) { p.stats.perfect++; if (r.id === 'lynet') p.stats.perfectLynet = true; }
    save();
    const pct = res.total ? res.coins / res.total : 0;
    const stars = pct > 0.7 && !res.pen ? 3 : pct > 0.45 ? 2 : 1;
    show(`
      <div class="card ride-end">
        <div class="confetti" id="conf"></div>
        <h2>Turen er slut!</h2>
        <div class="end-stars">${'⭐'.repeat(stars)}<span class="dim">${'⭐'.repeat(3 - stars)}</span></div>
        <p class="end-pts">Du samlede <b>${res.coins}</b> mønter = <b>${kr(money)}</b> til parken!</p>
        ${res.airs ? `<p>Toget lettede ${res.airs} gang${res.airs === 1 ? '' : 'e'}. Wiii!</p>` : ''}
        ${res.loops ? `<p>🔄 Du kørte ${res.loops} loop${res.loops === 1 ? '' : 's'} med fuld fart!</p>` : ''}
        ${res.pen ? `<p>Du kørte for hurtigt i ${res.pen} rød${res.pen === 1 ? 't' : 'e'} sving.</p>` : '<p>Du kørte perfekt i alle de røde sving! 👏</p>'}
        <p>Du har nu <b>${kr(p.money)}</b> og ${p.tickets} 🎟️.</p>
        <div class="end-actions">
          ${p.tickets > 0 ? '<button class="btn big" id="again">🎢 Kør igen (1 🎟️)</button>' : ''}
          <button class="btn gold big" id="park">Til parken</button>
        </div>
      </div>`, 'ride-done');
    confetti($('#conf'));
    if (stars === 3) fireworks($('.ride-end'), 6);
    Sfx.fanfare();
    say(`Turen er slut! Du samlede ${res.coins} mønter. Det giver ${money} kroner til parken.`);
    $('#park').onclick = () => screenPark();
    if ($('#again')) $('#again').onclick = () => playRide(r);
    checkBadges(p);
  }

  // ---------- badges ----------
  function screenBadges() {
    const p = cur;
    show(`
      <header class="lesson-top" style="--cc:#ffb703"><button class="btn small" id="back">⬅ Parken</button><div class="lt-name">🏅 Mærker</div><div class="lt-pts">${p.badges.length}/${BADGES.length}</div></header>
      <div class="badge-grid">
        ${BADGES.map(b => {
          const has = p.badges.includes(b.id);
          return `<button class="badge ${has ? 'has' : ''}" data-say="${esc(b.name + '. ' + b.desc)}"><div class="b-icon">${has ? b.icon : '🔒'}</div><b>${esc(b.name)}</b><small>${esc(b.desc)}</small></button>`;
        }).join('')}
      </div>`, 'badges');
    say(`Du har ${p.badges.length} mærker.`);
    $('#back').onclick = () => screenPark();
  }

  // ---------- ice cream break ----------
  function screenIce() {
    const p = cur, y = p.year, n = y === 1 ? 2 : 3;
    const price = () => (y === 1 ? 1 : y === 2 ? 2 + Math.floor(Math.random() * 4) : y === 3 ? 4 + Math.floor(Math.random() * 6) : 6 + Math.floor(Math.random() * 9));
    const menu = Tasks.shuffle(FLAVORS).slice(0, 6).map(([name, col]) => ({ name, col, pr: price() }));
    const picked = [];
    const cone = () => `<div class="cone-wrap">${picked.map((f, i) => `<div class="scoop" style="background:${f.col};bottom:${70 + i * 46}px"></div>`).join('')}<div class="cone"></div></div>`;
    const render = () => {
      show(`
        <header class="lesson-top" style="--cc:#3a86ff"><button class="btn small" id="back">⬅ Parken</button><div class="lt-name">🍦 Is-pause</div><div class="lt-pts">🐧</div></header>
        <div class="ice-screen">
          <div class="ice-left">${cone()}</div>
          <div class="ice-right">
            <div class="bubble"><span>${picked.length < n ? `Vælg ${n - picked.length} kugle${n - picked.length === 1 ? '' : 'r'} mere!` : 'Hvad koster din is?'}</span></div>
            ${picked.length < n ? `<div class="flavors">${menu.map((f, i) => `<button class="flavor" data-i="${i}"><span class="fl-dot" style="background:${f.col}"></span>${esc(f.name)}<b>${f.pr} kr</b></button>`).join('')}</div>`
              : `<div class="big">${picked.map(f => f.pr).join(' + ')} = ?</div><div class="options" id="iceopts"></div>`}
          </div>
        </div>`, 'ice');
      $('#back').onclick = () => screenPark();
      if (picked.length < n) {
        say(picked.length ? `${picked[picked.length - 1].name}. Vælg en kugle mere.` : `Is-pause! Pingvinen Pia byder på is. Vælg ${n} kugler.`);
        $$('.flavor').forEach(b => { b.onclick = () => { picked.push(menu[+b.dataset.i]); Sfx.click(); render(); }; });
      } else {
        const sum = picked.reduce((a, f) => a + f.pr, 0);
        say(`Hvad koster din is? ${picked.map(f => f.pr).join(' plus ')}`);
        const opts = Tasks.shuffle([sum, sum + 1, Math.max(0, sum - 1), sum + 2].filter((v, i, a) => a.indexOf(v) === i));
        $('#iceopts').innerHTML = opts.map(v => `<div class="opt-wrap"><button class="opt" data-v="${v}">${v} kr</button></div>`).join('');
        let tries = 0;
        $$('#iceopts .opt').forEach(b => {
          b.onclick = () => {
            if (+b.dataset.v === sum) {
              b.classList.add('right');
              p.stats.ice++; p.points += 10; p.day.pts += 10;
              playStart = Date.now();
              save();
              Sfx.good();
              modal(`<div class="confetti" id="conf"></div>${cone()}<h2>Værsgo! Isen koster ${sum} kr</h2><p>Men du får den gratis, fordi du arbejder så godt! 🐧</p><button class="btn gold big" data-close>Mums!</button>`, () => { checkBadges(p); screenPark(); }, 'ice-done');
              confetti(document.querySelector('.pmodal #conf'));
              say(`Rigtigt! Isen koster ${sum} kroner. Men du får den gratis. Velbekomme!`);
            } else {
              b.classList.add('wrong'); b.disabled = true; tries++; Sfx.bad();
              say(tries > 1 ? `Det er ${sum} kroner.` : 'Prøv igen. Læg tallene sammen.');
            }
          };
        });
      }
    };
    render();
  }

  // ---------- Voice settings ----------
  function screenVoices() {
    const samples = { da: 'Hej! Velkommen til parken. Hvad er tre plus fire?', en: 'Hello! Welcome to the park. One ticket, please.' };
    const langs = { da: 'da-DK', en: 'en-GB' };
    show(`
      <h1 class="title small">Vælg stemme</h1>
      <div class="voices" id="voices"></div>
      <div class="card voice-help">
        <h2>Bedre dansk stemme på iPad</h2>
        <p>Åbn <b>Indstillinger → Tilgængelighed → Oplæst indhold → Stemmer → Dansk</b>.<br>
        Hent <b>Sara (forbedret)</b> eller en anden stemme mærket <i>forbedret</i> eller <i>premium</i>.<br>
        Luk og åbn spillet igen. Så kan du vælge stemmen her.</p>
      </div>
      <div class="builder-actions"><button class="btn gold big" id="done">Færdig ✓</button></div>`, 'voice-screen');
    const render = () => {
      const box = $('#voices');
      if (!box) return;
      const current = { da: Speech.voice('da-DK'), en: Speech.voice('en-GB') };
      box.innerHTML = ['da', 'en'].map(l2 => {
        const list = Speech.listFor(l2);
        const btns = list.length
          ? list.map(v => `<button class="opt-btn voice-btn ${current[l2] === v ? 'sel' : ''}" data-l="${l2}" data-uri="${esc(v.voiceURI)}">${esc(v.name)}<small>${esc(v.lang)}</small></button>`).join('')
          : `<p>${l2 === 'da' ? 'Ingen dansk stemme fundet på denne enhed.' : 'Ingen engelsk stemme fundet.'}</p>`;
        return `<div class="row"><div class="row-label">${l2 === 'da' ? 'Dansk' : 'Engelsk'}</div><div class="row-opts">${btns}</div></div>`;
      }).join('');
      $$('.voice-btn').forEach(b => {
        b.onclick = () => {
          state.voices = { ...(state.voices || {}), [b.dataset.l]: b.dataset.uri };
          Speech.prefs = state.voices;
          save();
          render();
          Speech.say(samples[b.dataset.l], langs[b.dataset.l]);
        };
      });
    };
    Speech.onChange = render;
    render();
    $('#done').onclick = () => { Speech.onChange = null; screenPark(); };
  }

  // ---------- Stations (lessons) ----------
  function stationScene(c, stage, total, fresh) {
    return `<div class="scene station" id="scene" style="--cc:${c.color}">
      <div class="st-booth"><div class="st-roof">${Array.from({ length: 8 }, (_, i) => `<i class="${i % 2 ? 'w' : ''}"></i>`).join('')}</div><div class="st-icon">${c.icon}</div><div class="st-host">${c.tIcon}</div></div>
      <div class="st-items">${Array.from({ length: total }, (_, i) => `<span class="${i < stage ? 'on' : ''} ${fresh && i === stage - 1 ? 'new' : ''}">${i < stage ? c.item : '·'}</span>`).join('')}</div>
    </div>`;
  }

  function startLesson(cid) {
    nextTask({ cid, c: CLASSES[cid], n: 0, total: 8, pts: 0, money: 0, streak: 0, stage: 0 });
  }
  function nextTask(L) {
    if (L.n >= L.total) { lessonEnd(L); return; }
    L.t = L.cid === 'billet' && Math.random() < 0.3 ? ticketTask(cur.year) : Tasks.make(L.cid, cur);
    L.tries = 0;
    L.locked = false;
    renderTask(L);
  }
  // Everyday money tasks at the ticket booth
  function ticketTask(y) {
    const r = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
    const opts = ans => Tasks.shuffle([...new Set([ans, ans + 1, Math.max(0, ans - 1), ans + 2, ans + (y > 2 ? 10 : 3)])].slice(0, 4)).map(v => ({ label: `${v} kr`, value: v, say: `${v} kroner` }));
    const coins = n => `<div class="items">${'🪙'.repeat(n)}</div>`;
    if (y === 1) {
      const n = r(2, 5);
      return { kind: 'choice', topic: 'add', prompt: `En billet koster 1 kr. ${n} børn skal ind. Hvor mange kr koster det?`, visual: `<div class="items">${'🧒'.repeat(n)}</div>`, options: opts(n), answer: n, explain: `${n} børn à 1 kr er ${n} kr.` };
    }
    if (y === 2) {
      const pr = r(2, 8), pay = 10;
      return { kind: 'choice', topic: 'sub', prompt: `En billet koster ${pr} kr. Du betaler med ${pay} kr. Hvor mange kr får du tilbage?`, visual: coins(pay), big: `${pay} − ${pr} = ?`, options: opts(pay - pr), answer: pay - pr, explain: `${pay} − ${pr} = ${pay - pr}` };
    }
    if (y === 3) {
      const a = r(2, 4), b = r(2, 5), pa = r(5, 9) * 5, pb = r(2, 6) * 5;
      return { kind: 'choice', topic: 'word', prompt: `${a} voksne à ${pa} kr og ${b} børn à ${pb} kr. Hvad koster det i alt?`, big: `${a} × ${pa} + ${b} × ${pb}`, options: opts(a * pa + b * pb), answer: a * pa + b * pb, explain: `${a * pa} + ${b * pb} = ${a * pa + b * pb}` };
    }
    const a = r(2, 4), b = r(2, 4), pa = r(15, 30) * 5, pb = r(10, 20) * 5, tot = a * pa + b * pb, pay = Math.ceil(tot / 500) * 500;
    return { kind: 'choice', topic: 'word', prompt: `Familien køber ${a} voksenbilletter à ${pa} kr og ${b} børnebilletter à ${pb} kr. De betaler med ${pay} kr. Hvor meget får de tilbage?`, options: opts(pay - tot), answer: pay - tot, explain: `${a * pa} + ${b * pb} = ${tot}. ${pay} − ${tot} = ${pay - tot}` };
  }
  function speakTask(t, auto) {
    const da = auto ? (t.auto ?? t.say ?? t.prompt) : (t.say ?? t.prompt);
    if (t.sayEn) {
      if (auto && t.mustSpeak && !state.tts) { Speech.say(t.sayEn, 'en-GB'); return; }
      Speech.sayThen(da, 'da-DK', t.sayEn, 'en-GB');
    } else {
      Speech.say(da, 'da-DK');
    }
  }

  function renderTask(L) {
    const t = L.t, c = L.c;
    let body = '';
    if (t.sayEn) body += `<button class="btn gold hear-btn" id="hearEn">🔊 ${t.sayEn.includes(' ') ? 'Hør det igen' : 'Hør ordet igen'}</button>`;
    if (t.big) body += `<div class="big ${t.bigClass || ''}">${esc(t.big)}</div>`;
    if (t.visual) body += `<div class="visual">${t.visual}</div>`;
    if (t.kind === 'choice') {
      body += `<div class="options ${t.optClass || ''}">${t.options.map((o, k) => `<div class="opt-wrap"><button class="opt" data-k="${k}">${o.label}</button><button class="opt-say" data-k="${k}" aria-label="Hør">🔊</button></div>`).join('')}</div>`;
    } else if (t.kind === 'build') {
      body += `<div class="build-target ${t.joiner === ' ' ? 'words' : ''}">${t.order.map((_, k) => `<span class="slot" data-s="${k}"></span>`).join('')}</div>
        <div class="pieces">${t.pieces.map((p, k) => `<button class="piece" data-k="${k}">${esc(p)}</button>`).join('')}</div>`;
    } else if (t.kind === 'say') {
      body += `<div class="say-box"><button class="btn gold big" id="mic">🎤 Sig det</button><button class="btn" id="said">✓ Jeg sagde det</button><div id="heard" class="heard"></div></div>`;
    }
    show(`
      <header class="lesson-top" style="--cc:${c.color}">
        <button class="btn small" id="leave">⬅ Parken</button>
        <div class="lt-name">${c.icon} ${c.name}</div>
        <div class="lt-pts">💰 <span id="pts">${L.money}</span> kr</div>
      </header>
      <div class="progress">${Array.from({ length: L.total }, (_, k) => `<span class="${k < L.n ? 'done' : k === L.n ? 'now' : ''}"></span>`).join('')}</div>
      <div class="lesson-body">
        <div class="scene-col">${stationScene(c, L.stage, L.total)}</div>
        <div class="task-col">
          <div class="teacher">
            <div class="t-icon">${c.tIcon}</div>
            <div class="bubble"><span id="prompt">${esc(t.prompt)}</span> <button class="speak" id="replay">🔊</button></div>
          </div>
          <main class="task">${body}</main>
        </div>
      </div>
      <div id="fx" class="fx"></div>`, 'lesson');

    $('#leave').onclick = () => screenPark();
    $('#replay').onclick = () => speakTask(t, false);
    if (t.sayEn) $('#hearEn').onclick = () => Speech.say(t.sayEn, 'en-GB');
    if (state.tts || t.mustSpeak) speakTask(t, true);
    $$('.opt-say').forEach(b => {
      b.onclick = () => {
        const o = t.options[+b.dataset.k];
        Speech.say(o.say ?? String(o.label).replace(/<[^>]*>/g, '').trim(), o.lang || 'da-DK');
      };
    });

    if (t.kind === 'choice') {
      $$('.opt').forEach(b => {
        b.onclick = () => {
          if (L.locked || b.disabled) return;
          const o = t.options[+b.dataset.k];
          if (o.value === t.answer) {
            b.classList.add('right');
            correct(L);
          } else {
            b.classList.add('wrong');
            b.disabled = true;
            wrong(L, () => $$('.opt').forEach(x => { if (t.options[+x.dataset.k].value === t.answer) x.classList.add('right'); }));
          }
        };
      });
    } else if (t.kind === 'build') {
      let pos = 0;
      $$('.piece').forEach(b => {
        b.onclick = () => {
          if (L.locked || b.disabled) return;
          const txt = t.pieces[+b.dataset.k];
          if (txt === t.order[pos]) {
            const slot = $(`.slot[data-s="${pos}"]`);
            slot.textContent = txt;
            slot.classList.add('filled');
            b.disabled = true;
            b.classList.add('used');
            pos++;
            Sfx.click();
            if (pos === t.order.length) correct(L);
          } else {
            b.classList.add('shake');
            later(() => b.classList.remove('shake'), 450);
            Sfx.bad();
            L.tries = 1;
            L.streak = 0;
          }
        };
      });
    } else if (t.kind === 'say') {
      const mic = $('#mic'), heard = $('#heard');
      mic.onclick = () => {
        if (L.locked) return;
        if (!Listen.supported()) { heard.textContent = 'Mikrofonen virker ikke her. Tryk på "Jeg sagde det".'; return; }
        Speech.stop();
        mic.classList.add('listening');
        mic.textContent = '👂 Jeg lytter...';
        const resetMic = () => { mic.classList.remove('listening'); mic.textContent = '🎤 Sig det'; };
        Listen.start(t.lang, alts => {
          resetMic();
          if (Listen.matches(alts, t.target)) {
            heard.textContent = `Jeg hørte: "${alts[0]}"`;
            correct(L);
          } else {
            heard.textContent = `Jeg hørte: "${alts[0]}". Prøv igen!`;
            Sfx.bad();
          }
        }, () => {
          resetMic();
          heard.textContent = 'Jeg hørte ikke noget. Prøv igen, eller tryk "Jeg sagde det".';
        });
      };
      $('#said').onclick = () => correct(L);
    }
  }

  function fxPop(text, cls = '') {
    const fx = $('#fx');
    if (!fx) return;
    let sparks = '';
    for (let k = 0; k < 14; k++) {
      const a = (k / 14) * Math.PI * 2, d = 80 + Math.random() * 80;
      sparks += `<i style="--dx:${(Math.cos(a) * d).toFixed(0)}px;--dy:${(Math.sin(a) * d).toFixed(0)}px"></i>`;
    }
    fx.innerHTML = `<div class="pop ${cls}">${esc(text)}</div>${cls ? '' : `<div class="sparks">${sparks}</div>`}`;
  }

  function correct(L) {
    if (L.locked) return;
    L.locked = true;
    const t = L.t, first = L.tries === 0;
    let pts = first ? 10 : 5;
    if (first) { L.streak++; if (L.streak % 3 === 0) pts += 5; } else L.streak = 0;
    const money = first ? PAY.first : PAY.second;
    Tasks.adapt(cur, t.topic, first);
    cur.points += pts;
    cur.day.pts += pts;
    cur.money += money;
    save();
    L.pts += pts;
    L.money += money;
    $('#pts').textContent = L.money;
    Sfx.good();
    later(() => Sfx.tone(1568, 0.15, 'triangle', 0.08), 200);
    fxPop(`+${money} kr${L.streak && L.streak % 3 === 0 ? ' 🔥' : ''}`);
    L.stage = Math.min(L.total, L.stage + 1);
    const sc = $('#scene');
    if (sc) sc.outerHTML = stationScene(L.c, L.stage, L.total, true);
    const praise = pick(['Godt!', 'Flot!', 'Super!', 'Rigtigt!', 'Fantastisk!', 'Sådan!']);
    if (t.after) Speech.say(t.after, t.afterLang || 'da-DK');
    else if (state.tts) Speech.say(praise);
    later(() => { L.n++; nextTask(L); }, t.after && t.after.length > 20 ? 2600 : 1400);
  }

  function wrong(L, revealAnswer) {
    L.tries++;
    L.streak = 0;
    Sfx.bad();
    if (L.tries >= 2) {
      L.locked = true;
      Tasks.adapt(cur, L.t.topic, false);
      revealAnswer();
      const ex = L.t.explain || 'Her er det rigtige svar.';
      $('#prompt').textContent = ex;
      fxPop('Næste gang!', 'soft');
      say(ex);
      later(() => { L.n++; nextTask(L); }, 3000);
    } else {
      fxPop('Prøv igen!', 'soft');
      say('Prøv igen!');
    }
  }

  function lessonEnd(L) {
    const p = cur;
    p.lessons++;
    p.money += PAY.lesson;
    p.tickets++;
    L.money += PAY.lesson;
    save();
    const afford = [...RIDES, ...DECOS].filter(r => !p.built.includes(r.id) && r.cost <= p.money && (areaOf(r) === 'sommer' || vikingOpen(p))).sort((a, b) => b.cost - a.cost)[0];
    const next = nextGoal(p);
    const iceTime = Date.now() - playStart >= ICE_AFTER_MS;
    show(`
      <div class="card lesson-end">
        ${stationScene(L.c, L.total, L.total)}
        <h2>Flot arbejde i ${L.c.name}!</h2>
        <p class="end-pts">Du tjente <b>${kr(L.money)}</b> og fik <b>1 🎟️ turbillet</b>.</p>
        <p>Nu har du <b>${kr(p.money)}</b> og ${p.tickets} 🎟️.</p>
        ${afford ? `<p class="end-unlock">🏗️ Du har råd til ${esc(afford.name)}!</p>` : next ? `<p>Du mangler ${kr(next.cost - p.money)} til ${esc(next.name)}.</p>` : ''}
        ${iceTime ? '<p class="end-unlock">🍦 Pingvinen Pia siger: Tid til is-pause!</p>' : ''}
        <div class="end-actions">
          ${iceTime ? '<button class="btn gold big" id="ice">🍦 Is-pause</button>' : ''}
          <button class="btn ${iceTime ? '' : 'gold'} big" id="park">🎡 Til parken</button>
          <button class="btn big" id="again">Én gang til</button>
        </div>
      </div>`, 'lesson-done');
    Sfx.fanfare();
    say(`Godt arbejde! Du tjente ${L.money} kroner og fik en turbillet.${afford ? ` Du har råd til ${afford.name}!` : ''}${iceTime ? ' Og nu er det tid til is-pause!' : ''}`);
    if (iceTime) $('#ice').onclick = screenIce;
    $('#park').onclick = () => screenPark();
    $('#again').onclick = () => startLesson(L.cid);
    checkBadges(p);
  }

  // ---------- start ----------
  Speech.init();
  Speech.prefs = state.voices || {};
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
  window.App = { cur: () => cur, save, screenPark, state: () => state };
  screenProfiles();
})();
