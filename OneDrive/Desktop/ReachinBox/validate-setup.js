#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Email Scheduler setup...\n');

const checks = {
  'Root package.json': fs.existsSync('package.json'),
  'Backend package.json': fs.existsSync('backend/package.json'),
  'Frontend package.json': fs.existsSync('frontend/package.json'),
  'Docker Compose': fs.existsSync('docker-compose.yml'),
  'Backend .env.example': fs.existsSync('backend/.env.example'),
  'Frontend .env.example': fs.existsSync('frontend/.env.example'),
  'Prisma schema': fs.existsSync('backend/prisma/schema.prisma'),
  'Backend TypeScript config': fs.existsSync('backend/tsconfig.json'),
  'Frontend TypeScript config': fs.existsSync('frontend/tsconfig.json'),
  'Tailwind config': fs.existsSync('frontend/tailwind.config.js'),
  'Setup script': fs.existsSync('setup.sh'),
  'README': fs.existsSync('README.md'),
  'Getting Started guide': fs.existsSync('GETTING_STARTED.md'),
};

let allPassed = true;

Object.entries(checks).forEach(([name, passed]) => {
  const status = passed ? '✅' : '❌';
  console.log(`${status} ${name}`);
  if (!passed) allPassed = false;
});

console.log('\n📋 Environment Files Check:');

// Check if .env files exist (optional)
const envFiles = [
  'backend/.env',
  'frontend/.env'
];

envFiles.forEach(file => {
  const exists = fs.existsSync(file);
  const status = exists ? '✅' : '⚠️ ';
  console.log(`${status} ${file} ${exists ? '(configured)' : '(needs setup)'}`);
});

console.log('\n🔧 Required Dependencies Check:');

try {
  const backendPkg = JSON.parse(fs.readFileSync('backend/package.json', 'utf8'));
  const frontendPkg = JSON.parse(fs.readFileSync('frontend/package.json', 'utf8'));
  
  const requiredBackend = [
    'express', 'bullmq', 'ioredis', '@prisma/client', 
    'nodemailer', 'google-auth-library', 'jsonwebtoken'
  ];
  
  const requiredFrontend = [
    'react', 'react-dom', '@tanstack/react-query', 
    'axios', 'zustand', 'react-hot-toast'
  ];
  
  requiredBackend.forEach(dep => {
    const exists = backendPkg.dependencies[dep];
    console.log(`${exists ? '✅' : '❌'} Backend: ${dep}`);
    if (!exists) allPassed = false;
  });
  
  requiredFrontend.forEach(dep => {
    const exists = frontendPkg.dependencies[dep];
    console.log(`${exists ? '✅' : '❌'} Frontend: ${dep}`);
    if (!exists) allPassed = false;
  });
  
} catch (error) {
  console.log('❌ Error reading package.json files');
  allPassed = false;
}

console.log('\n📊 Summary:');
if (allPassed) {
  console.log('✅ All checks passed! Your setup looks good.');
  console.log('\n🚀 Next steps:');
  console.log('1. Copy .env.example files and configure them');
  console.log('2. Run: npm run install:all');
  console.log('3. Run: docker-compose up -d');
  console.log('4. Run: cd backend && npx prisma migrate dev');
  console.log('5. Run: npm run dev');
} else {
  console.log('❌ Some checks failed. Please review the setup.');
  process.exit(1);
}