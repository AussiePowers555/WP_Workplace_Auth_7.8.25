const Database = require('better-sqlite3');
const CryptoJS = require('crypto-js');
const path = require('path');

// Initialize database
const dataDir = path.join(__dirname, 'data');
const dbPath = path.join(dataDir, 'pbike-rescue.db');
const db = new Database(dbPath);

// Password hashing utility
const hashPassword = (password) => {
  return CryptoJS.SHA256(password + 'salt_pbr_2024').toString();
};

// Test credentials
const email = 'Aussiepowers555@gmail.com';
const password = 'TempPass123!';

console.log('Testing login credentials...\n');
console.log(`Email: ${email}`);
console.log(`Password: ${password}`);
console.log('\n-----------------------------------\n');

// Try to authenticate
const hashedPassword = hashPassword(password);
const user = db.prepare('SELECT * FROM user_accounts WHERE email = ?').get(email);

if (!user) {
  console.log('❌ User not found');
  process.exit(1);
}

console.log('✅ User found in database');
console.log(`   ID: ${user.id}`);
console.log(`   Role: ${user.role}`);
console.log(`   Status: ${user.status}`);
console.log(`   First Login: ${user.first_login ? 'Yes' : 'No'}`);

if (user.password_hash === hashedPassword) {
  console.log('\n✅ Password is correct!');
  console.log('🎉 Login would be successful');
  
  if (user.status === 'pending_password_change') {
    console.log('\n⚠️  Note: User will be prompted to change password on first login');
  }
} else {
  console.log('\n❌ Password is incorrect');
  console.log('Debug info:');
  console.log(`   Expected hash: ${user.password_hash}`);
  console.log(`   Provided hash: ${hashedPassword}`);
}

// Close database
db.close();