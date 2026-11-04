# Yakadabadu.lk

Scrap pickup, made simple. Customers book metal, plastic or wood pickups, drivers work through their assigned stops, and admins assign drivers and plan routes.

## Features
- **Customers:** register, log in and schedule a pickup (item type, size, date, what they want in return).
- **Drivers:** see assigned pickups pinned on a map, complete or cancel them with weight and amount, download the list as a PDF, manage their profile.
- **Admins:** assign drivers to pickups and optimise routes with Google Maps.

## Tech stack
| Layer | Tools |
| --- | --- |
| Frontend | React 19, Vite, Bootstrap 5, React Router |
| Backend | Node.js, Express, MongoDB (Mongoose), JWT, Joi |
| Maps | Leaflet with OpenStreetMap tiles (no key needed); Google Directions for route optimisation |

## Getting started
**Prerequisites:** Node.js 18+. No database install is needed. A Google Maps API key is optional (only route optimisation uses it).

```bash
git clone https://github.com/reshika1219/Yakadabadu.lk.git
cd Yakadabadu.lk

cp backend/.env.example backend/.env      # then fill in the values below
cp frontend/.env.example frontend/.env

npm install     # installs root, backend and frontend
npm run dev     # API on :5001, web app on :5173
```

Open <http://localhost:5173>. On the login page, the **Quick login** buttons (Driver, Customer, Admin) sign you in with one click. The demo accounts are created on the first run:

| Role | Email | Password |
| --- | --- | --- |
| Driver | `driver@demo.lk` | `Demo@1234` |
| Customer | `customer@demo.lk` | `Demo@1234` |

The quick-login buttons are an MVP convenience. Hide them with `VITE_DEMO_LOGIN=false` in `frontend/.env`.

### Database
By default (`MONGODB_URI=memory`) the API starts an embedded MongoDB and keeps its data in `backend/.data`. Delete that folder to reset to fresh demo data. To use your own MongoDB or Atlas, put the full connection string in `MONGODB_URI`.

### Environment variables
| File | Variable | Purpose |
| --- | --- | --- |
| `backend/.env` | `MONGODB_URI` | `memory` (embedded, default) or a MongoDB connection string |
| | `JWT_SECRET` | Secret used to sign login tokens (use a long random value) |
| | `GOOGLE_MAPS_API_KEY` | Route optimisation |
| | `PORT` | API port (default `5001`) |
| `frontend/.env` | `VITE_API_URL` | API base URL (default `http://localhost:5001/api`) |
| | `VITE_DEMO_LOGIN` | Set to `false` to hide the quick-login buttons |
| | `VITE_API_URL` | API base URL (default `http://localhost:5001/api`) |

Port 5001 is used because macOS AirPlay occupies 5000.

## Scripts
| Command | Where | What it does |
| --- | --- | --- |
| `npm run dev` | root | Runs API and web app together |
| `npm run build` | root | Production build of the frontend |
| `npm start` | root | Starts the API without auto-reload |
| `npm run lint` | `frontend/` | Lints the frontend |

## Pages and roles
| Route | Who | Page |
| --- | --- | --- |
| `/` | Everyone | Landing page |
| `/login` | Everyone | Driver and customer login, customer sign-up |
| `/schedule-pickup` | Customer | Book a pickup |
| `/home`, `/driver-dashboard`, `/driver-profile` | Driver | Driver area |
| `/admin-dashboard` | Driver | Assign pickups, optimise routes |

Driver and admin API endpoints reject customer tokens.

## API overview
All routes are under `/api`. Protected routes need `Authorization: Bearer <token>`.

| Resource | Endpoints |
| --- | --- |
| `users` | `POST /register`, `POST /login` |
| `drivers` | `POST /register`, `POST /login`, `GET /me`, `GET /`, `PUT /:id`, `POST /upload-profile-picture` |
| `pickups` | `POST /add`, `GET /me`, `GET /`, `POST /assign`, `PUT /:id/confirm`, `PUT /:id/cancel`, `POST /optimize-route` |

## Project structure
```
backend/    Express API: routes, controllers, models, middleware
frontend/   React app: pages, components, shared styles (src/styles.css)
```

## Security
Please see [SECURITY.md](SECURITY.md) to report a vulnerability.
