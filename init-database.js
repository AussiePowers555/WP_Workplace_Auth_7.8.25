const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Database file will be stored in the data directory
const dataDir = path.join(process.cwd(), 'data');
const DB_PATH = path.join(dataDir, 'pbike-rescue.db');

// Ensure database directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

console.log(`📁 Database will be stored at: ${DB_PATH}`);
console.log('🔧 Initializing SQLite database...');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL'); // Better performance

// Create user_accounts table
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

console.log('✅ User accounts table created');

// Create workspaces table (needed for foreign key references)
db.exec(`
  CREATE TABLE IF NOT EXISTS workspaces (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

console.log('✅ Workspaces table created');

// Create contacts table (needed for foreign key references)
db.exec(`
  CREATE TABLE IF NOT EXISTS contacts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    type TEXT,
    company TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

console.log('✅ Contacts table created');

// Create cases table
db.exec(`
  CREATE TABLE IF NOT EXISTS cases (
    id TEXT PRIMARY KEY,
    case_number TEXT UNIQUE NOT NULL,
    workspace_id TEXT,
    status TEXT NOT NULL,
    last_updated TEXT NOT NULL,
    client_name TEXT NOT NULL,
    client_phone TEXT,
    client_email TEXT,
    client_street_address TEXT,
    client_suburb TEXT,
    client_state TEXT,
    client_postcode TEXT,
    client_claim_number TEXT,
    client_insurance_company TEXT,
    client_insurer TEXT,
    client_vehicle_rego TEXT,
    at_fault_party_name TEXT NOT NULL,
    at_fault_party_phone TEXT,
    at_fault_party_email TEXT,
    at_fault_party_street_address TEXT,
    at_fault_party_suburb TEXT,
    at_fault_party_state TEXT,
    at_fault_party_postcode TEXT,
    at_fault_party_claim_number TEXT,
    at_fault_party_insurance_company TEXT,
    at_fault_party_insurer TEXT,
    at_fault_party_vehicle_rego TEXT,
    rental_company TEXT,
    lawyer TEXT,
    assigned_lawyer_id TEXT,
    assigned_rental_company_id TEXT,
    invoiced REAL DEFAULT 0,
    reserve REAL DEFAULT 0,
    agreed REAL DEFAULT 0,
    paid REAL DEFAULT 0,
    accident_date TEXT,
    accident_time TEXT,
    accident_description TEXT,
    accident_diagram TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

console.log('✅ Cases table created');

// Create other necessary tables
db.exec(`
  CREATE TABLE IF NOT EXISTS signature_tokens (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending',
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS digital_signatures (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL,
    token_id TEXT NOT NULL,
    signature_data TEXT NOT NULL,
    signed_at DATETIME NOT NULL,
    signed_by TEXT NOT NULL,
    ip_address TEXT NOT NULL,
    user_agent TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS rental_agreements (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL,
    signature_id TEXT,
    rental_details TEXT,
    status TEXT DEFAULT 'draft',
    signed_at DATETIME,
    signed_by TEXT,
    pdf_url TEXT,
    pdf_path TEXT,
    pdf_generated_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS bikes (
    id TEXT PRIMARY KEY,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    registration TEXT,
    registration_expires TEXT,
    service_center TEXT,
    delivery_street TEXT,
    delivery_suburb TEXT,
    delivery_state TEXT,
    delivery_postcode TEXT,
    last_service_date TEXT,
    service_notes TEXT,
    status TEXT DEFAULT 'Available',
    location TEXT DEFAULT 'Main Warehouse',
    daily_rate REAL DEFAULT 85.00,
    image_url TEXT,
    image_hint TEXT,
    assignment TEXT DEFAULT '-',
    workspace_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

console.log('✅ All database tables created successfully');

// Close database
db.close();
console.log('✅ Database initialization complete!');