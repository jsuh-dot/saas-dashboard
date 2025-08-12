# SaaS Finance Dashboard — Vite + React + Tailwind

A production-ready SaaS finance dashboard that merges Actuals and Budget CSVs, computes derived metrics, and visualizes KPIs and trends.

## Open in StackBlitz
Click the badge below once you've pushed this repo to GitHub (replace `YOUR_GITHUB_USERNAME` if you rename the repo):

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/YOUR_GITHUB_USERNAME/saas-finance-dashboard?file=index.html)

## Deploy to Netlify (optional)
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/YOUR_GITHUB_USERNAME/saas-finance-dashboard)

---

## Quick Start (Local)
```bash
npm i
npm run dev
```

## Data Format
- Place your CSVs in `/public/actuals.csv` and `/public/budget.csv`.
- Columns follow `<Metric>_Actual` and `<Metric>_Budget` (e.g., `Revenue_Actual`).
- Derived metrics are automatically computed when missing:
  - Gross Margin % = 1 – (COGS / Revenue)
  - OpEx = Sales & Marketing + R&D + G&A
  - EBITDA = Revenue – COGS – OpEx
  - EBITDA Margin = EBITDA / Revenue
  - Rule of 40 = YoY Growth + EBITDA Margin

## What’s Included
- Dark, responsive UI with KPI cards (sparklines), charts (Chart.js), and a variance table.
- CSV parsing via PapaParse; merge on `Month`.
- Favorable/Unfavorable coloring logic (costs & churn invert).

## Rename Instructions
1. Push this folder to GitHub as `saas-finance-dashboard` (recommended).
2. Replace `YOUR_GITHUB_USERNAME` in the badge links above with your GitHub handle.
3. If you change the repo name, update the URLs accordingly.
