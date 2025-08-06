const Database = require('better-sqlite3');
const CryptoJS = require('crypto-js');
const path = require('path');
const fs = require('fs');

// Password hashing utility
const hashPassword = (password) => {
  return CryptoJS.SHA256(password + 'salt_pbr_2024').toString();
};

// Function to setup user in a database
function setupUserInDatabase(dbPath, email, password, role = 'admin') {
  try {
    if (!fs.existsSync(dbPath)) {
      console.log(`⚠️  Database ${dbPath} does not exist, skipping...`);
      return;
    }

    console.log(`\n📁 Setting up user in: ${dbPath}`);
    const db = new Database(dbPath);

    // Check if user_accounts table exists
    const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='user_accounts'").get();
    
    if (!tableExists) {
      console.log('   Creating user_accounts table...');
      db.exec(`
        CREATE TABLE IF NOT EXISTS user_accounts (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL,
          status TEXT NOT NULL,
          contact_id TEXT,
          workspace_id TEXT,
          first_login BOOLEAN DEFAULT TRUE,
          remember_login BOOLEAN DEFAULT FALSE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_login DATETIME
        )
      `);
    }

    // Check if user exists
    const existingUser = db.prepare('SELECT * FROM user_accounts WHERE LOWER(email) = LOWER(?)').get(email);
    
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
        WHERE LOWER(email) = LOWER(?)
      `);
      
      updateStmt.run(
        hashedPassword,
        'pending_password_change',
        role,
        1,
        now,
        email
      );
      
      console.log(`   ✅ Updated existing user: ${email}`);
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
        1,
        0,
        now,
        now
      );
      
      console.log(`   ✅ Created new user: ${email}`);
    }

    db.close();
  } catch (error) {
    console.error(`   ❌ Error in ${dbPath}:`, error.message);
  }
}

// Setup credentials
const email = 'Aussiepowers555@gmail.com';
const password = 'TempPass123!';
const role = 'admin';

console.log('Setting up user account in all databases...');
console.log(`Email: ${email}`);
console.log(`Password: ${password}`);
console.log(`Role: ${role}`);

// Setup in all possible database locations
setupUserInDatabase(path.join(__dirname, 'data', 'pbike-rescue.db'), email, password, role);
setupUserInDatabase(path.join(__dirname, 'local.db'), email, password, role);
setupUserInDatabase(path.join(__dirname, 'pbr.db'), email, password, role);

console.log('\n✅ Setup complete!');
console.log('\n⚠️  Important: This is a temporary password.');
console.log('   The user will be prompted to change it on first login.');
console.log('\n📝 You can now log in with:');
console.log(`   Email: ${email} (case-insensitive)`);
console.log(`   Password: ${password}`);