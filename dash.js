/* Piccolo motore della pagina pubblica: carica i CSV, calcola i dati derivati e ridisegna. */
(function () {
  const DATASETS = ['stations', 'obs_2026_11', 'obs_2026_12', 'obs_2027_01', 'obs_2027_02', 'obs_2027_03', 'obs_2027_04', 'fc', 'models', 'cur_season', 'past_cum', 'past_seasons', 'avalanche'];
  const store = {}; const calcs = []; const draws = []; const dataCbs = [];
  DATASETS.forEach((id) => { store[id] = {status: 'loading'}; });
  let params = {st: 'pradalago', range: '30'};
  try { const p = JSON.parse(localStorage.getItem('meteo-params') || 'null'); if (p) params = {...params, ...p}; } catch (e) {}
  const num = /^-?\d+(\.\d+)?$/;
  const typed = (rows) => rows.map((r) => { const o = {}; for (const k in r) { const v = r[k]; o[k] = num.test(v) ? +v : v; } return o; });
  const runCalcs = () => {
    for (const c of calcs) {
      const ins = c.inputs.map((i) => store[i]);
      if (ins.some((x) => x.status !== 'ok')) { store[c.id] = {status: ins.some((x) => x.status === 'error') ? 'error' : 'loading'}; continue; }
      try { store[c.id] = {status: 'ok', data: c.fn(...ins.map((x) => x.data))}; } catch (e) { console.error(c.id, e); store[c.id] = {status: 'error'}; }
    }
  };
  const runDraws = () => {
    for (const d of draws) document.querySelectorAll(`[data-draw="${d.key}"]`).forEach((el) => { try { d.fn(el); } catch (e) { console.error(d.key, e); } });
    dataCbs.forEach((f) => { try { f(); } catch (e) { console.error(e); } });
  };
  window.dash = {
    data: (id) => store[id] || {status: 'error'},
    calc: (id, spec) => { calcs.push({id, inputs: spec.inputs, fn: spec.fn}); store[id] = {status: 'loading'}; },
    draw: (key, fn) => { draws.push({key, fn}); },
    onData: (fn) => { dataCbs.push(fn); },
    params: () => params,
    setParams: (p) => { params = {...params, ...p}; try { localStorage.setItem('meteo-params', JSON.stringify(params)); } catch (e) {} runDraws(); }
  };
  const load = async () => {
    await Promise.all(DATASETS.map(async (id) => {
      try { const r = await fetch(`data/${id}.csv?v=${Date.now().toString().slice(0, -5)}`); if (!r.ok) throw new Error(r.status); store[id] = {status: 'ok', data: typed(d3.csvParse(await r.text()))}; }
      catch (e) { store[id] = {status: 'error'}; }
    }));
    const st = store.stations.status === 'ok' ? store.stations.data : [];
    if (st.length && !st.some((s) => s.loc === params.st)) params.st = st[0].loc;
    runCalcs(); runDraws();
  };
  let w = window.innerWidth, t;
  window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(() => { if (Math.abs(window.innerWidth - w) > 20) { w = window.innerWidth; runDraws(); } }, 200); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load); else load();
})();
