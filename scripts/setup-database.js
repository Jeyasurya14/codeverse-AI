/**
 * Database Setup Script
 * 
 * This script runs the database schema on your Render PostgreSQL database.
 * 
 * Usage:
 *   cd backend
 *   node ../scripts/setup-database.js
 * 
 * Or from project root:
 *   node scripts/setup-database.js
 * 
 * Make sure DATABASE_URL is set in backend/.env file.
 */

const fs = require('fs');
const path = require('path');

// Try to load dotenv if available
try {
  require('dotenv').config({ path: require('path').join(__dirname, '..', 'backend', '.env') });
} catch (err) {
  // dotenv not installed, will read .env manually
}

// Try to require pg - check backend/node_modules first
let Pool;
try {
  // First try from backend directory (where dependencies are installed)
  const backendPg = path.join(__dirname, '..', 'backend', 'node_modules', 'pg');
  Pool = require(backendPg).Pool;
} catch (err) {
  try {
    // Fallback to regular require (if running from backend directory)
    Pool = require('pg').Pool;
  } catch (err2) {
    console.error('❌ Cannot find "pg" module.');
    console.log('\nPlease install dependencies first:');
    console.log('  cd backend');
    console.log('  npm install');
    process.exit(1);
  }
}

// Try multiple locations for DATABASE_URL
let DATABASE_URL = process.env.DATABASE_URL;

// If not found, try reading from backend/.env directly
if (!DATABASE_URL) {
  try {
    const envPath = path.join(__dirname, '..', 'backend', '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const match = envContent.match(/^DATABASE_URL=(.+)$/m);
      if (match) {
        DATABASE_URL = match[1].trim();
        // Remove any comments or trailing whitespace
        DATABASE_URL = DATABASE_URL.split('#')[0].trim();
      }
    }
  } catch (err) {
    // Ignore
  }
}

// Check if DATABASE_URL is just a hostname (incomplete)
if (DATABASE_URL && !DATABASE_URL.startsWith('postgresql://') && !DATABASE_URL.startsWith('postgres://')) {
  console.warn('⚠️  DATABASE_URL appears incomplete (missing postgresql:// protocol)');
  console.warn(`   Current value: ${DATABASE_URL.substring(0, 50)}...`);
  console.log('\nPlease update backend/.env with the full connection string from Render:');
  console.log('   Format: postgresql://user:password@host:port/database');
  console.log('\nOr use Option A in docs/DATABASE_SETUP.md (Render SQL Editor)');
  process.exit(1);
}

// Validate connection string format
if (DATABASE_URL) {
  try {
    const url = new URL(DATABASE_URL);
    if (!url.hostname || !url.pathname) {
      throw new Error('Invalid URL format');
    }
    // Render PostgreSQL URLs might not have explicit port, default to 5432
    if (!url.port && url.protocol === 'postgresql:') {
      console.log('ℹ️  No port specified, PostgreSQL defaults to 5432');
    }
  } catch (err) {
    console.error('❌ DATABASE_URL format is invalid:', err.message);
    console.log('\nExpected format: postgresql://user:password@host:port/database');
    console.log('Example: postgresql://user:pass@dpg-xxxxx-a.singapore-postgres.render.com:5432/dbname');
    process.exit(1);
  }
}

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set.');
  console.log('\nPlease set DATABASE_URL in your .env file or environment:');
  console.log('  DATABASE_URL=postgresql://user:password@host:port/database');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function setupDatabase() {
  console.log('🔄 Connecting to database...');
  console.log(`   Host: ${DATABASE_URL.match(/@([^:/]+)/)?.[1] || 'unknown'}\n`);
  
  try {
    // Test connection with timeout
    const testQuery = pool.query('SELECT NOW()');
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Connection timeout')), 10000)
    );
    await Promise.race([testQuery, timeoutPromise]);
    console.log('✅ Connected to database successfully\n');
    
    // Read schema file
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found: ${schemaPath}`);
    }
    
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    // Remove comments
    let cleanSQL = schemaSQL
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && line.trim() !== '')
      .join('\n');
    
    // Remove block comments
    cleanSQL = cleanSQL.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Split into statements - handle both ); and ; endings
    // First, replace ); with a special marker, then split by ;
    const normalizedSQL = cleanSQL.replace(/\);/g, ');__STMT_END__');
    const rawStatements = normalizedSQL.split('__STMT_END__')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    // Separate CREATE TABLE and CREATE INDEX statements
    const createTableStatements = [];
    const createIndexStatements = [];
    
    for (const stmt of rawStatements) {
      const trimmed = stmt.trim();
      if (!trimmed) continue;
      
      // Add semicolon back if it was removed
      const finalStmt = trimmed.endsWith(';') ? trimmed : trimmed + ';';
      
      if (finalStmt.toUpperCase().startsWith('CREATE TABLE')) {
        createTableStatements.push(finalStmt);
      } else if (finalStmt.toUpperCase().startsWith('CREATE INDEX')) {
        createIndexStatements.push(finalStmt);
      } else {
        // Other statements (shouldn't be any, but handle them)
        createTableStatements.push(finalStmt);
      }
    }
    
    console.log(`📝 Found ${createTableStatements.length} CREATE TABLE statements`);
    console.log(`📝 Found ${createIndexStatements.length} CREATE INDEX statements\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Execute CREATE TABLE statements first
    console.log('📦 Creating tables...');
    for (let i = 0; i < createTableStatements.length; i++) {
      const statement = createTableStatements[i];
      try {
        await pool.query(statement);
        successCount++;
        const tableName = statement.match(/CREATE TABLE\s+IF\s+NOT\s+EXISTS\s+(\w+)|CREATE TABLE\s+(\w+)/i)?.[1] || statement.match(/CREATE TABLE\s+(\w+)/i)?.[1] || `table ${i + 1}`;
        console.log(`   ✅ Created table: ${tableName}`);
      } catch (err) {
        if (err.message.includes('already exists') || err.code === '42P07') {
          const tableName = statement.match(/CREATE TABLE\s+IF\s+NOT\s+EXISTS\s+(\w+)|CREATE TABLE\s+(\w+)/i)?.[1] || statement.match(/CREATE TABLE\s+(\w+)/i)?.[1] || `table ${i + 1}`;
          console.log(`   ⚠️  Table already exists: ${tableName}`);
          successCount++;
        } else {
          console.error(`   ❌ Error creating table:`, err.message);
          console.error(`      SQL: ${statement.substring(0, 150)}...`);
          errorCount++;
        }
      }
    }
    
    // Then execute CREATE INDEX statements
    console.log('\n📇 Creating indexes...');
    for (let i = 0; i < createIndexStatements.length; i++) {
      const statement = createIndexStatements[i];
      try {
        await pool.query(statement);
        successCount++;
        const indexName = statement.match(/CREATE INDEX.*?(\w+)/i)?.[1] || `index ${i + 1}`;
        if (i < 5 || i % 5 === 0) {
          console.log(`   ✅ Created index: ${indexName}`);
        }
      } catch (err) {
        if (err.message.includes('already exists') || err.code === '42P07') {
          successCount++;
        } else {
          const indexName = statement.match(/CREATE INDEX.*?(\w+)/i)?.[1] || `index ${i + 1}`;
          console.error(`   ❌ Error creating index ${indexName}:`, err.message);
          errorCount++;
        }
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    
    // Verify tables were created
    console.log('\n🔍 Verifying tables...');
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    const expectedTables = [
      'users',
      'refresh_tokens',
      'magic_link_tokens',
      'email_verification_tokens',
      'password_reset_tokens',
      'security_audit_logs'
    ];
    
    const createdTables = tablesResult.rows.map(r => r.table_name);
    console.log(`\n📋 Created tables (${createdTables.length}):`);
    createdTables.forEach(table => {
      const check = expectedTables.includes(table) ? '✅' : '⚠️';
      console.log(`   ${check} ${table}`);
    });
    
    const missingTables = expectedTables.filter(t => !createdTables.includes(t));
    if (missingTables.length > 0) {
      console.log(`\n⚠️  Missing tables: ${missingTables.join(', ')}`);
    } else {
      console.log('\n✅ All expected tables are present!');
    }
    
    console.log('\n🎉 Database setup complete!');
    
  } catch (err) {
    console.error('\n❌ Database setup failed:', err.message);
    if (err.code === 'ENOTFOUND') {
      console.error('   Check your DATABASE_URL - host not found');
    } else if (err.code === 'ECONNREFUSED') {
      console.error('   Connection refused - check host and port');
    } else if (err.code === '28P01') {
      console.error('   Authentication failed - check username and password');
    } else if (err.code === '3D000') {
      console.error('   Database does not exist - check database name');
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupDatabase();
