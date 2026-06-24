-- NutriRPG Database Schema
-- PostgreSQL

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username      VARCHAR(50) NOT NULL UNIQUE,
  first_name    VARCHAR(80),
  last_name     VARCHAR(80),
  email         VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  weight_kg     FLOAT,
  level         INTEGER DEFAULT 1,
  xp_total      INTEGER DEFAULT 0,
  role          VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user','nutritionist','admin')),
  patient_code  CHAR(6) UNIQUE,
  disabled      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE hydration_logs (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_ml  INTEGER NOT NULL CHECK (amount_ml > 0),
  logged_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE product_categories (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       VARCHAR(80) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE products (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                VARCHAR(100) NOT NULL UNIQUE,
  description         TEXT,
  unit                VARCHAR(10) NOT NULL DEFAULT 'g',
  category            VARCHAR(50),
  low_stock_threshold FLOAT NOT NULL DEFAULT 100,
  created_at          TIMESTAMP DEFAULT NOW()
);

CREATE TABLE pantry_items (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id          UUID REFERENCES products(id),
  name                VARCHAR(100) NOT NULL,
  quantity            FLOAT NOT NULL DEFAULT 0,
  unit                VARCHAR(20) NOT NULL DEFAULT 'g',
  low_stock_threshold FLOAT DEFAULT 100,
  category            VARCHAR(50),
  created_at          TIMESTAMP DEFAULT NOW(),
  updated_at          TIMESTAMP DEFAULT NOW()
);

CREATE TABLE xp_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action      VARCHAR(100) NOT NULL,
  xp_gained   INTEGER NOT NULL,
  description VARCHAR(255),
  logged_at   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE nutritionist_patients (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nutritionist_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  patient_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at       TIMESTAMP DEFAULT NOW(),
  UNIQUE(patient_id)
);

CREATE TABLE recipes (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nutritionist_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  patient_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  name             VARCHAR(150) NOT NULL,
  description      TEXT,
  instructions     TEXT,
  xp_reward        INTEGER DEFAULT 50,
  created_at       TIMESTAMP DEFAULT NOW(),
  updated_at       TIMESTAMP DEFAULT NOW()
);

CREATE TABLE recipe_ingredients (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id   UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity    FLOAT NOT NULL,
  unit        VARCHAR(10) NOT NULL
);

CREATE TABLE recipe_assignments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id   UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  patient_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES users(id),
  assigned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(recipe_id, patient_id)
);

CREATE TABLE meals (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nutritionist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name            VARCHAR(100) NOT NULL,
  meal_time       VARCHAR(10) NOT NULL DEFAULT '08:00',
  order_index     INTEGER DEFAULT 0,
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE meal_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meal_id     UUID NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
  description VARCHAR(255) NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE weight_logs (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  weight_kg  FLOAT NOT NULL,
  logged_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE recipe_completions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipe_id    UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  completed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_hydration_user_date ON hydration_logs(user_id, logged_at);
CREATE INDEX idx_pantry_user ON pantry_items(user_id);
CREATE INDEX idx_xp_user ON xp_logs(user_id, logged_at);
CREATE INDEX idx_nutri_patients ON nutritionist_patients(nutritionist_id);
CREATE INDEX idx_recipes_patient ON recipes(patient_id);
CREATE INDEX idx_recipes_nutri ON recipes(nutritionist_id);
CREATE INDEX idx_recipe_ingredients ON recipe_ingredients(recipe_id);
