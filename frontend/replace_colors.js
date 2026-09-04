import fs from 'fs';
import path from 'path';

const SRC_DIR = path.resolve('./src');

const replacements = [
  { from: /bg-\[#110f22\]/g, to: 'bg-base' },
  { from: /bg-\[#232136\]/g, to: 'bg-surface' },
  { from: /bg-\[#24223d\]/g, to: 'bg-surface-alt' },
  { from: /border-white\/5/g, to: 'border-subtle' },
  { from: /border-white\/10/g, to: 'border-subtle-hover' },
  { from: /text-\[#a09eb5\]/g, to: 'text-muted' },
  { from: /bg-white\/5/g, to: 'bg-hover' },
];

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let original = content;
      
      // Perform simple replacements
      for (const rule of replacements) {
        content = content.replace(rule.from, rule.to);
      }
      
      // Handle text-white replacement carefully
      // We only want to replace text-white if it's NOT inside a class string that contains a solid background color like bg-[#9b51e0], bg-emerald-500, etc.
      // But for simplicity in regex, let's just replace text-white everywhere first, and then we will manually or via another pass fix buttons if they break.
      // Actually, a better regex is to match text-white inside className="..." and see if the same string contains bg-purple, bg-[#9b51e0], bg-amber, bg-emerald, bg-blue, bg-red.
      
      content = content.replace(/className=(["'])(.*?)\1/g, (match, quote, classStr) => {
        // If it contains a solid color background, leave text-white alone
        const solidBgRegex = /bg-(gradient|purple|emerald|red|amber|blue|green|indigo|pink|orange|cyan|teal|yellow)-|bg-\[#9b51e0\]|bg-white\b|bg-black\b/;
        if (solidBgRegex.test(classStr)) {
          return match;
        }
        
        // Otherwise, replace text-white with text-main
        const newClassStr = classStr.replace(/\btext-white\b/g, 'text-main');
        return `className=${quote}${newClassStr}${quote}`;
      });

      // Also replace text-white in template literals className={`...`}
      content = content.replace(/className=\{`([^`]+)`\}/g, (match, classStr) => {
        const solidBgRegex = /bg-(gradient|purple|emerald|red|amber|blue|green|indigo|pink|orange|cyan|teal|yellow)-|bg-\[#9b51e0\]|bg-white\b|bg-black\b/;
        if (solidBgRegex.test(classStr)) {
          return match;
        }
        const newClassStr = classStr.replace(/\btext-white\b/g, 'text-main');
        return `className={\`${newClassStr}\`}`;
      });
      
      if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDirectory(SRC_DIR);
console.log('Done replacing colors.');
