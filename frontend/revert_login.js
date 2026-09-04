import fs from 'fs';
import path from 'path';

const LOGIN_FILE = path.resolve('./src/pages/Login.tsx');

const revertReplacements = [
  { from: /\bbg-base\b/g, to: 'bg-[#110f22]' },
  { from: /\bbg-surface-alt\b/g, to: 'bg-[#24223d]' },
  { from: /\bbg-surface\b/g, to: 'bg-[#232136]' },
  { from: /\bborder-subtle-hover\b/g, to: 'border-white/10' },
  { from: /\bborder-subtle\b/g, to: 'border-white/5' },
  { from: /\btext-muted\b/g, to: 'text-[#a09eb5]' },
  { from: /\btext-main\b/g, to: 'text-white' },
  { from: /\bbg-hover\b/g, to: 'bg-white/5' },
  { from: / className="dark /g, to: ' className="' }
];

let content = fs.readFileSync(LOGIN_FILE, 'utf8');

for (const rule of revertReplacements) {
  content = content.replace(rule.from, rule.to);
}

fs.writeFileSync(LOGIN_FILE, content, 'utf8');
console.log('Reverted colors in Login.tsx');
