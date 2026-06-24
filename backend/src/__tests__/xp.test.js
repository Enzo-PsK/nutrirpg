// src/__tests__/xp.test.js
const { calculateLevel, XP_REWARDS } = require('../controllers/xpController');

describe('Gamification Engine - XP Tests', () => {
  test('Level 1 at 0 XP', () => {
    expect(calculateLevel(0)).toBe(1);
  });

  test('Level 1 below threshold', () => {
    expect(calculateLevel(50)).toBe(1);
  });

  test('Level 2 at correct XP', () => {
    expect(calculateLevel(150)).toBeGreaterThanOrEqual(2);
  });

  test('XP rewards are defined for all actions', () => {
    expect(XP_REWARDS.drink_water).toBe(10);
    expect(XP_REWARDS.eat_fruit).toBe(25);
    expect(XP_REWARDS.eat_vegetable).toBe(20);
    expect(XP_REWARDS.complete_meal_plan).toBe(50);
    expect(XP_REWARDS.daily_login).toBe(15);
  });

  test('Level increases monotonically with XP', () => {
    const levels = [0, 100, 300, 700, 1500].map(calculateLevel);
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i]).toBeGreaterThanOrEqual(levels[i - 1]);
    }
  });
});

describe('Hydration Goal Calculation', () => {
  const { calculateDailyGoal } = require('../controllers/hydrationController');

  test('Default goal for null weight is 2000ml', () => {
    expect(calculateDailyGoal(null)).toBe(2000);
  });

  test('70kg person needs at least 2450ml', () => {
    expect(calculateDailyGoal(70)).toBe(2450);
  });

  test('Minimum goal is always 2000ml', () => {
    expect(calculateDailyGoal(50)).toBeGreaterThanOrEqual(2000);
  });
});
