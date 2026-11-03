// Park map and ride drawings (SVG)
const ParkArt = (() => {
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const W = 1000, H = 720;
  const LOOP = 'M280 195 H760 Q775 195 775 210 V465 Q775 480 760 480 H280 Q265 480 265 465 V210 Q265 195 280 195 Z';
  const GUEST_C = ['#ff5a5f', '#3a86ff', '#ffd23f', '#0ead69', '#ff70a6', '#8338ec', '#ff9f1c', '#00b4d8', '#e63946', '#2a9d8f'];
  const f1 = n => n.toFixed(1);

  const avatar = (av, cls = '') => `<span class="ava ${cls}" style="background:${av.color}">${av.animal}</span>`;

  // ---------- coasters: closed loop with hills drawn in 3/4 view ----------
  function coaster(id, w, h, c) {
    const n = c.hills.length, max = Math.max(...c.hills);
    const cx = w / 2, cy = h * 0.72, rx = w * 0.44, ry = h * 0.2;
    const pts = [];
    for (let k = 0; k <= 160; k++) {
      const t = k / 160, a = t * Math.PI * 2;
      const i = Math.min(n - 1, Math.floor(t * n)), u = t * n - i;
      const bump = (c.hills[i] / max) * h * 0.52 * Math.sin(Math.PI * u) ** 2;
      const gx = cx + rx * Math.cos(a), gy = cy + ry * Math.sin(a);
      pts.push([gx, gy, gy - bump - 6]);
    }
    const d = pts.map((p, k) => `${k ? 'L' : 'M'}${f1(p[0])} ${f1(p[2])}`).join('') + 'Z';
    const wood = c.theme === 'trae' || c.theme === 'viking';
    let sup = '';
    pts.forEach((p, k) => {
      if (k % (wood ? 2 : 4)) return;
      sup += `<line x1="${f1(p[0])}" y1="${f1(p[1])}" x2="${f1(p[0])}" y2="${f1(p[2])}"/>`;
      if (wood && k % 4 === 0 && pts[k + 2]) sup += `<line x1="${f1(p[0])}" y1="${f1(p[1])}" x2="${f1(pts[k + 2][0])}" y2="${f1(pts[k + 2][2])}"/>`;
    });
    const hang = c.hang;
    const car = (dx, col) => `<g transform="translate(${dx} ${hang ? 8 : -5})"><rect x="-7" y="-4" width="14" height="8" rx="3" fill="${col}" stroke="#000" stroke-width="1"/><rect x="-5" y="-3" width="10" height="2" rx="1" fill="rgba(255,255,255,.5)"/><circle cx="-3" cy="${hang ? 6 : -5}" r="2.3" fill="#ffd9b0"/><circle cx="3" cy="${hang ? 6 : -5}" r="2.3" fill="#ffd9b0"/></g>`;
    const heads = { orm: '🐛', drage: '🐉', midgard: '🐍', viking: '🛶' };
    const head = heads[c.theme] ? `<text x="16" y="1" font-size="14" text-anchor="middle">${heads[c.theme]}</text>` : '';
    const dur = (c.len / 600).toFixed(1);
    const top = pts.reduce((a, p) => (p[2] < a[2] ? p : a));
    let extra = '';
    for (let l = 0; l < (c.loops || 0); l++) {
      const p = pts[50 + l * 40];
      extra += `<circle cx="${f1(p[0])}" cy="${f1(p[2] - h * 0.13)}" r="${f1(h * 0.13)}" fill="none" stroke="#333" stroke-width="6"/><circle cx="${f1(p[0])}" cy="${f1(p[2] - h * 0.13)}" r="${f1(h * 0.13)}" fill="none" stroke="${c.track}" stroke-width="3.5"/>`;
    }
    const emblem = { storm: '🌪️', ild: '🔥', lyn: '⚡', flagermus: '🦇', drage: '🐉', valkyrie: '🛡️', midgard: '🌊' }[c.theme];
    let tunnel = '';
    if (c.tunnels) {
      const p = pts[118];
      tunnel = `<path d="M${f1(p[0] - 30)} ${f1(p[1] + 4)} Q${f1(p[0] - 22)} ${f1(p[2] - 26)} ${f1(p[0])} ${f1(p[2] - 30)} Q${f1(p[0] + 26)} ${f1(p[2] - 26)} ${f1(p[0] + 32)} ${f1(p[1] + 4)}Z" fill="#7d6b5d" stroke="#5a4a3d" stroke-width="2"/>
        <path d="M${f1(p[0] - 12)} ${f1(p[1] + 2)} Q${f1(p[0] - 10)} ${f1(p[2] - 6)} ${f1(p[0])} ${f1(p[2] - 8)} Q${f1(p[0] + 10)} ${f1(p[2] - 6)} ${f1(p[0] + 12)} ${f1(p[1] + 2)}Z" fill="#2a2420"/>`;
    }
    return `
      <ellipse cx="${cx}" cy="${cy + 4}" rx="${rx + 14}" ry="${ry + 12}" fill="rgba(0,0,0,.14)"/>
      ${emblem ? `<text x="${cx}" y="${cy + 8}" font-size="${f1(h * 0.22)}" text-anchor="middle">${emblem}</text>` : ''}
      ${extra}
      <g stroke="${wood ? '#a87a4a' : '#b0b8c1'}" stroke-width="${wood ? 1.6 : 2}">${sup}</g>
      <path id="trk-${id}" d="${d}" fill="none" stroke="#2b2b2b" stroke-width="7" stroke-linejoin="round"/>
      <path d="${d}" fill="none" stroke="${c.track}" stroke-width="4" stroke-linejoin="round"/>
      <path d="${d}" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="1.2" stroke-linejoin="round"/>
      <circle cx="${f1(top[0])}" cy="${f1(top[2] - 3)}" r="3" fill="#ff3b3b"><animate attributeName="opacity" values="1;.2;1" dur="1s" repeatCount="indefinite"/></circle>
      <g>${head}${car(0, c.car)}${car(-16, c.car)}${car(-32, c.car)}
        <animateMotion dur="${dur}s" repeatCount="indefinite" rotate="auto"><mpath href="#trk-${id}"/></animateMotion></g>
      ${tunnel}`;
  }

  // simple carousel horse facing right, origin at its belly
  const horse = col => `<g><line x1="0" y1="-26" x2="0" y2="10" stroke="#d4af37" stroke-width="2"/>
    <ellipse cx="0" cy="0" rx="10" ry="5.5" fill="${col}" stroke="#7a5a3a" stroke-width="1"/>
    <path d="M7 -2 L13 -11 L17 -9 L12 1Z" fill="${col}" stroke="#7a5a3a" stroke-width="1"/>
    <path d="M9 -9 Q6 -13 5 -6" fill="#e63946"/>
    <path d="M-7 3 L-9 11 M-3 4 L-2 11 M4 4 L6 11 M7 2 L10 9" stroke="${col}" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M-10 -1 Q-16 2 -14 8" fill="none" stroke="#7a5a3a" stroke-width="2"/></g>`;

  // ---------- flat rides ----------
  const DRAW = {
    karrusel(w, h) {
      const cx = w / 2, by = h * 0.82;
      const stripes = Array.from({ length: 8 }, (_, i) => {
        const x1 = cx - 60 + i * 15, x2 = x1 + 15;
        return `<polygon points="${cx},${h * 0.08} ${x1},${h * 0.42} ${x2},${h * 0.42}" fill="${i % 2 ? '#fff' : '#e63946'}"/>`;
      }).join('');
      const cols = ['#fff', '#f4d58d', '#bde0fe', '#ffc8dd'];
      const horses = cols.map((col, i) => `<g><g>${horse(col)}<animateTransform attributeName="transform" type="translate" values="0 0;0 -5;0 0" dur="1.2s" begin="-${i * 0.3}s" repeatCount="indefinite"/></g>
        <animateMotion dur="5s" begin="-${i * 1.25}s" repeatCount="indefinite" path="M${cx - 48} ${by - 14} A48 12 0 1 0 ${cx + 48} ${by - 14} A48 12 0 1 0 ${cx - 48} ${by - 14}"/></g>`).join('');
      const bulbs = Array.from({ length: 9 }, (_, i) => `<circle cx="${cx - 60 + i * 15}" cy="${h * 0.42 + 9}" r="2.4" fill="#fff3b0"><animate attributeName="fill" values="#fff3b0;#ff5a5f;#fff3b0" dur="1.2s" begin="${(i * 0.13).toFixed(2)}s" repeatCount="indefinite"/></circle>`).join('');
      return `<ellipse cx="${cx}" cy="${by + 4}" rx="70" ry="20" fill="rgba(0,0,0,.15)"/>
        <ellipse cx="${cx}" cy="${by}" rx="64" ry="18" fill="#c9a227" stroke="#7a5a10" stroke-width="2"/>
        <ellipse cx="${cx}" cy="${by - 4}" rx="60" ry="15" fill="#ffe08a"/>
        <rect x="${cx - 4}" y="${h * 0.4}" width="8" height="${by - h * 0.4}" fill="#d4af37"/>
        ${horses}
        ${stripes}
        <rect x="${cx - 62}" y="${h * 0.4}" width="124" height="9" rx="3" fill="#ffd23f" stroke="#b8860b"/>
        ${bulbs}
        <line x1="${cx}" y1="${h * 0.08}" x2="${cx}" y2="0" stroke="#555" stroke-width="2"/>
        <path d="M${cx} 0 l14 4 l-14 4z" fill="#3a86ff"/>`;
    },
    radiobil(w, h) {
      const cars = ['#ff5a5f', '#3a86ff', '#ffd23f', '#0ead69'].map((col, i) => {
        const p = [`M30 30 L140 80 L40 90 L130 35 Z`, `M140 30 L30 85 L120 90 L50 35 Z`, `M60 60 L140 60 L90 30 L40 85 Z`, `M110 85 L35 50 L140 45 L70 90 Z`][i];
        return `<g><rect x="-12" y="-8" width="24" height="16" rx="7" fill="${col}" stroke="#222" stroke-width="1.5"/><rect x="-14" y="-3" width="28" height="6" rx="3" fill="#333"/><circle r="4" fill="#ffd9b0"/><line x1="0" y1="0" x2="0" y2="-18" stroke="#888"/><circle cy="-18" r="1.5" fill="#ffd23f"/>
          <animateMotion dur="${5 + i}s" repeatCount="indefinite" path="${p}"/></g>`;
      }).join('');
      return `<rect x="8" y="16" width="${w - 16}" height="${h - 20}" rx="14" fill="rgba(0,0,0,.15)"/>
        <rect x="8" y="12" width="${w - 16}" height="${h - 20}" rx="14" fill="#3d3d4d" stroke="#ffd23f" stroke-width="5"/>
        <rect x="16" y="20" width="${w - 32}" height="${h - 36}" rx="10" fill="#5c6370"/>
        <g stroke="rgba(255,255,255,.12)">${Array.from({ length: 8 }, (_, i) => `<line x1="${16 + i * 20}" y1="20" x2="${16 + i * 20}" y2="${h - 16}"/>`).join('')}</g>
        ${cars}
        <rect x="${w / 2 - 44}" y="0" width="88" height="16" rx="8" fill="#e63946"/>
        <text x="${w / 2}" y="12" font-size="11" font-weight="800" fill="#fff" text-anchor="middle">RADIOBILER</text>`;
    },
    svaner(w, h) {
      const swan = (i) => `<g><text font-size="30" text-anchor="middle" y="8">🦢</text>
        <animateMotion dur="14s" begin="-${(i * 4.6).toFixed(1)}s" repeatCount="indefinite" path="M60 110 Q120 60 190 100 Q220 150 150 160 Q70 165 60 110 Z"/></g>`;
      return `<path d="M20 104 Q30 34 130 44 Q240 44 235 124 Q230 194 120 189 Q15 184 20 104Z" fill="rgba(0,0,0,.12)"/>
        <path d="M20 100 Q30 30 130 40 Q240 40 235 120 Q230 190 120 185 Q15 180 20 100Z" fill="#48cae4" stroke="#90e0ef" stroke-width="6"/>
        <path d="M40 110 Q60 60 130 60 Q210 60 215 120" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="3" stroke-dasharray="10 12">
          <animate attributeName="stroke-dashoffset" from="0" to="44" dur="3s" repeatCount="indefinite"/></path>
        ${[[60, 70], [170, 150], [110, 120]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="2" fill="#fff"><animate attributeName="opacity" values="0;1;0" dur="2s" begin="${(i * 0.7).toFixed(1)}s" repeatCount="indefinite"/></circle>`).join('')}
        <text x="30" y="70" font-size="20">🪷</text><text x="190" y="175" font-size="18">🪷</text>
        <rect x="200" y="150" width="40" height="10" fill="#8b5a2b"/>
        ${[0, 1, 2].map(swan).join('')}`;
    },
    raev(w, h) {
      return `<path d="M10 ${h - 6} Q20 64 90 34 Q150 4 200 54 Q230 94 225 ${h - 6} Z" fill="rgba(0,0,0,.15)"/>
        <path d="M10 ${h - 10} Q20 60 90 30 Q150 0 200 50 Q230 90 225 ${h - 10} Z" fill="#8d6e63" stroke="#5d4037" stroke-width="3"/>
        <path d="M40 ${h - 10} Q60 80 110 70 Q160 70 190 ${h - 10}Z" fill="#a1887f"/>
        <text x="30" y="80" font-size="22">🌲</text><text x="185" y="70" font-size="20">🌲</text>
        <path d="M80 ${h - 10} V130 Q110 95 140 130 V${h - 10} Z" fill="#1b1b1b"/>
        <g fill="#ffd23f"><circle cx="100" cy="140" r="2.5"/><circle cx="114" cy="140" r="2.5"/><animate attributeName="opacity" values="1;0;1" dur="2.5s" repeatCount="indefinite"/></g>
        <g transform="translate(110 60)">
          <path d="M-26 -10 L-30 -36 L-12 -22 Z M26 -10 L30 -36 L12 -22 Z" fill="#f77f00" stroke="#7a3a00" stroke-width="2"/>
          <path d="M-28 -16 Q0 -30 28 -16 Q24 12 0 22 Q-24 12 -28 -16Z" fill="#f77f00" stroke="#7a3a00" stroke-width="2"/>
          <path d="M-14 6 Q0 20 14 6 Q0 26 -14 6Z" fill="#fff"/>
          <circle cx="-10" cy="-6" r="3.5" fill="#000"/><circle cx="10" cy="-6" r="3.5" fill="#000"/><circle cy="10" r="3" fill="#000"/>
        </g>
        <path d="M110 ${h - 12} H225" stroke="#555" stroke-width="4"/>
        <g><rect x="-10" y="-8" width="20" height="10" rx="3" fill="#d62828"/><rect x="-24" y="-8" width="12" height="10" rx="3" fill="#ffd23f"/>
          <animateMotion dur="6s" repeatCount="indefinite" keyTimes="0;.7;1" keyPoints="0;1;1" calcMode="linear" path="M230 ${h - 18} H110"/>
          <animate attributeName="opacity" values="1;1;0;0" keyTimes="0;.65;.7;1" dur="6s" repeatCount="indefinite"/></g>
        <rect x="58" y="${h - 22}" width="104" height="18" rx="9" fill="#f77f00"/>
        <text x="110" y="${h - 9}" font-size="12" font-weight="800" fill="#fff" text-anchor="middle">RÆVENS HULE</text>`;
    },
    pariser(w, h) {
      const cx = w / 2, cy = h * 0.42, r = Math.min(w, h) * 0.38;
      const spokes = Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return `<line x1="0" y1="0" x2="${f1(r * Math.cos(a))}" y2="${f1(r * Math.sin(a))}"/>`;
      }).join('');
      const gond = Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return `<circle cx="${f1(r * Math.cos(a))}" cy="${f1(r * Math.sin(a))}" r="7.5" fill="${GUEST_C[i % GUEST_C.length]}" stroke="#222"/>`;
      }).join('');
      const bulbs = Array.from({ length: 24 }, (_, i) => {
        const a = (i / 24) * Math.PI * 2;
        return `<circle cx="${f1(r * Math.cos(a))}" cy="${f1(r * Math.sin(a))}" r="1.8" fill="#fff8c4"/>`;
      }).join('');
      return `<ellipse cx="${cx}" cy="${h - 6}" rx="${f1(r * 0.9)}" ry="8" fill="rgba(0,0,0,.15)"/>
        <path d="M${f1(cx - r * 0.7)} ${h - 8} L${cx} ${cy} L${f1(cx + r * 0.7)} ${h - 8}" fill="none" stroke="#adb5bd" stroke-width="7"/>
        <g transform="translate(${cx} ${cy})">
          <g><circle r="${f1(r)}" fill="none" stroke="#e63946" stroke-width="4"/><circle r="${f1(r * 0.55)}" fill="none" stroke="#ffd23f" stroke-width="2"/>
            <g stroke="#ced4da" stroke-width="2">${spokes}</g>${bulbs}${gond}
            <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="24s" repeatCount="indefinite"/></g>
          <circle r="9" fill="#495057" stroke="#ffd23f" stroke-width="2"/></g>
        <rect x="${cx - 30}" y="${h - 12}" width="60" height="10" rx="3" fill="#6c757d"/>`;
    },
    vand(w, h) {
      const slide = (d, col, dl) => `<path d="${d}" fill="none" stroke="${col}" stroke-width="9" stroke-linecap="round"/>
        <path d="${d}" fill="none" stroke="rgba(255,255,255,.8)" stroke-width="3" stroke-dasharray="6 10"><animate attributeName="stroke-dashoffset" from="32" to="0" dur="${dl}s" repeatCount="indefinite"/></path>`;
      return `<rect x="10" y="${h * 0.5 + 4}" width="${w - 20}" height="${h * 0.45}" rx="20" fill="rgba(0,0,0,.15)"/>
        <rect x="10" y="${h * 0.5}" width="${w - 20}" height="${h * 0.45}" rx="20" fill="#e9f7fb" stroke="#fff" stroke-width="5"/>
        <rect x="20" y="${h * 0.56}" width="${w - 40}" height="${h * 0.33}" rx="14" fill="#00b4d8"/>
        <path d="M24 ${h * 0.66} q20 -6 40 0 t40 0 t40 0 t40 0" fill="none" stroke="rgba(255,255,255,.5)" stroke-width="2"><animateTransform attributeName="transform" type="translate" values="0 0;-20 0;0 0" dur="3s" repeatCount="indefinite"/></path>
        <rect x="20" y="10" width="34" height="${h * 0.5}" fill="#ff9f1c" stroke="#c46a00" stroke-width="2"/>
        <rect x="16" y="6" width="42" height="8" rx="3" fill="#e63946"/>
        ${slide(`M54 22 C120 20 150 60 100 80 S60 120 120 ${h * 0.66}`, '#ff5a5f', 0.8)}
        ${slide(`M54 50 C170 50 180 90 150 ${h * 0.64}`, '#ffd23f', 0.9)}
        <circle cx="120" cy="${h * 0.7}" r="6" fill="#fff" opacity=".8"><animate attributeName="r" values="4;14;4" dur="1.2s" repeatCount="indefinite"/><animate attributeName="opacity" values=".9;0;.9" dur="1.2s" repeatCount="indefinite"/></circle>
        <text x="${w - 30}" y="${h * 0.48}" font-size="34">🌴</text><text x="${w - 50}" y="${h - 6}" font-size="20">⛱️</text>`;
    },
    faldtaarn(w, h, hammer) {
      const cx = w / 2;
      return `<ellipse cx="${cx}" cy="${h - 6}" rx="34" ry="7" fill="rgba(0,0,0,.18)"/>
        <rect x="${cx - 9}" y="20" width="18" height="${h - 30}" fill="${hammer ? '#8d99ae' : '#adb5bd'}" stroke="#6c757d" stroke-width="2"/>
        <g fill="#ffd23f">${Array.from({ length: 8 }, (_, i) => `<circle cx="${cx}" cy="${36 + i * 20}" r="2.5"><animate attributeName="opacity" values="1;.2;1" dur="1s" begin="${(i * 0.12).toFixed(2)}s" repeatCount="indefinite"/></circle>`).join('')}</g>
        ${hammer ? `<g><rect x="${cx - 26}" y="-6" width="52" height="22" rx="4" fill="#78909c" stroke="#37474f" stroke-width="2"/><rect x="${cx - 4}" y="14" width="8" height="10" fill="#6d4c41"/>
          <path d="M${cx - 10} 2 l6 -6 l-2 6 l6 0 l-8 8 l2 -6z" fill="#ffd60a"><animate attributeName="opacity" values="1;0;1;1" dur="1.5s" repeatCount="indefinite"/></path></g>`
        : `<path d="M${cx - 18} 22 L${cx} 2 L${cx + 18} 22Z" fill="#e63946"/>`}
        <g><rect x="${cx - 26}" y="0" width="52" height="16" rx="5" fill="${hammer ? '#c62828' : '#3a86ff'}" stroke="#222" stroke-width="2"/>
          ${[-16, -5, 6, 17].map(x => `<circle cx="${cx + x}" cy="18" r="3" fill="#ffd9b0"/>`).join('')}
          <animateTransform attributeName="transform" type="translate" values="0 ${h - 50};0 30;0 30;0 ${h - 50};0 ${h - 50}" keyTimes="0;.45;.6;.68;1" dur="6s" repeatCount="indefinite"/></g>
        <rect x="${cx - 30}" y="${h - 12}" width="60" height="10" rx="3" fill="#6c757d"/>`;
    },
    thor(w, h) { return DRAW.faldtaarn(w, h, true); },
    gokart(w, h) {
      const track = `M60 30 H${w - 60} A50 50 0 0 1 ${w - 60} ${h - 30} H60 A50 50 0 0 1 60 30Z`;
      const karts = ['#e63946', '#3a86ff', '#ffd23f', '#0ead69'].map((col, i) => `<g><rect x="-10" y="-6" width="20" height="12" rx="4" fill="${col}" stroke="#222"/><circle r="3.5" fill="#ffd9b0"/>
        <animateMotion dur="${4 + i * 0.5}s" begin="-${i}s" repeatCount="indefinite" rotate="auto" path="${track}"/></g>`).join('');
      return `<path d="${track}" fill="rgba(0,0,0,.15)" transform="translate(0 4)"/>
        <path d="${track}" fill="#5fb84a" stroke="#555" stroke-width="30"/>
        <path d="${track}" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="12 10"/>
        <rect x="${w / 2 - 4}" y="15" width="8" height="30" fill="#fff"/><rect x="${w / 2 - 4}" y="15" width="4" height="5" fill="#000"/><rect x="${w / 2}" y="20" width="4" height="5" fill="#000"/><rect x="${w / 2 - 4}" y="25" width="4" height="5" fill="#000"/><rect x="${w / 2}" y="30" width="4" height="5" fill="#000"/><rect x="${w / 2 - 4}" y="35" width="4" height="5" fill="#000"/><rect x="${w / 2}" y="40" width="4" height="5" fill="#000"/>
        ${[[w / 2 - 40, h / 2], [w / 2 + 40, h / 2]].map(([x, y]) => `<g>${[0, 1, 2].map(k => `<ellipse cx="${x}" cy="${y - k * 6}" rx="9" ry="4" fill="#222" stroke="#555"/>`).join('')}</g>`).join('')}
        <text x="${w / 2}" y="${h / 2 + 6}" font-size="20" text-anchor="middle">🏁</text>
        ${karts}`;
    },
    skib(w, h) {
      const px = w / 2, py = 16;
      const shields = Array.from({ length: 6 }, (_, i) => `<circle cx="${-50 + i * 20}" cy="${f1(h * 0.62 - py + 2)}" r="7" fill="${['#e63946', '#ffd23f', '#3a86ff'][i % 3]}" stroke="#4e342e" stroke-width="1.5"/>`).join('');
      return `<ellipse cx="${px}" cy="${h - 6}" rx="100" ry="10" fill="rgba(0,0,0,.15)"/>
        <path d="M${px - 70} ${h - 6} L${px} ${py} L${px + 70} ${h - 6}" fill="none" stroke="#5d4037" stroke-width="7"/>
        <g transform="translate(${px} ${py})"><g>
          <line x1="0" y1="0" x2="0" y2="${h * 0.5}" stroke="#8d6e63" stroke-width="4"/>
          <path d="M-80 ${h * 0.55 - py} Q0 ${h * 0.8 - py} 80 ${h * 0.55 - py} L70 ${h * 0.5 - py} L-70 ${h * 0.5 - py}Z" fill="#8d5524" stroke="#4e342e" stroke-width="2"/>
          <path d="M70 ${h * 0.52 - py} Q96 ${h * 0.4 - py} 90 ${h * 0.3 - py} Q100 ${h * 0.27 - py} 98 ${h * 0.34 - py}" fill="none" stroke="#8d5524" stroke-width="6" stroke-linecap="round"/>
          <path d="M-70 ${h * 0.52 - py} Q-90 ${h * 0.42 - py} -86 ${h * 0.34 - py}" fill="none" stroke="#8d5524" stroke-width="6" stroke-linecap="round"/>
          ${shields}
          <rect x="-24" y="${h * 0.18}" width="48" height="${h * 0.26}" fill="#e63946" stroke="#fff" stroke-width="2"/><line x1="-24" y1="${h * 0.31}" x2="24" y2="${h * 0.31}" stroke="#fff" stroke-width="3"/>
          <animateTransform attributeName="transform" type="rotate" values="-32;32;-32" dur="3.4s" calcMode="spline" keyTimes="0;.5;1" keySplines=".45 0 .55 1;.45 0 .55 1" repeatCount="indefinite"/></g></g>`;
    },
    tekopper(w, h) {
      const cx = w / 2, cy = h * 0.6;
      const cup = (col, i) => `<g transform="rotate(${i * 90}) translate(34 0)"><g>
          <ellipse rx="15" ry="11" fill="${col}" stroke="#4a3a2a" stroke-width="2"/><ellipse rx="10" ry="6" fill="#6d4c41"/>
          <path d="M13 -4 q8 4 0 8" fill="none" stroke="${col}" stroke-width="4"/><circle cx="-3" cy="-1" r="3" fill="#ffd9b0"/><circle cx="4" cy="1" r="3" fill="#ffd9b0"/>
          <animateTransform attributeName="transform" type="rotate" from="0" to="-720" dur="4s" repeatCount="indefinite"/></g></g>`;
      return `<ellipse cx="${cx}" cy="${cy + 6}" rx="64" ry="34" fill="rgba(0,0,0,.15)"/>
        <ellipse cx="${cx}" cy="${cy}" rx="62" ry="32" fill="#ffd6a5" stroke="#c9a227" stroke-width="3"/>
        <g transform="translate(${cx} ${cy}) scale(1 .55)"><g>${['#ff70a6', '#3a86ff', '#0ead69', '#ffd23f'].map(cup).join('')}
          <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="6s" repeatCount="indefinite"/></g></g>
        <path d="M${cx - 50} ${h * 0.24} Q${cx} ${h * 0.02} ${cx + 50} ${h * 0.24}Z" fill="#8338ec" stroke="#fff" stroke-width="2"/>
        <line x1="${cx}" y1="${h * 0.24}" x2="${cx}" y2="${cy}" stroke="#c9a227" stroke-width="4"/>`;
    },
    spoegelse(w, h) {
      const ghost = (x, y, d) => `<g><text x="${x}" y="${y}" font-size="20" text-anchor="middle">👻</text><animateTransform attributeName="transform" type="translate" values="0 0;0 -10;0 0" dur="${d}s" repeatCount="indefinite"/></g>`;
      return `<rect x="16" y="${h - 14}" width="${w - 32}" height="10" rx="5" fill="rgba(0,0,0,.18)"/>
        <rect x="30" y="40" width="${w - 60}" height="${h - 50}" fill="#6c5b7b" stroke="#3d3047" stroke-width="3"/>
        <rect x="14" y="20" width="34" height="${h - 30}" fill="#594a69" stroke="#3d3047" stroke-width="3"/><path d="M10 22 L31 -2 L52 22Z" fill="#3d3047"/>
        <rect x="${w - 48}" y="20" width="34" height="${h - 30}" fill="#594a69" stroke="#3d3047" stroke-width="3"/><path d="M${w - 52} 22 L${w - 31} -2 L${w - 10} 22Z" fill="#3d3047"/>
        ${Array.from({ length: 6 }, (_, i) => `<rect x="${40 + i * 16}" y="32" width="9" height="9" fill="#6c5b7b" stroke="#3d3047" stroke-width="2"/>`).join('')}
        <path d="M${w / 2 - 14} ${h - 10} V${h - 40} Q${w / 2} ${h - 56} ${w / 2 + 14} ${h - 40} V${h - 10}Z" fill="#1a1423"/>
        ${[[60, 62], [w - 66, 62], [31, 50], [w - 31, 50]].map(([x, y], i) => `<rect x="${x - 5}" y="${y}" width="10" height="13" rx="5" fill="#ffd166"><animate attributeName="fill" values="#ffd166;#7a5c00;#ffd166" dur="${2 + i * 0.4}s" repeatCount="indefinite"/></rect>`).join('')}
        ${ghost(w / 2 - 40, 30, 2.2)}${ghost(w / 2 + 40, 26, 2.8)}`;
    },
    rafting(w, h) {
      const river = 'M10 30 C80 20 60 90 130 90 S220 140 200 190';
      return `<path d="${river}" fill="none" stroke="rgba(0,0,0,.15)" stroke-width="50" stroke-linecap="round" transform="translate(0 4)"/>
        <path d="${river}" fill="none" stroke="#2a9df4" stroke-width="44" stroke-linecap="round"/>
        <path d="${river}" fill="none" stroke="#fff" stroke-width="5" stroke-dasharray="4 18" opacity=".8"><animate attributeName="stroke-dashoffset" from="44" to="0" dur="1s" repeatCount="indefinite"/></path>
        <text x="40" y="70" font-size="18">🪨</text><text x="150" y="80" font-size="16">🪨</text><text x="190" y="150" font-size="18">🌲</text><text x="20" y="150" font-size="22">🌲</text>
        ${[0, 1, 2].map(i => `<g><circle r="10" fill="#ff9f1c" stroke="#7a3a00" stroke-width="2"/><circle r="5" fill="#ffe8cc"/><circle cx="-3" cy="-2" r="2.4" fill="#ffd9b0"/><circle cx="3" cy="2" r="2.4" fill="#ffd9b0"/>
          <animateMotion dur="7s" begin="-${(i * 2.3).toFixed(1)}s" repeatCount="indefinite" path="${river}"/></g>`).join('')}`;
    },
    trolde(w, h) {
      const trees = [[20, 70], [60, 50], [110, 40], [160, 55], [200, 75], [30, 130], [80, 110], [150, 120], [205, 140], [50, 185], [120, 175], [185, 190]]
        .map(([x, y]) => `<text x="${x}" y="${y}" font-size="34" text-anchor="middle">🌲</text>`).join('');
      const eyes = [[95, 95], [165, 160], [40, 160]].map(([x, y], i) => `<g fill="#ffeb3b"><circle cx="${x}" cy="${y}" r="3"/><circle cx="${x + 9}" cy="${y}" r="3"/><animate attributeName="opacity" values="0;1;1;0;0" keyTimes="0;.1;.5;.6;1" dur="${3 + i}s" repeatCount="indefinite"/></g>`).join('');
      return `<ellipse cx="${w / 2}" cy="${h / 2 + 10}" rx="${w / 2 - 6}" ry="${h / 2 - 12}" fill="#1b4332"/>
        ${eyes}${trees}
        <g><text font-size="26" text-anchor="middle">🧌</text><animateMotion dur="8s" repeatCount="indefinite" path="M60 150 Q120 120 170 150 Q120 170 60 150Z"/></g>
        <rect x="58" y="${h - 22}" width="114" height="18" rx="9" fill="#2d6a4f"/>
        <text x="115" y="${h - 9}" font-size="12" font-weight="800" fill="#fff" text-anchor="middle">TROLDESKOVEN</text>`;
    },
    ravne(w, h) {
      const cx = w / 2, top = 40, ry = 26, rx = 72, cy = h * 0.5;
      const orbit = `M${cx - rx} ${cy} A${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A${rx} ${ry} 0 1 0 ${cx - rx} ${cy}`;
      return `<ellipse cx="${cx}" cy="${h - 8}" rx="60" ry="10" fill="rgba(0,0,0,.15)"/>
        <rect x="${cx - 6}" y="${top}" width="12" height="${h - top - 10}" fill="#5d4037"/>
        <ellipse cx="${cx}" cy="${top}" rx="60" ry="14" fill="#212121" stroke="#ffd23f" stroke-width="3"/>
        <path d="M${cx - 60} ${top} Q${cx} ${top - 40} ${cx + 60} ${top}" fill="#37474f"/>
        <text x="${cx}" y="${top - 12}" font-size="18" text-anchor="middle">🐦</text>
        ${Array.from({ length: 6 }, (_, i) => `<g><rect x="-6" y="-4" width="12" height="9" rx="3" fill="${GUEST_C[i]}" stroke="#222"/><circle cy="-6" r="3" fill="#ffd9b0"/>
          <animateMotion dur="4s" begin="-${((i * 4) / 6).toFixed(2)}s" repeatCount="indefinite" path="${orbit}"/></g>`).join('')}
        <rect x="${cx - 40}" y="${h - 14}" width="80" height="10" rx="3" fill="#6c757d"/>`;
    },
    bolge(w, h) {
      const wave = (y, d, o) => `<path d="M0 ${y} q20 -10 40 0 t40 0 t40 0 t40 0 t40 0 t40 0" fill="none" stroke="rgba(255,255,255,${o})" stroke-width="4"><animateTransform attributeName="transform" type="translate" values="-40 0;0 0" dur="${d}s" repeatCount="indefinite"/></path>`;
      return `<rect x="10" y="${h * 0.2 + 4}" width="${w - 20}" height="${h * 0.75}" rx="26" fill="rgba(0,0,0,.15)"/>
        <rect x="10" y="${h * 0.2}" width="${w - 20}" height="${h * 0.75}" rx="26" fill="#f4e1b5" stroke="#fff" stroke-width="5"/>
        <svg x="18" y="${h * 0.24}" width="${w - 36}" height="${h * 0.5}"><rect width="100%" height="100%" rx="18" fill="#0096c7"/>
          ${wave(14, 2, 0.7)}${wave(36, 2.6, 0.5)}${wave(58, 3.2, 0.4)}${wave(80, 2.2, 0.35)}</svg>
        <text x="30" y="${h * 0.92}" font-size="22">⛱️</text><text x="${w - 50}" y="${h * 0.92}" font-size="22">🏖️</text>
        <text x="${w / 2}" y="${h * 0.16}" font-size="22" text-anchor="middle">🌊</text>`;
    },
  };

  const DECO = {
    traeer: (w, h) => `<text x="${w / 2}" y="60" font-size="48" text-anchor="middle">🌳</text><text x="${w / 2 - 12}" y="120" font-size="42" text-anchor="middle">🌲</text><text x="${w / 2 + 10}" y="175" font-size="48" text-anchor="middle">🌳</text>`,
    ballon: (w, h) => `<g><text x="${w / 2 - 8}" y="34" font-size="28" text-anchor="middle">🎈</text><text x="${w / 2 + 10}" y="28" font-size="24" text-anchor="middle">🎈</text><animateTransform attributeName="transform" type="translate" values="0 0;0 -4;0 0" dur="2s" repeatCount="indefinite"/></g><text x="${w / 2}" y="${h}" font-size="22" text-anchor="middle">🤡</text>`,
    isbod: (w, h) => `<rect x="8" y="34" width="${w - 16}" height="${h - 40}" rx="6" fill="#fff" stroke="#3a86ff" stroke-width="3"/>
      ${Array.from({ length: 6 }, (_, i) => `<rect x="${4 + i * 12}" y="22" width="12" height="16" fill="${i % 2 ? '#fff' : '#ff70a6'}"/>`).join('')}
      <text x="${w / 2}" y="${h - 10}" font-size="30" text-anchor="middle">🍦</text>`,
    poelse: (w, h) => `<rect x="8" y="30" width="${w - 16}" height="${h - 44}" rx="8" fill="#e63946" stroke="#8a1414" stroke-width="3"/>
      <circle cx="22" cy="${h - 10}" r="8" fill="#333"/><circle cx="${w - 22}" cy="${h - 10}" r="8" fill="#333"/>
      ${Array.from({ length: 6 }, (_, i) => `<rect x="${4 + i * 12}" y="18" width="12" height="14" fill="${i % 2 ? '#fff' : '#ffd23f'}"/>`).join('')}
      <text x="${w / 2}" y="${h - 22}" font-size="28" text-anchor="middle">🌭</text>`,
    springvand: (w, h) => `<ellipse cx="${w / 2}" cy="${h - 20}" rx="${w / 2 - 4}" ry="16" fill="#90e0ef" stroke="#adb5bd" stroke-width="5"/>
      <rect x="${w / 2 - 4}" y="${h - 50}" width="8" height="30" fill="#adb5bd"/>
      ${[-1, 0, 1].map(s => `<path d="M${w / 2} ${h - 50} q${s * 16} -26 ${s * 26} 24" fill="none" stroke="#caf0f8" stroke-width="3"><animate attributeName="stroke-dasharray" values="0 80;80 0" dur="1.2s" repeatCount="indefinite"/></path>`).join('')}`,
    legeplads: (w, h) => `<rect x="2" y="2" width="${w - 4}" height="${h - 4}" rx="10" fill="#f4d58d" stroke="#c9a227" stroke-width="2"/>
      <text x="30" y="${h - 14}" font-size="34" text-anchor="middle">🛝</text><text x="${w - 30}" y="${h - 14}" font-size="30" text-anchor="middle">🪁</text>`,
    skjolde: (w, h) => Array.from({ length: 5 }, (_, i) => `<circle cx="${w / 2 + (i % 2 ? 12 : -12)}" cy="${22 + i * 34}" r="17" fill="${['#e63946', '#ffd23f', '#3a86ff', '#0ead69', '#e63946'][i]}" stroke="#5d4037" stroke-width="4"/><circle cx="${w / 2 + (i % 2 ? 12 : -12)}" cy="${22 + i * 34}" r="4" fill="#9e9e9e"/>`).join(''),
    ravn: (w, h) => `<rect x="${w / 2 - 3}" y="24" width="6" height="${h - 24}" fill="#6d4c41"/>
      <g><path d="M${w / 2 - 14} 22 Q${w / 2} 8 ${w / 2 + 12} 18 L${w / 2 + 20} 16 L${w / 2 + 12} 22 Q${w / 2} 28 ${w / 2 - 14} 22Z" fill="#212121"/><circle cx="${w / 2 + 8}" cy="16" r="1.5" fill="#fff"/>
        <animateTransform attributeName="transform" type="rotate" values="0 ${w / 2} 22;-6 ${w / 2} 22;0 ${w / 2} 22" dur="2s" repeatCount="indefinite"/></g>`,
    baal: (w, h) => `<path d="M14 ${h - 12} L${w - 14} ${h - 26} M14 ${h - 26} L${w - 14} ${h - 12}" stroke="#6d4c41" stroke-width="8" stroke-linecap="round"/>
      <g transform="translate(${w / 2} ${h - 22})"><path d="M-16 0 Q-18 -26 0 -44 Q18 -26 16 0Z" fill="#ff6d00"><animateTransform attributeName="transform" type="scale" values="1 1;1.1 .9;1 1.08;1 1" dur=".6s" repeatCount="indefinite"/></path><path d="M-8 0 Q-8 -16 0 -26 Q8 -16 8 0Z" fill="#ffd600"/></g>`,
    runesten: (w, h) => `<path d="M${w / 2 - 22} ${h - 4} Q${w / 2 - 28} 20 ${w / 2} 8 Q${w / 2 + 28} 20 ${w / 2 + 22} ${h - 4}Z" fill="#9e9e9e" stroke="#616161" stroke-width="3"/>
      <path d="M${w / 2 - 8} 30 v26 M${w / 2 - 8} 36 l10 -6 M${w / 2 + 8} 40 v24 l-8 -8 M${w / 2 + 8} 52 l-8 6" stroke="#c62828" stroke-width="3" fill="none"/>`,
    brond: (w, h) => `<ellipse cx="${w / 2}" cy="${h - 14}" rx="28" ry="10" fill="#78909c" stroke="#455a64" stroke-width="3"/><rect x="${w / 2 - 28}" y="${h - 34}" width="56" height="20" fill="#90a4ae" stroke="#455a64" stroke-width="2"/>
      <path d="M${w / 2 - 34} 26 L${w / 2} 6 L${w / 2 + 34} 26Z" fill="#8d6e63"/><line x1="${w / 2 - 26}" y1="26" x2="${w / 2 - 26}" y2="${h - 34}" stroke="#6d4c41" stroke-width="4"/><line x1="${w / 2 + 26}" y1="26" x2="${w / 2 + 26}" y2="${h - 34}" stroke="#6d4c41" stroke-width="4"/>
      <circle cx="${w / 2 + 10}" cy="${h - 16}" r="2" fill="#ffd23f"><animate attributeName="opacity" values="0;1;0" dur="1.6s" repeatCount="indefinite"/></circle>`,
    langhus: (w, h) => `<rect x="6" y="${h * 0.45}" width="${w - 12}" height="${h * 0.5}" fill="#8d6e63" stroke="#4e342e" stroke-width="2"/>
      <path d="M0 ${h * 0.5} Q${w / 2} ${h * 0.05} ${w} ${h * 0.5}Z" fill="#a1887f" stroke="#4e342e" stroke-width="2"/><rect x="${w / 2 - 6}" y="${h * 0.62}" width="12" height="${h * 0.33}" fill="#3e2723"/>
      <path d="M4 ${h * 0.3} q-6 -14 4 -18 M${w - 4} ${h * 0.3} q6 -14 -4 -18" fill="none" stroke="#4e342e" stroke-width="3"/>`,
  };

  function drawRide(id, w, h, uid = id) {
    const r = rideById(id);
    if (r && r.coaster) return coaster(uid, w, h, r.coaster);
    if (DRAW[id]) return DRAW[id](w, h);
    if (DECO[id]) return DECO[id](w, h);
    return '';
  }

  const DEFS = `<filter id="paint"><feColorMatrix type="hueRotate" values="150"/></filter>
    <radialGradient id="glow"><stop offset="0" stop-color="#fff6b0" stop-opacity=".9"/><stop offset="1" stop-color="#ffd23f" stop-opacity="0"/></radialGradient>`;

  // Upgrade visuals: 1 = light chain, 2 = new paint, 3 = golden star
  function upgraded(inner, w, h, lvl) {
    if (!lvl) return inner;
    let s = lvl >= 2 ? `<g filter="url(#paint)">${inner}</g>` : inner;
    const n = Math.max(6, Math.round(w / 16));
    s += `<g class="bulbs">${Array.from({ length: n }, (_, i) => {
      const x = 6 + (i * (w - 12)) / (n - 1), y = h - 4 - Math.sin((i / (n - 1)) * Math.PI) * 6;
      return `<circle cx="${f1(x)}" cy="${f1(y)}" r="3" fill="${GUEST_C[i % 6]}"><animate attributeName="opacity" values="1;.25;1" dur="1.1s" begin="${(i * 0.15).toFixed(2)}s" repeatCount="indefinite"/></circle>`;
    }).join('')}</g>`;
    if (lvl >= 3) {
      s += `<g transform="translate(${w - 14} 4)"><g><circle r="18" fill="url(#glow)"/><text y="7" font-size="20" text-anchor="middle">⭐</text>
        <animateTransform attributeName="transform" type="scale" values="1;1.15;1" dur="1.6s" repeatCount="indefinite"/></g></g>`;
    }
    return s;
  }

  // Standalone picture of a ride (for dialogs)
  function rideSvg(id, cls = 'ride-pic', up = 0) {
    const r = rideById(id), [, , w, h] = r.plot;
    const uid = id + '-pic' + Math.random().toString(36).slice(2, 6);
    return `<svg class="${cls}" viewBox="-10 -14 ${w + 20} ${h + 24}"><defs>${DEFS}</defs>${upgraded(drawRide(id, w, h, uid), w, h, up)}</svg>`;
  }

  // slot = place on the map. occ = what stands there (players can swap rides)
  function slotSvg(slot, occ, p, opts) {
    const [x, y, w, h] = slot.plot;
    const built = p.built.includes(occ.id);
    const sel = opts.moveSel === slot.id ? ' sel' : '';
    if (built) {
      const [, , nw, nh] = occ.plot;
      const s = Math.min(w / nw, h / nh), ox = (w - nw * s) / 2, oy = (h - nh * s) / 2;
      const inner = upgraded(drawRide(occ.id, nw, nh), nw, nh, (p.up || {})[occ.id] || 0);
      return `<g class="plot built${sel}" data-plot="${slot.id}" transform="translate(${x} ${y})">
        <rect class="hit" x="0" y="0" width="${w}" height="${h}" rx="12"/>
        <g transform="translate(${f1(ox)} ${f1(oy)}) scale(${s.toFixed(3)})">${inner}</g></g>`;
    }
    const can = p.money >= occ.cost;
    const small = w < 90 || h < 70;
    return `<g class="plot empty ${can ? 'can' : ''}${sel}" data-plot="${slot.id}" transform="translate(${x} ${y})">
      <rect x="3" y="3" width="${w - 6}" height="${h - 6}" rx="12" class="lot"/>
      ${small ? `<text x="${w / 2}" y="${h / 2 + 6}" font-size="20" text-anchor="middle">${can ? '🏗️' : '🔒'}</text>`
        : `<text x="${w / 2}" y="${h / 2 - 8}" font-size="${Math.min(34, h * 0.3)}" text-anchor="middle">${can ? '🏗️' : '🔒'}</text>
      <text x="${w / 2}" y="${h / 2 + 18}" class="lot-name" text-anchor="middle">${esc(occ.name)}</text>
      <text x="${w / 2}" y="${h / 2 + 38}" class="lot-price" text-anchor="middle">${occ.cost} kr</text>`}
    </g>`;
  }

  function guests(n) {
    let s = '';
    const g = (i, c, extra) => `<g class="guest" data-g="${i}"><circle class="ghit" cy="-6" r="13"/><circle cy="-9" r="3.8" fill="#ffd9b0"/><rect x="-3.8" y="-6" width="7.6" height="9.5" rx="3" fill="${c}"/>${extra}</g>`;
    for (let i = 0; i < n; i++) {
      const c = GUEST_C[i % GUEST_C.length], dur = 40 + (i % 5) * 7;
      const rev = i % 2 ? ' keyPoints="1;0" keyTimes="0;1" calcMode="linear"' : '';
      const bal = i % 4 === 0 ? `<line x1="3" y1="-6" x2="7" y2="-22" stroke="#555" stroke-width=".8"/><circle cx="7" cy="-25" r="4" fill="${GUEST_C[(i + 3) % 10]}"/>` : '';
      s += g(i, c, `${bal}<animateMotion dur="${dur}s" begin="-${f1((i * 13.7) % dur)}s" repeatCount="indefinite"${rev} path="${LOOP}"/>`);
    }
    for (let i = 0; i < Math.min(6, Math.floor(n / 3)); i++) {
      s += g(100 + i, GUEST_C[(i + 3) % 10], `<animateMotion dur="${18 + i * 3}s" begin="-${i * 4}s" repeatCount="indefinite" keyPoints="0;1;0" keyTimes="0;.5;1" calcMode="linear" path="M530 715 V482"/>`);
    }
    return s;
  }

  // lamp posts along the promenade
  const LAMPS = [];
  for (let x = 320; x <= 740; x += 105) { LAMPS.push([x, 176]); LAMPS.push([x, 500]); }
  for (let y = 250; y <= 440; y += 95) { LAMPS.push([246, y]); LAMPS.push([794, y]); }
  LAMPS.push([500, 612], [560, 612]);

  const FLOWERS = [[255, 170], [790, 180], [250, 500], [785, 500], [600, 470], [460, 470], [700, 205], [380, 205], [140, 690], [900, 700], [500, 690], [565, 690]];

  function bunting(x1, y1, x2, y2) {
    const n = 9, mx = (x1 + x2) / 2, my = (y1 + y2) / 2 + 18;
    let s = `<path d="M${x1} ${y1} Q${mx} ${my} ${x2} ${y2}" fill="none" stroke="#555" stroke-width="1.2"/>`;
    for (let i = 1; i < n; i++) {
      const t = i / n, x = (1 - t) ** 2 * x1 + 2 * (1 - t) * t * mx + t * t * x2, y = (1 - t) ** 2 * y1 + 2 * (1 - t) * t * my + t * t * y2;
      s += `<path d="M${f1(x - 5)} ${f1(y)} l5 10 l5 -10z" fill="${GUEST_C[i % 10]}"/>`;
    }
    return s;
  }

  function map(p, opts = {}) {
    const area = opts.area || 'sommer';
    const viking = area === 'viking';
    const pos = (p.pos || {})[area] || {};
    const slots = [...RIDES, ...DECOS].filter(r => areaOf(r) === area);
    const builtHere = slots.filter(r => p.built.includes(r.id));
    const nRides = builtHere.filter(r => RIDES.includes(r)).length;
    const nGuests = Math.round(Math.min(30, 3 + nRides * 2 + (builtHere.length - nRides)) * (opts.weather === 'regn' ? 0.6 : 1));
    const treeE = viking ? '🌲' : '🌳';
    const trees = [[150, 690], [215, 700], [880, 700], [960, 690], [985, 450], [10, 445], [560, 195], [250, 470]]
      .map(([x, y]) => `<text x="${x}" y="${y}" font-size="30" text-anchor="middle">${treeE}</text>`).join('');
    const rocks = viking ? [[120, 450], [890, 455], [480, 200], [230, 690]].map(([x, y]) => `<text x="${x}" y="${y}" font-size="20" text-anchor="middle">🪨</text>`).join('') : '';
    const flowers = FLOWERS.map(([x, y], i) => `<g transform="translate(${x} ${y})">${[0, 1, 2, 3, 4].map(k => `<circle cx="${(k - 2) * 5}" cy="${(k % 2) * 4}" r="3" fill="${GUEST_C[(i + k) % 10]}"/>`).join('')}</g>`).join('');
    const lamps = LAMPS.map(([x, y]) => `<g><line x1="${x}" y1="${y}" x2="${x}" y2="${y - 22}" stroke="#37474f" stroke-width="2.5"/><circle cx="${x}" cy="${y - 24}" r="4" fill="#fff3b0" stroke="#37474f" stroke-width="1.5"/></g>`).join('');
    const ground = viking ? ['#7fb069', '#4f7942'] : ['#8bd36b', '#5fb84a'];
    const night = !!opts.night;
    return `<svg class="park-map" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="grass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${ground[0]}"/><stop offset="1" stop-color="${ground[1]}"/></linearGradient>
        <pattern id="mow" width="60" height="60" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><rect width="30" height="60" fill="rgba(255,255,255,.05)"/></pattern>
        <pattern id="blades" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M4 18 l2 -5 M14 8 l1 -5 M19 21 l2 -4 M9 4 l-1 -3" stroke="rgba(0,60,0,.18)" stroke-width="1.4"/></pattern>
        <pattern id="tiles" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="#f1e3c2"/><path d="M0 0 H14 M0 0 V14" stroke="rgba(150,120,70,.25)" stroke-width="1"/></pattern>
        <radialGradient id="lampglow"><stop offset="0" stop-color="#fff3b0" stop-opacity=".85"/><stop offset="1" stop-color="#ffd23f" stop-opacity="0"/></radialGradient>
        ${DEFS}
      </defs>
      <rect width="${W}" height="${H}" rx="26" fill="url(#grass)"/>
      <rect width="${W}" height="${H}" rx="26" fill="url(#mow)"/>
      <rect width="${W}" height="${H}" rx="26" fill="url(#blades)"/>
      <path d="${LOOP}" fill="none" stroke="#2d6a2d" stroke-width="56" stroke-linejoin="round" stroke-dasharray="1 15" stroke-linecap="round" opacity=".5"/>
      <path d="${LOOP}" fill="none" stroke="#c9b48a" stroke-width="34" stroke-linejoin="round"/>
      <path d="${LOOP}" fill="none" stroke="url(#tiles)" stroke-width="27" stroke-linejoin="round"/>
      <path d="M530 482 V720" stroke="#c9b48a" stroke-width="42"/><path d="M530 482 V720" stroke="url(#tiles)" stroke-width="34"/>
      <circle cx="530" cy="565" r="60" fill="url(#tiles)" stroke="#c9b48a" stroke-width="5"/>
      ${flowers}${trees}${rocks}
      ${slots.map(slot => slotSvg(slot, rideById(pos[slot.id] || slot.id), p, opts)).join('')}
      ${lamps}
      ${guests(nGuests)}
      ${bunting(486, 600, 576, 600)}
      <g class="gate">
        <rect x="462" y="640" width="26" height="78" rx="4" fill="#e63946" stroke="#8a1414" stroke-width="2"/><rect x="572" y="640" width="26" height="78" rx="4" fill="#e63946" stroke="#8a1414" stroke-width="2"/>
        <path d="M455 660 Q530 596 605 660" fill="none" stroke="#ffd23f" stroke-width="16" stroke-linecap="round"/>
        ${Array.from({ length: 9 }, (_, i) => { const t = i / 8, x = 455 + t * 150, y = 660 - Math.sin(t * Math.PI) * 32; return `<circle cx="${f1(x)}" cy="${f1(y)}" r="3" fill="#fff"><animate attributeName="fill" values="#fff;#ff5a5f;#fff" dur="1s" begin="${(i * 0.11).toFixed(2)}s" repeatCount="indefinite"/></circle>`; }).join('')}
        <rect x="430" y="622" width="200" height="36" rx="18" fill="#fff" stroke="#e63946" stroke-width="4"/>
        <text x="530" y="646" text-anchor="middle" class="gate-name">${esc(p.parkName)}${viking ? ' ⚔️' : ''}</text>
      </g>
      <g pointer-events="none">
        <ellipse cx="0" cy="200" rx="160" ry="60" fill="rgba(0,0,0,.06)"><animateTransform attributeName="transform" type="translate" values="-200 0;1300 80" dur="70s" repeatCount="indefinite"/></ellipse>
        <ellipse cx="0" cy="520" rx="200" ry="70" fill="rgba(0,0,0,.05)"><animateTransform attributeName="transform" type="translate" values="-300 0;1300 -60" dur="95s" begin="-40s" repeatCount="indefinite"/></ellipse>
      </g>
      ${night ? `<rect width="${W}" height="${H}" rx="26" fill="#0b1a4a" opacity=".55" pointer-events="none"/>
        <g pointer-events="none">${LAMPS.map(([x, y]) => `<circle cx="${x}" cy="${y - 24}" r="26" fill="url(#lampglow)"/>`).join('')}</g>
        <g pointer-events="none">${Array.from({ length: 30 }, (_, i) => `<circle cx="${(i * 137) % W}" cy="${(i * 89) % 160 + 6}" r="${i % 3 ? 1 : 1.6}" fill="#fff"><animate attributeName="opacity" values=".2;1;.2" dur="${2 + (i % 4)}s" repeatCount="indefinite"/></circle>`).join('')}</g>` : ''}
      ${opts.weather === 'regn' ? `<g pointer-events="none" opacity=".55"><rect width="${W}" height="${H}" rx="26" fill="rgba(60,80,110,.18)"/>
        ${Array.from({ length: 60 }, (_, i) => `<line x1="${(i * 167) % W}" y1="0" x2="${(i * 167) % W - 10}" y2="26" stroke="#dfe9f5" stroke-width="2"><animateTransform attributeName="transform" type="translate" values="0 ${-40 - (i * 37) % 300};-60 ${H}" dur="${(0.8 + (i % 5) * 0.1).toFixed(1)}s" repeatCount="indefinite"/></line>`).join('')}</g>` : ''}
    </svg>`;
  }

  return { map, rideSvg, avatar, drawRide };
})();
