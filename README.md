# nabajagaran-club

nabajagaran-club is a community website and administration dashboard for managing club content and operations.

## Technology

- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Backend:** Java 21, Spring Boot REST API, Spring Security
- **Database:** PostgreSQL

## Local development

### 1. Configure and start the backend

Create a PostgreSQL database, then set the connection and admin credentials in PowerShell. Choose your own passwords; do not commit them.

```powershell
$env:DB_URL = "jdbc:postgresql://localhost:5432/nabajaran_db"
$env:DB_USERNAME = "<database-user>"
$env:DB_PASSWORD = "<database-password>"
$env:ADMIN_USERNAME = "admin"
$env:ADMIN_PASSWORD = "<strong-admin-password>"

Set-Location backend
.\gradlew.bat bootRun
```

The API starts at `http://localhost:8080`. If `ADMIN_PASSWORD` is blank or unset, admin endpoints reject all requests.

### 2. Start the frontend

In another terminal:

```powershell
Set-Location frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal (normally `http://localhost:5173`). The frontend proxies `/api` requests to the backend on port `8080`.

## Admin dashboard and security

Open `/admin` on the frontend and sign in with `ADMIN_USERNAME` and `ADMIN_PASSWORD`. The current admin increment includes a responsive dashboard with live counts for upcoming events, published announcements, and approved businesses. Other management modules are shown as coming soon.

Spring Security protects every `/api/v1/admin/**` endpoint with the `ADMIN` role. Authentication is enforced by the backend, not just by the frontend route. Admin credentials are held in browser memory and are not persisted across page reloads. Use HTTPS in deployed environments.

Current public read endpoints include:

- `GET /api/v1/club`
- `GET /api/v1/events/upcoming`
- `GET /api/v1/announcements/published`
- `GET /api/v1/businesses/approved`

The admin dashboard summary does not include private member information.

## Checks

```powershell
# Frontend
Set-Location frontend
npm run build
npm run lint

# Backend
Set-Location ..\backend
.\gradlew.bat test
```

See [frontend/README.md](./frontend/README.md) for frontend-specific details and [backend/HELP.md](./backend/HELP.md) for backend security configuration.
