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

// Function to create or update user account
function setupUserAccount(email, password, role = 'admin') {
  try {
    // Check if user exists
    const existingUser = db.prepare('SELECT * FROM user_accounts WHERE email = ?').get(email);
    
    const hashedPassword = hashPassword(password);
    const now = new Date().toISOString();
    
    if (existingUser) {
      // Update existing user
      const updateStmt = db.prepare(`
        UPDATE user_accounts 
        SET password_hash = ?, 
            status = ?, 
            role = ?,
            first_login = ?,
            updated_at = ?
        WHERE email = ?
      `);
      
      updateStmt.run(
        hashedPassword,
        'pending_password_change', // Status indicating temporary password
        role,
        1, // First login = true (will need to change password)
        now,
        email
      );
      
      console.log(`✅ Updated existing user: ${email}`);
      console.log(`   Role: ${role}`);
      console.log(`   Status: pending_password_change`);
      console.log(`   Temporary Password: ${password}`);
    } else {
      // Create new user
      const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const insertStmt = db.prepare(`
        INSERT INTO user_accounts (
          id, email, password_hash, role, status, 
          first_login, remember_login, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      insertStmt.run(
        id,
        email,
        hashedPassword,
        role,
        'pending_password_change',
        1, // First login = true
        0, // Remember login = false
        now,
        now
      );
      
      console.log(`✅ Created new user: ${email}`);
      console.log(`   ID: ${id}`);
      console.log(`   Role: ${role}`);
      console.log(`   Status: pending_password_change`);
      console.log(`   Temporary Password: ${password}`);
    }
    
    console.log('\n⚠️  Important: This is a temporary password.');
    console.log('   The user will be prompted to change it on first login.');
    
  } catch (error) {
    console.error('❌ Error setting up user account:', error);
    process.exit(1);
  }
}

// Set up the requested user account
console.log('Setting up user account...\n');
setupUserAccount('Aussiepowers555@gmail.com', 'TempPass123!', 'admin');

// Close database
db.close();
console.log('\n✅ Setup complete!');