import React, { useEffect, useRef } from 'react'
import { fmtCurrency, fmtNumber, fmtPercent, percentMetrics, currencyMetrics, lowerIsBetter } from '../utils.js'
import Chart from 'chart.js/auto'

function SmallSpark({ labels, values }){
  const ref = useRef(null)
  useEffect(()=>{
    if (!ref.current) return
    const ctx = ref.current.getContext('2d')
    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{ data: values, tension: .35, borderWidth:2, pointRadius:0, fill:false }]
      },
      options: {
        responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{ display:false }, tooltip:{ enabled:false } },
        scales:{ x:{ display:false }, y:{ display:false } }
      }
    })
    return ()=> chart.destroy()
  }, [labels, values])
  return <div className="sparkline h-12 mt-1"><canvas ref={ref}/></div>
}

export default function KPI({ name, actual, budget, last12 }){
  const better = lowerIsBetter.has(name) ? (actual <= budget) : (actual >= budget)
  const badge = better ? 'bg-green-950/40 border-green-500/30 text-green-300' : 'bg-red-950/40 border-red-500/30 text-red-300'
  const format = percentMetrics.has(name) ? fmtPercent : (currencyMetrics.has(name) ? fmtCurrency : fmtNumber)
  return (
    <div className="kpi card glow rounded-2xl p-4 fade-in">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-slate-300 text-xs uppercase tracking-wider">{name}</div>
          <div className="text-2xl font-semibold mt-1">{format(actual)}</div>
        </div>
        <span className={`badge px-2 py-1 rounded-lg text-xs ${badge}`}>
          {better ? '▲ vs Budget' : '▼ vs Budget'}
        </span>
      </div>
      {last12?.length ? <SmallSpark labels={last12.map(r=>r.Month)} values={last12.map(r=>r.val)} /> : null}
    </div>
  )
}
