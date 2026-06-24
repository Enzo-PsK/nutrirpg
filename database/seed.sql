-- NutriRPG — Seed Data para Desenvolvimento/Testes
-- Executar após schema.sql: psql -d nutrirpg -f database/seed.sql

-- Utilizador de teste (password: "test123")
-- Hash bcrypt de "test123" com salt=10
INSERT INTO users (id, username, email, password_hash, weight_kg, level, xp_total, role, patient_code)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'HeroTeste',
  'teste@nutrirpg.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  70.0,
  3,
  350,
  'user',
  '123456'
) ON CONFLICT DO NOTHING;

-- Nutricionista de teste (password: "nutri123")
INSERT INTO users (id, username, email, password_hash, weight_kg, level, xp_total, role, patient_code)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'DrNutri',
  'nutri@nutrirpg.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  NULL,
  1,
  0,
  'nutritionist',
  NULL
) ON CONFLICT DO NOTHING;

-- Ligar o paciente de teste ao nutricionista de teste
INSERT INTO nutritionist_patients (nutritionist_id, patient_id)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111'
) ON CONFLICT DO NOTHING;

-- Itens na dispensa do utilizador de teste
INSERT INTO pantry_items (user_id, name, quantity, unit, low_stock_threshold, category)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Maçã', 500, 'g', 100, 'Fruta'),
  ('11111111-1111-1111-1111-111111111111', 'Banana', 300, 'g', 100, 'Fruta'),
  ('11111111-1111-1111-1111-111111111111', 'Ovos', 6, 'un', 2, 'Proteína'),
  ('11111111-1111-1111-1111-111111111111', 'Tomate', 200, 'g', 50, 'Legume'),
  ('11111111-1111-1111-1111-111111111111', 'Cebola', 80, 'g', 100, 'Legume'),
  ('11111111-1111-1111-1111-111111111111', 'Leite', 1000, 'ml', 200, 'Lacticínio'),
  ('11111111-1111-1111-1111-111111111111', 'Espinafres', 50, 'g', 100, 'Legume'),
  ('11111111-1111-1111-1111-111111111111', 'Azeite', 30, 'ml', 50, 'Condimento')
ON CONFLICT DO NOTHING;

-- Alguns logs de XP
INSERT INTO xp_logs (user_id, action, xp_gained, description)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'daily_login', 15, 'Login diário'),
  ('11111111-1111-1111-1111-111111111111', 'drink_water', 10, 'Bebeu 250ml de água'),
  ('11111111-1111-1111-1111-111111111111', 'eat_fruit', 25, 'Comeu fruta ao pequeno-almoço'),
  ('11111111-1111-1111-1111-111111111111', 'drink_water', 10, 'Bebeu 500ml de água'),
  ('11111111-1111-1111-1111-111111111111', 'eat_vegetable', 20, 'Comeu salada ao almoço'),
  ('11111111-1111-1111-1111-111111111111', 'log_hydration_goal', 30, 'Meta de hidratação atingida'),
  ('11111111-1111-1111-1111-111111111111', 'complete_meal_plan', 50, 'Plano do dia concluído'),
  ('11111111-1111-1111-1111-111111111111', 'eat_fruit', 25, 'Lanche saudável'),
  ('11111111-1111-1111-1111-111111111111', 'drink_water', 10, 'Hidratação pós-exercício'),
  ('11111111-1111-1111-1111-111111111111', 'daily_login', 15, 'Login diário')
ON CONFLICT DO NOTHING;

-- Logs de hidratação de hoje
INSERT INTO hydration_logs (user_id, amount_ml)
VALUES
  ('11111111-1111-1111-1111-111111111111', 250),
  ('11111111-1111-1111-1111-111111111111', 500),
  ('11111111-1111-1111-1111-111111111111', 300)
ON CONFLICT DO NOTHING;
