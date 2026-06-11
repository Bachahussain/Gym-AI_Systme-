-- Run this script to update the MySQL Database Schema for Gym AI Application

-- 1. Create or Modify User Profiles Table
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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 2. Create Workout Plans Table
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
);

-- 2b. Create Workout Logs Table
CREATE TABLE IF NOT EXISTS workout_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  day_index INT NOT NULL,
  week_start_date DATE DEFAULT NULL,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 2c. Create Workout Exercise Logs Table (exercise-level completion)
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
);

-- 3. Create Diet Plans Table
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
);

-- 4. Create Progress Tracking Table
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
);
