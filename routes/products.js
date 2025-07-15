const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Get all products
router.get('/', (req, res) => {
    try {
        const productsPath = path.join(__dirname, '..', 'data', 'products.json');
        const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve products' });
    }
});

// Get product by ID
router.get('/:productId', (req, res) => {
    try {
        const { productId } = req.params;
        const productsPath = path.join(__dirname, '..', 'data', 'products.json');
        const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
        
        const product = products.find(p => p.id === productId);
        
        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ error: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve product' });
    }
});

// Search products
router.get('/search/:query', (req, res) => {
    try {
        const { query } = req.params;
        const productsPath = path.join(__dirname, '..', 'data', 'products.json');
        const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
        
        const searchResults = products.filter(product => 
            product.name.toLowerCase().includes(query.toLowerCase()) ||
            product.description.toLowerCase().includes(query.toLowerCase()) ||
            product.category.toLowerCase().includes(query.toLowerCase())
        );
        
        res.json(searchResults);
    } catch (error) {
        res.status(500).json({ error: 'Failed to search products' });
    }
});

// Get products by category
router.get('/category/:category', (req, res) => {
    try {
        const { category } = req.params;
        const productsPath = path.join(__dirname, '..', 'data', 'products.json');
        const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
        
        const categoryProducts = products.filter(product => 
            product.category.toLowerCase() === category.toLowerCase()
        );
        
        res.json(categoryProducts);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve category products' });
    }
});

// Check product availability
router.get('/:productId/availability', (req, res) => {
    try {
        const { productId } = req.params;
        const productsPath = path.join(__dirname, '..', 'data', 'products.json');
        const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
        
        const product = products.find(p => p.id === productId);
        
        if (product) {
            res.json({
                productId: product.id,
                name: product.name,
                stock: product.stock,
                available: product.stock > 0,
                lastUpdated: new Date().toISOString()
            });
        } else {
            res.status(404).json({ error: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to check product availability' });
    }
});

module.exports = router;
