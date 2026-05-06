import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Move up to the root directory
const rootDir = path.join(__dirname, '..');
const backupRootDir = path.join(rootDir, 'backups');

async function runRestore() {
  try {
    const requestedBackup = process.argv[2];
    let sourceDir = "";

    if (!requestedBackup) {
      if (!fs.existsSync(backupRootDir)) {
        console.error('Backup directory not found.');
        process.exit(1);
      }
      const backups = fs.readdirSync(backupRootDir).filter(f => 
        fs.statSync(path.join(backupRootDir, f)).isDirectory()
      );
      if (backups.length === 0) {
        console.error('No backups found in local backups directory.');
        process.exit(1);
      }
      // Sort by modification time to find the absolute latest
      backups.sort((a, b) => {
        return fs.statSync(path.join(backupRootDir, b)).mtime.getTime() - fs.statSync(path.join(backupRootDir, a)).mtime.getTime();
      });
      sourceDir = path.join(backupRootDir, backups[0]);
    } else {
      // Check if requestedBackup is a full path or just a name in the local backups folder
      if (fs.existsSync(requestedBackup) && fs.statSync(requestedBackup).isDirectory()) {
        sourceDir = requestedBackup;
      } else {
        const localPath = path.join(backupRootDir, requestedBackup);
        if (fs.existsSync(localPath) && fs.statSync(localPath).isDirectory()) {
          sourceDir = localPath;
        } else {
          console.error(`Backup '${requestedBackup}' not found as a folder or full path.`);
          process.exit(1);
        }
      }
    }

    console.log(`Restoring design environment from ${sourceDir}...`);

    // Files and directories to restore
    const itemsToRestore = [
      'src',
      'public',
      'json',
      'index.html',
      '.env',
      '.gitignore',
      'app_config.json',
      '예제.md'
    ];


    for (const item of itemsToRestore) {
      const srcItemPath = path.join(sourceDir, item);
      const destItemPath = path.join(rootDir, item);

      if (fs.existsSync(srcItemPath)) {
        console.log(`Restoring ${item}...`);
        await fs.copy(srcItemPath, destItemPath, { overwrite: true });
      }
    }

    console.log('Restore completed successfully.');
  } catch (err) {
    console.error('Restore failed:', err);
    process.exit(1);
  }
}

runRestore();
