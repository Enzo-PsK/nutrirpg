// src/setup-db.js — Creates the nutrirpg database and runs the schema
const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config();

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 5432;
const DB_NAME = process.env.DB_NAME || 'nutrirpg';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASS = process.env.DB_PASS || '';

async function setup() {
  const adminClient = new Client({
    host: DB_HOST,
    port: DB_PORT,
    database: 'postgres',
    user: DB_USER,
    password: DB_PASS,
  });

  try {
    await adminClient.connect();
    console.log('Connected to PostgreSQL');

    const exists = await adminClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [DB_NAME],
    );

    if (exists.rowCount === 0) {
      await adminClient.query(`CREATE DATABASE "${DB_NAME}"`);
      console.log(`Database "${DB_NAME}" created`);
    } else {
      console.log(`Database "${DB_NAME}" already exists`);
    }
  } finally {
    await adminClient.end();
  }

  const appClient = new Client({
    host: DB_HOST,
    port: DB_PORT,
    database: DB_NAME,
    user: DB_USER,
    password: DB_PASS,
  });

  const schemaPath = path.join(__dirname, '../../database/schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  try {
    await appClient.connect();
    await appClient.query(schema);
    console.log('Schema applied successfully');
  } finally {
    await appClient.end();
  }

  console.log('Database setup complete — you can now run: npm run dev');
}

setup().catch((err) => {
  console.error('Setup failed:', err.message);
  process.exit(1);
});
