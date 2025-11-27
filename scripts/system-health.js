#!/usr/bin/env node
// scripts/system-health.js
// MANGU System Health Monitor

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

class SystemHealthMonitor {
  constructor(options = {}) {
    this.options = {
      watch: options.watch || false,
      interval: options.interval || 30000,
      alertThreshold: options.alertThreshold || 0.8,
      ...options
    };
    this.results = {};
  }

  async runFullDiagnostic() {
    const startTime = Date.now();
    
    console.log('🔍 MANGU System Health Diagnostic');
    console.log('==================================\n');

    const checks = await Promise.allSettled([
      this.checkFileStructure(),
      this.checkExports(),
      this.checkImports(),
      this.checkSyntax(),
      this.checkDependencies()
    ]);

    const results = checks.map((check, index) => ({
      name: ['fileStructure', 'exports', 'imports', 'syntax', 'dependencies'][index],
      status: check.status,
      value: check.status === 'fulfilled' ? check.value : check.reason
    }));

    const report = this.generateReport(results, Date.now() - startTime);
    
    if (this.options.watch) {
      this.startWatching();
    }

    return report;
  }

  async checkFileStructure() {
    const clientPagesDir = path.join(PROJECT_ROOT, 'client', 'src', 'pages');
    const components = [];

    if (fs.existsSync(clientPagesDir)) {
      const files = fs.readdirSync(clientPagesDir)
        .filter(f => f.endsWith('.jsx') && !f.includes('test'));
      
      components.push(...files.map(file => ({
        component: file.replace('.jsx', ''),
        exists: true,
        path: path.join(clientPagesDir, file),
        size: fs.statSync(path.join(clientPagesDir, file)).size
      })));
    }

    this.results.fileStructure = components;
    return components;
  }

  async checkExports() {
    const pagesDir = path.join(PROJECT_ROOT, 'client', 'src', 'pages');
    if (!fs.existsSync(pagesDir)) {
      return [];
    }

    const files = fs.readdirSync(pagesDir)
      .filter(f => f.endsWith('.jsx') && !f.includes('test'));

    const results = files.map(file => {
      const filePath = path.join(pagesDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      const hasDefaultExport = /export\s+default/.test(content);
      const namedExports = (content.match(/export\s+(const|function|class)/g) || []).length;
      
      const issues = [];
      if (!hasDefaultExport && file !== 'index.jsx') {
        issues.push('Missing default export');
      }

      return {
        file,
        hasDefaultExport,
        hasNamedExports: namedExports > 0,
        exportCount: namedExports,
        issues
      };
    });

    this.results.exports = results;
    return results;
  }

  async checkImports() {
    const appFile = path.join(PROJECT_ROOT, 'client', 'src', 'App.jsx');
    if (!fs.existsSync(appFile)) {
      return [];
    }

    const appContent = fs.readFileSync(appFile, 'utf8');
    const importRegex = /import\s+.*\s+from\s+['"](.*)['"]/g;
    const imports = [];
    let match;

    while ((match = importRegex.exec(appContent)) !== null) {
      const fullMatch = match[0];
      const importPath = match[1];
      const lineNumber = appContent.substring(0, match.index).split('\n').length;
      
      imports.push({
        statement: fullMatch,
        path: importPath,
        line: lineNumber
      });
    }

    const resolved = imports.map(imp => {
      let exists = false;
      let error = null;

      try {
        if (imp.path.startsWith('.')) {
          const possiblePaths = [
            path.join(PROJECT_ROOT, 'client', 'src', imp.path),
            path.join(PROJECT_ROOT, 'client', 'src', imp.path + '.jsx'),
            path.join(PROJECT_ROOT, 'client', 'src', imp.path + '.js'),
            path.join(PROJECT_ROOT, 'client', 'src', imp.path, 'index.jsx'),
            path.join(PROJECT_ROOT, 'client', 'src', imp.path, 'index.js')
          ];
          
          exists = possiblePaths.some(p => fs.existsSync(p));
          if (!exists) {
            error = `Could not resolve: ${imp.path}`;
          }
        } else {
          try {
            require.resolve(imp.path);
            exists = true;
          } catch (e) {
            exists = false;
            error = `Module not found: ${imp.path}`;
          }
        }
      } catch (e) {
        error = e.message;
      }

      return { ...imp, exists, error };
    });

    this.results.imports = resolved;
    return resolved;
  }

  async checkSyntax() {
    const pagesDir = path.join(PROJECT_ROOT, 'client', 'src', 'pages');
    if (!fs.existsSync(pagesDir)) {
      return [];
    }

    const files = fs.readdirSync(pagesDir)
      .filter(f => f.endsWith('.jsx') || f.endsWith('.js'));

    const results = files.map(file => {
      const filePath = path.join(pagesDir, file);
      try {
        execSync(`node --check "${filePath}"`, { 
          stdio: 'pipe',
          timeout: 5000
        });
        return { file, valid: true };
      } catch (error) {
        const errorMsg = error.stdout?.toString() || error.message;
        return { 
          file, 
          valid: false, 
          error: errorMsg.split('\n')[0]
        };
      }
    });

    this.results.syntax = results;
    return results;
  }

  async checkDependencies() {
    try {
      const packageJsonPath = path.join(PROJECT_ROOT, 'client', 'package.json');
      if (!fs.existsSync(packageJsonPath)) {
        return { error: 'package.json not found' };
      }

      const packageJson = JSON.parse(
        fs.readFileSync(packageJsonPath, 'utf8')
      );
      
      const deps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };

      this.results.dependencies = {
        total: Object.keys(deps).length,
        packages: Object.keys(deps)
      };
    } catch (error) {
      this.results.dependencies = { error: error.message };
    }
    return this.results.dependencies;
  }

  generateReport(results, duration) {
    const summary = {
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      checks: results.length,
      passed: results.filter(r => r.status === 'fulfilled').length,
      errors: results.filter(r => r.status === 'rejected').length
    };

    const report = {
      summary,
      details: results.reduce((acc, result) => {
        acc[result.name] = result.value;
        return acc;
      }, {})
    };

    // Print summary
    console.log('\n📊 Health Summary:');
    console.log('==================');
    console.log(`Duration: ${summary.duration}`);
    console.log(`Checks: ${summary.checks}`);
    console.log(`✅ Passed: ${summary.passed}`);
    console.log(`❌ Errors: ${summary.errors}`);

    return report;
  }

  startWatching() {
    console.log(`\n👀 Watching for changes (interval: ${this.options.interval}ms)...`);
    
    this.watcher = setInterval(async () => {
      console.log('\n🔄 Running periodic health check...');
      await this.runFullDiagnostic();
    }, this.options.interval);

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      if (this.watcher) {
        clearInterval(this.watcher);
        console.log('\n👋 Health monitoring stopped');
      }
      process.exit(0);
    });
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const watch = process.argv.includes('--watch');
  const intervalArg = process.argv.find(arg => arg.startsWith('--interval='));
  const interval = intervalArg ? parseInt(intervalArg.split('=')[1]) : 30000;

  const monitor = new SystemHealthMonitor({
    watch,
    interval
  });

  monitor.runFullDiagnostic().then(report => {
    const exitCode = report.summary.errors > 0 ? 1 : 0;
    process.exit(exitCode);
  });
}

export default SystemHealthMonitor;





