// backend/src/config/database.ts

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'smart_queue',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  charset: 'utf8mb4',
});

let databaseReady = false;

export const checkDatabaseConnection = async () => {
  try {
    const connection = await pool.getConnection();
    connection.release();
    databaseReady = true;
    return true;
  } catch (error) {
    databaseReady = false;
    console.error('⚠️ Database connection check failed:', error);
    return false;
  }
};

export const isDatabaseReady = () => databaseReady;

pool.on('enqueue', () => {
  databaseReady = false;
});

void checkDatabaseConnection();

export default pool;
