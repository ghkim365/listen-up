import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { exec } from 'child_process'
import fs from 'fs'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/listen_up/',
  plugins: [
    react(),
    {
      name: 'backup-api',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url.startsWith('/api/backup')) {
            const url = new URL(req.url, `http://${req.headers.host}`);
            const customPath = url.searchParams.get('path');
            
            console.log(`Triggering server backup via API... ${customPath ? 'Target: ' + customPath : ''}`);
            const cmd = customPath ? `node scripts/backup.js "${customPath}"` : 'npm run backup';
            
            exec(cmd, (err, stdout, stderr) => {
              if (err) {
                console.error('Backup API error:', err);
                res.statusCode = 500;
                res.end(JSON.stringify({ success: false, error: err.message }));
                return;
              }
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, message: 'Backup successful' }));
            });
            return;
          }

          if (req.url === '/api/backups') {
            try {
              const backupDir = path.join(process.cwd(), 'backups');
              if (!fs.existsSync(backupDir)) {
                res.end(JSON.stringify([]));
                return;
              }
              const folders = fs.readdirSync(backupDir)
                .filter(f => fs.statSync(path.join(backupDir, f)).isDirectory())
                .sort((a, b) => {
                  return fs.statSync(path.join(backupDir, b)).mtime.getTime() - fs.statSync(path.join(backupDir, a)).mtime.getTime();
                });
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(folders));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
            return;
          }

          if (req.url.startsWith('/api/restore')) {
            const url = new URL(req.url, `http://${req.headers.host}`);
            const folder = url.searchParams.get('folder');
            
            console.log(`Triggering server restore via API for folder: ${folder || 'latest'}...`);
            const cmd = folder ? `node scripts/restore.js "${folder}"` : 'npm run restore';
            
            exec(cmd, (err, stdout, stderr) => {
              if (err) {
                console.error('Restore API error:', err);
                res.statusCode = 500;
                res.end(JSON.stringify({ success: false, error: err.message }));
                return;
              }
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, message: 'Restore scheduled' }));
            });
            return;
          }

          if (req.url === '/api/pick-folder') {
            const psCommand = `powershell -Command "Add-Type -AssemblyName System.Windows.Forms; $f = New-Object System.Windows.Forms.FolderBrowserDialog; $f.Description = '복구할 디자인 환경 폴더를 선택하세요'; if($f.ShowDialog() -eq 'OK') { $f.SelectedPath }"`;
            exec(psCommand, (err, stdout, stderr) => {
              if (err) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: err.message }));
                return;
              }
              const selectedPath = stdout.trim();
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ path: selectedPath }));
            });
            return;
          }

          if (req.url === '/api/open-backups') {
            const backupDir = path.join(process.cwd(), 'backups');
            exec(`explorer "${backupDir}"`);
            res.end(JSON.stringify({ success: true }));
            return;
          }

          next();
        });
      }
    }
  ],
  server: {
    host: '0.0.0.0',
    port: 3060,
    watch: {
      ignored: ['**/backups/**']
    }
  }
})
