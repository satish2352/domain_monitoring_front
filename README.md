# PULSE — Frontend (standalone)

React + TypeScript + Vite + MUI. This folder is self-contained and can be installed,
built, and run on its own — no monorepo root required.

## Requirements
- Node **>= 18**

## Run (development)
```bash
npm install
cp .env.example .env        # set VITE_API_TARGET to your backend URL
npm run dev                 # Vite dev server on :5173
```
The SPA always calls `/api/...`. In dev, Vite proxies those requests to
`VITE_API_TARGET` (default `http://localhost:4000`), so the backend can live anywhere.

## Run (production build)
```bash
npm install
npm run build               # type-checks, outputs a static SPA to dist/
npm run preview             # serve the built dist/ locally
```
In production, serve `dist/` from any static host (or the included nginx config) and
proxy `/api` to the backend.
