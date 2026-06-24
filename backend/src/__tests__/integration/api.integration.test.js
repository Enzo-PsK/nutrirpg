/**
 * Testes de integração — endpoints críticos NutriRPG
 * Requer PostgreSQL acessível (variáveis DB_* ou .env).
 * Executar: cd backend && npm test
 */
const request = require('supertest');
const sequelize = require('../../config/database');
const app = require('../../index');

const ts = Date.now();
const patientEmail = `int.patient.${ts}@test.local`;
const nutriEmail = `int.nutri.${ts}@test.local`;
const password = 'testpass123';

let dbAvailable = false;
let patientToken;
let nutriToken;
let patientId;
let patientCode;
let productId;
let recipeId;
let pantryItemId;

beforeAll(async () => {
  try {
    await sequelize.authenticate();
    dbAvailable = true;
  } catch {
    dbAvailable = false;
    console.warn('Integração: BD indisponível — testes ignorados.');
  }
});

afterAll(async () => {
  if (dbAvailable) {
    await sequelize.query(`DELETE FROM recipes WHERE name LIKE 'Receita Teste %'`);
    await sequelize.query(`
      DELETE FROM recipe_assignments
      WHERE assigned_by IN (
        SELECT id FROM users
        WHERE email LIKE 'int.patient.%@test.local'
           OR email LIKE 'int.nutri.%@test.local'
           OR (first_name = 'Int' AND last_name IN ('Patient', 'Nutri'))
      )
         OR patient_id IN (
        SELECT id FROM users
        WHERE email LIKE 'int.patient.%@test.local'
           OR email LIKE 'int.nutri.%@test.local'
           OR (first_name = 'Int' AND last_name IN ('Patient', 'Nutri'))
      )
    `);
    await sequelize.query(`
      DELETE FROM users
      WHERE email LIKE 'int.patient.%@test.local'
         OR email LIKE 'int.nutri.%@test.local'
         OR (first_name = 'Int' AND last_name IN ('Patient', 'Nutri'))
    `);
    await sequelize.close();
  }
});

const skipIfNoDb = () => {
  if (!dbAvailable) {
    expect(true).toBe(true);
    return true;
  }
  return false;
};

describe('Integração — Autenticação', () => {
  test('registo paciente devolve token e patient_code', async () => {
    if (skipIfNoDb()) return;

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        first_name: 'Int',
        last_name: 'Patient',
        email: patientEmail,
        password,
        weight_kg: 70,
      });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.patient_code).toMatch(/^\d{6}$/);
    patientToken = res.body.token;
    patientId = res.body.user.id;
    patientCode = res.body.user.patient_code;
  });

  test('login com credenciais válidas devolve token', async () => {
    if (skipIfNoDb()) return;

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: patientEmail, password });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test('login inválido devolve 401', async () => {
    if (skipIfNoDb()) return;

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: patientEmail, password: 'wrong' });

    expect(res.status).toBe(401);
  });

  test('registo nutricionista', async () => {
    if (skipIfNoDb()) return;

    const res = await request(app)
      .post('/api/auth/register-nutritionist')
      .send({
        first_name: 'Int',
        last_name: 'Nutri',
        email: nutriEmail,
        password,
      });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('nutritionist');
    nutriToken = res.body.token;
  });
});

describe('Integração — Autorização por roles', () => {
  test('paciente não acede à biblioteca de receitas (403)', async () => {
    if (skipIfNoDb() || !patientToken) return;

    const res = await request(app)
      .get('/api/recipes/library')
      .set('Authorization', `Bearer ${patientToken}`);

    expect(res.status).toBe(403);
  });

  test('pedido sem token devolve 401', async () => {
    if (skipIfNoDb()) return;

    const res = await request(app).get('/api/pantry');
    expect(res.status).toBe(401);
  });

  test('nutricionista acede à biblioteca (200)', async () => {
    if (skipIfNoDb() || !nutriToken) return;

    const res = await request(app)
      .get('/api/recipes/library')
      .set('Authorization', `Bearer ${nutriToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('Integração — Associação nutricionista–paciente', () => {
  test('nutricionista adiciona paciente por código', async () => {
    if (skipIfNoDb() || !nutriToken || !patientCode) return;

    const res = await request(app)
      .post('/api/admin/patients/add')
      .set('Authorization', `Bearer ${nutriToken}`)
      .send({ code: patientCode });

    expect(res.status).toBe(201);
    expect(res.body.patient.id).toBe(patientId);
  });

  test('duplicado na mesma lista devolve 409', async () => {
    if (skipIfNoDb() || !nutriToken || !patientCode) return;

    const res = await request(app)
      .post('/api/admin/patients/add')
      .set('Authorization', `Bearer ${nutriToken}`)
      .send({ code: patientCode });

    expect(res.status).toBe(409);
  });

  test('lista de pacientes inclui o paciente associado', async () => {
    if (skipIfNoDb() || !nutriToken) return;

    const res = await request(app)
      .get('/api/admin/patients')
      .set('Authorization', `Bearer ${nutriToken}`);

    expect(res.status).toBe(200);
    const ids = res.body.map((p) => p.id);
    expect(ids).toContain(patientId);
  });
});

describe('Integração — Dispensa', () => {
  test('obter catálogo de ingredientes', async () => {
    if (skipIfNoDb() || !nutriToken) return;

    const res = await request(app)
      .get('/api/products')
      .set('Authorization', `Bearer ${nutriToken}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    productId = res.body[0].id;
  });

  test('paciente adiciona item à dispensa', async () => {
    if (skipIfNoDb() || !patientToken || !productId) return;

    const products = await request(app)
      .get('/api/products')
      .set('Authorization', `Bearer ${patientToken}`);
    const product = products.body.find((p) => p.id === productId);
    const productName = product?.name || 'Arroz';

    const res = await request(app)
      .post('/api/pantry')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        name: productName,
        quantity: 500,
        unit: 'g',
        product_id: productId,
        category: 'Cereais',
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.low_stock_threshold).toBe(product.low_stock_threshold);
    pantryItemId = res.body.id;
  });

  test('listar dispensa devolve o item', async () => {
    if (skipIfNoDb() || !patientToken) return;

    const res = await request(app)
      .get('/api/pantry')
      .set('Authorization', `Bearer ${patientToken}`);

    expect(res.status).toBe(200);
    expect(res.body.items.some((i) => i.id === pantryItemId)).toBe(true);
  });
});

describe('Integração — Receitas e sugestões', () => {
  test('nutricionista cria receita na biblioteca', async () => {
    if (skipIfNoDb() || !nutriToken || !productId) return;

    const res = await request(app)
      .post('/api/recipes/library')
      .set('Authorization', `Bearer ${nutriToken}`)
      .send({
        name: `Receita Teste ${ts}`,
        description: 'Teste integração',
        instructions: 'Passo 1',
        xp_reward: 40,
        ingredients: [{ product_id: productId, quantity: 100, unit: 'g' }],
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    recipeId = res.body.id;
  });

  test('nutricionista atribui receita ao paciente', async () => {
    if (skipIfNoDb() || !nutriToken || !recipeId || !patientId) return;

    const res = await request(app)
      .post('/api/recipes/assign')
      .set('Authorization', `Bearer ${nutriToken}`)
      .send({ recipe_id: recipeId, patient_id: patientId });

    expect(res.status).toBe(201);
  });

  test('paciente vê receitas atribuídas (mine)', async () => {
    if (skipIfNoDb() || !patientToken) return;

    const res = await request(app)
      .get('/api/recipes/mine')
      .set('Authorization', `Bearer ${patientToken}`);

    expect(res.status).toBe(200);
    expect(res.body.some((r) => r.id === recipeId)).toBe(true);
  });

  test('sugestões da dispensa devolvem receitas compatíveis', async () => {
    if (skipIfNoDb() || !patientToken) return;

    const res = await request(app)
      .get('/api/recipes/suggest')
      .set('Authorization', `Bearer ${patientToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) {
      expect(res.body[0]).toHaveProperty('match_percentage');
      expect(res.body[0]).toHaveProperty('missing_ingredients');
    }
  });

  test('cozinhar receita atribui xp_reward da receita (não valor fixo)', async () => {
    if (skipIfNoDb() || !patientToken || !recipeId) return;

    const res = await request(app)
      .post(`/api/user/complete-recipe/${recipeId}`)
      .set('Authorization', `Bearer ${patientToken}`);

    expect(res.status).toBe(200);
    expect(res.body.xp_gained).toBe(40);
    expect(res.body.xp_reward).toBe(40);

    const again = await request(app)
      .post(`/api/user/complete-recipe/${recipeId}`)
      .set('Authorization', `Bearer ${patientToken}`);

    expect(again.status).toBe(200);
    expect(again.body.xp_gained).toBe(40);
  });
});

describe('Integração — Plano nutricional', () => {
  test('nutricionista aplica template ao paciente', async () => {
    if (skipIfNoDb() || !nutriToken || !patientId) return;

    const res = await request(app)
      .post(`/api/meal-plan/for-patient/${patientId}/template`)
      .set('Authorization', `Bearer ${nutriToken}`);

    expect([200, 201]).toContain(res.status);
  });

  test('paciente consulta plano (mine)', async () => {
    if (skipIfNoDb() || !patientToken) return;

    const res = await request(app)
      .get('/api/meal-plan/mine')
      .set('Authorization', `Bearer ${patientToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
});
