# Nabajaran Club frontend

The frontend is a React and TypeScript application built with Vite and Tailwind CSS. It contains the public community website and the first increment of the admin dashboard.

## Run locally

Start the backend first (see [backend/HELP.md](../backend/HELP.md)), then run:

```powershell
npm install
npm run dev
```

Vite proxies requests under `/api` to `http://localhost:8080`. Open the local URL printed by Vite, normally `http://localhost:5173`.

## Admin dashboard

Open `/admin` and sign in with the admin credentials configured on the backend using `ADMIN_USERNAME` and `ADMIN_PASSWORD`. The dashboard currently displays live counts for upcoming events, published announcements, and approved businesses. The remaining management modules are marked as coming soon.

The dashboard sends credentials to backend-protected `/api/v1/admin/**` routes and keeps them in memory only; refreshing the page requires signing in again. Configure HTTPS for deployed environments.

## Commands

```powershell
npm run dev
npm run build
npm run lint
npm run preview
```
