#!/usr/bin/env node
/*
ORM-like DB init:
- Reads POSTGRES_URL from .env
- Ensures the database exists
- Creates required tables with IF NOT EXISTS
Usage:
  npm run db:init
*/
const { Client } = require('pg');
const { URL } = require('url');
require('dotenv').config();

(async () => {
  const conn = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!conn) {
    console.error('POSTGRES_URL (or DATABASE_URL) not set in environment/.env');
    process.exit(1);
  }

  let dbUrl;
  try {
    dbUrl = new URL(conn);
  } catch (e) {
    console.error('Invalid connection string:', e.message);
    process.exit(1);
  }

  const dbName = (dbUrl.pathname || '/').replace(/^\//, '');
  if (!dbName) {
    console.error('Connection string must include a database name');
    process.exit(1);
  }

  // 1) Ensure DB exists by connecting to admin DB (postgres)
  const adminUrl = new URL(dbUrl.toString());
  adminUrl.pathname = '/postgres';

  const admin = new Client({ connectionString: adminUrl.toString() });
  try {
    await admin.connect();
    const { rows } = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
    if (rows.length === 0) {
      console.log(`Creating database ${dbName}...`);
      try {
        await admin.query(`CREATE DATABASE ${JSON.stringify(dbName).replace(/"/g, '')}`);
      } catch (err) {
        console.error('Failed to create database:', err.message);
        process.exit(1);
      }
      console.log('Database created.');
    } else {
      console.log(`Database ${dbName} already exists.`);
    }
  } finally {
    await admin.end();
  }

  // 2) Connect to target DB and run schema creation
  const client = new Client({ connectionString: dbUrl.toString() });
  await client.connect();

  const sql = `
BEGIN;

CREATE TABLE IF NOT EXISTS auth_users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    "emailVerified" TIMESTAMP,
    image VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS auth_accounts (
    id SERIAL PRIMARY KEY,
    "userId" INT NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    "providerAccountId" VARCHAR(255) NOT NULL,
    password TEXT,
    UNIQUE("provider", "providerAccountId")
);

CREATE TABLE IF NOT EXISTS auth_sessions (
    id SERIAL PRIMARY KEY,
    "userId" INT NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
    "sessionToken" VARCHAR(255) UNIQUE NOT NULL,
    expires TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
    image VARCHAR(255),
    first_name VARCHAR(255),
    middle_name VARCHAR(255),
    last_name VARCHAR(255),
    maiden_name VARCHAR(255),
    race VARCHAR(100),
    sex VARCHAR(50),
    birthdate DATE,
    height NUMERIC,
    weight NUMERIC,
    current_city VARCHAR(255),
    current_state VARCHAR(255),
    current_country VARCHAR(255),
    birthplace_city VARCHAR(255),
    birthplace_state VARCHAR(255),
    birthplace_country VARCHAR(255),
    religious_affiliation VARCHAR(255),
    favorite_sports_team VARCHAR(255),
    favorite_color VARCHAR(50),
    first_vehicle VARCHAR(255),
    favorite_hobbies TEXT,
    favorite_music_genre VARCHAR(255),
    favorite_music_band VARCHAR(255),
    favorite_travel_destination VARCHAR(255),
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS beta_users (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  beta_group VARCHAR(100) DEFAULT 'general',
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS beta_activity_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  action VARCHAR(255) NOT NULL,
  page_url TEXT,
  details JSONB,
  session_id VARCHAR(255),
  ip_address VARCHAR(100),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_beta_user FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS beta_feedback (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  feedback_type VARCHAR(100),
  status VARCHAR(50) DEFAULT 'open',
  message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_feedback_user FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS health_questionnaires (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES auth_users(id) ON DELETE CASCADE,
  blood_type VARCHAR(10),
  height_feet INTEGER,
  height_inches INTEGER,
  weight INTEGER,
  allergies TEXT[],
  medications TEXT[],
  chronic_conditions TEXT[],
  surgeries TEXT[],
  family_history TEXT,
  exercise_frequency VARCHAR(50),
  smoking_status VARCHAR(50),
  alcohol_consumption VARCHAR(50),
  diet_restrictions TEXT[],
  mental_health_conditions TEXT[],
  vision_aids BOOLEAN DEFAULT FALSE,
  hearing_aids BOOLEAN DEFAULT FALSE,
  mobility_aids BOOLEAN DEFAULT FALSE,
  emergency_contact_name VARCHAR(100),
  emergency_contact_phone VARCHAR(20),
  emergency_contact_relationship VARCHAR(50),
  primary_physician VARCHAR(100),
  physician_phone VARCHAR(20),
  insurance_provider VARCHAR(100),
  insurance_policy_number VARCHAR(50),
  last_physical_date DATE,
  last_dental_date DATE,
  last_eye_exam_date DATE,
  vaccinations TEXT[],
  family_heart_disease BOOLEAN DEFAULT FALSE,
  family_diabetes BOOLEAN DEFAULT FALSE,
  family_cancer BOOLEAN DEFAULT FALSE,
  family_mental_health BOOLEAN DEFAULT FALSE,
  family_other_conditions TEXT,
  emergency_contact_1_name VARCHAR(100),
  emergency_contact_1_relationship VARCHAR(50),
  emergency_contact_1_phone VARCHAR(20),
  emergency_contact_2_name VARCHAR(100),
  emergency_contact_2_relationship VARCHAR(50),
  emergency_contact_2_phone VARCHAR(20),
  preferred_hospital VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS scheduled_messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES auth_users(id) ON DELETE CASCADE,
    recipient_name VARCHAR(255) NOT NULL,
    recipient_email VARCHAR(255),
    recipient_phone VARCHAR(50),
    message_type VARCHAR(50) NOT NULL,
    delivery_method VARCHAR(50) NOT NULL,
    scheduled_date TIMESTAMP NOT NULL,
    subject VARCHAR(255),
    message_content TEXT NOT NULL,
    media_url TEXT,
    timezone VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_creations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  creation_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS creation_collections (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS creation_collection_items (
    id SERIAL PRIMARY KEY,
    collection_id INT NOT NULL REFERENCES creation_collections(id) ON DELETE CASCADE,
    creation_id INT NOT NULL REFERENCES user_creations(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(collection_id, creation_id)
);

CREATE TABLE IF NOT EXISTS video_albums (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES auth_users(id),
    title TEXT NOT NULL,
    description TEXT,
    visibility VARCHAR(20) DEFAULT 'private',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS videos (
    id SERIAL PRIMARY KEY,
    album_id INT NOT NULL REFERENCES video_albums(id),
    user_id INT NOT NULL REFERENCES auth_users(id),
    video_url TEXT NOT NULL,
    caption TEXT,
    labels TEXT[],
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS video_comments (
    id SERIAL PRIMARY KEY,
    video_id INT NOT NULL REFERENCES videos(id),
    user_id INT NOT NULL REFERENCES auth_users(id),
    content TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS video_add_requests (
    id SERIAL PRIMARY KEY,
    album_id INT NOT NULL REFERENCES video_albums(id),
    requester_id INT NOT NULL REFERENCES auth_users(id),
    video_url TEXT NOT NULL,
    caption TEXT,
    labels TEXT[],
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_quotes (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES auth_users(id),
    quote_text TEXT NOT NULL,
    author TEXT,
    category VARCHAR(50) DEFAULT 'personal',
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS photo_albums (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    visibility TEXT DEFAULT 'private',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS photos (
    id SERIAL PRIMARY KEY,
    album_id INT NOT NULL REFERENCES photo_albums(id) ON DELETE CASCADE,
    user_id INT NOT NULL,
    image_url TEXT NOT NULL,
    caption TEXT,
    labels TEXT[],
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS photo_comments (
    id SERIAL PRIMARY KEY,
    photo_id INT NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS photo_add_requests (
    id SERIAL PRIMARY KEY,
    album_id INT NOT NULL REFERENCES photo_albums(id) ON DELETE CASCADE,
    requester_id INT NOT NULL,
    image_url TEXT NOT NULL,
    caption TEXT,
    labels TEXT[],
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS journal_entries (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    visibility VARCHAR(50) CHECK (visibility IN ('private', 'semi-public', 'public')) DEFAULT 'private',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS journal_media (
    id SERIAL PRIMARY KEY,
    journal_id INTEGER NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
    media_type VARCHAR(50) CHECK (media_type IN ('image', 'video')) NOT NULL,
    media_url TEXT NOT NULL,
    thumbnail_url TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS journal_comments (
    id SERIAL PRIMARY KEY,
    journal_id INTEGER NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS journal_add_requests (
    id SERIAL PRIMARY KEY,
    journal_id INTEGER NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    requester_id INTEGER NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
    content TEXT,
    media JSONB,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS voice_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES auth_users(id) ON DELETE CASCADE,
    voice_sample_url TEXT NOT NULL,
    voice_settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS social_media_links (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES auth_users(id) ON DELETE CASCADE,
    platform VARCHAR(100) NOT NULL,
    url TEXT NOT NULL,
    username VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (user_id, platform)
);

COMMIT;`;

  try {
    await client.query(sql);
    console.log('Database initialized successfully.');
  } catch (e) {
    console.error('Initialization failed:', e.message);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
