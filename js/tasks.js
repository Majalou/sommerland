const Tasks = (() => {
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = arr => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // Highest adaptive level per year and topic
  const MAXLVL = {
    1: { add: 2, sub: 2, count: 2, grid: 1, prob: 1 },
    2: { add: 3, sub: 3, mult: 3, area: 3, perim: 3, prob: 2 },
    3: { add: 2, sub: 2, mult: 2, div: 1, frac: 1, word: 1, area: 2, perim: 2, prob: 1 },
    4: { add: 2, sub: 2, mult: 2, div: 1, frac: 1, word: 1, eq: 2, area: 2, perim: 2, prob: 1 },
  };

  function skill(p, topic) {
    const k = p.year + ':' + topic;
    if (!p.skill[k]) p.skill[k] = { lvl: 0, ok: 0, bad: 0 };
    return p.skill[k];
  }
  function lvl(p, topic) {
    return Math.min(skill(p, topic).lvl, (MAXLVL[p.year] || {})[topic] || 0);
  }
  function adapt(p, topic, ok) {
    if (!topic || !(MAXLVL[p.year] || {})[topic]) return;
    const s = skill(p, topic), max = MAXLVL[p.year][topic];
    if (ok) {
      s.ok++; s.bad = 0;
      if (s.ok >= 3) { s.lvl = Math.min(max, s.lvl + 1); s.ok = 0; }
    } else {
      s.bad++; s.ok = 0;
      if (s.bad >= 2) { s.lvl = Math.max(0, s.lvl - 1); s.bad = 0; }
    }
  }

  function numOptions(ans) {
    const set = new Set([ans]);
    const deltas = ans <= 20 ? shuffle([1, -1, 2, -2, 3, -3]) : shuffle([1, -1, 10, -10, 2, -2, 5]);
    for (const d of deltas) {
      if (set.size >= 4) break;
      if (ans + d >= 0) set.add(ans + d);
    }
    let k = 4;
    while (set.size < 4) set.add(ans + k++);
    return shuffle([...set]).map(v => ({ label: String(v), value: v }));
  }

  const items = (e, n, gone = 0) =>
    `<div class="items">${Array.from({ length: n }, (_, i) => `<span class="${i >= n - gone ? 'gone' : ''}">${e}</span>`).join('')}</div>`;

  const ITEMS = ['🍄', '🐌', '🪶', '💧', '🕷️', '🌰'];

  function gridSvg(w, h, o = {}) {
    const u = Math.min(38, 230 / Math.max(w, h));
    const W = w * u, H = h * u, pad = o.labels ? 56 : 10;
    let s = `<svg class="geo" viewBox="${-pad} ${-pad} ${W + pad * 2} ${H + pad * 2}" width="${W + pad * 2}" height="${H + pad * 2}">`;
    if (o.grid) {
      for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) {
        s += `<rect x="${i * u}" y="${j * u}" width="${u}" height="${u}" fill="rgba(120,170,255,.35)" stroke="#cfe0ff" stroke-width="1.5"/>`;
      }
    } else {
      s += `<rect x="0" y="0" width="${W}" height="${H}" fill="rgba(120,170,255,.3)"/>`;
    }
    s += `<rect x="0" y="0" width="${W}" height="${H}" fill="none" stroke="#ffe27a" stroke-width="${o.thick ? 6 : 3}"/>`;
    if (o.labels) {
      s += `<text x="${W / 2}" y="-14" text-anchor="middle" class="geo-l">${o.labels[0]}</text>`;
      s += `<text x="${W + 10}" y="${H / 2 + 7}" class="geo-l">${o.labels[1]}</text>`;
    }
    return s + '</svg>';
  }

  function polySvg(n) {
    const pts = Array.from({ length: n }, (_, i) => {
      const a = -Math.PI / 2 + (i * Math.PI * 2) / n;
      return `${(80 + Math.cos(a) * 70).toFixed(1)},${(80 + Math.sin(a) * 70).toFixed(1)}`;
    }).join(' ');
    return `<svg class="geo" viewBox="0 0 160 160" width="170" height="170"><polygon points="${pts}" fill="rgba(120,170,255,.35)" stroke="#ffe27a" stroke-width="5" stroke-linejoin="round"/></svg>`;
  }

  // [ental, flertal, farve]
  const BALLS = [['hvid', 'hvide', '#f4f4f4'], ['rød', 'røde', '#d62828'], ['blå', 'blå', '#2563eb'], ['grøn', 'grønne', '#2a9d3a'], ['gul', 'gule', '#f6c90e']];
  const fracHtml = (a, b) => `<span class="frac"><span>${a}</span><span>${b}</span></span>`;

  function jarSvg(k, n, c1, c2) {
    const balls = shuffle([...Array(k).fill(c1), ...Array(n - k).fill(c2)]);
    const per = 4, rows = Math.ceil(n / per);
    let s = '';
    balls.forEach((c, i) => {
      const r = Math.floor(i / per), col = i % per, inRow = Math.min(per, n - r * per);
      const x = 70 - (inRow - 1) * 13 + col * 26, y = 150 - r * 25;
      s += `<circle cx="${x}" cy="${y}" r="11" fill="${c}" stroke="#333" stroke-width="1.5"/><circle cx="${x - 4}" cy="${y - 4}" r="3" fill="#fff" opacity=".6"/>`;
    });
    const top = Math.min(60, 150 - rows * 25 - 10);
    return `<svg class="geo jar" viewBox="0 0 140 180" width="150" height="190">
      <rect x="40" y="${top - 22}" width="60" height="14" rx="4" fill="#8b5a2b"/>
      <path d="M44 ${top - 8} Q20 ${top + 10} 20 ${top + 40} V160 Q20 172 34 172 H106 Q120 172 120 160 V${top + 40} Q120 ${top + 10} 96 ${top - 8} Z" fill="rgba(200,230,255,.18)" stroke="#cfe0ff" stroke-width="3"/>
      ${s}
    </svg>`;
  }

  function chanceWord(k, n) {
    if (k === 0) return 'Ingen';
    if (k === n) return 'Sikker';
    if (k * 2 === n) return 'Lige stor';
    return k * 2 < n ? 'Lille' : 'Meget stor';
  }

  function prob(p) {
    const y = p.year, L = lvl(p, 'prob');
    const [a, b] = shuffle(BALLS);
    const fraction = (y === 1 && L === 1 && Math.random() < 0.5) || (y === 2 && L >= 1) || y >= 3;

    if (y >= 3 && L === 1 && Math.random() < 0.5) {
      const n1 = rnd(3, 8), k1 = rnd(1, n1 - 1);
      let n2, k2;
      do { n2 = rnd(3, 8); k2 = rnd(1, n2 - 1); } while (k1 * n2 === k2 * n1);
      const ans = k1 * n2 > k2 * n1 ? 'A' : 'B';
      return {
        topic: 'prob', kind: 'choice', prompt: `Hvilken krukke giver størst chance for en ${a[0]} bold?`,
        visual: `<div class="jars"><div><b>A</b>${jarSvg(k1, n1, a[2], b[2])}</div><div><b>B</b>${jarSvg(k2, n2, a[2], b[2])}</div></div>`,
        options: [{ label: 'Krukke A', value: 'A' }, { label: 'Krukke B', value: 'B' }], answer: ans,
        explain: `A: ${k1} ud af ${n1}. B: ${k2} ud af ${n2}. Krukke ${ans} giver størst chance.`,
      };
    }

    const n = fraction ? rnd(y === 1 ? 2 : 3, y === 1 ? 4 : y === 2 ? 8 : 12) : rnd(2, 6);
    let k;
    if (fraction) k = rnd(1, n - 1);
    else {
      const cat = pick(['none', 'small', 'half', 'big', 'sure']);
      k = cat === 'none' ? 0 : cat === 'sure' ? n : cat === 'half' ? (n % 2 ? rnd(1, n - 1) : n / 2) : cat === 'small' ? rnd(1, Math.max(1, Math.ceil(n / 2) - 1)) : rnd(Math.floor(n / 2) + 1, n - 1 || 1);
      k = Math.max(0, Math.min(n, k));
    }
    const intro = `Der er ${n} bolde i krukken. ${k === 0 ? `Ingen af dem er ${a[1]}` : k === n ? `Alle er ${a[1]}` : `${k} ${k === 1 ? `er ${a[0]}` : `er ${a[1]}`}`}.`;
    const visual = jarSvg(k, n, a[2], b[2]);

    if (!fraction) {
      const words = ['Ingen', 'Lille', 'Lige stor', 'Meget stor', 'Sikker'];
      const ans = chanceWord(k, n);
      return {
        topic: 'prob', kind: 'choice', prompt: `${intro} Hvor stor er chancen for at trække en ${a[0]} bold?`, visual,
        options: words.map(w => ({ label: w, value: w })), answer: ans, optClass: 'chance',
        explain: `${k} ud af ${n} er ${k === 1 ? a[0] : a[1]}. Chancen er ${ans.toLowerCase()}${k > 0 && k < n ? `: ${k}/${n}` : ''}.`,
      };
    }
    const opts = [[k, n], [n - k, n], [1, n], [k, n + 1], [k, n - k]]
      .filter(([x, z]) => z > 0 && x <= z)
      .filter((f, i, arr) => arr.findIndex(g => g[0] === f[0] && g[1] === f[1]) === i)
      .slice(0, 4);
    while (opts.length < 4) opts.push([opts.length, n + opts.length]);
    return {
      topic: 'prob', kind: 'choice', prompt: `${intro} Hvad er sandsynligheden for at trække en ${a[0]} bold?`, visual,
      options: shuffle(opts).map(([x, z]) => ({ label: fracHtml(x, z), value: `${x}/${z}`, say: `${x} ud af ${z}` })), answer: `${k}/${n}`,
      optClass: 'fracs', explain: `${k} ud af ${n} bolde er ${k === 1 ? a[0] : a[1]}. Sandsynligheden er ${k}/${n}.`,
    };
  }

  const geo = {
    prob,
    sides() {
      const n = pick([3, 4, 5, 6]), what = pick(['sider', 'hjørner']);
      return {
        topic: 'sides', kind: 'choice', prompt: `Hvor mange ${what} har figuren?`, visual: polySvg(n),
        options: numOptions(n), answer: n, explain: `Figuren har ${n} ${what}.`,
      };
    },
    grid(p) {
      const L = lvl(p, 'grid');
      const w = rnd(1, L ? 4 : 3), h = rnd(L ? 2 : 1, 3), n = w * h;
      return {
        topic: 'grid', kind: 'choice', prompt: 'Hvor mange felter er der?', visual: gridSvg(w, h, { grid: true }),
        options: numOptions(n), answer: n, explain: `Der er ${n} felter.`,
      };
    },
    area(p) {
      const L = lvl(p, 'area');
      if (p.year === 2) {
        if (L <= 1) {
          const w = rnd(2, L ? 6 : 4), h = rnd(2, L ? 5 : 3);
          return {
            topic: 'area', kind: 'choice', prompt: 'Arealet er antal felter. Hvor stort er arealet?', visual: gridSvg(w, h, { grid: true }),
            options: numOptions(w * h), answer: w * h, explain: `${w} × ${h} = ${w * h} felter`,
          };
        }
        const w = rnd(2, L === 2 ? 6 : 9), h = rnd(2, 6);
        return {
          topic: 'area', kind: 'choice', prompt: 'Gang de to sider. Hvad er arealet?', visual: gridSvg(w, h, { labels: [w, h] }),
          options: numOptions(w * h), answer: w * h, explain: `${w} × ${h} = ${w * h}`,
        };
      }
      if (L === 2 && Math.random() < 0.5) {
        const s = rnd(3, 12);
        return {
          topic: 'area', kind: 'choice', prompt: `Et kvadrat har siden ${s} cm. Hvad er arealet i cm²?`, visual: gridSvg(4, 4, { labels: [`${s} cm`, `${s} cm`] }),
          options: numOptions(s * s), answer: s * s, explain: `${s} × ${s} = ${s * s} cm²`,
        };
      }
      const w = rnd(3, L ? 15 : 10), h = rnd(2, L ? 10 : 8);
      return {
        topic: 'area', kind: 'choice', prompt: 'Hvad er arealet i cm²?', visual: gridSvg(w, h, { labels: [`${w} cm`, `${h} cm`] }),
        options: numOptions(w * h), answer: w * h, explain: `Areal = ${w} × ${h} = ${w * h} cm²`,
      };
    },
    perim(p) {
      const L = lvl(p, 'perim');
      if (p.year === 2) {
        if (L <= 1) {
          const w = rnd(1, L ? 5 : 3), h = rnd(1, L ? 4 : 3), ans = 2 * (w + h);
          return {
            topic: 'perim', kind: 'choice', prompt: 'Omkreds er hele vejen rundt. Tæl kanterne.', visual: gridSvg(w, h, { grid: true, thick: true }),
            options: numOptions(ans), answer: ans, explain: `${w} + ${h} + ${w} + ${h} = ${ans}`,
          };
        }
        const w = rnd(2, L === 2 ? 9 : 15), h = rnd(2, 9), ans = 2 * (w + h);
        return {
          topic: 'perim', kind: 'choice', prompt: 'Læg alle fire sider sammen. Hvad er omkredsen?', visual: gridSvg(w, h, { labels: [w, h] }),
          options: numOptions(ans), answer: ans, explain: `${w} + ${h} + ${w} + ${h} = ${ans}`,
        };
      }
      if (L >= 1 && Math.random() < 0.5) {
        const s = rnd(2, 12);
        return {
          topic: 'perim', kind: 'choice', prompt: `Et kvadrat har omkredsen ${4 * s} cm. Hvor lang er én side?`, visual: gridSvg(4, 4, { labels: ['?', '?'] }),
          options: numOptions(s), answer: s, explain: `${4 * s} ÷ 4 = ${s} cm`,
        };
      }
      const w = rnd(2, L === 2 ? 25 : 12), h = rnd(2, L === 2 ? 15 : 9), ans = 2 * (w + h);
      return {
        topic: 'perim', kind: 'choice', prompt: 'Hvad er omkredsen i cm?', visual: gridSvg(w, h, { labels: [`${w} cm`, `${h} cm`] }),
        options: numOptions(ans), answer: ans, explain: `${w} + ${h} + ${w} + ${h} = ${ans} cm`,
      };
    },
  };

  // ---------- visual aids ----------
  const dots = (n, cls = 'a', crossed = 0) =>
    `<div class="tf">${Array.from({ length: n }, (_, i) => `<i class="d ${cls} ${i >= n - crossed ? 'x' : ''}"></i>`).join('')}</div>`;
  const blocks = n => {
    const h = Math.floor(n / 100), t = Math.floor((n % 100) / 10), o = n % 10;
    return `<div class="blk">${'<i class="bh"></i>'.repeat(h)}${'<i class="bt"></i>'.repeat(t)}<span class="bo">${'<i></i>'.repeat(o)}</span></div>`;
  };
  function eqVis(a, op, b, mode) {
    const pic = (n, cls, crossed) => (mode === 'blocks' ? blocks(n) : dots(n, cls, crossed));
    const col = (n, cls, crossed) => `<div class="eqcol"><div class="eqn">${n}</div>${pic(n, cls, crossed)}</div>`;
    return `<div class="eqvis">${col(a, 'a', op === '−' && mode !== 'blocks' ? b : 0)}<div class="eqop">${op}</div>${col(b, 'b')}<div class="eqop">=</div><div class="eqcol"><div class="eqn q">?</div></div></div>`;
  }
  const arrayVis = (rows, cols) =>
    `<div class="arr" style="grid-template-columns:repeat(${cols}, 16px)">${'<i class="d a"></i>'.repeat(rows * cols)}</div><div class="arr-l">${rows} rækker med ${cols} i hver</div>`;
  const fracBar = (k, d, label = '') =>
    `<div class="fbar">${Array.from({ length: d }, (_, i) => `<i class="${i < k ? 'on' : ''}"></i>`).join('')}</div>${label ? `<div class="arr-l">${label}</div>` : ''}`;
  const balance = (left, right) =>
    `<div class="balance"><div class="pan">${left}</div><div class="beam-mid">⚖️</div><div class="pan">${right}</div></div><div class="arr-l">Begge sider vejer det samme</div>`;

  const math = {
    add(p) {
      const L = lvl(p, 'add'), y = p.year;
      if (y === 1) {
        if (L === 2) {
          const s = rnd(4, 10), a = rnd(1, s - 1), b = s - a;
          return {
            topic: 'add', kind: 'choice', prompt: `Hvad mangler? ${a} + ? = ${s}`, big: `${a} + ? = ${s}`,
            visual: `<div class="eqvis"><div class="eqcol"><div class="eqn">${s}</div><div class="tf">${'<i class="d a"></i>'.repeat(a)}${'<i class="d empty"></i>'.repeat(b)}</div></div></div>`,
            options: numOptions(b), answer: b, explain: `${a} + ${b} = ${s}`,
          };
        }
        const max = L === 0 ? 5 : 10;
        const a = rnd(0, max - 1), b = rnd(1, max - a), ans = a + b;
        return {
          topic: 'add', kind: 'choice', prompt: `Hvad er ${a} + ${b}?`, visual: eqVis(a, '+', b),
          options: numOptions(ans), answer: ans, explain: `${a} + ${b} = ${ans}`,
        };
      }
      if (y === 4) {
        if (L === 2) {
          const a = rnd(100, 600), b = rnd(50, 350), c = rnd(20, Math.min(400, a + b - 1)), ans = a + b - c;
          return { topic: 'add', kind: 'choice', prompt: `Regn ud: ${a} + ${b} − ${c}`, big: `${a} + ${b} − ${c} = ?`, options: numOptions(ans), answer: ans, explain: `${a} + ${b} = ${a + b}. ${a + b} − ${c} = ${ans}` };
        }
        const a = L === 0 ? rnd(1, 7) * 100 : rnd(100, 699), b = L === 0 ? rnd(1, 9 - a / 100) * 100 : rnd(100, 999 - a), ans = a + b;
        return { topic: 'add', kind: 'choice', prompt: `Hvad er ${a} + ${b}?`, big: L === 0 ? '' : `${a} + ${b} = ?`, visual: L === 0 ? eqVis(a, '+', b, 'blocks') : '', options: numOptions(ans), answer: ans, explain: `${a} + ${b} = ${ans}` };
      }
      const max = y === 2 ? [20, 50, 100, 100][L] : [100, 500, 1000][L];
      const lo = y === 2 && L === 3 ? 15 : 2;
      const a = rnd(lo, max - 1), b = rnd(1, max - a), ans = a + b;
      const visual = y === 2 ? eqVis(a, '+', b, ans <= 20 ? 'dots' : 'blocks') : L === 0 ? eqVis(a, '+', b, 'blocks') : '';
      return {
        topic: 'add', kind: 'choice', prompt: `Hvad er ${a} + ${b}?`, big: visual ? '' : `${a} + ${b} = ?`, visual,
        options: numOptions(ans), answer: ans, explain: `${a} + ${b} = ${ans}`,
      };
    },
    sub(p) {
      const L = lvl(p, 'sub'), y = p.year;
      if (y === 1) {
        if (L === 2) {
          const a = rnd(4, 10), b = rnd(1, a - 1), r = a - b;
          return {
            topic: 'sub', kind: 'choice', prompt: `Hvad mangler? ${a} − ? = ${r}`, big: `${a} − ? = ${r}`,
            visual: `<div class="eqvis"><div class="eqcol"><div class="eqn">${a}</div>${dots(a)}</div><div class="eqop">→</div><div class="eqcol"><div class="eqn">${r}</div>${dots(r, 'b')}</div></div>`,
            options: numOptions(b), answer: b, explain: `${a} − ${b} = ${r}`,
          };
        }
        const max = L === 0 ? 5 : 10;
        const a = rnd(2, max), b = rnd(1, a - 1), ans = a - b;
        return {
          topic: 'sub', kind: 'choice', prompt: `Hvad er ${a} − ${b}?`, visual: eqVis(a, '−', b),
          options: numOptions(ans), answer: ans, explain: `${a} − ${b} = ${ans}. Vi tager ${b} væk.`,
        };
      }
      if (y === 4) {
        if (L === 2) {
          const a = rnd(400, 999), b = rnd(100, a - 200), c = rnd(20, a - b - 1), ans = a - b - c;
          return { topic: 'sub', kind: 'choice', prompt: `Regn ud: ${a} − ${b} − ${c}`, big: `${a} − ${b} − ${c} = ?`, options: numOptions(ans), answer: ans, explain: `${a} − ${b} = ${a - b}. ${a - b} − ${c} = ${ans}` };
        }
        const a = L === 0 ? rnd(3, 10) * 100 : rnd(300, 999), b = L === 0 ? rnd(1, a / 100 - 1) * 100 : rnd(100, a - 1), ans = a - b;
        return { topic: 'sub', kind: 'choice', prompt: `Hvad er ${a} − ${b}?`, big: L === 0 ? '' : `${a} − ${b} = ?`, visual: L === 0 ? eqVis(a, '−', b, 'blocks') : '', options: numOptions(ans), answer: ans, explain: `${a} − ${b} = ${ans}` };
      }
      const max = y === 2 ? [20, 50, 100, 100][L] : [100, 500, 1000][L];
      const a = rnd(10, max), b = rnd(1, a - 1), ans = a - b;
      const visual = y === 2 ? eqVis(a, '−', b, a <= 20 ? 'dots' : 'blocks') : L === 0 ? eqVis(a, '−', b, 'blocks') : '';
      return {
        topic: 'sub', kind: 'choice', prompt: `Hvad er ${a} − ${b}?`, big: visual ? '' : `${a} − ${b} = ?`, visual,
        options: numOptions(ans), answer: ans, explain: `${a} − ${b} = ${ans}`,
      };
    },
    count(p) {
      const L = lvl(p, 'count');
      const e = pick(['�', '🎈', '🍭', '🍿', '🎟️']);
      if (L < 2) {
        const n = L === 0 ? rnd(1, 5) : rnd(4, 12);
        return {
          topic: 'count', kind: 'choice', prompt: 'Hvor mange er der?', visual: items(e, n),
          options: numOptions(n), answer: n, explain: `Der er ${n}.`,
        };
      }
      const r = rnd(2, 4), c = rnd(2, 5), n = r * c;
      const rows = Array.from({ length: r }, () => items(e, c)).join('');
      return {
        topic: 'count', kind: 'choice', prompt: `${r} rækker med ${c} i hver. Hvor mange i alt?`, visual: `<div class="rows">${rows}</div>`,
        options: numOptions(n), answer: n, explain: `${Array(r).fill(c).join(' + ')} = ${n}`,
      };
    },
    mult(p) {
      const L = lvl(p, 'mult'), y = p.year;
      if (y === 4) {
        const a = rnd(2, 10), b = rnd(2, 10);
        if (L === 1) {
          return { topic: 'mult', kind: 'choice', prompt: `Hvilket tal mangler? ? × ${a} = ${a * b}`, big: `? × ${a} = ${a * b}`, options: numOptions(b), answer: b, explain: `${b} × ${a} = ${a * b}` };
        }
        if (L === 2) {
          const c = rnd(2, 20), plus = Math.random() < 0.5 || a * b <= c;
          const ans = plus ? a * b + c : a * b - c;
          const expr = plus ? `${a} × ${b} + ${c}` : `${a} × ${b} − ${c}`;
          return { topic: 'mult', kind: 'choice', prompt: `Regn ud. Husk: gange før plus og minus. ${expr}`, big: `${expr} = ?`, options: numOptions(ans), answer: ans, explain: `${a} × ${b} = ${a * b}. Så ${plus ? '+' : '−'} ${c} = ${ans}` };
        }
        return { topic: 'mult', kind: 'choice', prompt: `Hvad er ${a} × ${b}?`, big: `${a} × ${b} = ?`, visual: a * b <= 60 ? arrayVis(a, b) : '', options: numOptions(a * b), answer: a * b, explain: `${a} × ${b} = ${a * b}` };
      }
      let a, b;
      if (y === 2) {
        const tables = [[1, 2, 5, 10], [3, 4, 5, 10], [6, 7, 8, 9], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]][L];
        a = pick(tables); b = rnd(1, 10);
      } else if (L === 0) { a = rnd(2, 10); b = rnd(2, 10); }
      else if (L === 1) { a = rnd(2, 9) * 10; b = rnd(2, 9); }
      else { a = rnd(11, 25); b = rnd(2, 9); }
      const ans = a * b;
      const visual = (y === 2 || L === 0) && ans <= 60 ? arrayVis(b, a) : '';
      return {
        topic: 'mult', kind: 'choice', prompt: `Hvad er ${b} × ${a}?`, big: `${b} × ${a} = ?`, visual,
        options: numOptions(ans), answer: ans, explain: `${b} × ${a} = ${ans}`,
      };
    },
    div(p) {
      const L = lvl(p, 'div');
      if (p.year === 4 && L === 1) {
        const a = rnd(3, 9), q = rnd(2, 9), r = rnd(1, a - 1), n = a * q + r;
        return { topic: 'div', kind: 'choice', prompt: `${n} slikkepinde deles mellem ${a} børn. Hvor mange får hver, og hvor mange er tilovers?`, big: `${n} ÷ ${a} = ?`,
          options: shuffle([[q, r], [q + 1, r], [q, r + 1 < a ? r + 1 : r - 1], [q - 1, r]]).map(([x, z]) => ({ label: `${x} rest ${z}`, value: `${x}r${z}`, say: `${x}, rest ${z}` })),
          answer: `${q}r${r}`, explain: `${a} × ${q} = ${a * q}. Der er ${r} tilovers.` };
      }
      const a = rnd(2, 10), ans = rnd(1, 10);
      const n = L === 0 ? a * ans : a * ans * 10;
      const res = L === 0 ? ans : ans * 10;
      return {
        topic: 'div', kind: 'choice', prompt: `Hvad er ${n} ÷ ${a}?`, big: `${n} ÷ ${a} = ?`,
        options: numOptions(res), answer: res, explain: `${n} ÷ ${a} = ${res}, fordi ${a} × ${res} = ${n}`,
      };
    },
    frac(p) {
      const L = lvl(p, 'frac');
      if (p.year === 4) {
        if (L === 1) {
          const d = pick([2, 3, 4, 5]), k = rnd(1, d - 1), m = rnd(2, 4);
          return { topic: 'frac', kind: 'choice', prompt: `Hvilket tal mangler? ${k}/${d} = ?/${d * m}`, big: `${k}/${d} = ?/${d * m}`, visual: `${fracBar(k, d, `${k}/${d}`)}${fracBar(0, d * m, `?/${d * m}`)}`, options: numOptions(k * m), answer: k * m, explain: `Gang tæller og nævner med ${m}: ${k}/${d} = ${k * m}/${d * m}` };
        }
        const d = pick([3, 4, 5, 10]), k = rnd(2, d - 1), unit = rnd(2, 10), n = d * unit;
        return { topic: 'frac', kind: 'choice', prompt: `Hvad er ${k}/${d} af ${n}?`, big: `${k}/${d} af ${n} = ?`, visual: fracBar(k, d, `${n} delt i ${d} lige store dele. Tag ${k} af dem.`), options: numOptions(k * unit), answer: k * unit, explain: `${n} ÷ ${d} = ${unit}. ${unit} × ${k} = ${k * unit}` };
      }
      const [d, word, sym] = L === 0 ? [2, 'halvdelen', '½'] : pick([[2, 'halvdelen', '½'], [3, 'en tredjedel', '⅓'], [4, 'en fjerdedel', '¼']]);
      const ans = rnd(1, L === 0 ? 10 : 12), n = ans * d;
      return {
        topic: 'frac', kind: 'choice', prompt: `Hvad er ${word} af ${n}?`, big: `${sym} af ${n} = ?`, visual: fracBar(1, d, `${n} delt i ${d} lige store dele`),
        options: numOptions(ans), answer: ans, explain: `${n} delt i ${d} lige store dele er ${ans}.`,
      };
    },
    word(p) {
      const L = lvl(p, 'word');
      if (p.year === 4) {
        const T4 = [
          () => { const a = rnd(300, 600), b = rnd(80, 200), c = rnd(40, 120); return [`Isbaren havde ${a} is. De solgte ${b} lørdag og ${c} søndag. Hvor mange is er der tilbage?`, a - b - c]; },
          () => { const a = rnd(200, 500), b = rnd(100, 300); return [`Et nyt tog til rutsjebanen koster ${a} kr, og nye sæder koster ${b} kr. Hvad koster det tilsammen?`, a + b]; },
          () => { const t = rnd(4, 9), e = rnd(6, 10), g = rnd(5, 20); return [`Rutsjebanen har ${t} vogne med ${e} pladser i hver. ${g} pladser er tomme. Hvor mange gæster kører med?`, t * e - g]; },
          () => { const h = rnd(500, 900), k = rnd(150, 300), u = rnd(100, 200); return [`Parken har ${h} kr. Den køber en karrusel til ${k} kr og en isbod til ${u} kr. Hvor mange kr er der tilbage?`, h - k - u]; },
          () => { const pr = rnd(3, 9), n = rnd(4, 10), s = rnd(10, 60); return [`En is koster ${pr} kr. Mor køber ${n} is og betaler med ${pr * n + s} kr. Hvor mange kr får hun tilbage?`, s]; },
          () => { const a = rnd(120, 400), b = rnd(120, 400); return [`Lørdag kom ${a} gæster, og søndag kom ${b} gæster. Hvor mange gæster kom der i alt?`, a + b]; },
        ];
        const [text, ans] = pick(L === 0 ? T4.slice(0, 3) : T4)();
        return { topic: 'word', kind: 'choice', prompt: text, options: numOptions(ans), answer: ans, explain: `Svaret er ${ans}.` };
      }
      const T = [
        () => { const a = rnd(8, 30), b = rnd(2, a - 2); return [`Der står ${a} børn i køen til karrusellen. ${b} børn kommer ind. Hvor mange står der nu i køen?`, a - b]; },
        () => { const a = rnd(5, 40), b = rnd(3, 30); return [`Der er ${a} gæster i parken. Der kommer ${b} mere. Hvor mange gæster er der nu?`, a + b]; },
        () => { const a = rnd(2, 9), b = rnd(2, 6); return [`Rutsjebanen har ${b} vogne med ${a} pladser i hver. Hvor mange pladser er der i alt?`, a * b]; },
        () => { const b = rnd(2, 6), r = rnd(2, 9); return [`${b * r} turbilletter skal deles lige mellem ${b} børn. Hvor mange får hver?`, r]; },
        () => { const a = rnd(20, 90), b = rnd(5, a - 5); return [`En stor is koster ${a} kr. Du har ${b} kr. Hvor mange kr mangler du?`, a - b]; },
        () => { const a = rnd(3, 8), b = rnd(3, 9); return [`Du kører ${a} ture i rutsjebanen hver dag i ${b} dage. Hvor mange ture kører du i alt?`, a * b]; },
      ];
      const [text, ans] = pick(L === 0 ? T.slice(0, 2).concat(T[4]) : T)();
      return { topic: 'word', kind: 'choice', prompt: text, options: numOptions(ans), answer: ans, explain: `Svaret er ${ans}.` };
    },
    eq(p) {
      const L = lvl(p, 'eq');
      const x = rnd(2, 10);
      let expr, explain;
      if (L === 0) {
        const a = rnd(5, 90), xx = rnd(5, 120);
        expr = `x + ${a} = ${xx + a}`;
        return { topic: 'eq', kind: 'choice', prompt: `Find x. ${expr}`, big: expr, visual: balance(`x + ${a}`, xx + a), options: numOptions(xx), answer: xx, explain: `x = ${xx + a} − ${a} = ${xx}` };
      }
      if (L === 1) {
        if (Math.random() < 0.5) {
          const a = rnd(2, 10);
          expr = `${a} · x = ${a * x}`;
          explain = `x = ${a * x} ÷ ${a} = ${x}`;
          return { topic: 'eq', kind: 'choice', prompt: `Find x. ${expr}`, big: expr, visual: balance(`${a} · x`, a * x), options: numOptions(x), answer: x, explain };
        }
        const a = rnd(10, 80), xx = rnd(a + 5, 200);
        expr = `x − ${a} = ${xx - a}`;
        return { topic: 'eq', kind: 'choice', prompt: `Find x. ${expr}`, big: expr, visual: balance(`x − ${a}`, xx - a), options: numOptions(xx), answer: xx, explain: `x = ${xx - a} + ${a} = ${xx}` };
      }
      const a = rnd(2, 9), b = rnd(1, 30);
      expr = `${a} · x + ${b} = ${a * x + b}`;
      return { topic: 'eq', kind: 'choice', prompt: `Find x. ${expr}`, big: expr, visual: balance(`${a} · x + ${b}`, a * x + b), options: numOptions(x), answer: x, explain: `${a * x + b} − ${b} = ${a * x}. ${a * x} ÷ ${a} = ${x}` };
    },
  };

  // ---------- English ----------
  const word = (w, cat) => ({ en: w[0], da: w[2], cat, pic: cat === 'color' ? `<span class="swatch" style="background:${w[1]}"></span>` : `<span class="emo">${w[1]}</span>` });
  const numWord = n => ({ en: EN_NUMBERS[n - 1], da: DA_NUMBERS[n - 1], cat: 'num', pic: `<span class="num">${n}</span>` });

  function enPool(y) {
    if (y === 1) {
      return [
        ...EN_ANIMALS.slice(0, 8).map(w => word(w, 'animal')),
        ...EN_COLORS.slice(0, 6).map(w => word(w, 'color')),
        ...[1, 2, 3, 4, 5].map(numWord),
      ];
    }
    return [
      ...EN_ANIMALS.map(w => word(w, 'animal')),
      ...EN_THINGS.map(w => word(w, 'thing')),
      ...EN_COLORS.map(w => word(w, 'color')),
      ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(numWord),
    ];
  }

  function others(pool, target, n = 3) {
    const same = pool.filter(w => w.en !== target.en && (w.cat === target.cat || (w.cat !== 'color' && w.cat !== 'num' && target.cat !== 'color' && target.cat !== 'num')));
    return shuffle(same).slice(0, n);
  }

  function english(p) {
    const y = p.year;
    const types = y === 1 ? ['listen', 'listen', 'listen', 'say'] : y === 2 ? ['listen', 'read', 'toEn', 'say'] : y === 3
      ? ['count', 'phrase', 'phraseListen', 'sayPhrase', 'read', 'translate']
      : ['grammar', 'grammar', 'translate', 'enOrder', 'readQ', 'readQ', 'phraseListen', 'sayPhrase'];
    const type = pick(types);
    const pool = enPool(y);

    if (type === 'grammar') {
      const [s, opts, ans] = pick(EN_GRAMMAR);
      return {
        kind: 'choice', topic: 'en', prompt: 'Hvilket ord passer i hullet?', big: s, bigClass: 'sentence',
        options: shuffle(opts).map(o => ({ label: o, value: o, lang: 'en-GB' })), answer: ans,
        after: s.replace('___', ans), afterLang: 'en-GB', explain: s.replace('___', ans),
      };
    }
    if (type === 'translate') {
      const s = pick(EN_SENTENCES);
      const opts = shuffle([s, ...shuffle(EN_SENTENCES.filter(x => x !== s)).slice(0, 3)]);
      return {
        kind: 'choice', topic: 'en', prompt: `Hvordan siger man det på engelsk: "${s[1]}"?`, big: s[1], bigClass: 'sentence',
        options: opts.map(o => ({ label: o[0], value: o[0], lang: 'en-GB' })), answer: s[0],
        after: s[0], afterLang: 'en-GB', explain: `${s[1]} = ${s[0]}`,
      };
    }
    if (type === 'enOrder') {
      const s = pick(EN_SENTENCES.filter(x => x[0].split(' ').length <= 7));
      const words = s[0].split(' ');
      let pieces = shuffle(words);
      if (pieces.join(' ') === s[0]) pieces = [...words].reverse();
      return {
        kind: 'build', topic: 'en', prompt: `Byg sætningen på engelsk: "${s[1]}"`, say: `Byg sætningen på engelsk: ${s[1]}`,
        pieces, order: words, joiner: ' ', after: s[0], afterLang: 'en-GB',
      };
    }
    if (type === 'readQ') {
      const [text, q, a, w] = pick(EN_READ);
      return {
        kind: 'choice', topic: 'en', prompt: 'Læs teksten og svar på spørgsmålet.', big: `${text}\n${q}`, bigClass: 'sentence en-read',
        sayEn: `${text} ${q}`, options: shuffle([a, ...w]).map(o => ({ label: o, value: o, lang: 'en-GB' })), answer: a,
        explain: `Svaret er: ${a}.`,
      };
    }

    if (type === 'listen' || type === 'read') {
      const t = pick(pool);
      const opts = shuffle([t, ...others(pool, t)]);
      const listen = type === 'listen';
      return {
        kind: 'choice', topic: 'en',
        prompt: listen ? 'Lyt. Find det rigtige billede.' : 'Læs ordet. Find det rigtige billede.',
        big: listen ? '' : t.en, sayEn: listen ? t.en : '', mustSpeak: listen, after: t.en, afterLang: 'en-GB',
        options: opts.map(o => ({ label: o.pic, value: o.en, say: o.en, lang: 'en-GB' })), answer: t.en, optClass: 'pics',
        explain: `${t.en} betyder ${t.da}.`,
      };
    }
    if (type === 'toEn') {
      const t = pick(pool.filter(w => w.cat !== 'num'));
      const opts = shuffle([t, ...others(pool, t)]);
      return {
        kind: 'choice', topic: 'en', prompt: `Hvad hedder ${t.da} på engelsk?`, visual: `<div class="pic-big">${t.pic}</div>`,
        options: opts.map(o => ({ label: o.en, value: o.en, lang: 'en-GB' })), answer: t.en, after: t.en, afterLang: 'en-GB',
        explain: `${t.da} hedder ${t.en} på engelsk.`,
      };
    }
    if (type === 'say') {
      const t = pick(pool);
      return {
        kind: 'say', topic: 'en', prompt: 'Lyt og sig ordet på engelsk.', big: t.en, visual: `<div class="pic-big">${t.pic}</div>`,
        sayEn: t.en, mustSpeak: true, target: t.en, lang: 'en-US',
      };
    }
    if (type === 'sayPhrase') {
      const ph = pick(EN_PHRASES.filter(x => x[0].split(' ').length <= 4));
      return {
        kind: 'say', topic: 'en', prompt: `Sig det på engelsk: ${ph[1]}`, big: ph[0],
        sayEn: ph[0], mustSpeak: true, target: ph[0], lang: 'en-US',
      };
    }
    if (type === 'count') {
      const n = rnd(2, 6), it = pick(EN_PLURALS);
      const sentence = `I can see ${EN_NUMBERS[n - 1]} ${it[0]}.`;
      const counts = shuffle([n, ...shuffle([1, 2, 3, 4, 5, 6, 7].filter(x => x !== n)).slice(0, 3)]);
      return {
        kind: 'choice', topic: 'en', prompt: 'Læs og lyt. Find det rigtige billede.', big: sentence,
        sayEn: sentence, mustSpeak: true, options: counts.map(c => ({ label: `<span class="emo-row">${it[1].repeat(c)}</span>`, value: c, say: `${EN_NUMBERS[c - 1]} ${c === 1 ? it[0].slice(0, -1) : it[0]}`, lang: 'en-GB' })),
        answer: n, optClass: 'pics', explain: `${EN_NUMBERS[n - 1]} betyder ${DA_NUMBERS[n - 1]}.`,
      };
    }
    // phrase / phraseListen
    const ph = pick(EN_PHRASES);
    const opts = shuffle([ph, ...shuffle(EN_PHRASES.filter(x => x !== ph)).slice(0, 3)]);
    const listen = type === 'phraseListen';
    return {
      kind: 'choice', topic: 'en', prompt: listen ? 'Lyt. Hvad betyder det?' : 'Hvad betyder det på dansk?',
      big: listen ? '' : ph[0], sayEn: ph[0], mustSpeak: listen,
      options: opts.map(o => ({ label: o[1], value: o[0] })), answer: ph[0],
      explain: `${ph[0]} betyder: ${ph[1]}.`,
    };
  }

  // ---------- Danish ----------
  function misspell(w) {
    const out = new Set();
    const vowels = 'aeiouyæøå';
    let guard = 0;
    while (out.size < 3 && guard++ < 80) {
      const i = rnd(0, w.length - 1), ch = w[i], r = Math.random();
      let v = null;
      if (r < 0.35 && vowels.includes(ch)) v = w.slice(0, i) + pick([...'aeiou'].filter(x => x !== ch)) + w.slice(i + 1);
      else if (r < 0.6 && i > 0) v = w.slice(0, i) + w.slice(i + 1);
      else if (r < 0.8 && !vowels.includes(ch)) v = w.slice(0, i) + ch + w.slice(i);
      else if (i < w.length - 1 && w[i] !== w[i + 1]) v = w.slice(0, i) + w[i + 1] + w[i] + w.slice(i + 2);
      if (v && v !== w && v.length > 1) out.add(v);
    }
    return [...out];
  }

  // Generated Danish sentence with who/what/where/when slots
  function genSentence(withWhen) {
    const g = DA_GEN, act = pick(g.acts);
    const s = { who: pick(g.who), act, what: pick(act.what), where: pick(g.where), when: withWhen ? pick(g.when) : '' };
    const [v, part] = act.v;
    s.text = `${s.who} ${v}${part ? ' ' + part : ''} ${s.what} ${s.where}${s.when ? ' ' + s.when : ''}.`;
    const slot = pick(withWhen ? ['who', 'what', 'where', 'when'] : ['who', 'what', 'where']);
    const q = {
      who: `Hvem ${v}${part ? ' ' + part : ''} ${s.what}?`,
      what: `Hvad ${v} ${s.who}${part ? ' ' + part : ''}?`,
      where: `Hvor ${v} ${s.who}${part ? ' ' + part : ''} ${s.what}?`,
      when: `Hvornår ${v} ${s.who}${part ? ' ' + part : ''} ${s.what}?`,
    }[slot];
    const poolFor = { who: g.who, what: act.what, where: g.where, when: g.when }[slot];
    const cap = t => t[0].toUpperCase() + t.slice(1);
    s.question = q;
    s.answer = cap(s[slot]);
    s.wrong = shuffle(poolFor.filter(x => x !== s[slot])).slice(0, 3).map(cap);
    return s;
  }

  function danish(p) {
    const y = p.year;
    if (y === 1) {
      const type = pick(['hear', 'case', 'first', 'rhyme']);
      if (type === 'rhyme') {
        const r = pick(DA_RHYMES);
        const others = shuffle(DA_RHYMES.filter(x => x !== r)).slice(0, 3).map(x => [x[2], x[3]]);
        const opts = shuffle([[r[2], r[3]], ...others]);
        return {
          kind: 'choice', topic: 'da', prompt: `Hvad rimer på ${r[0]}?`, visual: `<div class="pic-big"><span class="emo">${r[1]}</span></div>`,
          say: `Hvad rimer på ${r[0]}?`, mustSpeak: true, optClass: 'pics',
          options: opts.map(o => ({ label: `<span class="emo">${o[1]}</span>`, value: o[0], say: o[0] })), answer: r[2],
          after: `${r[0]} og ${r[2]}`, explain: `${r[0]} rimer på ${r[2]}.`,
        };
      }
      const t = pick(DA_LETTERS);
      const opts = shuffle([t, ...shuffle(DA_LETTERS.filter(x => x !== t)).slice(0, 3)]);
      if (type === 'hear') {
        return {
          kind: 'choice', topic: 'da', prompt: 'Lyt. Find bogstavet.', say: `Find bogstavet ${t[0]}. ${t[0]} som i ${t[1]}.`, mustSpeak: true,
          options: opts.map(o => ({ label: o[0], value: o[0] })), answer: t[0], optClass: 'letters', explain: `Det er ${t[0]} som i ${t[1]}.`,
        };
      }
      if (type === 'case') {
        return {
          kind: 'choice', topic: 'da', prompt: 'Find det lille bogstav.', big: t[0], say: `Find det lille ${t[0]}.`,
          options: opts.map(o => ({ label: o[0].toLowerCase(), value: o[0] })), answer: t[0], optClass: 'letters',
          explain: `Stort ${t[0]} og lille ${t[0].toLowerCase()}.`,
        };
      }
      return {
        kind: 'choice', topic: 'da', prompt: 'Hvad starter ordet med?', visual: `<div class="pic-big"><span class="emo">${t[2]}</span></div>`,
        say: `Hvilket bogstav starter ${t[1]} med?`, mustSpeak: true,
        options: opts.map(o => ({ label: o[0], value: o[0] })), answer: t[0], optClass: 'letters',
        explain: `${t[1]} starter med ${t[0]}.`,
      };
    }
    if (y === 2) {
      const type = pick(['build', 'build', 'spell', 'syll', 'rhyme']);
      if (type === 'rhyme') {
        const r = pick(DA_RHYMES);
        const opts = shuffle([r[2], ...shuffle(DA_RHYMES.filter(x => x !== r)).slice(0, 3).map(x => x[2])]);
        return {
          kind: 'choice', topic: 'da', prompt: `Hvilket ord rimer på "${r[0]}"?`, big: r[0], say: `Hvilket ord rimer på ${r[0]}?`,
          options: opts.map(o => ({ label: o, value: o })), answer: r[2], optClass: 'letters', explain: `${r[0]} rimer på ${r[2]}.`,
        };
      }
      const w = pick(DA_WORDS), full = w.s.join('');
      if (type === 'build') {
        let pieces = shuffle(w.s);
        if (pieces.join('') === full) pieces = [...w.s].reverse();
        return {
          kind: 'build', topic: 'da', prompt: 'Byg ordet. Tryk på stykkerne i rigtig rækkefølge.', say: `Byg ordet ${full}.`,
          visual: `<div class="pic-big"><span class="emo">${w.e}</span></div>`, pieces, order: w.s, joiner: '', after: full,
        };
      }
      if (type === 'spell') {
        const opts = shuffle([full, ...misspell(full)]);
        return {
          kind: 'choice', topic: 'da', prompt: 'Hvilket ord er stavet rigtigt?', say: 'Hvilket ord er stavet rigtigt?',
          visual: `<div class="pic-big"><span class="emo">${w.e}</span></div>`,
          options: opts.map(o => ({ label: o, value: o })), answer: full, after: full, explain: `Det staves ${full}.`,
        };
      }
      const n = w.s.length;
      return {
        kind: 'choice', topic: 'da', prompt: 'Hvor mange stavelser har ordet? Klap og tæl.', big: full, say: `Hvor mange stavelser har ordet ${full}?`,
        options: [1, 2, 3, 4].map(v => ({ label: String(v), value: v })), answer: n, optClass: 'letters',
        explain: w.s.join(' - '),
      };
    }
    if (y === 4) {
      const type = pick(['text', 'text', 'gen', 'antonym', 'synonym', 'compound', 'wordclass', 'orderLong', 'gap']);
      if (type === 'text') {
        const s = pick(DA_TEXTS);
        return {
          kind: 'choice', topic: 'da', prompt: s.q, big: s.t, say: `${s.t} ${s.q}`, auto: s.q, bigClass: 'sentence',
          options: shuffle([s.a, ...s.w]).map(o => ({ label: o, value: o })), answer: s.a, explain: `Svaret er: ${s.a}.`,
        };
      }
      if (type === 'antonym' || type === 'synonym') {
        const list = type === 'antonym' ? DA_ANTONYMS : DA_SYNONYMS;
        const pair = pick(list), [w, ans] = Math.random() < 0.5 ? pair : [pair[1], pair[0]];
        const wrong = shuffle(list.filter(x => x !== pair).flat()).slice(0, 3);
        const q = type === 'antonym' ? `Hvad er det modsatte af "${w}"?` : `Hvilket ord betyder næsten det samme som "${w}"?`;
        return {
          kind: 'choice', topic: 'da', prompt: q, big: w, say: q,
          options: shuffle([ans, ...wrong]).map(o => ({ label: o, value: o })), answer: ans,
          explain: type === 'antonym' ? `Det modsatte af ${w} er ${ans}.` : `${w} og ${ans} betyder næsten det samme.`,
        };
      }
      if (type === 'compound') {
        const c = pick(DA_COMPOUNDS), ans = c.join('');
        const wrong = [c[1] + c[0], c[0] + ' ' + c[1], c[0] + 'e' + c[1]].filter(x => x !== ans);
        return {
          kind: 'choice', topic: 'da', prompt: `Sæt ordene sammen til ét ord: ${c[0]} + ${c[1]}`, big: `${c[0]} + ${c[1]}`, say: `Sæt ${c[0]} og ${c[1]} sammen til ét ord.`,
          options: shuffle([ans, ...wrong]).map(o => ({ label: o, value: o })), answer: ans, explain: `${c[0]} + ${c[1]} = ${ans}. Sammensatte ord skrives i ét ord.`,
        };
      }
      if (type === 'wordclass') {
        const [w, cls] = pick(DA_WORDCLASS);
        return {
          kind: 'choice', topic: 'da', prompt: `Hvilken ordklasse er "${w}"?`, big: w, say: `Hvilken ordklasse er ${w}?`,
          options: ['navneord', 'udsagnsord', 'tillægsord'].map(o => ({ label: o, value: o })), answer: cls,
          explain: 'Navneord er ting, dyr og personer. Udsagnsord er noget man gør. Tillægsord fortæller, hvordan noget er.',
        };
      }
      if (type === 'orderLong') {
        const s = genSentence(Math.random() < 0.5);
        const words = s.text.replace(/\.$/, '').split(' ');
        let pieces = shuffle(words);
        if (pieces.join(' ') === words.join(' ')) pieces = [...words].reverse();
        return { kind: 'build', topic: 'da', prompt: 'Sæt ordene i rigtig rækkefølge.', say: 'Sæt ordene i rigtig rækkefølge.', pieces, order: words, joiner: ' ', after: s.text };
      }
      if (type === 'gen') {
        const s = genSentence(true);
        return {
          kind: 'choice', topic: 'da', prompt: s.question, big: s.text, say: `${s.text} ${s.question}`, auto: s.question, bigClass: 'sentence',
          options: shuffle([s.answer, ...s.wrong]).map(o => ({ label: o, value: o })), answer: s.answer, explain: `Svaret er: ${s.answer}.`,
        };
      }
    }
    // year 3 (and gap for year 4): fixed story sentences mixed with generated ones
    const type = y === 4 ? 'gap' : pick(['read', 'read', 'gen', 'gen', 'order', 'gap']);
    if (type === 'gen') {
      const s = genSentence(false);
      return {
        kind: 'choice', topic: 'da', prompt: s.question, big: s.text, say: `${s.text} ${s.question}`, auto: s.question, bigClass: 'sentence',
        options: shuffle([s.answer, ...s.wrong]).map(o => ({ label: o, value: o })), answer: s.answer, explain: `Svaret er: ${s.answer}.`,
      };
    }
    const useGen = type !== 'read' && Math.random() < 0.5;
    const s = useGen ? { t: genSentence(y === 4).text } : pick(DA_SENTENCES);
    if (type === 'read') {
      return {
        kind: 'choice', topic: 'da', prompt: s.q, big: s.t, say: `${s.t} ${s.q}`, auto: s.q, bigClass: 'sentence',
        options: shuffle([s.a, ...s.w]).map(o => ({ label: o, value: o })), answer: s.a, explain: `Svaret er: ${s.a}.`,
      };
    }
    const words = s.t.replace(/[.,]/g, '').split(' ');
    if (type === 'order') {
      const short = DA_SENTENCES.filter(x => x.t.split(' ').length <= 7);
      const s2 = useGen ? { t: genSentence(false).text } : pick(short);
      const w2 = s2.t.replace(/[.,]/g, '').split(' ');
      let pieces = shuffle(w2);
      if (pieces.join(' ') === w2.join(' ')) pieces = [...w2].reverse();
      return {
        kind: 'build', topic: 'da', prompt: 'Sæt ordene i rigtig rækkefølge.', say: 'Sæt ordene i rigtig rækkefølge.',
        pieces, order: w2, joiner: ' ', after: s2.t,
      };
    }
    const idxs = words.map((w, i) => i).filter(i => i > 0 && words[i].length >= 3);
    const gi = pick(idxs), answer = words[gi];
    const pool = [...new Set(DA_SENTENCES.flatMap(x => x.t.replace(/[.,]/g, '').split(' ')).filter(w => w.length >= 3 && w.toLowerCase() !== answer.toLowerCase()))];
    const shown = words.map((w, i) => (i === gi ? '____' : w)).join(' ') + '.';
    return {
      kind: 'choice', topic: 'da', prompt: 'Hvilket ord mangler?', big: shown, say: 'Hvilket ord mangler?', bigClass: 'sentence',
      options: shuffle([answer, ...shuffle(pool).slice(0, 3)]).map(o => ({ label: o, value: o })), answer, after: s.t,
      explain: s.t,
    };
  }

  function make(classId, p) {
    const c = CLASSES[classId];
    if (c.kind === 'en') return english(p);
    if (c.kind === 'da') return danish(p);
    const topic = pick(c.topics[p.year]);
    return (math[topic] || geo[topic])(p);
  }

  return { make, adapt, pick, shuffle, rnd };
})();
