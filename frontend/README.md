# nabajagaran-club frontend

The frontend is a React and TypeScript application built with Vite and Tailwind CSS. It contains the public community website and the first increment of the admin dashboard.

## Run locally

Start the backend first (see [backend/HELP.md](../backend/HELP.md)), then run:

```powershell
npm install
npm run dev
```

Vite proxies requests under `/api` to `http://localhost:8080`. Open the local URL printed by Vite, normally `http://localhost:5173`.

## Deployment API URL

The Vite proxy is for local development only. In Cloudflare Pages, set the build environment
variable `VITE_API_BASE_URL` to the Render API base URL, including `/api/v1` (for example,
`https://<render-service>.onrender.com/api/v1`). This value is public and must not contain
credentials. Production requests fail with a visible configuration error if it is missing.

Configure the backend's `APP_CORS_ALLOWED_ORIGINS` with the exact Cloudflare Pages site origin.
The backend uses that allowlist for cross-origin API access.

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
