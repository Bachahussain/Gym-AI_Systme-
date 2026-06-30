import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbHost = process.env.DB_HOST || 'localhost';
const dbUser = process.env.DB_USER || 'root';
const dbPassword = process.env.DB_PASSWORD || process.env.DB_PASS || '';
const dbName = process.env.DB_NAME || 'gym';
const dbPort = parseInt(process.env.DB_PORT || '3306');

const pool = mysql.createPool({
  host: dbHost,
  user: dbUser,
  password: dbPassword,
  database: dbName,
  port: dbPort,
  ssl: (dbHost && !dbHost.includes('localhost') && !dbHost.includes('127.0.0.1')) ? { rejectUnauthorized: false } : undefined,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export const initDB = async () => {
  if (dbHost === 'localhost' || dbHost === '127.0.0.1') {
    console.warn('⚠️  DATABASE WARNING: "localhost" (127.0.0.1) will not work in the Cloud Run environment.');
    console.warn('To connect your database, you must provide a REMOTE database host IP or use Firebase/Firestore.');
  }

  try {
    // 1. Try to ensure the database exists (with connection timeout)
    try {
      const initialConnection = await mysql.createConnection({
        host: dbHost,
        user: dbUser,
        password: dbPassword,
        port: dbPort,
        ssl: (dbHost && !dbHost.includes('localhost') && !dbHost.includes('127.0.0.1')) ? { rejectUnauthorized: false } : undefined
      });
      await initialConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
      await initialConnection.end();
      console.log(`Database '${dbName}' verified/created successfully.`);
    } catch (createDbErr) {
      console.warn('Could not verify/create database directly, proceeding with normal pool initialization...', createDbErr.message);
    }

    // 2. Test pool connectivity
    const connection = await pool.getConnection();
    console.log('✅ Connected to MySQL database successfully');

    // 3. Initialize tables
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL UNIQUE,
        age INT NOT NULL,
        gender ENUM('male', 'female', 'other') NOT NULL,
        height FLOAT NOT NULL,
        weight FLOAT NOT NULL,
        bmi FLOAT,
        bmi_category VARCHAR(50),
        bmr FLOAT,
        tdee FLOAT,
        goal ENUM('weight_loss', 'muscle_gain', 'maintenance') NOT NULL,
        activity_level ENUM('sedentary', 'moderate', 'active') NOT NULL,
        dietary_preference VARCHAR(100) DEFAULT 'none',
        medical_conditions VARCHAR(255) DEFAULT 'none',
        workout_days INT DEFAULT 3,
        preferred_split VARCHAR(100) DEFAULT 'Full Body',
        experience_level VARCHAR(50) DEFAULT 'Beginner',
        is_pro BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS workout_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        day_index INT NOT NULL,
        week_start_date DATE DEFAULT NULL,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS workout_exercise_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        week_start_date DATE NOT NULL,
        day_index INT NOT NULL,
        exercise_index INT NOT NULL,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_exercise_completion (user_id, week_start_date, day_index, exercise_index),
        INDEX user_week_idx (user_id, week_start_date),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS workout_plans (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        week_start_date DATE NOT NULL,
        plan_version INT DEFAULT 1,
        plan_json JSON NOT NULL,
        personalization_score FLOAT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_weekly_workout (user_id, week_start_date, plan_version),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS diet_plans (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        week_start_date DATE NOT NULL,
        plan_version INT DEFAULT 1,
        plan_json JSON NOT NULL,
        personalization_score FLOAT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_weekly_diet (user_id, week_start_date, plan_version),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS exercise_gifs_cache (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ai_exercise_name VARCHAR(255) NOT NULL UNIQUE,
        api_exercise_name VARCHAR(255),
        gif_url LONGTEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS progress_tracking (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        weight FLOAT NOT NULL,
        bmi FLOAT DEFAULT NULL,
        age INT DEFAULT NULL,
        experience_level VARCHAR(50) DEFAULT NULL,
        workout_days INT DEFAULT NULL,
        body_fat FLOAT DEFAULT NULL,
        muscle_mass FLOAT DEFAULT NULL,
        notes TEXT,
        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX user_date_idx (user_id, recorded_at),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log('Database and all tables verified successfully');

    // Schema migrations for existing tables
    try {
      const [columns] = await connection.query('SHOW COLUMNS FROM user_profiles');
      const columnNames = columns.map(c => c.Field);
      const [progressColumns] = await connection.query('SHOW COLUMNS FROM progress_tracking');
      const progressColumnNames = progressColumns.map(c => c.Field);

      if (!columnNames.includes('workout_days')) {
        await connection.query('ALTER TABLE user_profiles ADD COLUMN workout_days INT DEFAULT 3');
        console.log('Added workout_days column to user_profiles');
      }
      if (!columnNames.includes('preferred_split')) {
        await connection.query('ALTER TABLE user_profiles ADD COLUMN preferred_split VARCHAR(100) DEFAULT "Full Body"');
        console.log('Added preferred_split column to user_profiles');
      }
      if (!columnNames.includes('experience_level')) {
        await connection.query('ALTER TABLE user_profiles ADD COLUMN experience_level VARCHAR(50) DEFAULT "Beginner"');
        console.log('Added experience_level column to user_profiles');
      }
      if (!columnNames.includes('is_pro')) {
        await connection.query('ALTER TABLE user_profiles ADD COLUMN is_pro BOOLEAN DEFAULT FALSE');
        console.log('Added is_pro column to user_profiles');
      }

      const [workoutLogColumns] = await connection.query('SHOW COLUMNS FROM workout_logs');
      const workoutLogColumnNames = workoutLogColumns.map(c => c.Field);
      if (!workoutLogColumnNames.includes('week_start_date')) {
        await connection.query('ALTER TABLE workout_logs ADD COLUMN week_start_date DATE DEFAULT NULL AFTER day_index');
        await connection.query('UPDATE workout_logs SET week_start_date = DATE(completed_at) WHERE week_start_date IS NULL');
        console.log('Added week_start_date column to workout_logs');
      }

      if (!progressColumnNames.includes('bmi')) {
        await connection.query('ALTER TABLE progress_tracking ADD COLUMN bmi FLOAT DEFAULT NULL AFTER weight');
        console.log('Added bmi column to progress_tracking');
      }
      if (!progressColumnNames.includes('age')) {
        await connection.query('ALTER TABLE progress_tracking ADD COLUMN age INT DEFAULT NULL AFTER bmi');
        console.log('Added age column to progress_tracking');
      }
      if (!progressColumnNames.includes('experience_level')) {
        await connection.query('ALTER TABLE progress_tracking ADD COLUMN experience_level VARCHAR(50) DEFAULT NULL AFTER age');
        console.log('Added experience_level column to progress_tracking');
      }
      if (!progressColumnNames.includes('workout_days')) {
        await connection.query('ALTER TABLE progress_tracking ADD COLUMN workout_days INT DEFAULT NULL AFTER experience_level');
        console.log('Added workout_days column to progress_tracking');
      }

      const [cacheColumns] = await connection.query('SHOW COLUMNS FROM exercise_gifs_cache');
      const gifUrlCol = cacheColumns.find(c => c.Field === 'gif_url');
      if (gifUrlCol && gifUrlCol.Type.includes('varchar')) {
        await connection.query('ALTER TABLE exercise_gifs_cache MODIFY gif_url LONGTEXT NOT NULL');
        console.log('Modified gif_url column to LONGTEXT in exercise_gifs_cache');
      }
    } catch (migrationErr) {
      console.error('Migration error:', migrationErr.message);
    }

    connection.release();
    console.log('🚀 Database and all tables initialized successfully (MySQL)');
  } catch (err) {
    console.error('❌ DATABASE CONNECTION/INITIALIZATION FAILED:', err.message);
    console.warn('Ignoring DB error to allow server startup. Database features will be unavailable.');
  }
};

export default pool;
