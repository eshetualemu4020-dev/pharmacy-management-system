const fs = require('fs');
const path = require('path');

const apiPath = path.join(__dirname, 'frontend', 'src', 'services', 'api.ts');
let content = fs.readFileSync(apiPath, 'utf8');

// Insert fetchWithAuth after getAuthHeaders
const insertStr = `
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, options);
  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Session expired. Please log in again.');
  }
  return response;
};
`;

content = content.replace(
  /const getAuthHeaders = \(\) => \(\{[\s\S]*?\}\);\n/,
  match => match + insertStr
);

// Replace fetch with fetchWithAuth, but ONLY after getAuthHeaders
// We can split the file at export const userApi
const parts = content.split('export const userApi = {');
if (parts.length === 2) {
  parts[1] = parts[1].replace(/await fetch\(/g, 'await fetchWithAuth(');
  content = parts[0] + 'export const userApi = {' + parts[1];
  fs.writeFileSync(apiPath, content, 'utf8');
  console.log('Successfully updated api.ts');
} else {
  console.log('Could not find userApi to split file');
}
