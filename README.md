# SpendWise — AI-Powered Expense Tracker

A full-stack, production-ready expense tracking application with AI insights, SMS auto-detection, budget management, and analytics.

## Tech Stack

| Layer     | Technology                                      |
|-----------|-------------------------------------------------|
| Frontend  | React 18, React Router, Chart.js, react-hot-toast |
| Backend   | Node.js, Express, MongoDB (Mongoose)            |
| AI        | Anthropic Claude (claude-sonnet-4-20250514)     |
| Auth      | JWT (jsonwebtoken + bcryptjs)                   |

---

## Project Structure

```
spendwise/
├── backend/
│   ├── models/          # MongoDB schemas
│   │   ├── User.js
│   │   ├── Transaction.js
│   │   └── Budget.js
│   ├── routes/          # Express route handlers
│   │   ├── auth.js
│   │   ├── transactions.js
│   │   ├── budget.js
│   │   ├── analytics.js
│   │   ├── ai.js        # Anthropic API integration
│   │   └── sms.js       # SMS parsing (regex + AI)
│   ├── middleware/
│   │   └── auth.js      # JWT middleware
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── AppShell.js          # Sidebar layout
    │   │   └── AddTransactionModal.js
    │   ├── context/
    │   │   └── AuthContext.js       # Auth state + JWT
    │   ├── pages/
    │   │   ├── LoginPage.js
    │   │   ├── RegisterPage.js
    │   │   ├── DashboardPage.js
    │   │   ├── TransactionsPage.js
    │   │   ├── AnalyticsPage.js
    │   │   ├── AIPage.js
    │   │   └── BudgetPage.js
    │   ├── utils/
    │   │   ├── api.js               # Axios client + interceptors
    │   │   └── constants.js         # Categories, formatters
    │   ├── index.css                # Global design system
    │   ├── index.js
    │   └── App.js                   # Routes
    ├── package.json
    └── .env.example
```

---

## Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- MongoDB running locally or a MongoDB Atlas URI
- Google Gemini API key

### 1. Clone / download this project

### 2. Setup Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your values:
#   MONGODB_URI=mongodb://localhost:27017/spendwise
#   JWT_SECRET=some_long_random_string
#   Google_Gemini_API_Key=...

npm install
npm run dev        # starts on http://localhost:5000
```

### 3. Setup Frontend

```bash
cd frontend
cp .env.example .env
# REACT_APP_API_URL=http://localhost:5000/api

npm install
npm start          # starts on http://localhost:3000
```

---

## API Endpoints

### Auth
| Method | Endpoint             | Description          |
|--------|----------------------|----------------------|
| POST   | /api/auth/register   | Register new user    |
| POST   | /api/auth/login      | Login, returns JWT   |
| GET    | /api/auth/me         | Get current user     |
| PATCH  | /api/auth/me         | Update profile       |

### Transactions
| Method | Endpoint                       | Description                 |
|--------|--------------------------------|-----------------------------|
| GET    | /api/transactions              | List (filter: period, cat)  |
| POST   | /api/transactions              | Create transaction          |
| PATCH  | /api/transactions/:id          | Update transaction          |
| DELETE | /api/transactions/:id          | Delete transaction          |
| GET    | /api/transactions/summary      | Monthly totals by category  |

### Budget
| Method | Endpoint     | Description                        |
|--------|--------------|------------------------------------|
| GET    | /api/budget  | Get budget + spending + alerts     |
| PATCH  | /api/budget  | Update budget limits               |

### Analytics
| Method | Endpoint                    | Description          |
|--------|-----------------------------|----------------------|
| GET    | /api/analytics/trend        | Daily spending trend |
| GET    | /api/analytics/categories   | Category breakdown   |
| GET    | /api/analytics/merchants    | Top merchants        |
| GET    | /api/analytics/report       | Full data report     |

### AI
| Method | Endpoint            | Description                   |
|--------|---------------------|-------------------------------|
| POST   | /api/ai/insights    | Chat with AI (Claude)         |
| POST   | /api/ai/categorize  | Auto-categorize a description |
| POST   | /api/ai/report      | Generate full AI report       |

### SMS
| Method | Endpoint        | Description              |
|--------|-----------------|--------------------------|
| POST   | /api/sms/parse  | Parse bank SMS text      |

---

## Deployment

### Option A: Render (free tier)

**Backend:**
1. Create a new "Web Service" on render.com
2. Connect your GitHub repo, set root directory to `backend`
3. Build command: `npm install`
4. Start command: `npm start`
5. Add env vars: `MONGODB_URI`, `JWT_SECRET`, `ANTHROPIC_API_KEY`, `FRONTEND_URL`

**Frontend:**
1. Create a new "Static Site" on render.com
2. Root directory: `frontend`
3. Build command: `npm install && npm run build`
4. Publish directory: `build`
5. Add env var: `REACT_APP_API_URL=https://your-backend.onrender.com/api`

### Option B: Railway

```bash
# Backend
railway up --service backend

# Frontend — set REACT_APP_API_URL in Railway dashboard
```

### Option C: VPS / Docker

A `docker-compose.yml` for full self-hosting:

```yaml
version: '3.8'
services:
  mongo:
    image: mongo:7
    volumes:
      - mongo_data:/data/db
    ports:
      - "27017:27017"

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - MONGODB_URI=mongodb://mongo:27017/spendwise
      - JWT_SECRET=change_this_secret
      - ANTHROPIC_API_KEY=sk-ant-...
      - FRONTEND_URL=http://localhost:3000
    depends_on:
      - mongo

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    environment:
      - REACT_APP_API_URL=http://localhost:5000/api

volumes:
  mongo_data:
```

---

## Features

- **Authentication** — JWT-based register/login, secure password hashing
- **Dashboard** — Real-time budget status, category overview, recent transactions, smart alerts
- **Transactions** — Add manually or parse from bank SMS, filter by period/category, paginated history
- **Analytics** — Daily trend bar chart, category doughnut chart, top merchants, AI-generated report
- **AI Insights** — Chat interface powered by Google Gemini with full access to your financial data
- **Budget** — Per-category limits, alert thresholds (warning/danger %), live notification generation
- **SMS Auto-Detection** — Hybrid regex + AI parser for Indian bank SMS formats

---

## Environment Variables Reference

### Backend `.env`
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/spendwise
JWT_SECRET=your_jwt_secret_at_least_32_chars
JWT_EXPIRES_IN=30d
GOOGLE_GEMINI_API_KEY=sk-ant-api03-...
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Frontend `.env`
```
REACT_APP_API_URL=http://localhost:5000/api
```
