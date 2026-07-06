import jwt from 'jsonwebtoken';
import http from 'http';

// Read env manually
import { readFileSync } from 'fs';
const env = Object.fromEntries(
  readFileSync('.env', 'utf8').split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const [k, ...v] = l.split('='); return [k.trim(), v.join('=').trim()]; })
);

const secret = env.JWT_ACCESS_SECRET;
const token = jwt.sign({ id: 'test123', role: 'seller' }, secret, { expiresIn: '7d' });
console.log('Generated token (first 50):', token.substring(0, 50));

// Test it against the running server
function request(path, headers = {}) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost', port: 5000, path, method: 'GET',
      headers: { 'Content-Type': 'application/json', ...headers }
    }, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d.substring(0, 200) }));
    });
    req.on('error', e => resolve({ error: e.message }));
    req.end();
  });
}

const r = await request('/api/v1/vendors/dashboard/stats', { Authorization: `Bearer ${token}` });
console.log('Status:', r.status);
console.log('Body:', r.body);
