const express = require('express');
const { getProducts, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const { authenticateToken } = require('../middleware/auth');
const { validateProduct } = require('../middleware/security');

const router = express.Router();
router.use(authenticateToken);

router.get('/',       getProducts);
router.post('/',      validateProduct, createProduct);
router.put('/:id',    validateProduct, updateProduct);
router.delete('/:id', deleteProduct);

module.exports = router;
