import React from 'react'
import { fmtCurrency, fmtNumber, fmtPercent, percentMetrics, currencyMetrics, lowerIsBetter } from '../utils.js'

export default function VarianceTable({ rows, metrics }){
  return (
    <div className="card glow rounded-2xl p-4 fade-in">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Budget vs Actual Variance</h3>
        <span className="text-xs text-slate-400">Green = favorable, Red = unfavorable</span>
      </div>
      <div className="overflow-auto">
        <table className="table-auto w-full text-sm">
          <thead>
            <tr className="text-slate-400">
              <th className="text-left py-2 pr-2">Month</th>
              {metrics.map(m=> <th key={m} className="text-right px-2">{m} Δ</th>)}
              {metrics.map(m=> <th key={m+'p'} className="text-right px-2">{m} Δ%</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx)=>{
              return (
                <tr key={idx} className="hover:bg-white/5">
                  <td className="py-2 pr-2 text-slate-300">{r.Month}</td>
                  {metrics.map(m=>{
                    const a = r[m+'_Actual']; const b = r[m+'_Budget'];
                    const delta = (a!=null && b!=null) ? (a-b) : null;
                    const better = lowerIsBetter.has(m) ? (delta<=0) : (delta>=0);
                    const cls = better ? 'text-green-400' : 'text-red-400';
                    const f = percentMetrics.has(m) ? fmtPercent : (currencyMetrics.has(m) ? fmtCurrency : fmtNumber);
                    return <td key={m+'d'} className={`text-right px-2 ${cls}`}>{percentMetrics.has(m) ? fmtPercent(delta) : f(delta)}</td>
                  })}
                  {metrics.map(m=>{
                    const a = r[m+'_Actual']; const b = r[m+'_Budget'];
                    const pct = (a!=null && b) ? ((a-b) / (Math.abs(b)||1)) : null;
                    const better = lowerIsBetter.has(m) ? (pct<=0) : (pct>=0);
                    const cls = better ? 'text-green-400' : 'text-red-400';
                    return <td key={m+'p'} className={`text-right px-2 ${cls}`}>{fmtPercent(pct)}</td>
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
