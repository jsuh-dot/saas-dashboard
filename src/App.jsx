import React, { useEffect, useMemo, useRef, useState } from 'react'
import Papa from 'papaparse'
import Chart from 'chart.js/auto'
import KPI from './components/KPI.jsx'
import VarianceTable from './components/VarianceTable.jsx'
import { combineActualBudget, fmtCurrency, fmtPercent } from './utils.js'

function useCSVData(){
  const [state, setState] = useState({ rows: [], ready: false, error: null })
  useEffect(()=>{
    (async ()=>{
      try {
        const [actuals, budget] = await Promise.all([
          fetch('/public/actuals.csv').then(r=>r.text()),
          fetch('/public/budget.csv').then(r=>r.text())
        ])
        const parse = (csv)=> new Promise(res=> Papa.parse(csv, { header:true, complete: (r)=> res(r.data.filter(r=>Object.values(r).some(v=>String(v).trim()!==''))) }))
        const [aRows, bRows] = await Promise.all([parse(actuals), parse(budget)])
        const merged = combineActualBudget(aRows, bRows)
        setState({ rows: merged, ready:true, error:null })
      } catch(e){
        console.error(e)
        setState({ rows: [], ready:true, error: e.message || String(e) })
      }
    })()
  }, [])
  return state
}

function useCharts(){
  const refs = {
    mrr: useRef(null),
    revExp: useRef(null),
    gm: useRef(null),
    cacLtv: useRef(null),
    ebitda: useRef(null),
  }

  useEffect(()=>{
    return ()=>{} // cleanup handled per chart creation
  }, [])

  function lineDual(ref, labels, seriesA, seriesB, labelA, labelB, valueFormatter){
    if (!ref.current) return null
    const ctx = ref.current.getContext('2d')
    const chart = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets: [
        { label: labelA, data: seriesA, tension:.35, borderWidth:2, pointRadius:0 },
        { label: labelB, data: seriesB, tension:.35, borderWidth:2, pointRadius:0, borderDash:[6,6] },
      ]},
      options: {
        responsive:true,
        interaction:{ mode:'index', intersect:false },
        plugins:{
          legend:{ labels:{ color:'#cbd5e1' } },
          tooltip:{ callbacks:{ label:(ctx)=> `${ctx.dataset.label}: ${valueFormatter(ctx.raw)}` } }
        },
        scales:{
          x:{ ticks:{ color:'#94a3b8' }, grid:{ color:'rgba(255,255,255,0.05)' } },
          y:{ ticks:{ color:'#94a3b8' }, grid:{ color:'rgba(255,255,255,0.05)' } }
        }
      }
    })
    return chart
  }

  function lineSingle(ref, labels, data, label, valueFormatter){
    if (!ref.current) return null
    const ctx = ref.current.getContext('2d')
    const chart = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets: [{ label, data, tension:.35, borderWidth:2, pointRadius:0 }] },
      options: {
        responsive:true,
        plugins:{
          legend:{ labels:{ color:'#cbd5e1' } },
          tooltip:{ callbacks:{ label:(ctx)=> `${label}: ${valueFormatter(ctx.raw)}` } }
        },
        scales:{
          x:{ ticks:{ color:'#94a3b8' }, grid:{ color:'rgba(255,255,255,0.05)' } },
          y:{ ticks:{ color:'#94a3b8' }, grid:{ color:'rgba(255,255,255,0.05)' } }
        }
      }
    })
    return chart
  }

  return { refs, lineDual, lineSingle }
}

export default function App(){
  const { rows, ready, error } = useCSVData()
  const charts = useCharts()

  useEffect(()=>{
    if (!ready || rows.length===0) return
    const labels = rows.map(r=>r.Month)
    const get = m => rows.map(r=>r[m+'_Actual'] ?? null)
    const getB = m => rows.map(r=>r[m+'_Budget'] ?? null)

    const mrrA = get('MRR'), mrrB = getB('MRR')
    const revA = get('Revenue'), cogsA = get('COGS'), opexA = get('OpEx')
    const gmA  = get('Gross Margin %')
    const cacA = get('CAC'), ltvA = get('LTV')
    const ebA  = get('EBITDA'), ebmA = get('EBITDA Margin')

    const mrrChart = charts.lineDual(charts.refs.mrr, labels, mrrA, mrrB, 'MRR Actual', 'MRR Budget', v=>fmtCurrency(v))

    let revExpChart = null
    if (charts.refs.revExp.current){
      const ctx = charts.refs.revExp.current.getContext('2d')
      revExpChart = new Chart(ctx, {
        type:'line',
        data: { labels, datasets: [
          { label:'Revenue', data:revA, tension:.35, borderWidth:2, pointRadius:0 },
          { label:'COGS', data:cogsA, tension:.35, borderWidth:2, pointRadius:0, borderDash:[6,6] },
          { label:'OpEx', data:opexA, tension:.35, borderWidth:2, pointRadius:0, borderDash:[2,4] }
        ]},
        options: {
          responsive:true, interaction:{ mode:'index', intersect:false },
          plugins:{ legend:{ labels:{ color:'#cbd5e1' } }, tooltip:{ callbacks:{ label:(ctx)=> `${ctx.dataset.label}: ${fmtCurrency(ctx.raw)}` } } },
          scales:{ x:{ ticks:{ color:'#94a3b8' }, grid:{ color:'rgba(255,255,255,0.05)'} }, y:{ ticks:{ color:'#94a3b8' }, grid:{ color:'rgba(255,255,255,0.05)' } } }
        }
      })
    }

    const gmChart  = charts.lineSingle(charts.refs.gm, labels, gmA, 'Gross Margin %', v=>fmtPercent(v))
    const cacLtvChart = charts.lineDual(charts.refs.cacLtv, labels, cacA, ltvA, 'CAC', 'LTV', v=>fmtCurrency(v))

    let ebChart = null
    if (charts.refs.ebitda.current){
      const ctx = charts.refs.ebitda.current.getContext('2d')
      ebChart = new Chart(ctx, {
        type:'line',
        data: { labels, datasets: [
          { label:'EBITDA', data:ebA, tension:.35, borderWidth:2, pointRadius:0, yAxisID:'y' },
          { label:'EBITDA Margin', data:ebmA, tension:.35, borderWidth:2, pointRadius:0, yAxisID:'y1' }
        ]},
        options: {
          responsive:true, interaction:{ mode:'index', intersect:false },
          plugins:{
            legend:{ labels:{ color:'#cbd5e1' } },
            tooltip:{ callbacks:{ label:(ctx)=> ctx.dataset.label.includes('Margin') ? `EBITDA Margin: ${fmtPercent(ctx.raw)}` : `EBITDA: ${fmtCurrency(ctx.raw)}` } }
          },
          scales:{
            x:{ ticks:{ color:'#94a3b8' }, grid:{ color:'rgba(255,255,255,0.05)'} },
            y:{ position:'left', ticks:{ color:'#94a3b8' }, grid:{ color:'rgba(255,255,255,0.05)'} },
            y1:{ position:'right', ticks:{ color:'#94a3b8', callback:(v)=> (v*100).toFixed(0)+'%' }, grid:{ drawOnChartArea:false } }
          }
        }
      })
    }

    return ()=>{
      mrrChart && mrrChart.destroy()
      revExpChart && revExpChart.destroy()
      gmChart && gmChart.destroy()
      cacLtvChart && cacLtvChart.destroy()
      ebChart && ebChart.destroy()
    }
  }, [ready, rows.length])

  if (!ready){
    return <div className="min-h-screen flex items-center justify-center"><div className="text-slate-300">Loading dashboard…</div></div>
  }
  if (error){
    return <div className="min-h-screen flex items-center justify-center"><div className="text-red-400">Error: {error}</div></div>
  }
  if (rows.length===0){
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-xl text-center text-slate-300">
          <h1 className="text-2xl font-bold mb-2">No data loaded yet</h1>
          <p className="text-slate-400">Place your CSVs in <code>/public/actuals.csv</code> and <code>/public/budget.csv</code> and refresh.</p>
        </div>
      </div>
    )
  }

  const last = rows[rows.length-1] || {}
  const headline = ['MRR','Revenue','Gross Margin %','EBITDA','EBITDA Margin','Rule of 40']
  const kpis = headline.map(name=>{
    const actual = last[name+'_Actual']
    const budget = last[name+'_Budget']
    const series = rows.slice(-12).map(r=>({ Month:r.Month, val:r[name+'_Actual'] }))
    return <KPI key={name} name={name} actual={actual} budget={budget} last12={series} />
  })

  const metrics = ['MRR','Revenue','COGS','Gross Margin %','Sales & Marketing','R&D','G&A','OpEx','EBITDA','EBITDA Margin','CAC','LTV','Churn Rate','Rule of 40']
  const varRows = rows.map(r=>{
    const obj = { Month: r.Month }
    metrics.forEach(m=>{
      obj[m+'_Actual'] = r[m+'_Actual']
      obj[m+'_Budget'] = r[m+'_Budget']
    })
    return obj
  })

  return (
    <div className="max-w-7xl mx-auto p-5 md:p-8 space-y-6">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">SaaS Finance Dashboard</h1>
          <p className="text-slate-400">Actual vs Budget • Replace CSVs in /public</p>
        </div>
        <div className="text-sm text-slate-400">{new Date().toLocaleString()}</div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">{kpis}</section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card glow rounded-2xl p-4 fade-in">
          <h3 className="text-lg font-semibold mb-2">MRR: Actual vs Budget</h3>
          <canvas ref={charts.refs.mrr} height="160"></canvas>
        </div>
        <div className="card glow rounded-2xl p-4 fade-in">
          <h3 className="text-lg font-semibold mb-2">Revenue vs COGS vs OpEx</h3>
          <canvas ref={charts.refs.revExp} height="160"></canvas>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card glow rounded-2xl p-4 fade-in">
          <h3 className="text-lg font-semibold mb-2">Gross Margin %</h3>
          <canvas ref={charts.refs.gm} height="160"></canvas>
        </div>
        <div className="card glow rounded-2xl p-4 fade-in">
          <h3 className="text-lg font-semibold mb-2">CAC vs LTV</h3>
          <canvas ref={charts.refs.cacLtv} height="160"></canvas>
        </div>
        <div className="card glow rounded-2xl p-4 fade-in">
          <h3 className="text-lg font-semibold mb-2">EBITDA & EBITDA Margin</h3>
          <canvas ref={charts.refs.ebitda} height="160"></canvas>
        </div>
      </section>

      <VarianceTable rows={varRows} metrics={metrics} />
    </div>
  )
}
