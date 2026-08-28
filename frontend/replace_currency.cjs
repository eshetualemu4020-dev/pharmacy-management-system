const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src', 'pages', 'admin');

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Pattern 1: ${parseFloat(xxx).toFixed(2)}
    // Example: ${parseFloat(data.summary.total_revenue).toFixed(2)}
    content = content.replace(/\$\{parseFloat\(([^)]+)\)\.toFixed\(2\)\}/g, (match, p1) => `{formatCurrency(${p1})}`);
    
    // Pattern 1b: ${parseFloat(xxx || 0).toFixed(2)}
    content = content.replace(/\$\{parseFloat\(([^)]+ \|\| 0)\)\.toFixed\(2\)\}/g, (match, p1) => `{formatCurrency(${p1})}`);

    // Pattern 1c: ${xxx.toFixed(2)} where xxx might be an expression
    content = content.replace(/\$\{((?:[^}]|\n)+)\.toFixed\(2\)\}/g, (match, p1) => {
        if (p1.includes('parseFloat')) return match; // Already handled
        return `{formatCurrency(${p1})}`;
    });

    // Pattern 2: ETB {Number(xxx).toFixed(2)}
    content = content.replace(/ETB \{Number\(([^)]+)\)\.toFixed\(2\)\}/g, (match, p1) => `{formatCurrency(${p1})}`);
    
    // Pattern 3: ETB {xxx.toFixed(2)}
    content = content.replace(/ETB \{([^}]+)\.toFixed\(2\)\}/g, (match, p1) => {
        if (p1.includes('Number(')) return match; // Already handled
        return `{formatCurrency(${p1})}`;
    });
    
    // Pattern 4: {Number(xxx).toFixed(2)} when it's not prefixed by ETB (like unit_cost)
    // Be careful, maybe it doesn't have a currency prefix, but since it's a price, we can use formatCurrency.
    // Let's only do this manually if needed. I'll just run this script for the obvious ones first.

    // Specific replacements for known patterns
    // <td>{Number(item.unit_cost).toFixed(2)}</td>
    content = content.replace(/\{Number\(([^)]+)\)\.toFixed\(2\)\}/g, (match, p1) => `{formatCurrency(${p1})}`);
    content = content.replace(/\{(\([^)]+\)\.toFixed\(2\))\}/g, (match, p1) => `{formatCurrency(${p1.replace(/\.toFixed\(2\)/, '')})}`);
    
    // If we made replacements, ensure we import formatCurrency
    if (content !== original) {
        if (!content.includes('formatCurrency')) {
            // Figure out relative path to utils/currency
            const relativePath = path.relative(path.dirname(filePath), path.join(__dirname, 'src', 'utils', 'currency')).replace(/\\/g, '/');
            
            // Add import after the last import statement
            const imports = content.match(/import .* from .*;/g);
            if (imports) {
                const lastImport = imports[imports.length - 1];
                content = content.replace(lastImport, `${lastImport}\nimport { formatCurrency } from '${relativePath}';`);
            } else {
                content = `import { formatCurrency } from '${relativePath}';\n` + content;
            }
        }
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${filePath}`);
    }
}

function traverse(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            traverse(fullPath);
        } else if (fullPath.endsWith('.tsx')) {
            replaceInFile(fullPath);
        }
    }
}

traverse(srcDir);
