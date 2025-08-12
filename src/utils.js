export const currencyMetrics = new Set(['MRR','ARR','Revenue','COGS','Sales & Marketing','R&D','G&A','OpEx','EBITDA','CAC','LTV']);
export const percentMetrics = new Set(['Gross Margin %','EBITDA Margin','NRR %','GRR %','Magic Number','Rule of 40','YoY Growth','Churn Rate']);
export const lowerIsBetter = new Set(['COGS','OpEx','Sales & Marketing','R&D','G&A','CAC','Churn Rate']);

export function parseNumber(x){
  if (x === null || x === undefined) return null;
  if (typeof x === 'number') return x;
  const s = String(x).replace(/[,$]/g,'').replace(/%/g,'').trim();
  const v = parseFloat(s);
  return Number.isNaN(v) ? null : v;
}
export function fmtCurrency(v){
  if (v==null || Number.isNaN(v)) return '—';
  return v.toLocaleString(undefined, { style:'currency', currency:'USD', maximumFractionDigits:0 });
}
export function fmtPercent(v){
  if (v==null || Number.isNaN(v)) return '—';
  return (v*100).toFixed(1)+'%';
}
export function fmtNumber(v){
  if (v==null || Number.isNaN(v)) return '—';
  return v.toLocaleString();
}
export function monthToKey(d){
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  return dt.toISOString().slice(0,7);
}

export function deriveMetrics(row){
  const out = { ...row };
  const Revenue = parseNumber(out['Revenue']);
  const COGS    = parseNumber(out['COGS']);
  const SM      = parseNumber(out['Sales & Marketing']);
  const RD      = parseNumber(out['R&D']);
  const GA      = parseNumber(out['G&A']);

  const OpEx = ('OpEx' in out) ? parseNumber(out['OpEx']) : ( (SM ?? 0) + (RD ?? 0) + (GA ?? 0) );
  if (!('OpEx' in out)) out['OpEx'] = OpEx;

  const EBITDA = ('EBITDA' in out) ? parseNumber(out['EBITDA']) : ( (Revenue ?? 0) - (COGS ?? 0) - (OpEx ?? 0) );
  out['EBITDA'] = EBITDA;

  const EBITDA_Margin = ('EBITDA Margin' in out) ? parseNumber(out['EBITDA Margin']) : (Revenue ? (EBITDA/Revenue) : null);
  out['EBITDA Margin'] = EBITDA_Margin;

  const GM = ('Gross Margin %' in out) ? parseNumber(out['Gross Margin %']) : (Revenue ? (1 - (COGS ?? 0) / Revenue) : null);
  out['Gross Margin %'] = GM;

  const MRR = ('MRR' in out) ? parseNumber(out['MRR']) : ( ('ARR' in out) ? parseNumber(out['ARR'])/12 : null );
  const ARR = ('ARR' in out) ? parseNumber(out['ARR']) : ( (MRR!=null) ? MRR*12 : null );
  if (MRR!=null) out['MRR'] = MRR;
  if (ARR!=null) out['ARR'] = ARR;

  const YoY = ('YoY Growth' in out) ? parseNumber(out['YoY Growth']) : null;
  const rule40 = (YoY!=null && EBITDA_Margin!=null) ? (YoY + EBITDA_Margin) : null;
  out['Rule of 40'] = rule40;

  return out;
}

export function combineActualBudget(actualRows, budgetRows){
  const A = {};
  actualRows.forEach(r=>{ A[monthToKey(r['Month'])] = r; });
  const merged = [];

  budgetRows.forEach(b=>{
    const key = monthToKey(b['Month']);
    const a = A[key] || { Month: b['Month'] };
    const row = { Month: key };
    const cols = new Set([...Object.keys(a), ...Object.keys(b)]);
    cols.delete('Month');
    cols.forEach(c=>{
      if (/_Actual$/i.test(c)){
        const base = c.replace(/_Actual$/i,'');
        row[base+'_Actual'] = a[c] ?? b[c];
      } else if (/_Budget$/i.test(c)){
        const base = c.replace(/_Budget$/i,'');
        row[base+'_Budget'] = b[c] ?? a[c];
      } else {
        const fromA = a[c];
        const fromB = b[c];
        if (fromA!=null) row[c+'_Actual'] = fromA;
        if (fromB!=null) row[c+'_Budget'] = fromB;
      }
    });
    merged.push(row);
  });

  Object.keys(A).forEach(key=>{
    if (!merged.find(r=>r.Month===key)){
      const a = A[key];
      const row = { Month: key };
      Object.keys(a).forEach(c=>{
        if (c==='Month') return;
        if (/_Actual$/i.test(c)) row[c] = a[c];
        else row[c+'_Actual'] = a[c];
      });
      merged.push(row);
    }
  });

  const result = merged.map(r=>{
    const out = { Month: r.Month };
    const bases = new Set();
    Object.keys(r).forEach(k=>{
      if (k==='Month') return;
      const m = k.match(/(.+)_(Actual|Budget)$/);
      if (m) bases.add(m[1]);
    });
    bases.forEach(base=>{
      const aKey = base+'_Actual';
      const bKey = base+'_Budget';
      if (aKey in r) out[aKey] = r[aKey];
      if (bKey in r) out[bKey] = r[bKey];
    });

    const actualView = {};
    const budgetView = {};
    Object.keys(out).forEach(k=>{
      const m = k.match(/(.+)_(Actual|Budget)$/);
      if (m){
        const base = m[1]; const side = m[2];
        if (side==='Actual') actualView[base] = parseNumber(out[k]);
        else budgetView[base] = parseNumber(out[k]);
      }
    });
    const dA = deriveMetrics(actualView);
    const dB = deriveMetrics(budgetView);
    Object.keys(dA).forEach(base=> out[base+'_Actual'] = dA[base]);
    Object.keys(dB).forEach(base=> out[base+'_Budget'] = dB[base]);
    return out;
  });

  result.sort((a,b)=> (a.Month<b.Month?-1:1));
  return result;
}
