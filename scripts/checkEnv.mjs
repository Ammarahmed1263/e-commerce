import '../server.js';
setTimeout(() => {
  console.log('JWT_ACCESS_EXPIRES_IN:', process.env.JWT_ACCESS_EXPIRES_IN);
  console.log('JWT_ACCESS_SECRET length:', process.env.JWT_ACCESS_SECRET?.length);
  process.exit(0);
}, 2000);
