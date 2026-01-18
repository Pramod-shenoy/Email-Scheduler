#!/usr/bin/env node

const http = require('http');
const fs = require('fs');

console.log('🔍 Checking Email Scheduler setup...\n');

// Check if files exist
const requiredFiles = [
  'package.json',
  'backend/package.json', 
  'frontend/package.json',
  'docker-compose.yml',
  'backend/prisma/schema.prisma'
];

console.log('📁 File Structure:');
requiredFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
});

// Check if node_modules exist
console.log('\n📦 Dependencies:');
const deps = [
  'node_modules',
  'backend/node_modules',
  'frontend/node_modules'
];

deps.forEach(dir => {
  const exists = fs.existsSync(dir);
  console.log(`${exists ? '✅' : '⚠️ '} ${dir} ${exists ? '' : '(run npm run install:all)'}`);
});

// Check environment files
console.log('\n🔧 Environment:');
const envFiles = [
  'backend/.env',
  'frontend/.env'
];

envFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`${exists ? '✅' : '⚠️ '} ${file} ${exists ? '' : '(copy from .env.example)'}`);
});

// Check if services are running
console.log('\n🚀 Services:');

// Check backend
const checkBackend = () => {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3001/api/health', (res) => {
      console.log('✅ Backend (http://localhost:3001)');
      resolve(true);
    });
    
    req.on('error', () => {
      console.log('❌ Backend (http://localhost:3001) - not running');
      resolve(false);
    });
    
    req.setTimeout(2000, () => {
      console.log('❌ Backend (http://localhost:3001) - timeout');
      resolve(false);
    });
  });
};

// Check frontend
const checkFrontend = () => {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3000', (res) => {
      console.log('✅ Frontend (http://localhost:3000)');
      resolve(true);
    });
    
    req.on('error', () => {
      console.log('❌ Frontend (http://localhost:3000) - not running');
      resolve(false);
    });
    
    req.setTimeout(2000, () => {
      console.log('❌ Frontend (http://localhost:3000) - timeout');
      resolve(false);
    });
  });
};

// Run service checks
(async () => {
  await checkBackend();
  await checkFrontend();
  
  console.log('\n📋 Quick Commands:');
  console.log('Install dependencies: npm run install:all');
  console.log('Start infrastructure: docker-compose up -d');
  console.log('Setup database: cd backend && npx prisma migrate dev');
  console.log('Start application: npm run dev');
  console.log('Validate setup: npm run validate');
})();