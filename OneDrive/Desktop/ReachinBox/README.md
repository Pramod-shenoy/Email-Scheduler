# Email Job Scheduler

A production-grade email scheduler service with dashboard built for ReachInbox.

## Features

- **Reliable Email Scheduling**: Uses BullMQ + Redis for persistent job scheduling
- **Rate Limiting**: Configurable emails per hour with Redis-backed counters
- **Concurrency Control**: Configurable worker concurrency with minimum delays between sends
- **Persistent State**: Survives server restarts without losing jobs or duplicating emails
- **Real-time Dashboard**: React frontend with Google OAuth authentication
- **SMTP Integration**: Uses Ethereal Email for testing

## Architecture

### Backend (TypeScript + Express)
- **Queue System**: BullMQ with Redis for job persistence
- **Database**: PostgreSQL with Prisma ORM
- **Rate Limiting**: Redis counters with hourly windows
- **Email Sending**: Ethereal Email SMTP
- **Authentication**: Google OAuth 2.0

### Frontend (React + TypeScript)
- **UI Framework**: React with Tailwind CSS
- **Authentication**: Google OAuth integration
- **State Management**: React Query for API calls
- **File Upload**: CSV parsing for email leads

## Rate Limiting Configuration

- **Delay Between Emails**: 2 seconds minimum (configurable via `EMAIL_DELAY_MS`)
- **Emails Per Hour**: 200 global limit (configurable via `MAX_EMAILS_PER_HOUR`)
- **Worker Concurrency**: 5 concurrent jobs (configurable via `WORKER_CONCURRENCY`)

### Rate Limiting Implementation

The system uses Redis-backed counters with hourly time windows:
- Key format: `email_count:{hour_window}` (e.g., `email_count:2024-01-17-14`)
- When hourly limit is reached, jobs are delayed to the next available hour
- Preserves job order while respecting rate limits
- Safe across multiple worker instances

## Quick Start

### Prerequisites
- Node.js 18+
- Docker (for Redis and PostgreSQL)
- Google OAuth credentials

### 1. Environment Setup

Create `.env` files in both backend and frontend directories:

**backend/.env**:
```
DATABASE_URL="postgresql://user:password@localhost:5432/email_scheduler"
REDIS_URL="redis://localhost:6379"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
JWT_SECRET="your-jwt-secret"
ETHEREAL_USER="your-ethereal-user"
ETHEREAL_PASS="your-ethereal-pass"
MAX_EMAILS_PER_HOUR=200
EMAIL_DELAY_MS=2000
WORKER_CONCURRENCY=5
```

**frontend/.env**:
```
REACT_APP_API_URL=http://localhost:3001
REACT_APP_GOOGLE_CLIENT_ID="your-google-client-id"
```

### 2. Start Infrastructure

```bash
# Start Redis and PostgreSQL
docker-compose up -d
```

### 3. Install Dependencies

```bash
npm run install:all
```

### 4. Database Setup

```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

### 5. Start Development

```bash
npm run dev
```

- Backend: http://localhost:3001
- Frontend: http://localhost:3000

## API Endpoints

### Authentication
- `POST /auth/google` - Google OAuth login
- `POST /auth/refresh` - Refresh JWT token

### Email Scheduling
- `POST /api/emails/schedule` - Schedule new emails
- `GET /api/emails/scheduled` - Get scheduled emails
- `GET /api/emails/sent` - Get sent emails

### System
- `GET /api/health` - Health check
- `GET /api/stats` - Queue statistics

## Load Behavior

When 1000+ emails are scheduled for the same time:
1. Jobs are queued with appropriate delays based on rate limits
2. Redis counters track hourly email counts
3. Jobs exceeding hourly limits are automatically delayed to next available window
4. Worker concurrency prevents system overload
5. Minimum delays between sends respect SMTP provider limits

## Development

### Backend Structure
```
backend/
├── src/
│   ├── controllers/     # API route handlers
│   ├── services/        # Business logic
│   ├── queues/          # BullMQ job definitions
│   ├── middleware/      # Auth, validation, etc.
│   ├── types/           # TypeScript definitions
│   └── utils/           # Helper functions
├── prisma/              # Database schema
└── tests/               # Test files
```

### Frontend Structure
```
frontend/
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/           # Page components
│   ├── hooks/           # Custom React hooks
│   ├── services/        # API calls
│   ├── types/           # TypeScript definitions
│   └── utils/           # Helper functions
└── public/              # Static assets
```

## Testing

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

## Production Deployment

1. Set production environment variables
2. Build applications: `npm run build`
3. Deploy backend with Redis and PostgreSQL
4. Deploy frontend to CDN/static hosting
5. Configure reverse proxy (nginx) for API routing