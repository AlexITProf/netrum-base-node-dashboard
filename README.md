# NetrumLabs Base Node Dashboard

Public, frontend-only dashboard for monitoring NetrumLabs Base nodes.

This project is designed as a lightweight, stateless interface that works entirely with public endpoints and does not introduce additional backend infrastructure.

Live Demo
👉 https://netrum-base-node-dashboard.vercel.app

---

## Features

- Active node list with status and metrics overview
- Client-side rewards estimation (no backend, no batch API calls)
- Node details page with:
  - Node metadata and metrics
  - Mining status and timing
  - Read-only token balance via external RPC (UX-only feature)
- Rate-limit–aware architecture
- Fully public, stateless frontend

---

## Architecture & Design Decisions

### Frontend-only architecture

The dashboard is intentionally implemented without a backend or database.

All node-related data is fetched directly from **NetrumLabs Public API endpoints**.  
This approach:

- Eliminates backend maintenance
- Avoids duplicating authoritative data
- Keeps infrastructure cost and complexity at zero
- Ensures the dashboard always reflects live public data

The dashboard intentionally uses a single aggregated API request with a fixed refresh interval.
This design minimizes load on the public API and avoids excessive polling,
at the cost of slightly longer initial load time for large node sets.

---

### Rewards calculation strategy

Rewards on the main dashboard are **estimated client-side** instead of being fetched per node from the API.

**Reason:**
- Per-node reward endpoints are rate-limited
- Mass reward fetching for all nodes would create unnecessary load on public endpoints

**Trade-off:**
- Displayed values are approximate
- Exact mined or claimable amounts require an individual node request

This design prioritizes API stability and responsible public endpoint usage.

---

### External RPC usage

Token balance is fetched via a third-party **read-only RPC endpoint**.

Important notes:
- Used **only** on the node details page
- Not required for core dashboard functionality
- Never used for status, metrics, or rewards calculations
- Clearly labeled in the UI as external data

This is an optional UX enhancement, not a system dependency.

---

## Tech Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Deployed on Vercel

---

## Limitations

- Rewards shown on the main dashboard are estimations
- Exact rewards require per-node API access
- External RPC data may be unavailable or delayed
- No historical data storage (stateless design)

---

## Live Demo 
Public deployment on 

👉 https://explorer.netrumlabs.alexit.xyz

---

## Repository

👉 https://github.com/AlexITProf/netrum-base-node-dashboard

---

## Local Development

This project is frontend-only and does not require any backend or database.

### Prerequisites
- Node.js 18+
- npm or pnpm

### Install & Run

```bash
git clone https://github.com/AlexITProf/netrum-base-node-dashboard.git
cd netrum-base-node-dashboard
npm install
npm run dev
```

Open http://localhost:3000 
in your browser.

Notes:
*Initial load may take longer due to fetching and caching a large public nodes dataset.
*No private keys or credentials are required.
*External RPC is used only on the Node Details page and is read-only.

---

## Disclaimer

This project is an independent, community-built dashboard  
and is **not an official NetrumLabs product**.

All displayed data is sourced from public endpoints.
