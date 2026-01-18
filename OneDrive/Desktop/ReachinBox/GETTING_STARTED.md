# Getting Started with Email Scheduler

This guide will help you set up and run the Email Scheduler application locally.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Docker & Docker Compose** - [Download here](https://www.docker.com/get-started)
- **Git** - [Download here](https://git-scm.com/)

## Quick Setup

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd email-scheduler

# Run the setup script (Linux/Mac)
chmod +x setup.sh
./setup.sh

# Or setup manually (Windows/Manual)
npm run install:all
docker-compose up -d
```

### 2. Configure Environment Variables

#### Backend Configuration (`backend/.env`)

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/email_scheduler"

# Redis
REDIS_URL="redis://localhost:6379"

# Google OAuth (Required)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# JWT Secret (Generate a secure random string)
JWT_SECRET="your-super-secret-jwt-key"

# Ethereal Email (Get from https://ethereal.email/)
ETHEREAL_USER="your-ethereal-user"
ETHEREAL_PASS="your-ethereal-pass"
ETHEREAL_HOST="smtp.ethereal.email"
ETHEREAL_PORT=587

# Rate Limiting (Optional - defaults shown)
MAX_EMAILS_PER_HOUR=200
EMAIL_DELAY_MS=2000
WORKER_CONCURRENCY=5

# Server
PORT=3001
NODE_ENV=development
```

#### Frontend Configuration (`frontend/.env`)

```env
REACT_APP_API_URL=http://localhost:3001
REACT_APP_GOOGLE_CLIENT_ID="your-google-client-id"
```

### 3. Get Required Credentials

#### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set application type to "Web application"
6. Add authorized origins:
   - `http://localhost:3000` (for development)
7. Add authorized redirect URIs:
   - `http://localhost:3000` (for development)
8. Copy the Client ID and Client Secret

#### Ethereal Email Setup

1. Go to [Ethereal Email](https://ethereal.email/)
2. Click "Create Ethereal Account"
3. Copy the username and password
4. Use these credentials in your backend `.env` file

### 4. Database Setup

```bash
cd backend

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# (Optional) Open Prisma Studio to view data
npx prisma studio
```

### 5. Start the Application

```bash
# Start both backend and frontend
npm run dev

# Or start individually
npm run dev:backend  # Backend only
npm run dev:frontend # Frontend only
```

## Application URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Queue Dashboard**: http://localhost:3001/admin/queues
- **Health Check**: http://localhost:3001/api/health

## Testing the Application

### 1. Login
- Open http://localhost:3000
- Click "Sign in with Google"
- Use your Google account to authenticate

### 2. Schedule Emails
- Click "Compose New Email"
- Fill in subject and body
- Upload a CSV file with email addresses or add manually
- Set scheduling options
- Click "Schedule Emails"

### 3. Monitor Progress
- View scheduled emails in the "Scheduled Emails" tab
- Check sent emails in the "Sent Emails" tab
- Monitor queue status at http://localhost:3001/admin/queues

## Development

### Project Structure

```
email-scheduler/
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── services/        # Business logic
│   │   ├── queues/          # BullMQ job definitions
│   │   ├── workers/         # Job processors
│   │   ├── middleware/      # Auth, validation, etc.
│   │   └── types/           # TypeScript definitions
│   ├── prisma/              # Database schema & migrations
│   └── tests/               # Test files
├── frontend/                # React application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API calls
│   │   ├── stores/          # Zustand state management
│   │   └── types/           # TypeScript definitions
│   └── public/              # Static assets
└── docker-compose.yml       # Infrastructure services
```

### Available Scripts

```bash
# Root level
npm run dev              # Start both backend and frontend
npm run build            # Build both applications
npm run install:all      # Install all dependencies

# Backend
cd backend
npm run dev              # Start development server
npm run build            # Build for production
npm run test             # Run tests
npm run db:migrate       # Run database migrations
npm run db:studio        # Open Prisma Studio

# Frontend
cd frontend
npm run dev              # Start development server
npm run build            # Build for production
npm run test             # Run tests
```

### Key Features Implemented

✅ **Authentication**
- Google OAuth 2.0 integration
- JWT token management with refresh

✅ **Email Scheduling**
- BullMQ for persistent job queues
- Redis-backed rate limiting
- Configurable delays and concurrency

✅ **Rate Limiting**
- Hourly email limits with Redis counters
- Automatic job rescheduling when limits exceeded
- Safe across multiple worker instances

✅ **Dashboard**
- Real-time job monitoring
- CSV file upload and parsing
- Pagination and filtering

✅ **Persistence**
- PostgreSQL database with Prisma ORM
- Survives server restarts
- Prevents duplicate sends

## Troubleshooting

### Common Issues

**1. Database Connection Error**
```bash
# Check if PostgreSQL is running
docker-compose ps

# Restart services
docker-compose restart postgres
```

**2. Redis Connection Error**
```bash
# Check if Redis is running
docker-compose ps

# Restart Redis
docker-compose restart redis
```

**3. Google OAuth Error**
- Verify your Google Client ID is correct
- Check that authorized origins include `http://localhost:3000`
- Ensure the Google+ API is enabled

**4. Email Sending Issues**
- Verify Ethereal Email credentials
- Check the queue dashboard for failed jobs
- Review backend logs for SMTP errors

**5. Build Errors**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear build cache
npm run build -- --clean
```

### Logs and Monitoring

```bash
# View backend logs
cd backend && npm run dev

# View queue dashboard
# Open http://localhost:3001/admin/queues

# Check health status
curl http://localhost:3001/api/health

# View Docker logs
docker-compose logs redis
docker-compose logs postgres
```

## Production Deployment

For production deployment, see the main README.md file for detailed instructions on:
- Environment configuration
- Database setup
- Redis configuration
- SSL/TLS setup
- Process management
- Monitoring and logging

## Support

If you encounter issues:
1. Check this troubleshooting guide
2. Review the application logs
3. Check the queue dashboard for job status
4. Verify all environment variables are set correctly