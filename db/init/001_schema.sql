-- 001_schema.sql

CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,

  title_ru TEXT NOT NULL,
  title_kz TEXT NOT NULL,
  title_en TEXT NOT NULL,

  description_ru TEXT NOT NULL,
  description_kz TEXT NOT NULL,
  description_en TEXT NOT NULL,

  technologies TEXT[] NOT NULL DEFAULT '{}',
  genres TEXT[] NOT NULL DEFAULT '{}',

  image TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'web',
  categories TEXT[] NOT NULL DEFAULT '{}',
  images TEXT[] NOT NULL DEFAULT '{}',
  featured BOOLEAN NOT NULL DEFAULT FALSE,

  project_url TEXT NOT NULL DEFAULT '',
  video TEXT NOT NULL DEFAULT '',
  presentation TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS technologies (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  name_ru TEXT NOT NULL DEFAULT '',
  name_kz TEXT NOT NULL DEFAULT '',
  name_en TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS genres (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

INSERT INTO categories (name, name_ru, name_kz, name_en) VALUES
  ('aiml', 'AI/ML', 'AI/ML', 'AI/ML'),
  ('iot', 'IoT', 'IoT', 'IoT'),
  ('web', 'Web', 'Web', 'Web'),
  ('mobile', 'Mobile', 'Mobile', 'Mobile'),
  ('vrar', 'VR/AR', 'VR/AR', 'VR/AR')
ON CONFLICT (name) DO UPDATE SET
  name_ru = EXCLUDED.name_ru,
  name_kz = EXCLUDED.name_kz,
  name_en = EXCLUDED.name_en;
