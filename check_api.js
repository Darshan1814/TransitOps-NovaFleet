const fs = require('fs');

async function run() {
  try {
    const res = await fetch('http://localhost:3000/api/auth/session');
    console.log('/api/auth/session Status:', res.status);
    const text = await res.text();
    console.log('/api/auth/session Response:', text.substring(0, 500));
  } catch (e) {
    console.error('Fetch error:', e);
  }
}
run();
