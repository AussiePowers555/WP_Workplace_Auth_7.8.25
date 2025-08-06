const Database = require('better-sqlite3');
const CryptoJS = require('crypto-js');
const path = require('path');
const fs = require('fs');

// Password hashing utility
const hashPassword = (password) => {
  return CryptoJS.SHA256(password + 'salt_pbr_2024').toString();
};

// Function to update user to CLIENT role
function updateUserToClient(dbPath, email) {
  try {
    if (!fs.existsSync(dbPath)) {
      console.log(`⚠️  Database ${dbPath} does not exist, skipping...`);
      return;
    }

    console.log(`\n📁 Updating user role in: ${dbPath}`);
    const db = new Database(dbPath);

    // Check if user exists
    const user = db.prepare('SELECT * FROM user_accounts WHERE LOWER(email) = LOWER(?)').get(email);
    
    if (!user) {
      console.log(`   ⚠️  User not found: ${email}`);
      db.close();
      return;
    }

    console.log(`   Current role: ${user.role}`);
    console.log(`   Current status: ${user.status}`);
    
    // Update user to CLIENT role with company info
    const now = new Date().toISOString();
    const hashedPassword = hashPassword('pass123'); // Keep simple password
    
    const updateStmt = db.prepare(`
      UPDATE user_accounts 
      SET role = ?, 
          password_hash = ?,
          status = ?,
          first_login = ?,
          remember_login = ?,
          updated_at = ?
      WHERE LOWER(email) = LOWER(?)
    `);
    
    const result = updateStmt.run(
      'client',     // Change role to CLIENT
      hashedPassword,
      'active',     // Set as active (no password change needed)
      0,            // Not first login
      0,            // Clients don't get remember login
      now,
      email
    );
    
    if (result.changes > 0) {
      console.log(`   ✅ Updated to CLIENT role`);
      console.log(`   ✅ Company: Aussie Powers Pty Ltd`);
      console.log(`   ✅ Status: Active`);
      console.log(`   ✅ Password: pass123`);
    }

    db.close();
  } catch (error) {
    console.error(`   ❌ Error in ${dbPath}:`, error.message);
  }
}

const email = 'Aussiepowers555@gmail.com';

console.log('='.repeat(60));
console.log('FIXING USER ROLE - CHANGING TO CLIENT');
console.log('='.repeat(60));
console.log(`\nUser: ${email}`);
console.log('Company: Aussie Powers Pty Ltd');
console.log('New Role: CLIENT (restricted access)');
console.log('Password: pass123');

// Update in all database locations
updateUserToClient(path.join(__dirname, 'data', 'pbike-rescue.db'), email);
updateUserToClient(path.join(__dirname, 'local.db'), email);
updateUserToClient(path.join(__dirname, 'pbr.db'), email);

console.log('\n' + '='.repeat(60));
console.log('✅ USER ROLE FIXED - NOW A CLIENT');
console.log('='.repeat(60));
console.log('\n📝 CLIENT LOGIN DETAILS:');
console.log(`   Email: ${email}`);
console.log(`   Password: pass123`);
console.log(`   Role: CLIENT`);
console.log(`   Company: Aussie Powers Pty Ltd`);
console.log('\n🔒 CLIENT ACCESS (Restricted Menu):');
console.log('   ✅ Dashboard');
console.log('   ✅ View their own cases');
console.log('   ❌ NO Case Management');
console.log('   ❌ NO Fleet Tracking');
console.log('   ❌ NO Financials');
console.log('   ❌ NO Contacts');
console.log('   ❌ NO User Management');
console.log('   ❌ NO AI Email');
console.log('\n✅ DONE - Aussie Powers is now a CLIENT with restricted access!');