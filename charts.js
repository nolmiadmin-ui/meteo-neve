{
const MX = window.MX;
const C = MX.C;
const nodata = (el, ids, msg) => { if (MX.failed(ids)) MX.dash(el, msg); else MX.dash(el); };

dash.draw('snowchart', (el) => {
  const d = MX.stRows();
  if (!d || !d.length) return nodata(el, ['daily'], 'Dati giornalieri non disponibili.');
  const f = MX.frame(el, 310, {t: 24, r: 44, b: 26, l: 36});
  f.svg.attr('aria-label', 'Neve fresca giornaliera e altezza della neve al suolo');
  const x = d3.scaleBand().domain(d.map((r) => r.date)).range([0, f.iw]).padding(0.25);
  const ys = d3.scaleLinear().domain([0, Math.max(10, d3.max(d, (r) => Math.max(+r.snow, r.kind === 'prev' ? +r.snow_hi : 0)))]).nice().range([f.ih, 0]);
  const yd = d3.scaleLinear().domain([0, Math.max(20, d3.max(d, (r) => +r.snow_depth))]).nice().range([f.ih, 0]);
  f.g.append('g').attr('class', 'grid').call(d3.axisLeft(ys).ticks(4).tickSize(-f.iw).tickFormat('')).select('.domain').remove();
  MX.dayAxis(f, x, d);
  f.g.append('g').call(d3.axisLeft(ys).ticks(4)).call((g) => g.select('.domain').remove());
  f.g.append('g').attr('transform', `translate(${f.iw},0)`).call(d3.axisRight(yd).ticks(4)).call((g) => g.select('.domain').remove());
  f.g.append('text').attr('x', -30).attr('y', -12).text('cm/g');
  f.g.append('path').datum(d).style('fill', MX.grad(f, MX.uid(), C[1], 0.28, 0)).attr('d', d3.area().x((r) => x(r.date) + x.bandwidth() / 2).y0(f.ih).y1((r) => yd(+r.snow_depth)));
  f.g.append('g').selectAll('rect').data(d).join('rect').attr('x', (r) => x(r.date)).attr('width', x.bandwidth()).attr('y', (r) => ys(+r.snow)).attr('height', (r) => f.ih - ys(+r.snow)).attr('rx', 2).style('fill', MX.grad(f, MX.uid(), C[0], 1, 0.35));
  const fc = d.filter((r) => r.kind === 'prev' && +r.snow_hi > 0);
  f.g.append('g').selectAll('line').data(fc).join('line').attr('x1', (r) => x(r.date) + x.bandwidth() / 2).attr('x2', (r) => x(r.date) + x.bandwidth() / 2).attr('y1', (r) => ys(+r.snow_lo)).attr('y2', (r) => ys(+r.snow_hi)).style('stroke', '#e9f0fa').attr('stroke-width', 1.2).attr('opacity', 0.7);
  f.g.append('g').selectAll('line').data(fc).join('line').attr('x1', (r) => x(r.date) + x.bandwidth() * 0.2).attr('x2', (r) => x(r.date) + x.bandwidth() * 0.8).attr('y1', (r) => ys(+r.snow_hi)).attr('y2', (r) => ys(+r.snow_hi)).style('stroke', '#e9f0fa').attr('stroke-width', 1.2).attr('opacity', 0.7);
  f.g.append('path').datum(d).attr('fill', 'none').style('stroke', C[1]).attr('stroke-width', 2.2).attr('d', d3.line().x((r) => x(r.date) + x.bandwidth() / 2).y((r) => yd(+r.snow_depth)));
  MX.hover(f, el, x, d, MX.tipLines);
});

const lineChart = (el, series, opt) => {
  const d = MX.stRows();
  if (!d || !d.length) return nodata(el, ['daily'], 'Dati giornalieri non disponibili.');
  const f = MX.frame(el, 300, {t: 14, r: 10, b: 26, l: 40});
  f.svg.attr('aria-label', opt.label);
  const x = d3.scaleBand().domain(d.map((r) => r.date)).range([0, f.iw]).padding(0.25);
  const vals = series.flatMap((s) => d.map((r) => MX.num(r[s.f]))).filter((v) => v != null).concat(opt.extra || []);
  const y = d3.scaleLinear().domain(d3.extent(vals)).nice().range([f.ih, 0]);
  f.g.append('g').attr('class', 'grid').call(d3.axisLeft(y).ticks(5).tickSize(-f.iw).tickFormat('')).select('.domain').remove();
  MX.dayAxis(f, x, d);
  f.g.append('g').call(d3.axisLeft(y).ticks(5).tickFormat(opt.tick || null)).call((g) => g.select('.domain').remove());
  const cx = (r) => x(r.date) + x.bandwidth() / 2;
  if (opt.band) f.g.append('path').datum(d).style('fill', MX.grad(f, MX.uid(), opt.bandColor, 0.35, 0.12)).attr('d', d3.area().x(cx).y0((r) => y(+r[opt.band[0]])).y1((r) => y(+r[opt.band[1]])));
  if (opt.area) f.g.append('path').datum(d.filter((r) => MX.num(r[series[0].f]) != null)).style('fill', MX.grad(f, MX.uid(), opt.area, 0.3, 0)).attr('d', d3.area().x(cx).y0(f.ih).y1((r) => y(+r[series[0].f])));
  if (opt.ref != null) { f.g.append('line').attr('x1', 0).attr('x2', f.iw).attr('y1', y(opt.ref)).attr('y2', y(opt.ref)).style('stroke', '#c9d6ea').attr('stroke-width', 1.5).attr('stroke-dasharray', '6 4'); f.g.append('text').attr('x', 4).attr('y', y(opt.ref) - 5).text(opt.refLabel); }
  for (const s of series) {
    if (s.bar) f.g.append('g').selectAll('rect').data(d).join('rect').attr('x', (r) => x(r.date)).attr('width', x.bandwidth()).attr('y', (r) => y(Math.max(0, +r[s.f]))).attr('height', (r) => Math.abs(y(0) - y(+r[s.f]))).attr('rx', 2).style('fill', s.c).attr('opacity', s.op || 1);
    else f.g.append('path').datum(d.filter((r) => MX.num(r[s.f]) != null)).attr('fill', 'none').style('stroke', s.c).attr('stroke-width', s.w || 2).attr('stroke-dasharray', s.dash || null).attr('d', d3.line().x(cx).y((r) => y(+r[s.f])));
  }
  if (opt.zero) f.g.append('line').attr('x1', 0).attr('x2', f.iw).attr('y1', y(0)).attr('y2', y(0)).style('stroke', '#22314a');
  MX.hover(f, el, x, d, MX.tipLines);
};
dash.draw('tempchart', (el) => lineChart(el, [{f: 'feel_min', c: '#4a5a74', dash: '4 3'}, {f: 'tmin', c: C[0]}, {f: 'tmax', c: C[2]}], {label: 'Temperatura massima e minima reale e minima percepita', zero: true, band: ['tmin', 'tmax'], bandColor: C[2]}));
dash.draw('windchart', (el) => lineChart(el, [{f: 'wind', c: C[3], bar: true, op: 0.85}, {f: 'gust', c: '#ff6f8e'}], {label: 'Vento massimo e raffica massima giornaliera', extra: [0]}));
dash.draw('frzchart', (el) => { const s = MX.station(); if (!s) return MX.dash(el); lineChart(el, [{f: 'freezing_lvl', c: C[4], w: 2.2}], {label: 'Zero termico medio giornaliero e quota della stazione', area: C[4], ref: +s.elevation, refLabel: `stazione ${s.elevation} m`, extra: [+s.elevation, 0], tick: (v) => d3.format(',')(v).replace(',', '.')}); });
dash.draw('humchart', (el) => lineChart(el, [{f: 'rh', c: C[1], w: 2.2}], {label: 'Umidità relativa media giornaliera', area: C[1], extra: [0, 100], tick: (v) => v + '%'}));
dash.draw('precipchart', (el) => {
  const d = MX.stRows();
  if (!d || !d.length) return nodata(el, ['daily'], 'Dati giornalieri non disponibili.');
  const f = MX.frame(el, 300, {t: 24, r: 10, b: 26, l: 36});
  f.svg.attr('aria-label', 'Precipitazione giornaliera');
  const x = d3.scaleBand().domain(d.map((r) => r.date)).range([0, f.iw]).padding(0.25);
  const yp = d3.scaleLinear().domain([0, Math.max(10, d3.max(d, (r) => +r.precip))]).nice().range([f.ih, 0]);
  f.g.append('g').attr('class', 'grid').call(d3.axisLeft(yp).ticks(4).tickSize(-f.iw).tickFormat('')).select('.domain').remove();
  MX.dayAxis(f, x, d);
  f.g.append('g').call(d3.axisLeft(yp).ticks(4)).call((g) => g.select('.domain').remove());
  f.g.append('text').attr('x', -30).attr('y', -12).text('mm');
  f.g.append('g').selectAll('rect').data(d).join('rect').attr('x', (r) => x(r.date)).attr('width', x.bandwidth()).attr('y', (r) => yp(+r.precip)).attr('height', (r) => f.ih - yp(+r.precip)).attr('rx', 2).style('fill', MX.grad(f, MX.uid(), C[5], 1, 0.4));
  MX.hover(f, el, x, d, MX.tipLines);
});

/* icone meteo disegnate a mano (tratto sottile: sole ambra, nuvola ghiaccio, gocce blu) */
const IC = {sun: '#ffad33', cloud: '#bcd9ff', fill: '#16233a', drop: '#2f9bff', flake: '#d6ecff', bolt: '#ffc23a'};
const sunG = (cx, cy, r) => { let s = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${IC.sun}" stroke-width="1.6"/>`; for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, c = Math.cos(a), n = Math.sin(a); s += `<line x1="${(cx + c * (r + 1.9)).toFixed(2)}" y1="${(cy + n * (r + 1.9)).toFixed(2)}" x2="${(cx + c * (r + 3.4)).toFixed(2)}" y2="${(cy + n * (r + 3.4)).toFixed(2)}" stroke="${IC.sun}" stroke-width="1.6" stroke-linecap="round"/>`; } return s; };
const cloudG = (tx, ty, sc) => `<g transform="translate(${tx},${ty}) scale(${sc || 1})"><path d="M7 18.5h10.5a3.8 3.8 0 0 0 .4-7.6 5.5 5.5 0 0 0-10.6 1.2A3.2 3.2 0 0 0 7 18.5z" fill="${IC.fill}" stroke="${IC.cloud}" stroke-width="1.6" stroke-linejoin="round"/></g>`;
const dropG = (x, y, s) => `<path d="M${x} ${y - 2.4 * s}c0 0-1.7 2-1.7 3.1a1.7 1.7 0 0 0 3.4 0c0-1.1-1.7-3.1-1.7-3.1z" transform="translate(${x * (1 - s)},${y * (1 - s)}) scale(${s})" fill="${IC.drop}"/>`;
const flakeG = (x, y) => { let s = ''; for (const a of [0, 60, 120]) { const r = a * Math.PI / 180, c = Math.cos(r) * 1.9, n = Math.sin(r) * 1.9; s += `<line x1="${(x - c).toFixed(2)}" y1="${(y - n).toFixed(2)}" x2="${(x + c).toFixed(2)}" y2="${(y + n).toFixed(2)}" stroke="${IC.flake}" stroke-width="1.3" stroke-linecap="round"/>`; } return s; };
MX.wxKind = (c) => { c = +c; if (c === 0) return 'sun'; if (c <= 2) return 'partly'; if (c === 3) return 'cloud'; if (c === 45 || c === 48) return 'fog'; if (c >= 51 && c <= 57) return 'drizzle'; if (c >= 61 && c <= 67) return 'rain'; if (c >= 71 && c <= 77) return 'snow'; if (c >= 80 && c <= 82) return 'showers'; if (c === 85 || c === 86) return 'snowshowers'; if (c >= 95) return 'thunder'; return 'cloud'; };
MX.wxSvg = (code, size) => {
  const k = MX.wxKind(code); let b = '';
  const partly = (dy) => sunG(15.6, 8.2 + dy, 3) + cloudG(-2, 2 + dy, 1);
  if (k === 'sun') b = sunG(12, 12, 4.4);
  else if (k === 'partly') b = partly(0);
  else if (k === 'cloud') b = cloudG(0, -1.5);
  else if (k === 'fog') b = cloudG(0, -4.5) + `<path d="M5 18.5h14M7 21.5h10" stroke="${IC.cloud}" stroke-width="1.6" stroke-linecap="round"/>`;
  else if (k === 'drizzle') b = cloudG(0, -4.5) + dropG(9.5, 20.6, 0.95) + dropG(14.5, 20.6, 0.95);
  else if (k === 'rain') b = cloudG(0, -4.5) + dropG(8.3, 20.2, 1.1) + dropG(12.3, 22, 1.1) + dropG(16.3, 20.2, 1.1);
  else if (k === 'snow') b = cloudG(0, -4.5) + flakeG(8.3, 18.8) + flakeG(12.3, 21.6) + flakeG(16.3, 18.8);
  else if (k === 'showers') b = partly(-2.2) + dropG(9, 21, 1) + dropG(13.5, 22, 1);
  else if (k === 'snowshowers') b = partly(-2.2) + flakeG(9, 20.2) + flakeG(13.5, 21.9);
  else if (k === 'thunder') b = cloudG(0, -4.5) + `<path d="M12.8 14.6 9.9 19.4h2.3l-1.3 3.8 4-5.4h-2.3l1.4-3.2z" fill="${IC.bolt}"/>`;
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true">${b}</svg>`;
};
MX.wxIcon = (code, size, cls) => { const s = document.createElement('span'); s.className = 'mx-wx' + (cls ? ' ' + cls : ''); s.innerHTML = MX.wxSvg(code, size); s.title = MX.wx(code); return s; };

/* barra a intervallo stile meteo: scala fissa sui 7 giorni, puntini agli estremi, valori sotto */
const rangeBar = (o) => {
  const W = o.W || 196, H = 40, p = 12;
  const x = d3.scaleLinear().domain(o.dom).range([p, W - p]).clamp(true);
  const svg = d3.create('svg').attr('viewBox', `0 0 ${W} ${H}`).attr('width', W).attr('height', H).attr('class', 'mx-rb').attr('role', 'img').attr('aria-label', o.label);
  const id = MX.uid();
  const g = svg.append('defs').append('linearGradient').attr('id', id).attr('gradientUnits', 'userSpaceOnUse').attr('x1', p).attr('x2', W - p).attr('y1', 0).attr('y2', 0);
  o.stops.forEach(([off, c]) => g.append('stop').attr('offset', off).attr('stop-color', c));
  svg.append('rect').attr('x', p - 4).attr('y', 10).attr('width', W - 2 * p + 8).attr('height', 6).attr('rx', 3).attr('fill', '#22314a');
  if (o.empty) { svg.append('text').attr('x', W / 2).attr('y', 34).attr('text-anchor', 'middle').attr('class', 'mx-rb-v dim').text(o.empty); return svg.node(); }
  svg.append('rect').attr('x', x(o.lo) - 4).attr('y', 10).attr('width', Math.max(8, x(o.hi) - x(o.lo) + 8)).attr('height', 6).attr('rx', 3).attr('fill', `url(#${id})`);
  const dot = (v, cls, f) => svg.append('circle').attr('cx', x(v)).attr('cy', 13).attr('r', 4.6).attr('class', cls).attr('data-source', 'daily').attr('data-field', f).attr('data-where', o.where);
  dot(o.lo, 'mx-rb-d', o.f[0]); dot(o.hi, 'mx-rb-d', o.f[1]); dot(o.mid, 'mx-rb-m ' + o.midCls, o.f[2]);
  const labs = [{v: o.lo, t: o.fmt(o.lo), c: 'mx-rb-v', f: o.f[0]}, {v: o.hi, t: o.fmt(o.hi), c: 'mx-rb-v', f: o.f[1]}, {v: o.mid, t: o.fmt(o.mid), c: 'mx-rb-v ' + o.midCls, f: o.f[2]}]
    .map((l) => ({...l, x: x(l.v), w: l.t.length * 6.4 + 2})).sort((a, b) => a.x - b.x || (a.c.length - b.c.length));
  const ded = []; labs.forEach((l) => { const q = ded.find((z) => z.t === l.t && Math.abs(z.x - l.x) < 3); if (!q) ded.push(l); });
  for (let i = 1; i < ded.length; i++) { const need = ded[i - 1].x + (ded[i - 1].w + ded[i].w) / 2 + 3; if (ded[i].x < need) ded[i].x = need; }
  const over = ded.length ? ded[ded.length - 1].x + ded[ded.length - 1].w / 2 - W : 0; if (over > 0) ded.forEach((l) => { l.x -= over; });
  const under = ded.length ? ded[0].w / 2 - ded[0].x : 0; if (under > 0) ded.forEach((l) => { l.x += under; });
  ded.forEach((l) => svg.append('text').attr('x', l.x).attr('y', 35).attr('text-anchor', 'middle').attr('class', l.c).attr('data-source', 'daily').attr('data-field', l.f).attr('data-where', o.where).text(l.t));
  return svg.node();
};
const tCol = d3.scaleLinear().domain([-20, -10, 0, 8, 18]).range(['#a48bff', '#4f7cff', '#5fd4ff', '#ffd27a', '#ff8a3d']).clamp(true);

dash.draw('fctable', (tb) => {
  const d = MX.allRows(); const t = MX.today();
  tb.replaceChildren();
  if (!d || !t) return;
  const w = d.filter((x) => x.date >= t).slice(0, 7);
  const tlo = Math.floor(d3.min(w, (r) => Math.min(+r.tmin, +r.feel_min))) - 1, thi = Math.ceil(d3.max(w, (r) => +r.tmax)) + 1;
  const tStops = d3.range(0, 1.0001, 0.25).map((k) => [`${k * 100}%`, tCol(tlo + k * (thi - tlo))]);
  /* precipitazione del giorno: neve se ne cade almeno mezzo cm, altrimenti pioggia */
  const pk = (r) => (+r.snow >= 0.5 ? {k: 'snow', lo: +r.snow_lo, hi: +r.snow_hi, mid: +r.snow, f: ['snow_lo', 'snow_hi', 'snow'], u: 'cm'} : +(r.precip_hi || r.precip) >= 0.5 ? {k: 'rain', lo: +(r.precip_lo || 0), hi: +(r.precip_hi || r.precip), mid: +r.precip, f: ['precip_lo', 'precip_hi', 'precip'], u: 'mm'} : null);
  const phi = Math.max(5, Math.ceil(d3.max(w, (r) => { const p = pk(r); return p ? p.hi : 0; })));
  const whi = Math.max(20, Math.ceil(d3.max(w, (r) => Math.max(+r.gust, +r.wind)) / 10) * 10);
  const deg = (v) => `${Math.round(v)}°`; const cm = (v) => (v > 0 && v < 1 ? '<1' : String(Math.round(v))); const kmh = (v) => String(Math.round(v));
  const DAYS = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
  const PI = {snow: `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.6 4.6 12 6.4l2.4-1.8M9.6 19.4 12 17.6l2.4 1.8" fill="none" stroke="#a7ecff" stroke-width="1.8" stroke-linecap="round"/></svg>`, rain: `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 3.5s-6 6.6-6 11a6 6 0 0 0 12 0c0-4.4-6-11-6-11z" fill="#5fb0ff"/></svg>`};
  for (const r of w) {
    const tr = document.createElement('tr'); tr.dataset.key = `${r.loc},${r.date}`; if (r.date === t) tr.className = 'now';
    const wh = `loc=${r.loc}&date=${r.date}`;
    const td = (cls) => { const c = document.createElement('td'); if (cls) c.className = cls; tr.append(c); return c; };
    const day = td('mx-fc-day'); day.textContent = r.date === t ? 'Oggi' : DAYS[r.dt.getUTCDay()];
    td('mx-fc-ic').append(MX.wxIcon(r.code, 30));
    td('mx-fc-bar v-t').append(rangeBar({label: `Temperatura ${deg(r.tmin)} / ${deg(r.tmax)}, percepita minima ${deg(r.feel_min)}`, dom: [tlo, thi], lo: +r.tmin, hi: +r.tmax, mid: +r.feel_min, midCls: 'feel', fmt: deg, stops: tStops, f: ['tmin', 'tmax', 'feel_min'], where: wh}));
    const p = pk(r); const pc = td('mx-fc-bar mx-fc-pr v-p');
    const ic = document.createElement('span'); ic.className = 'mx-fc-pt';
    if (p) { ic.innerHTML = PI[p.k]; const u = document.createElement('small'); u.textContent = p.u; ic.append(u); ic.title = p.k === 'snow' ? 'Neve (cm)' : 'Pioggia (mm)'; }
    pc.append(ic, rangeBar(p ? {W: 168, label: `${p.k === 'snow' ? 'Neve' : 'Pioggia'} media ${cm(p.mid)} ${p.u}, modelli tra ${cm(p.lo)} e ${cm(p.hi)} ${p.u}`, dom: [0, phi], lo: p.lo, hi: p.hi, mid: p.mid, midCls: p.k, fmt: cm, stops: p.k === 'snow' ? [['0%', '#3b82f6'], ['100%', '#a7ecff']] : [['0%', '#1f5fbf'], ['100%', '#5fb0ff']], f: p.f, where: wh} : {W: 168, label: 'Nessuna precipitazione', dom: [0, phi], stops: [], empty: '0'}));
    const wl = r.wind_min === '' || r.wind_min == null ? 0 : +r.wind_min;
    td('mx-fc-bar v-w').append(rangeBar({label: `Vento tra ${kmh(wl)} e ${kmh(r.wind)} km/h, raffica ${kmh(r.gust)} km/h`, dom: [0, whi], lo: wl, hi: +r.wind, mid: +r.gust, midCls: 'gust', fmt: kmh, stops: [['0%', '#4f7cff'], ['100%', '#bcd9ff']], f: ['wind_min', 'wind', 'gust'], where: wh}));
    const num = (txt, unit, dim) => { const c = td(dim ? 'dim' : ''); c.append(txt); if (unit) { const u = document.createElement('small'); u.textContent = unit; c.append(u); } };
    num(String(r.rh), '%'); num(String(r.sun_h), ' h'); num(String(r.freezing_lvl), ' m');
    tb.append(tr);
  }
});

const cm0 = (v) => (+v > 0 && +v < 1 ? '<1' : String(Math.round(+v)));
dash.draw('k_now', (el) => {
  const d = MX.allRows(); const s = MX.station(); const r = d && d.find((x) => x.date === MX.today());
  if (!r || !s) return MX.dash(el);
  const wh = `loc=${r.loc}&date=${r.date}`; const k = MX.wxKind(r.code);
  const bg = {sun: 'rgba(255,173,51,.16)', partly: 'rgba(255,173,51,.10)', snow: 'rgba(214,236,255,.14)', snowshowers: 'rgba(214,236,255,.12)', rain: 'rgba(47,155,255,.16)', drizzle: 'rgba(47,155,255,.12)', showers: 'rgba(47,155,255,.12)', thunder: 'rgba(255,194,58,.12)'}[k] || 'rgba(188,217,255,.08)';
  el.style.background = `radial-gradient(260px 160px at 0% 0%, ${bg}, transparent 70%)`;
  const top = document.createElement('div'); top.className = 'mx-now';
  const txt = document.createElement('div');
  const lab = document.createElement('p'); lab.className = 'mx-k'; lab.textContent = `Oggi · ${s.name}`;
  const big = document.createElement('div'); big.className = 'mx-v'; big.append(MX.span(`${Math.round(r.tmax)}°`, 'daily', 'tmax', wh)); const mn = document.createElement('small'); mn.className = 'mx-now-min'; mn.append(' / ', MX.span(`${Math.round(r.tmin)}°`, 'daily', 'tmin', wh)); big.append(mn);
  const cond = document.createElement('div'); cond.className = 'mx-now-c'; cond.append(MX.span(MX.wx(r.code), 'daily', 'code', wh));
  txt.append(lab, big, cond); top.append(MX.wxIcon(r.code, 64, 'big'), txt);
  const chips = document.createElement('div'); chips.className = 'mx-chips';
  const chip = (lab2, v, f) => { const c = document.createElement('div'); const l = document.createElement('span'); l.textContent = lab2; c.append(l, MX.span(v, 'daily', f, wh)); chips.append(c); };
  chip('Percepita', `${Math.round(r.feel_min)}°`, 'feel_min'); chip('Neve', `${cm0(r.snow)} cm`, 'snow'); chip('Vento', `${r.wind} km/h`, 'wind');
  chip('Raffiche', `${r.gust} km/h`, 'gust'); chip('Umidità', `${r.rh}%`, 'rh'); chip('Zero termico', `${r.freezing_lvl} m`, 'freezing_lvl');
  el.replaceChildren(top, chips);
});

dash.draw('modelchart', (el) => {
  const m = MX.rows('models'), c = MX.rows('cur');
  if (!m || !c) return nodata(el, ['models'], 'Confronto modelli non disponibile.');
  const d = m.filter((r) => r.loc === MX.st());
  const avg = (c.find((r) => r.loc === MX.st()) || {}).next7;
  const rowH = 34;
  const f = MX.frame(el, d.length * rowH + 30, {t: 6, r: 90, b: 24, l: 10});
  f.svg.attr('aria-label', 'Neve prevista nei prossimi 7 giorni da ciascun modello meteo, con la media');
  const labW = Math.min(150, f.iw * 0.4);
  const x = d3.scaleLinear().domain([0, Math.max(1, avg || 0, d3.max(d, (r) => +r.snow_7d))]).nice().range([labW, f.iw]);
  const y = d3.scaleBand().domain(d.map((r) => r.model)).range([0, d.length * rowH]).padding(0.3);
  f.g.append('g').attr('transform', `translate(0,${d.length * rowH})`).call(d3.axisBottom(x).ticks(f.iw < 420 ? 3 : 6).tickSizeOuter(0));
  f.g.append('g').selectAll('text').data(d).join('text').attr('x', 0).attr('y', (r) => y(r.model) + y.bandwidth() / 2 + 4).text((r) => r.model);
  f.g.append('g').selectAll('rect').data(d).join('rect').attr('x', labW).attr('y', (r) => y(r.model)).attr('height', y.bandwidth()).attr('width', (r) => Math.max(1, x(+r.snow_7d) - labW)).attr('rx', 6).style('fill', (r) => (+r.days < 7 ? '#4a5a74' : MX.grad(f, MX.uid(), C[0], 1, 0.5)));
  f.g.append('g').selectAll('text').data(d).join('text').attr('x', (r) => x(+r.snow_7d) + 6).attr('y', (r) => y(r.model) + y.bandwidth() / 2 + 4).text((r) => `${r.snow_7d} cm${+r.days < 7 ? ` (${r.days} gg)` : ''}`);
  if (avg != null) f.g.append('line').attr('x1', x(avg)).attr('x2', x(avg)).attr('y1', -4).attr('y2', d.length * rowH).style('stroke', '#c9d6ea').attr('stroke-width', 2.5);
  f.g.append('g').selectAll('rect').data(d).join('rect').attr('x', 0).attr('y', (r) => y(r.model)).attr('width', f.iw).attr('height', y.step()).attr('fill', 'transparent')
    .on('mousemove', (e, r) => MX.tip(f, el, e, [r.model, `Giorni coperti: ${r.days} su 7`, `Neve: ${r.snow_7d} cm · precipitazione ${r.precip_7d} mm`, `Neve domani: ${r.snow_tomorrow} cm`, `T max media ${r.tmax_avg}° · T min media ${r.tmin_avg}°`, `Media dei modelli: ${avg} cm`])).on('mouseleave', () => f.tt.style('display', 'none'));
});

const MONTHS = [['ott', 0], ['nov', 31], ['dic', 61], ['gen', 92], ['feb', 123], ['mar', 151], ['apr', 182]];
dash.draw('cumchart', (el) => {
  const pc = MX.rows('past_cum'), cs = MX.rows('cur_season'), med = MX.rows('cummed');
  if (!pc || !cs || !med) return nodata(el, ['past_cum', 'cur_season'], 'Storico non disponibile.');
  const st = MX.st();
  const past = pc.filter((r) => r.loc === st).map((r) => ({season: r.season, v: MX.cum(r.daily)}));
  const cr = cs.find((r) => r.loc === st); const cur = cr ? MX.cum(cr.daily) : [];
  const md = med.filter((r) => r.loc === st).map((r) => r.median);
  const f = MX.frame(el, 330, {t: 24, r: 64, b: 28, l: 40});
  f.svg.attr('aria-label', 'Neve cumulata giorno per giorno dal 1 ottobre, stagione in corso contro le dieci precedenti');
  const x = d3.scaleLinear().domain([0, 211]).range([0, f.iw]);
  const y = d3.scaleLinear().domain([0, d3.max(past, (s) => d3.max(s.v)) || 10]).nice().range([f.ih, 0]);
  f.g.append('g').attr('class', 'grid').call(d3.axisLeft(y).ticks(5).tickSize(-f.iw).tickFormat('')).select('.domain').remove();
  f.g.append('g').attr('transform', `translate(0,${f.ih})`).call(d3.axisBottom(x).tickValues(MONTHS.map((m) => m[1])).tickFormat((v, i) => MONTHS[i][0]).tickSizeOuter(0));
  f.g.append('g').call(d3.axisLeft(y).ticks(5)).call((g) => g.select('.domain').remove());
  f.g.append('text').attr('x', -34).attr('y', -12).text('cm');
  const line = d3.line().x((v, i) => x(i)).y((v) => y(v));
  f.g.append('g').selectAll('path').data(past).join('path').attr('fill', 'none').style('stroke', '#4a5a74').attr('stroke-width', 1.1).attr('opacity', 0.8).attr('d', (s) => line(s.v));
  f.g.append('path').datum(md).attr('fill', 'none').style('stroke', '#c9d6ea').attr('stroke-width', 2).attr('stroke-dasharray', '6 4').attr('d', line);
  if (cur.length) {
    f.g.append('path').datum(cur).style('fill', MX.grad(f, MX.uid(), C[0], 0.3, 0)).attr('d', d3.area().x((v, i) => x(i)).y0(f.ih).y1((v) => y(v)));
    f.g.append('path').datum(cur).attr('fill', 'none').style('stroke', C[0]).attr('stroke-width', 3.2).attr('d', line);
    const lx = cur.length - 1, lv = cur[lx];
    f.g.append('circle').attr('cx', x(lx)).attr('cy', y(lv)).attr('r', 4).style('fill', C[0]).style('filter', 'drop-shadow(0 0 6px #5fd4ff)');
    f.g.append('text').attr('x', x(lx) + 8).attr('y', y(lv) - 8).style('fill', '#e9f0fa').style('font-weight', 600).text(`2026-27: ${lv} cm`);
  }
  const ends = past.map((s) => ({t: s.season, v: s.v[s.v.length - 1]})).sort((a, b) => b.v - a.v);
  if (ends.length) for (const e of [ends[0], ends[ends.length - 1]]) f.g.append('text').attr('x', f.iw + 4).attr('y', y(e.v) + 4).text(e.t);
  const tt = (e) => {
    const [px] = d3.pointer(e, f.g.node()); const i = Math.max(0, Math.min(211, Math.round(x.invert(px))));
    const day = new Date(Date.UTC(2026, 9, 1 + i));
    const lines = [MX.flong(day).trim()];
    if (cur[i] != null) lines.push(`2026-27: ${cur[i]} cm`);
    if (md[i] != null) lines.push(`Mediana: ${md[i]} cm`);
    past.slice().sort((a, b) => (b.v[i] ?? 0) - (a.v[i] ?? 0)).forEach((s) => lines.push(`${s.season}: ${s.v[i] ?? '–'} cm`));
    MX.tip(f, el, e, lines);
  };
  f.g.append('rect').attr('width', f.iw).attr('height', f.ih).attr('fill', 'transparent').on('mousemove', tt).on('mouseleave', () => f.tt.style('display', 'none')).on('touchstart', tt, {passive: true});
});

const barSeasons = (el, d, label, medLabel) => {
  const f = MX.frame(el, 240, {t: 18, r: 8, b: 26, l: 36});
  f.svg.attr('aria-label', label);
  const x = d3.scaleBand().domain(d.map((s) => s.season)).range([0, f.iw]).padding(0.22);
  const y = d3.scaleLinear().domain([0, Math.max(10, d3.max(d, (s) => s.v))]).nice().range([f.ih, 0]);
  const med = MX.median(d.filter((s) => s.season !== '2026-27').map((s) => s.v));
  f.g.append('g').attr('class', 'grid').call(d3.axisLeft(y).ticks(4).tickSize(-f.iw).tickFormat('')).select('.domain').remove();
  const narrow = f.iw < 420;
  f.g.append('g').attr('transform', `translate(0,${f.ih})`).call(d3.axisBottom(x).tickFormat((s, i) => (narrow ? (i % 2 ? '' : "'" + s.slice(2, 4)) : s.slice(2))).tickSizeOuter(0));
  f.g.append('g').call(d3.axisLeft(y).ticks(4)).call((g) => g.select('.domain').remove());
  const gc = MX.grad(f, MX.uid(), C[0], 1, 0.4);
  f.g.append('g').selectAll('rect').data(d).join('rect').attr('x', (s) => x(s.season)).attr('width', x.bandwidth()).attr('y', (s) => y(s.v)).attr('height', (s) => f.ih - y(s.v)).attr('rx', 4).style('fill', (s) => (s.season === '2026-27' ? gc : '#33435e'));
  if (!narrow) f.g.append('g').selectAll('text').data(d).join('text').attr('x', (s) => x(s.season) + x.bandwidth() / 2).attr('y', (s) => y(s.v) - 5).attr('text-anchor', 'middle').text((s) => s.v);
  if (med != null) { f.g.append('line').attr('x1', 0).attr('x2', f.iw).attr('y1', y(med)).attr('y2', y(med)).style('stroke', '#c9d6ea').attr('stroke-dasharray', '6 4').attr('stroke-width', 1.5); }
  f.g.append('g').selectAll('rect').data(d).join('rect').attr('x', (s) => x(s.season)).attr('width', x.step()).attr('y', 0).attr('height', f.ih).attr('fill', 'transparent')
    .on('mousemove', (e, s) => MX.tip(f, el, e, [`Stagione ${s.season}${s.season === '2026-27' ? ' (in corso)' : ''}`, `${medLabel}: ${s.v} cm`, `Mediana 10 anni: ${med} cm`])).on('mouseleave', () => f.tt.style('display', 'none'));
};
dash.draw('todatechart', (el) => {
  const t = MX.rows('todate'); if (!t) return nodata(el, ['past_cum', 'cur_season'], 'Storico non disponibile.');
  barSeasons(el, t.filter((r) => r.loc === MX.st()).map((r) => ({season: r.season, v: r.snow_todate})), 'Neve caduta dal 1 ottobre alla stessa data in ogni stagione', 'Neve alla data');
});
dash.draw('totchart', (el) => {
  const p = MX.rows('past_seasons'), c = MX.rows('cur'); if (!p || !c) return nodata(el, ['past_seasons'], 'Storico non disponibile.');
  const cr = c.find((r) => r.loc === MX.st());
  const d = p.filter((r) => r.loc === MX.st()).map((r) => ({season: r.season, v: +r.snow_total}));
  if (cr) d.push({season: '2026-27', v: cr.todate});
  barSeasons(el, d, 'Neve totale da ottobre ad aprile in ogni stagione', 'Neve totale');
});

dash.draw('seasontable', (tb) => {
  const p = MX.rows('past_seasons'), t = MX.rows('todate'), cs = MX.rows('cur_season');
  tb.replaceChildren();
  if (!p || !t) return;
  const st = MX.st();
  const td = (s) => (t.find((r) => r.loc === st && r.season === s) || {}).snow_todate ?? '–';
  const add = (cells, key, now) => { const tr = document.createElement('tr'); tr.dataset.key = key; if (now) tr.className = 'now'; cells.forEach((c) => { const x = document.createElement('td'); x.textContent = c; tr.append(x); }); tb.append(tr); };
  const c = cs && cs.find((r) => r.loc === st);
  if (c) add(['2026-27 (in corso)', td('2026-27'), `${td('2026-27')} finora`, c.snow_days, c.max_day_snow, c.precip_total, '–'], `${st},2026-27`, true);
  p.filter((r) => r.loc === st).slice().reverse().forEach((s) => add([s.season, td(s.season), s.snow_total, s.snow_days, s.max_day_snow, s.precip_total, `${s.tmean_djf}°`], `${s.loc},${s.season}`, false));
});

dash.draw('allchart', (el) => {
  const c = MX.rows('cur'), st = MX.rows('stations');
  if (!c || !st) return MX.dash(el);
  const d = st.map((s) => ({...s, ...(c.find((r) => r.loc === s.loc) || {})})).filter((r) => r.todate != null);
  const rowH = 34;
  const f = MX.frame(el, d.length * rowH + 30, {t: 6, r: 96, b: 24, l: 10});
  f.svg.attr('aria-label', 'Neve caduta in stagione per ogni stazione contro la mediana di dieci anni');
  const labW = Math.min(190, f.iw * 0.42);
  const x = d3.scaleLinear().domain([0, Math.max(10, d3.max(d, (r) => Math.max(r.todate, r.median)))]).nice().range([labW, f.iw]);
  const y = d3.scaleBand().domain(d.map((r) => r.loc)).range([0, d.length * rowH]).padding(0.3);
  f.g.append('g').attr('transform', `translate(0,${d.length * rowH})`).call(d3.axisBottom(x).ticks(f.iw < 420 ? 3 : 6).tickSizeOuter(0));
  f.g.append('g').selectAll('text').data(d).join('text').attr('x', 0).attr('y', (r) => y(r.loc) + y.bandwidth() / 2 + 4).style('fill', (r) => (r.loc === MX.st() ? '#e9f0fa' : null)).style('font-weight', (r) => (r.loc === MX.st() ? 600 : null)).text((r) => `${r.resort.replace('Madonna di ', '')} · ${r.name}`);
  const gc = MX.grad(f, MX.uid(), C[0], 1, 0.5);
  f.g.append('g').selectAll('rect').data(d).join('rect').attr('x', labW).attr('y', (r) => y(r.loc)).attr('height', y.bandwidth()).attr('width', (r) => Math.max(1, x(r.todate) - labW)).attr('rx', 6).style('fill', gc).attr('opacity', (r) => (r.loc === MX.st() ? 1 : 0.6));
  f.g.append('g').selectAll('line').data(d).join('line').attr('x1', (r) => x(r.median)).attr('x2', (r) => x(r.median)).attr('y1', (r) => y(r.loc) - 3).attr('y2', (r) => y(r.loc) + y.bandwidth() + 3).style('stroke', '#c9d6ea').attr('stroke-width', 2.5);
  f.g.append('g').selectAll('text').data(d).join('text').attr('x', (r) => Math.max(x(r.todate), x(r.median)) + 6).attr('y', (r) => y(r.loc) + y.bandwidth() / 2 + 4).style('fill', (r) => (r.diff_pct >= 0 ? '#43e3a1' : '#ff6b7d')).text((r) => `${r.todate} cm (${r.diff_pct > 0 ? '+' : ''}${r.diff_pct}%)`);
  f.g.append('g').selectAll('rect').data(d).join('rect').attr('x', 0).attr('y', (r) => y(r.loc)).attr('width', f.iw).attr('height', y.step()).attr('fill', 'transparent').style('cursor', 'pointer')
    .on('mousemove', (e, r) => MX.tip(f, el, e, [`${r.resort} – ${r.name} (${r.elevation} m)`, `2026-27 al ${MX.flong(MX.date(r.asof)).trim()}: ${r.todate} cm`, `Mediana 10 anni: ${r.median} cm`, `Posizione: ${r.rank}ª su ${r.of}`, `Prossimi 7 giorni: ${r.next7} cm`])).on('mouseleave', () => f.tt.style('display', 'none'))
    .on('click', (e, r) => dash.setParams({st: r.loc}));
});

/* sezione webcam: una scheda per stazione, come nell'app delle webcam */
const SKY = {sun: ['#2d6fb8', '#7fb6e6'], partly: ['#3a6797', '#8fb3d6'], cloud: ['#4a5a70', '#8a99ad'], fog: ['#5b6676', '#a4adb9'], drizzle: ['#3c4c63', '#7c8ba0'], rain: ['#2f3d52', '#6b7b92'], snow: ['#5d6f88', '#c3d0de'], showers: ['#3f5a7a', '#93a9c2'], snowshowers: ['#55708f', '#bfcfe0'], thunder: ['#262c3a', '#59647a']};
const scene = (k, snowy, id) => {
  const s = SKY[k] || SKY.cloud;
  return `<svg viewBox="0 0 400 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="s${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s[0]}"/><stop offset="1" stop-color="${s[1]}"/></linearGradient><linearGradient id="m${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9f0fa"/><stop offset=".55" stop-color="#c9d6ea"/><stop offset="1" stop-color="#8fa1ba"/></linearGradient></defs>`
    + `<rect width="400" height="180" fill="url(#s${id})"/>`
    + `<path d="M0 120 60 70 95 98 150 40 205 92 245 62 300 110 350 75 400 105V180H0z" fill="#6f819b" opacity=".55"/>`
    + `<path d="M0 150 70 95 120 125 185 72 250 128 300 98 400 140V180H0z" fill="${snowy ? 'url(#m' + id + ')' : '#5b6b82'}"/>`
    + `<path d="M150 40 165 56 157 54 172 70 150 62 138 66 150 40z" fill="#fff" opacity="${snowy ? 0.85 : 0.5}"/><path d="M185 72 198 86 190 85 202 98 184 92 172 96z" fill="#fff" opacity="${snowy ? 0.9 : 0.35}"/></svg>`;
};
dash.draw('webcams', (el) => {
  const st = MX.rows('stations'), d = MX.rows('daily'), c = MX.rows('cur'), t = MX.today();
  if (!st || !d || !t) return MX.dash(el);
  el.replaceChildren(...st.map((s, i) => {
    const r = d.find((x) => x.loc === s.loc && x.date === t) || {}; const cu = (c || []).find((x) => x.loc === s.loc) || {};
    const wh = `loc=${s.loc}&date=${t}`;
    const a = document.createElement('a'); a.className = 'mx-wc'; a.href = s.webcam_url; a.rel = 'noopener';
    a.setAttribute('aria-label', `Apri la webcam live di ${s.resort} – ${s.name}`);
    const pic = document.createElement('div'); pic.className = 'mx-wc-pic';
    const pano = window.MX_REMOTE_IMG && s.pano ? `https://panodata.panomax.com/cams/${s.pano}/recent_reduced.jpg` : '';
    if (pano) {
      /* panoramica Panomax a 360°: si apre al centro e si può far scorrere col dito */
      const sc = document.createElement('div'); sc.className = 'mx-wc-scroll';
      const im = document.createElement('img'); im.src = pano; im.alt = `Webcam ${s.resort} – ${s.name} (Panomax)`; im.loading = 'lazy'; im.decoding = 'async';
      im.onload = () => { sc.scrollLeft = (sc.scrollWidth - sc.clientWidth) / 2; };
      im.onerror = () => { pic.classList.remove('has-photo'); sc.remove(); pic.insertAdjacentHTML('afterbegin', scene(MX.wxKind(r.code), +r.snow_depth > 5, 'wc' + i)); };
      sc.append(im); pic.append(sc); pic.classList.add('has-photo');
    } else if (s.webcam_img) { const im = document.createElement('img'); im.src = s.webcam_img; im.alt = `Webcam ${s.resort} – ${s.name}`; im.loading = 'lazy'; pic.append(im); }
    else pic.innerHTML = scene(MX.wxKind(r.code), +r.snow_depth > 5, 'wc' + i);
    const ov = document.createElement('div'); ov.className = 'mx-wc-ov';
    if (r.code != null) ov.append(MX.wxIcon(r.code, 40));
    const tv = document.createElement('div'); tv.className = 'mx-wc-t';
    if (r.tmax != null) tv.append(MX.span(`${Math.round(r.tmax)}°`, 'daily', 'tmax', wh), document.createElement('br'), MX.span(MX.wx(r.code), 'daily', 'code', wh));
    ov.append(tv);
    const live = document.createElement('span'); live.className = 'mx-wc-live'; live.textContent = pano ? 'Panomax · live ↗' : s.webcam_img ? 'Foto delle 8 · live ↗' : 'Live ↗';
    pic.append(ov, live);
    const bar = document.createElement('div'); bar.className = 'mx-wc-bar';
    const nm = document.createElement('b'); nm.append(MX.span(`${s.resort} - ${s.name}`, 'stations', 'name', `loc=${s.loc}`));
    const q = document.createElement('span'); q.append(MX.span(`${s.elevation} m`, 'stations', 'elevation', `loc=${s.loc}`));
    bar.append(nm, q);
    const ft = document.createElement('div'); ft.className = 'mx-wc-ft';
    const chip = (lab, v, src, f, w) => { const x = document.createElement('span'); x.append(lab + ' ', MX.span(v, src, f, w)); ft.append(x); };
    if (r.snow_depth != null) chip('Manto', `${r.snow_depth} cm`, 'daily', 'snow_depth', wh);
    if (r.snow != null) chip('Oggi', `${cm0(r.snow)} cm`, 'daily', 'snow', wh);
    if (cu.next7 != null) chip('7 giorni', `+${cu.next7} cm`, 'cur', 'next7', `loc=${s.loc}`);
    a.append(pic, bar, ft);
    return a;
  }));
});
}
