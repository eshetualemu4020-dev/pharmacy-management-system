import db from './src/config/database.js';

const tables = db.prepare("SELECT name, sql FROM sqlite_master WHERE type='table'").all();
console.log(JSON.stringify(tables, null, 2));
