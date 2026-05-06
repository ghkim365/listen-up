import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Move up to the root directory
const rootDir = path.join(__dirname, '..');
const srcDir = path.join(rootDir, 'src');
const backupDir = path.join(rootDir, 'backups');

function getFormattedDate() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  let hh = now.getHours();
  const min = String(now.getMinutes()).padStart(2, '0');
  const ampm = hh >= 12 ? 'pm' : 'am';
  hh = hh % 12;
  hh = hh ? hh : 12;
  const formattedHour = String(hh).padStart(2, '0');
  return `design_env_${yyyy}${mm}${dd}_${formattedHour}${min}${ampm}`;
}

const targetDir = path.join(backupDir, getFormattedDate());

async function runBackup() {
  try {
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }
    
    console.log(`Starting backup of design environment to ${targetDir}...`);
    
    // Copy src
    if (fs.existsSync(srcDir)) {
      await fs.copy(srcDir, path.join(targetDir, 'src'));
    }
    
    // Copy public
    const publicDir = path.join(rootDir, 'public');
    if (fs.existsSync(publicDir)) {
      await fs.copy(publicDir, path.join(targetDir, 'public'));
    }
    
    // Copy config and data files
    const configFiles = ['package.json', 'vite.config.js', 'index.html', '.env', '.gitignore', 'app_config.json', '예제.md'];
    for (const file of configFiles) {
      const filePath = path.join(rootDir, file);
      if (fs.existsSync(filePath)) {
        await fs.copy(filePath, path.join(targetDir, file));
      }
    }

    // Copy json data directory
    const jsonDir = path.join(rootDir, 'json');
    if (fs.existsSync(jsonDir)) {
      await fs.copy(jsonDir, path.join(targetDir, 'json'));
    }
    
    console.log(`Backup completed successfully at: ${targetDir}`);
    
    // Force permissions so the user can access/delete/modify the folder
    if (process.platform === 'win32') {
      console.log('Resetting ownership and permissions for the backup folder...');
      const cmd = `cmd /c "takeown /f \"${targetDir}\" /r /d y && icacls \"${targetDir}\" /grant Everyone:(OI)(CI)F /t"`;
      await new Promise((resolve) => {
        exec(cmd, (err) => {
          if (err) console.error('Permission fix failed:', err);
          else console.log('Permissions updated successfully.');
          resolve();
        });
      });
    }
  } catch (err) {
    console.error('Backup failed:', err);
  }
}

runBackup();
