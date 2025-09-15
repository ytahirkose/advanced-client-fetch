#!/usr/bin/env node

/**
 * Bundle analysis script for Advanced Client Fetch
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function analyzeBundleSize() {
  const packages = ['core', 'plugins', 'presets', 'axios-adapter'];
  const results = {};

  packages.forEach(pkg => {
    const distPath = path.join(__dirname, '..', 'packages', pkg, 'dist');
    
    if (!fs.existsSync(distPath)) {
      console.log(`❌ Package ${pkg} not built yet`);
      return;
    }

    const files = fs.readdirSync(distPath);
    const packageResults = {
      totalSize: 0,
      files: {}
    };

    files.forEach(file => {
      const filePath = path.join(distPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isFile() && (file.endsWith('.js') || file.endsWith('.cjs'))) {
        const size = stats.size;
        packageResults.files[file] = {
          size: size,
          sizeKB: (size / 1024).toFixed(2),
          sizeMB: (size / (1024 * 1024)).toFixed(3)
        };
        packageResults.totalSize += size;
      }
    });

    packageResults.totalSizeKB = (packageResults.totalSize / 1024).toFixed(2);
    packageResults.totalSizeMB = (packageResults.totalSize / (1024 * 1024)).toFixed(3);
    
    results[pkg] = packageResults;
  });

  return results;
}

function printAnalysis(results) {
  console.log('\n📊 Bundle Size Analysis\n');
  console.log('=' .repeat(60));

  Object.entries(results).forEach(([pkg, data]) => {
    console.log(`\n📦 Package: ${pkg}`);
    console.log(`   Total Size: ${data.totalSizeKB} KB (${data.totalSizeMB} MB)`);
    console.log('   Files:');
    
    Object.entries(data.files).forEach(([file, info]) => {
      console.log(`     ${file}: ${info.sizeKB} KB`);
    });
  });

  // Summary
  const totalSize = Object.values(results).reduce((sum, data) => sum + data.totalSize, 0);
  const totalSizeKB = (totalSize / 1024).toFixed(2);
  const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(3);

  console.log('\n' + '=' .repeat(60));
  console.log(`📈 Total Bundle Size: ${totalSizeKB} KB (${totalSizeMB} MB)`);
  console.log('=' .repeat(60));

  // Recommendations
  console.log('\n💡 Recommendations:');
  
  if (totalSizeMB > 1) {
    console.log('   ⚠️  Bundle size is large. Consider:');
    console.log('      - Tree shaking optimization');
    console.log('      - Code splitting');
    console.log('      - Removing unused dependencies');
  } else {
    console.log('   ✅ Bundle size is reasonable');
  }

  // Check for large files
  Object.entries(results).forEach(([pkg, data]) => {
    Object.entries(data.files).forEach(([file, info]) => {
      if (info.size > 100 * 1024) { // 100KB
        console.log(`   ⚠️  Large file: ${pkg}/${file} (${info.sizeKB} KB)`);
      }
    });
  });
}

function checkTreeShaking() {
  console.log('\n🌳 Tree Shaking Analysis\n');
  console.log('=' .repeat(60));

  const packages = ['core', 'plugins', 'presets'];
  
  packages.forEach(pkg => {
    const distPath = path.join(__dirname, '..', 'packages', pkg, 'dist');
    
    if (!fs.existsSync(distPath)) {
      return;
    }

    const files = fs.readdirSync(distPath);
    const hasESM = files.some(f => f.endsWith('.js') && !f.endsWith('.cjs'));
    const hasCJS = files.some(f => f.endsWith('.cjs'));
    const hasDTS = files.some(f => f.endsWith('.d.ts'));

    console.log(`📦 ${pkg}:`);
    console.log(`   ESM: ${hasESM ? '✅' : '❌'}`);
    console.log(`   CJS: ${hasCJS ? '✅' : '❌'}`);
    console.log(`   DTS: ${hasDTS ? '✅' : '❌'}`);
  });
}

function main() {
  console.log('🔍 Analyzing Advanced Client Fetch bundles...\n');
  
  const results = analyzeBundleSize();
  printAnalysis(results);
  checkTreeShaking();
  
  console.log('\n✨ Analysis complete!');
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { analyzeBundleSize, printAnalysis, checkTreeShaking };
