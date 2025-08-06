const Database = require('better-sqlite3');
const CryptoJS = require('crypto-js');
const path = require('path');

// Password hashing utility
const hashPassword = (password) => {
  return CryptoJS.SHA256(password + 'salt_pbr_2024').toString();
};

// Simple password validation
const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return { valid: errors.length === 0, errors };
};

// Test various passwords
const testPasswords = [
  'pass123',      // ✅ Valid: 6+ chars with number
  'test456',      // ✅ Valid: 6+ chars with number
  'simple1',      // ✅ Valid: 6+ chars with number
  'abc123',       // ✅ Valid: 6 chars with number
  'password',     // ❌ Invalid: no number
  'pass1',        // ❌ Invalid: only 5 chars
  '12345',        // ❌ Invalid: only 5 chars
  '123456',       // ✅ Valid: 6 chars all numbers
  'hello1world',  // ✅ Valid: 6+ chars with number
];

console.log('Testing simplified password validation:\n');
console.log('Requirements: At least 6 characters and 1 number\n');
console.log('─'.repeat(50));

testPasswords.forEach(password => {
  const validation = validatePassword(password);
  const status = validation.valid ? '✅' : '❌';
  const paddedPassword = password.padEnd(15);
  
  if (validation.valid) {
    console.log(`${status} "${paddedPassword}" - Valid`);
  } else {
    console.log(`${status} "${paddedPassword}" - Invalid: ${validation.errors.join(', ')}`);
  }
});

console.log('\n─'.repeat(50));
console.log('\nNow testing actual login with simplified password...\n');

// Test actual database login
const dbPath = path.join(__dirname, 'data', 'pbike-rescue.db');
const db = new Database(dbPath);

const email = 'Aussiepowers555@gmail.com';
const password = 'pass123';

const hashedPassword = hashPassword(password);
const user = db.prepare('SELECT * FROM user_accounts WHERE LOWER(email) = LOWER(?)').get(email);

if (user && user.password_hash === hashedPassword) {
  console.log('✅ Login successful with simplified password!');
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password}`);
} else {
  console.log('❌ Login failed');
}

db.close();