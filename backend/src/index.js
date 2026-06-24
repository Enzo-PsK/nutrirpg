// src/index.js - NutriRPG Backend Entry Point
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const sequelize = require('./config/database');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const hydrationRoutes = require('./routes/hydration');
const pantryRoutes = require('./routes/pantry');
const xpRoutes = require('./routes/xp');
const recipeRoutes  = require('./routes/recipe');
const adminRoutes   = require('./routes/admin');
const productRoutes   = require('./routes/products');
const categoryRoutes  = require('./routes/categories');
const mealPlanRoutes  = require('./routes/mealPlan');
const platformAdminRoutes = require('./routes/platformAdmin');

const { apiLimiter } = require('./middleware/security');

const app = express();
app.set('trust proxy', 1); // trust first proxy (Expo tunnel, Railway, etc.)
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use('/api/', apiLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/hydration', hydrationRoutes);
app.use('/api/pantry', pantryRoutes);
app.use('/api/xp', xpRoutes);
app.use('/api/recipes',  recipeRoutes);
app.use('/api/products',   productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/meal-plan', mealPlanRoutes);
app.use('/api/platform-admin', platformAdminRoutes);
app.use('/api/admin',    adminRoutes);

// Health check
app.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: 'ok', version: '1.0.0', db: 'connected' });
  } catch {
    res.status(503).json({ status: 'ok', version: '1.0.0', db: 'disconnected' });
  }
});

const start = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established');
    app.listen(PORT, () => {
      console.log(`NutriRPG API running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error.message);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  start();
}

module.exports = app;
