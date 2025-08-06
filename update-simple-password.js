const Database = require('better-sqlite3');
const CryptoJS = require('crypto-js');
const path = require('path');
const fs = require('fs');

// Password hashing utility
const hashPassword = (password) => {
  return CryptoJS.SHA256(password + 'salt_pbr_2024').toString();
};

// Function to update user password in a database
function updateUserPassword(dbPath, email, newPassword) {
  try {
    if (!fs.existsSync(dbPath)) {
      console.log(`⚠️  Database ${dbPath} does not exist, skipping...`);
      return;
    }

    console.log(`\n📁 Updating password in: ${dbPath}`);
    const db = new Database(dbPath);

    // Check if user_accounts table exists
    const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='user_accounts'").get();
    
    if (!tableExists) {
      console.log('   ❌ user_accounts table does not exist');
      db.close();
      return;
    }

    // Update user password
    const hashedPassword = hashPassword(newPassword);
    const now = new Date().toISOString();
    
    const updateStmt = db.prepare(`
      UPDATE user_accounts 
      SET password_hash = ?, 
          status = ?, 
          first_login = ?,
          updated_at = ?
      WHERE LOWER(email) = LOWER(?)
    `);
    
    const result = updateStmt.run(
      hashedPassword,
      'pending_password_change',
      1,
      now,
      email
    );
    
    if (result.changes > 0) {
      console.log(`   ✅ Password updated for: ${email}`);
    } else {
      console.log(`   ⚠️  User not found: ${email}`);
    }

    db.close();
  } catch (error) {
    console.error(`   ❌ Error in ${dbPath}:`, error.message);
  }
}

// Simple password that meets new requirements (6+ chars with 1 number)
const email = 'Aussiepowers555@gmail.com';
const newPassword = 'pass123';  // Simple: 6+ characters with at least 1 number

console.log('Updating user password to simplified requirements...');
console.log(`Email: ${email}`);
console.log(`New Password: ${newPassword}`);
console.log('Requirements: At least 6 characters and 1 number');

// Update in all possible database locations
updateUserPassword(path.join(__dirname, 'data', 'pbike-rescue.db'), email, newPassword);
updateUserPassword(path.join(__dirname, 'local.db'), email, newPassword);
updateUserPassword(path.join(__dirname, 'pbr.db'), email, newPassword);

console.log('\n✅ Password update complete!');
console.log('\n📝 You can now log in with:');
console.log(`   Email: ${email} (case-insensitive)`);
console.log(`   Password: ${newPassword}`);
console.log('\n💡 Password requirements:');
console.log('   - At least 6 characters');
console.log('   - At least 1 number');
console.log('   - No uppercase, lowercase, or special characters required!');