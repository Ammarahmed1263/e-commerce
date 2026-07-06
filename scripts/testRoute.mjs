// Quick test: make a real HTTP request to the running server
import http from 'http';

function request(path, method = 'GET', headers = {}) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: { 'Content-Type': 'application/json', ...headers }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data.substring(0, 300) }));
    });
    req.on('error', e => resolve({ error: e.message }));
    req.end();
  });
}

// Test with no auth
const r1 = await request('/api/v1/vendors/dashboard/stats');
console.log('No auth:', r1.status, r1.body.substring(0, 100));

// Test with fake auth  
const r2 = await request('/api/v1/vendors/dashboard/stats', 'GET', { Authorization: 'Bearer faketoken' });
console.log('Fake auth:', r2.status, r2.body.substring(0, 100));

// Test the slug route to compare
const r3 = await request('/api/v1/vendors/dashboard', 'GET');
console.log('/vendors/dashboard (no trailing):', r3.status, r3.body.substring(0, 100));

// Test with origin header (like browser)
const r4 = await request('/api/v1/vendors/dashboard/stats', 'GET', { 
  Authorization: 'Bearer faketoken',
  Origin: 'http://localhost:5173'
});
console.log('With Origin header:', r4.status, r4.body.substring(0, 100));
