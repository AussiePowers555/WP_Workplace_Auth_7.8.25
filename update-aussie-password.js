const Database = require('better-sqlite3');
const CryptoJS = require('crypto-js');
const path = require('path');
const fs = require('fs');

// Password hashing utility
const hashPassword = (password) => {
  return CryptoJS.SHA256(password + 'salt_pbr_2024').toString();
};

// Function to update password
function updatePassword(dbPath, email, newPassword) {
  try {
    if (!fs.existsSync(dbPath)) {
      console.log(`⚠️  Database ${dbPath} does not exist, skipping...`);
      return;
    }

    console.log(`📁 Updating password in: ${path.basename(dbPath)}`);
    const db = new Database(dbPath);

    const hashedPassword = hashPassword(newPassword);
    const now = new Date().toISOString();
    
    const updateStmt = db.prepare(`
      UPDATE user_accounts 
      SET password_hash = ?, 
          updated_at = ?
      WHERE LOWER(email) = LOWER(?)
    `);
    
    const result = updateStmt.run(hashedPassword, now, email);
    
    if (result.changes > 0) {
      console.log(`   ✅ Password updated successfully`);
    } else {
      console.log(`   ⚠️  User not found`);
    }

    db.close();
  } catch (error) {
    console.error(`   ❌ Error:`, error.message);
  }
}

const email = 'Aussiepowers555@gmail.com';
const newPassword = 'abc123';

console.log('='.repeat(50));
console.log('UPDATING CLIENT PASSWORD');
console.log('='.repeat(50));
console.log(`\nEmail: ${email}`);
console.log(`New Password: ${newPassword}`);
console.log(`Role: CLIENT`);
console.log('\n');

// Update in all database locations
updatePassword(path.join(__dirname, 'data', 'pbike-rescue.db'), email, newPassword);
updatePassword(path.join(__dirname, 'local.db'), email, newPassword);
updatePassword(path.join(__dirname, 'pbr.db'), email, newPassword);

console.log('\n' + '='.repeat(50));
console.log('✅ PASSWORD UPDATED');
console.log('='.repeat(50));
console.log('\n📝 CLIENT LOGIN:');
console.log(`   Email: ${email}`);
console.log(`   Password: ${newPassword}`);
console.log(`   Role: CLIENT (restricted access)`);