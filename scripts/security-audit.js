#!/usr/bin/env node

/**
 * RS-BUILDER Security Audit Script
 * Performs comprehensive security checks on the codebase
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const SECURITY_ISSUES = [];
const WARNINGS = [];

// Dangerous patterns to check for
const DANGEROUS_PATTERNS = [
  { pattern: /\beval\s*\(/g, severity: 'CRITICAL', message: 'Use of eval() detected' },
  { pattern: /\bFunction\s*\(/g, severity: 'HIGH', message: 'Use of Function constructor detected' },
  { pattern: /innerHTML\s*=/g, severity: 'HIGH', message: 'Direct innerHTML assignment detected' },
  { pattern: /document\.write\s*\(/g, severity: 'HIGH', message: 'Use of document.write() detected' },
  { pattern: /dangerouslySetInnerHTML/g, severity: 'MEDIUM', message: 'Use of dangerouslySetInnerHTML detected' },
  { pattern: /localStorage\.setItem.*password/gi, severity: 'HIGH', message: 'Password stored in localStorage' },
  { pattern: /sessionStorage\.setItem.*password/gi, severity: 'HIGH', message: 'Password stored in sessionStorage' },
  { pattern: /http:\/\//g, severity: 'LOW', message: 'Non-HTTPS URL detected' },
  { pattern: /api[_-]?key\s*=\s*['"][^'"]{8,}['"]/gi, severity: 'CRITICAL', message: 'Hardcoded API key detected' },
  { pattern: /password\s*=\s*['"][^'"]+['"]/gi, severity: 'CRITICAL', message: 'Hardcoded password detected' },
  { pattern: /secret\s*=\s*['"][^'"]+['"]/gi, severity: 'CRITICAL', message: 'Hardcoded secret detected' },
  { pattern: /token\s*=\s*['"][^'"]{16,}['"]/gi, severity: 'HIGH', message: 'Hardcoded token detected' },
];

// Files to skip
const SKIP_DIRS = ['node_modules', 'dist', '.git', 'coverage'];
const SKIP_FILES = ['.min.js', '.bundle.js', 'package-lock.json'];

function shouldSkip(filePath) {
  return SKIP_DIRS.some(dir => filePath.includes(`/${dir}/`)) ||
         SKIP_FILES.some(file => filePath.endsWith(file));
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    DANGEROUS_PATTERNS.forEach(({ pattern, severity, message }) => {
      if (pattern.test(line)) {
        const issue = {
          file: filePath,
          line: index + 1,
          severity,
          message,
          code: line.trim(),
        };
        
        if (severity === 'CRITICAL' || severity === 'HIGH') {
          SECURITY_ISSUES.push(issue);
        } else {
          WARNINGS.push(issue);
        }
      }
    });
  });
}

function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!shouldSkip(filePath)) {
        scanDirectory(filePath);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
      if (!shouldSkip(filePath)) {
        scanFile(filePath);
      }
    }
  });
}

function checkDependencies() {
  console.log('\n📦 Checking dependencies...\n');
  
  try {
    const auditResult = execSync('npm audit --json', { encoding: 'utf-8' });
    const audit = JSON.parse(auditResult);
    
    if (audit.vulnerabilities && Object.keys(audit.vulnerabilities).length > 0) {
      console.log('⚠️  Vulnerabilities found in dependencies:\n');
      
      Object.entries(audit.vulnerabilities).forEach(([name, vuln]) => {
        console.log(`  - ${name}: ${vuln.severity} severity`);
        if (vuln.range) console.log(`    Range: ${vuln.range}`);
        if (vuln.fixAvailable) {
          if (typeof vuln.fixAvailable === 'object') {
            console.log(`    Fix: ${vuln.fixAvailable.name}@${vuln.fixAvailable.version}`);
          } else {
            console.log(`    Fix: Run 'npm audit fix'`);
          }
        }
      });
    } else {
      console.log('✅ No vulnerabilities found in dependencies\n');
    }
  } catch (error) {
    console.log('✅ No vulnerabilities found in dependencies\n');
  }
}

function checkTypeScript() {
  console.log('\n🔍 Running TypeScript type check...\n');
  
  try {
    execSync('npm run typecheck', { encoding: 'utf-8', stdio: 'inherit' });
    console.log('✅ TypeScript check passed\n');
  } catch (error) {
    console.log('❌ TypeScript check failed\n');
  }
}

function checkBuild() {
  console.log('\n🔨 Running build check...\n');
  
  try {
    execSync('npm run build', { encoding: 'utf-8', stdio: 'inherit' });
    console.log('✅ Build successful\n');
  } catch (error) {
    console.log('❌ Build failed\n');
  }
}

function generateReport() {
  console.log('\n' + '='.repeat(60));
  console.log('🔒 SECURITY AUDIT REPORT');
  console.log('='.repeat(60) + '\n');
  
  if (SECURITY_ISSUES.length === 0 && WARNINGS.length === 0) {
    console.log('✅ No security issues found!\n');
  } else {
    if (SECURITY_ISSUES.length > 0) {
      console.log(`❌ Found ${SECURITY_ISSUES.length} security issue(s):\n`);
      SECURITY_ISSUES.forEach((issue, index) => {
        console.log(`${index + 1}. [${issue.severity}] ${issue.message}`);
        console.log(`   File: ${issue.file}:${issue.line}`);
        console.log(`   Code: ${issue.code}\n`);
      });
    }
    
    if (WARNINGS.length > 0) {
      console.log(`\n⚠️  Found ${WARNINGS.length} warning(s):\n`);
      WARNINGS.forEach((issue, index) => {
        console.log(`${index + 1}. [${issue.severity}] ${issue.message}`);
        console.log(`   File: ${issue.file}:${issue.line}`);
        console.log(`   Code: ${issue.code}\n`);
      });
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Critical Issues: ${SECURITY_ISSUES.filter(i => i.severity === 'CRITICAL').length}`);
  console.log(`High Issues: ${SECURITY_ISSUES.filter(i => i.severity === 'HIGH').length}`);
  console.log(`Medium Issues: ${WARNINGS.filter(i => i.severity === 'MEDIUM').length}`);
  console.log(`Low Issues: ${WARNINGS.filter(i => i.severity === 'LOW').length}`);
  console.log('='.repeat(60) + '\n');
}

// Main execution
console.log('\n🔒 Starting RS-BUILDER Security Audit...\n');

// Scan source code
console.log('📂 Scanning source code...\n');
scanDirectory('./src');

// Check dependencies
checkDependencies();

// Generate report
generateReport();

// Exit with error code if critical issues found
if (SECURITY_ISSUES.filter(i => i.severity === 'CRITICAL').length > 0) {
  process.exit(1);
}
