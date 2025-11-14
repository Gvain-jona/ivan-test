// Simple script to test the auth API
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/check-email',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const data = JSON.stringify({
  email: 'admin@example.com'
});

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('BODY:', responseData);
    try {
      const jsonData = JSON.parse(responseData);
      console.log('Parsed JSON:', jsonData);
    } catch (e) {
      console.error('Failed to parse JSON:', e.message);
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(data);
req.end();
