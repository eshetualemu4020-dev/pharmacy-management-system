import cron from 'node-cron';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backupDir = path.join(__dirname, '../../backups');
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
}

// Run backup every night at 2 AM
cron.schedule('0 2 * * *', () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `backup-${timestamp}.sql`;
    const filePath = path.join(backupDir, fileName);

    const host = process.env.MYSQL_SERVER || 'localhost';
    const user = process.env.MYSQL_USER || 'root';
    const password = process.env.MYSQL_PASSWORD || '';
    const database = process.env.MYSQL_DB || 'pharmacy_db';
    
    // WARNING: mysqldump must be installed and in PATH
    const command = `mysqldump -h ${host} -u ${user} -p${password} ${database} > "${filePath}"`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Backup error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`Backup stderr: ${stderr}`);
        }
        console.log(`Successfully backed up database to ${filePath}`);
    });
});

console.log('Database backup cron job scheduled.');
