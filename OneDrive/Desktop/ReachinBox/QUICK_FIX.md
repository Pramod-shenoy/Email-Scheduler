# Quick Fix for TypeScript Errors

The TypeScript errors you're seeing are expected before installing dependencies. Here's how to fix them:

## 🚀 Quick Setup (5 minutes)

### 1. Install Dependencies
```bash
# Install all dependencies
npm run install:all

# Or install individually
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### 2. Start Infrastructure
```bash
# Start Redis and PostgreSQL
docker-compose up -d
```

### 3. Setup Database
```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
cd ..
```

### 4. Configure Environment Variables

**Create `backend/.env`:**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/email_scheduler"
REDIS_URL="redis://localhost:6379"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
JWT_SECRET="your-super-secret-jwt-key-here"
ETHEREAL_USER="your-ethereal-user"
ETHEREAL_PASS="your-ethereal-pass"
ETHEREAL_HOST="smtp.ethereal.email"
ETHEREAL_PORT=587
MAX_EMAILS_PER_HOUR=200
EMAIL_DELAY_MS=2000
WORKER_CONCURRENCY=5
PORT=3001
NODE_ENV=development
```

**Create `frontend/.env`:**
```env
REACT_APP_API_URL=http://localhost:3001
REACT_APP_GOOGLE_CLIENT_ID="your-google-client-id"
```

### 5. Get Credentials

**Google OAuth:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create project → Enable Google+ API → Create OAuth 2.0 credentials
3. Add `http://localhost:3000` to authorized origins

**Ethereal Email:**
1. Go to [Ethereal Email](https://ethereal.email/)
2. Click "Create Ethereal Account"
3. Copy username and password

### 6. Start Application
```bash
npm run dev
```

## ✅ Verify Setup

Run the validation script:
```bash
npm run validate
```

Check health:
```bash
npm run health
```

## 🔧 Common Issues & Solutions

### TypeScript Errors
- **Cause**: Missing dependencies
- **Fix**: Run `npm run install:all`

### Module Not Found Errors
- **Cause**: Dependencies not installed
- **Fix**: Delete `node_modules` and run `npm install` in each folder

### Database Connection Error
- **Cause**: PostgreSQL not running
- **Fix**: Run `docker-compose up -d`

### Redis Connection Error
- **Cause**: Redis not running
- **Fix**: Run `docker-compose restart redis`

### Google OAuth Error
- **Cause**: Invalid client ID or missing configuration
- **Fix**: Verify Google Cloud Console setup and environment variables

### SMTP Error
- **Cause**: Invalid Ethereal credentials
- **Fix**: Create new Ethereal account and update credentials

## 📊 Expected Results After Setup

✅ **No TypeScript errors**
✅ **Backend starts on port 3001**
✅ **Frontend starts on port 3000**
✅ **Database connected**
✅ **Redis connected**
✅ **Google login works**
✅ **Email scheduling works**

## 🎯 Test the Application

1. Open http://localhost:3000
2. Sign in with Google
3. Click "Compose New Email"
4. Upload a CSV or add emails manually
5. Schedule emails
6. Check progress in dashboard
7. Monitor queue at http://localhost:3001/admin/queues

## 📞 Still Having Issues?

1. Check all environment variables are set
2. Verify Docker containers are running: `docker-compose ps`
3. Check logs: `docker-compose logs`
4. Restart everything: `docker-compose restart && npm run dev`

The TypeScript errors will disappear once dependencies are installed and the application is properly configured.