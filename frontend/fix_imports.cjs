const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src', 'pages', 'admin');

function fixImports(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            fixImports(fullPath);
        } else if (fullPath.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('formatCurrency') && !content.includes('import { formatCurrency }')) {
                // Determine relative path
                let relativePath = path.relative(path.dirname(fullPath), path.join(__dirname, 'src', 'utils', 'currency')).replace(/\\/g, '/');
                
                // Prepend import to the file
                content = `import { formatCurrency } from '${relativePath}';\n` + content;
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Fixed import in ${fullPath}`);
            }
        }
    }
}

fixImports(srcDir);
