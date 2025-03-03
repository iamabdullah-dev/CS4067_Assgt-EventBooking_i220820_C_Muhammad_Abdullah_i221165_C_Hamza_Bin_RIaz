const { Sequelize } = require('sequelize');
const { Pool } = require('pg');

// Function to create database if it doesn't exist
async function createDatabaseIfNotExists() {
  const dbName = process.env.DB_NAME || 'user_db';
  const dbUser = process.env.DB_USER || 'postgres';
  const dbPassword = process.env.DB_PASSWORD || 'postgres';
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = process.env.DB_PORT || 5432;

  // Connect to default postgres database
  const pool = new Pool({
    user: dbUser,
    password: dbPassword,
    host: dbHost,
    port: dbPort,
    database: 'postgres', // Connect to default postgres database
  });

  try {
    // Check if database exists
    const checkResult = await pool.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName]
    );

    // If database doesn't exist, create it
    if (checkResult.rowCount === 0) {
      console.log(`Database ${dbName} does not exist, creating it...`);
      await pool.query(`CREATE DATABASE ${dbName}`);
      console.log(`Database ${dbName} created successfully`);
    } else {
      console.log(`Database ${dbName} already exists`);
    }

    return true;
  } catch (error) {
    console.error('Error creating database:', error);
    return false;
  } finally {
    await pool.end();
  }
}

// Database configuration
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'user_db',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  logging: false,
});

// Import models
const User = require('./user')(sequelize);

// Function to initialize database
async function initializeDatabase() {
  try {
    // First create database if it doesn't exist
    const dbCreated = await createDatabaseIfNotExists();
    if (!dbCreated) {
      console.error('Failed to create database');
      return false;
    }

    // Test the connection
    await sequelize.authenticate();
    console.log('Connection to the database has been established successfully.');
    
    // Sync all models
    await sequelize.sync({ force: false });
    console.log('All models were synchronized successfully.');
    
    return true;
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    return false;
  }
}

// Export models, sequelize instance, and initialization function
module.exports = {
  sequelize,
  User,
  initializeDatabase,
}; 