#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const chokidar = require('chokidar');

const LIBS_DIR = path.join(__dirname, 'libs');
const DIST_DIR = path.join(LIBS_DIR, 'dist');
const WEB_TARGET = path.join(__dirname, 'apps/web/node_modules/@qnoffice/shared');
const BE_TARGET = path.join(__dirname, 'apps/be/node_modules/@qnoffice/shared');

let tscProcess = null;
let debounceTimer = null;

// Copy directory recursively
function copyDir(src, dest) {
   if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
   }

   const entries = fs.readdirSync(src, { withFileTypes: true });

   for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
         copyDir(srcPath, destPath);
      } else {
         fs.copyFileSync(srcPath, destPath);
      }
   }
}

// Copy package.json
function copyPackageJson() {
   const pkgSrc = path.join(LIBS_DIR, 'package.json');
   fs.copyFileSync(pkgSrc, path.join(WEB_TARGET, 'package.json'));
   fs.copyFileSync(pkgSrc, path.join(BE_TARGET, 'package.json'));
}

// Sync dist to node_modules
function syncToNodeModules() {
   if (debounceTimer) clearTimeout(debounceTimer);

   debounceTimer = setTimeout(() => {
      console.log('\n📦 Syncing to node_modules...');

      try {
         // Copy dist to web
         copyDir(DIST_DIR, path.join(WEB_TARGET, 'dist'));
         // Copy dist to be
         copyDir(DIST_DIR, path.join(BE_TARGET, 'dist'));
         // Copy package.json
         copyPackageJson();

         console.log('✅ Synced to web and backend!\n');
      } catch (error) {
         console.error('❌ Sync error:', error.message);
      }
   }, 500);
}

// Start TypeScript compiler in watch mode
function startTscWatch() {
   console.log('🔨 Starting TypeScript compiler in watch mode...\n');

   tscProcess = spawn('npm', ['run', 'watch'], {
      cwd: LIBS_DIR,
      stdio: 'inherit',
      shell: true
   });

   tscProcess.on('error', (error) => {
      console.error('❌ Failed to start tsc:', error);
   });
}

// Main
console.log('👀 Starting libs watcher...\n');

// Initial sync
if (fs.existsSync(DIST_DIR)) {
   syncToNodeModules();
}

// Start TypeScript watcher
startTscWatch();

// Watch dist folder for changes
const watcher = chokidar.watch(DIST_DIR, {
   ignored: /(^|[\/\\])\../,
   persistent: true,
   ignoreInitial: true
});

watcher
   .on('add', (path) => {
      console.log(`📄 File added: ${path}`);
      syncToNodeModules();
   })
   .on('change', (path) => {
      console.log(`📝 File changed: ${path}`);
      syncToNodeModules();
   })
   .on('unlink', (path) => {
      console.log(`🗑️  File removed: ${path}`);
      syncToNodeModules();
   });

// Handle process termination
process.on('SIGINT', () => {
   console.log('\n\n👋 Stopping watcher...');
   if (tscProcess) tscProcess.kill();
   watcher.close();
   process.exit(0);
});

console.log('✅ Watcher started! Press Ctrl+C to stop.\n');
