import Database from 'better-sqlite3';
import path from 'path';

const db = new Database('moonstone.db');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    phone TEXT,
    address TEXT,
    password TEXT NOT NULL,
    profile_picture TEXT,
    role TEXT DEFAULT 'customer',
    status TEXT DEFAULT 'pending', -- pending, active, disabled
    transfer_pin TEXT,
    failed_attempts INTEGER DEFAULT 0,
    locked_until DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Migration: Add missing columns to users table
const userCols = db.prepare("PRAGMA table_info(users)").all();
const userColNames = (userCols as any[]).map(c => c.name);
if (!userColNames.includes('failed_attempts')) {
  db.exec("ALTER TABLE users ADD COLUMN failed_attempts INTEGER DEFAULT 0");
}
if (!userColNames.includes('locked_until')) {
  db.exec("ALTER TABLE users ADD COLUMN locked_until DATETIME");
}

db.exec(`
  CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    account_number TEXT UNIQUE NOT NULL,
    balance DECIMAL(15, 2) DEFAULT 0.00,
    status TEXT DEFAULT 'active',
    card_number TEXT,
    card_expiry TEXT,
    card_cvv TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Migration: Add missing columns to accounts table
const accountCols = db.prepare("PRAGMA table_info(accounts)").all();
const accountColNames = (accountCols as any[]).map(c => c.name);
if (!accountColNames.includes('card_number')) {
  db.exec("ALTER TABLE accounts ADD COLUMN card_number TEXT");
}
if (!accountColNames.includes('card_expiry')) {
  db.exec("ALTER TABLE accounts ADD COLUMN card_expiry TEXT");
}
if (!accountColNames.includes('card_cvv')) {
  db.exec("ALTER TABLE accounts ADD COLUMN card_cvv TEXT");
}

db.exec(`
  CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL,
    type TEXT NOT NULL, -- deposit, withdrawal, transfer_in, transfer_out, loan_disbursement, loan_repayment
    amount DECIMAL(15, 2) NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'completed', -- pending, completed, rejected
    reference TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts(id)
  );

  CREATE TABLE IF NOT EXISTS loans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    purpose TEXT,
    status TEXT DEFAULT 'pending', -- pending, approved, rejected, paid
    repayment_schedule TEXT, -- JSON string
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS beneficiaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS chat_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    sender_id INTEGER NOT NULL,
    message_text TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    read_status INTEGER DEFAULT 0,
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id)
  );
`);

// Migration: Add missing columns to chat_messages table
const chatCols = db.prepare("PRAGMA table_info(chat_messages)").all();
const chatColNames = (chatCols as any[]).map(c => c.name);
if (!chatColNames.includes('read_status')) {
  db.exec("ALTER TABLE chat_messages ADD COLUMN read_status INTEGER DEFAULT 0");
}

db.exec(`
  CREATE TABLE IF NOT EXISTS support_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

import bcrypt from 'bcryptjs';

// Seed admin if not exists
const admin = db.prepare('SELECT * FROM users WHERE email = ?').get('admin@gmail.com');
if (!admin) {
  const hashedPassword = bcrypt.hashSync('password', 10);
  db.prepare(`
    INSERT INTO users (first_name, last_name, email, username, password, role, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run('System', 'Admin', 'admin@gmail.com', 'admin', hashedPassword, 'admin', 'active');
}

export default db;
