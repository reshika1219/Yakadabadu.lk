# Yakadabadu.lk

Scrap collection and recycling for Sri Lanka. Customers book pickups, drivers run their routes, admins dispatch and manage the platform, and a marketplace gives reusable items a second life.

## What you can do

**Customers**
- Book a pickup in a guided 4-step flow (material, size, date and slot, review) with a live price estimate
- Track every pickup with a status timeline, driver details and a map; reschedule, cancel, rate and download an invoice
- Dashboard with recycled kilograms, earnings, CO₂ estimate and a monthly chart
- Sell second-hand items, manage offers and inspection requests, buy or make offers on others' listings
- Earnings history (exportable), notifications, profile and pickup preferences

**Drivers**
- A "Today" route with Start, Complete (weight and cash) and Missed actions, call and navigate buttons, a map and a PDF trip sheet
- Check in and out, set availability, request leave, see attendance history
- Performance stats and customer reviews

**Admins**
- Dashboard with a "needs attention" queue, 14-day trend, material and area breakdowns
- Pickups manager with filters, sorting, inline driver assignment, cancel and CSV export
- Dispatch map and route planner, staff management, leave approvals, daily attendance
- Customers (suspend or reinstate), marketplace moderation, reviews with flagging
- Finance (payouts, commission, estimated margin, transactions export) and live pricing per material

**Everyone**
- Public site with live prices, a payout estimator, the marketplace, FAQ, About, Privacy and Terms
- Role-based sidebar, breadcrumbs, notification bell, **⌘K / Ctrl+K quick jump**, mobile drawer and tab bar

## Tech stack
| Layer | Tools |
| --- | --- |
| Frontend | React 19, Vite, Bootstrap 5 (grid and utilities), React Router, Lucide icons |
| Backend | Node.js, Express, MongoDB (Mongoose), JWT, bcrypt |
| Maps | Leaflet with OpenStreetMap tiles (no key needed); Google Directions for the route planner |

## Getting started
**Prerequisites:** Node.js 18+. No database install is needed. A Google Maps key is optional (route planner only).

```bash
git clone https://github.com/reshika1219/Yakadabadu.lk.git
cd Yakadabadu.lk

cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

npm install     # installs root, backend and frontend
npm run dev     # API on :5001, web app on :5173
```

Open <http://localhost:5173>. On the login page the **Quick login** buttons sign you in with one click, or use the demo accounts (password `Demo@1234`):

| Role | Email | Lands on |
| --- | --- | --- |
| Customer | `customer@demo.lk` | `/app` |
| Driver | `driver@demo.lk` | `/driver` |
| Admin | `admin@demo.lk` | `/admin` |

Switch between demo accounts any time from the user menu (top right).

### Demo data and the database
By default (`MONGODB_URI=memory`) the API runs an embedded MongoDB and keeps its data in `backend/.data`. On first run it seeds 45 days of history: 4 staff, 5 customers, 66 pickups with ratings, marketplace listings, transactions, attendance and leave. When the seed version in `backend/config/seed.js` changes, the embedded demo database is rebuilt (set `KEEP_DATA=true` to prevent that). Delete `backend/.data` to reset by hand. To use your own MongoDB or Atlas, put the full connection string in `MONGODB_URI`.

### Environment variables
| File | Variable | Purpose |
| --- | --- | --- |
| `backend/.env` | `MONGODB_URI` | `memory` (embedded, default) or a MongoDB connection string |
| | `JWT_SECRET` | Secret used to sign login tokens (use a long random value) |
| | `GOOGLE_MAPS_API_KEY` | Route planner (optional) |
| | `PORT` | API port (default `5001`; macOS AirPlay uses 5000) |
| `frontend/.env` | `VITE_API_URL` | API base URL (default `http://localhost:5001/api`) |
| | `VITE_DEMO_LOGIN` | Set to `false` to hide the quick-login buttons |

## Scripts
| Command | Where | What it does |
| --- | --- | --- |
| `npm run dev` | root | Runs API and web app together |
| `npm run build` | root | Production build of the frontend |
| `npm start` | root | Starts the API without auto-reload |
| `npm run lint` | `frontend/` | Lints the frontend |

## How it is organised
```
backend/    Express API
  models/       Mongoose schemas (User, Driver, Pickup, Listing, Transaction, Rate, ...)
  controllers/  Business logic for pickups, listings, finance, staff, users
  routes/       URL wiring and role guards
  middleware/   JWT auth and role checks (user, driver, admin)
  config/       Database connection and demo seed
frontend/src/
  layouts/      PublicLayout (marketing) and AppLayout (sidebar shell)
  pages/        public, customer, driver, admin, shared
  components/   UI kit, charts, map, driver actions
  nav.js        One navigation model per role (drives sidebar, tabs and ⌘K)
```

## Roles and routes
| Area | Who | Routes |
| --- | --- | --- |
| Public | Everyone | `/`, `/prices`, `/marketplace`, `/about`, `/help`, `/privacy`, `/terms`, `/login` |
| Customer | `user` | `/app/*` (dashboard, schedule, pickups, market, earnings, profile) |
| Driver | `driver` | `/driver/*` (today, pickups, availability, performance, profile) |
| Admin | `admin` | `/admin/*` (dashboard, pickups, dispatch, staff, customers, marketplace, finance, pricing, reviews) |

Each area rejects the other roles, both in the UI and in the API.

## API overview
All routes are under `/api`. Protected routes need `Authorization: Bearer <token>`.

| Resource | Main endpoints |
| --- | --- |
| `users` | `POST /register`, `POST /login`, `GET/PUT /me`, `PUT /me/password`, admin: `GET /`, `PUT /:id/suspend` |
| `drivers` (staff) | `POST /login`, `GET/PUT /me`, admin: `GET /`, `POST /`, `PUT /:id`, `DELETE /:id` |
| `pickups` | `POST /add`, `GET /mine`, `GET /me`, `GET /`, `GET /:id`, `PUT /:id/start`, `/confirm`, `/cancel`, `/reschedule`, `POST /:id/rate`, `GET /:id/invoice`, admin: `POST /assign` |
| `listings` | `GET /`, `GET /:id`, `POST /`, `GET /mine`, `GET /purchases`, `POST /:id/buy`, `/offers`, `/inspections`, admin: `PUT /:id/moderate` |
| `rates` | `GET /`, `POST /estimate`, admin: `PUT /:material` |
| `finance` | `GET /me`, admin: `GET /summary`, `GET /transactions` |
| `analytics` | `GET /admin`, `/customer`, `/driver` |
| `attendance`, `leaves` | driver check-in/out and leave requests; admin review |
| `notifications`, `reviews` | in-app notifications; admin review moderation |

## Notes
- Money figures for recycler value, margin and CO₂ savings are labelled estimates.
- Marketplace payments happen between buyer and seller; the platform records the sale and a 10% commission.
- Addresses are placed on maps by geocoding with OpenStreetMap Nominatim and cached in the browser.

## Security
Please see [SECURITY.md](SECURITY.md) to report a vulnerability.
