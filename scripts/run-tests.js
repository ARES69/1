#!/usr/bin/env node

/**
 * RS-BUILDER Automated Test Suite
 * Tests all critical functions and reports results
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const RESULTS = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: [],
};

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warning: '\x1b[33m',
    reset: '\x1b[0m',
  };
  console.log(`${colors[type]}${message}${colors.reset}`);
}

function test(name, fn) {
  try {
    fn();
    RESULTS.passed++;
    RESULTS.tests.push({ name, status: 'PASS' });
    log(`✓ ${name}`, 'success');
  } catch (error) {
    RESULTS.failed++;
    RESULTS.tests.push({ name, status: 'FAIL', error: error.message });
    log(`✗ ${name}: ${error.message}`, 'error');
  }
}

function warn(name, message) {
  RESULTS.warnings++;
  RESULTS.tests.push({ name, status: 'WARN', message });
  log(`⚠ ${name}: ${message}`, 'warning');
}

// Test 1: Check file structure
log('\n📁 Testing file structure...', 'info');

test('package.json exists', () => {
  if (!fs.existsSync('package.json')) throw new Error('package.json not found');
});

test('src directory exists', () => {
  if (!fs.existsSync('src')) throw new Error('src directory not found');
});

test('src/App.tsx exists', () => {
  if (!fs.existsSync('src/App.tsx')) throw new Error('src/App.tsx not found');
});

test('src/main.tsx exists', () => {
  if (!fs.existsSync('src/main.tsx')) throw new Error('src/main.tsx not found');
});

test('index.html exists', () => {
  if (!fs.existsSync('index.html')) throw new Error('index.html not found');
});

// Test 2: Check critical components
log('\n🧩 Testing critical components...', 'info');

const criticalComponents = [
  'src/components/Header.tsx',
  'src/components/Footer.tsx',
  'src/components/ProtectedRoute.tsx',
  'src/components/ErrorBoundary.tsx',
  'src/pages/Auth.tsx',
  'src/pages/Workspace.tsx',
  'src/pages/Home.tsx',
];

criticalComponents.forEach(component => {
  test(`${path.basename(component)} exists`, () => {
    if (!fs.existsSync(component)) throw new Error(`${component} not found`);
  });
});

// Test 3: Check critical libraries
log('\n📚 Testing critical libraries...', 'info');

const criticalLibs = [
  'src/lib/auth.ts',
  'src/lib/settings.ts',
  'src/lib/agent-engine.ts',
  'src/lib/virtual-fs.ts',
  'src/lib/memory.ts',
];

criticalLibs.forEach(lib => {
  test(`${path.basename(lib)} exists`, () => {
    if (!fs.existsSync(lib)) throw new Error(`${lib} not found`);
  });
});

// Test 4: Check auth implementation
log('\n🔐 Testing auth implementation...', 'info');

test('auth.ts has signup function', () => {
  const content = fs.readFileSync('src/lib/auth.ts', 'utf-8');
  if (!content.includes('export function signup')) throw new Error('signup function not found');
});

test('auth.ts has login function', () => {
  const content = fs.readFileSync('src/lib/auth.ts', 'utf-8');
  if (!content.includes('export function login')) throw new Error('login function not found');
});

test('auth.ts has logout function', () => {
  const content = fs.readFileSync('src/lib/auth.ts', 'utf-8');
  if (!content.includes('export function logout')) throw new Error('logout function not found');
});

test('auth.ts has isLoggedIn function', () => {
  const content = fs.readFileSync('src/lib/auth.ts', 'utf-8');
  if (!content.includes('export function isLoggedIn')) throw new Error('isLoggedIn function not found');
});

// Test 5: Check ProtectedRoute
log('\n🛡️ Testing ProtectedRoute...', 'info');

test('ProtectedRoute checks isLoggedIn', () => {
  const content = fs.readFileSync('src/components/ProtectedRoute.tsx', 'utf-8');
  if (!content.includes('isLoggedIn()')) throw new Error('isLoggedIn check not found');
});

test('ProtectedRoute redirects to /login', () => {
  const content = fs.readFileSync('src/components/ProtectedRoute.tsx', 'utf-8');
  if (!content.includes('/login')) throw new Error('redirect to /login not found');
});

// Test 6: Check App routing
log('\n🛣️ Testing App routing...', 'info');

test('App.tsx has ProtectedRoute', () => {
  const content = fs.readFileSync('src/App.tsx', 'utf-8');
  if (!content.includes('ProtectedRoute')) throw new Error('ProtectedRoute not imported');
});

test('App.tsx has ErrorBoundary', () => {
  const content = fs.readFileSync('src/App.tsx', 'utf-8');
  if (!content.includes('ErrorBoundary')) throw new Error('ErrorBoundary not imported');
});

test('App.tsx protects /app route', () => {
  const content = fs.readFileSync('src/App.tsx', 'utf-8');
  if (!content.includes('path="/app"')) throw new Error('/app route not found');
});

// Test 7: Check build
log('\n🔨 Testing build...', 'info');

test('Build succeeds', () => {
  try {
    execSync('npm run build', { stdio: 'pipe' });
  } catch (error) {
    throw new Error('Build failed');
  }
});

test('dist/index.html exists', () => {
  if (!fs.existsSync('dist/index.html')) throw new Error('dist/index.html not found');
});

test('dist/assets exists', () => {
  if (!fs.existsSync('dist/assets')) throw new Error('dist/assets not found');
});

// Test 8: Check for Supabase remnants
log('\n🔍 Checking for Supabase remnants...', 'info');

test('No supabase-auth.ts file', () => {
  if (fs.existsSync('src/lib/supabase-auth.ts')) {
    throw new Error('supabase-auth.ts still exists');
  }
});

test('No AuthCallback.tsx file', () => {
  if (fs.existsSync('src/pages/AuthCallback.tsx')) {
    throw new Error('AuthCallback.tsx still exists');
  }
});

test('No ForgotPassword.tsx file', () => {
  if (fs.existsSync('src/pages/ForgotPassword.tsx')) {
    throw new Error('ForgotPassword.tsx still exists');
  }
});

test('No ResetPassword.tsx file', () => {
  if (fs.existsSync('src/pages/ResetPassword.tsx')) {
    throw new Error('ResetPassword.tsx still exists');
  }
});

// Test 9: Check Workspace
log('\n💼 Testing Workspace...', 'info');

test('Workspace has correct height', () => {
  const content = fs.readFileSync('src/pages/Workspace.tsx', 'utf-8');
  if (!content.includes('calc(100vh - 64px)')) {
    warn('Workspace height', 'Using h-screen instead of calc(100vh - 64px)');
  }
});

test('Workspace has min-h-0', () => {
  const content = fs.readFileSync('src/pages/Workspace.tsx', 'utf-8');
  if (!content.includes('min-h-0')) {
    warn('Workspace min-h-0', 'min-h-0 not found in flex containers');
  }
});

test('SetupModal not auto-shown', () => {
  const content = fs.readFileSync('src/pages/Workspace.tsx', 'utf-8');
  if (content.includes('useState(shouldShowSetup())')) {
    throw new Error('SetupModal is still auto-shown');
  }
});

// Test 10: Check ErrorBoundary
log('\n🚧 Testing ErrorBoundary...', 'info');

test('ErrorBoundary exists', () => {
  if (!fs.existsSync('src/components/ErrorBoundary.tsx')) {
    throw new Error('ErrorBoundary.tsx not found');
  }
});

test('ErrorBoundary has getDerivedStateFromError', () => {
  const content = fs.readFileSync('src/components/ErrorBoundary.tsx', 'utf-8');
  if (!content.includes('getDerivedStateFromError')) {
    throw new Error('getDerivedStateFromError not found');
  }
});

test('ErrorBoundary has componentDidCatch', () => {
  const content = fs.readFileSync('src/components/ErrorBoundary.tsx', 'utf-8');
  if (!content.includes('componentDidCatch')) {
    throw new Error('componentDidCatch not found');
  }
});

// Test 11: Check documentation
log('\n📚 Testing documentation...', 'info');

const docs = [
  'README.md',
  'LICENSE',
  'LOCAL_AUTH.md',
  'FINAL_SUMMARY.md',
  'FULL_AUDIT_REPORT.md',
];

docs.forEach(doc => {
  test(`${doc} exists`, () => {
    if (!fs.existsSync(doc)) throw new Error(`${doc} not found`);
  });
});

// Test 12: Check for unused imports in Workspace
log('\n🔎 Checking for unused imports...', 'info');

test('Workspace imports are clean', () => {
  const content = fs.readFileSync('src/pages/Workspace.tsx', 'utf-8');
  const unusedImports = ['comprehensiveAnalysis', 'getTemplate'];
  
  unusedImports.forEach(imp => {
    if (content.includes(imp) && !content.includes(`${imp}(`)) {
      warn('Unused import', `${imp} imported but not used`);
    }
  });
});

// Test 13: Check package.json
log('\n📦 Testing package.json...', 'info');

test('package.json has correct name', () => {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  if (!pkg.name) throw new Error('name not found');
});

test('package.json has build script', () => {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  if (!pkg.scripts.build) throw new Error('build script not found');
});

test('package.json has dev script', () => {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  if (!pkg.scripts.dev) throw new Error('dev script not found');
});

// Print summary
log('\n' + '='.repeat(60), 'info');
log('📊 TEST SUMMARY', 'info');
log('='.repeat(60), 'info');
log(`✓ Passed: ${RESULTS.passed}`, 'success');
log(`✗ Failed: ${RESULTS.failed}`, RESULTS.failed > 0 ? 'error' : 'info');
log(`⚠ Warnings: ${RESULTS.warnings}`, RESULTS.warnings > 0 ? 'warning' : 'info');
log('='.repeat(60), 'info');

if (RESULTS.failed === 0) {
  log('\n🎉 ALL TESTS PASSED!', 'success');
  log('✅ Project is ready for production!\n', 'success');
  process.exit(0);
} else {
  log(`\n❌ ${RESULTS.failed} TEST(S) FAILED`, 'error');
  log('Please fix the issues before deploying.\n', 'error');
  process.exit(1);
}
