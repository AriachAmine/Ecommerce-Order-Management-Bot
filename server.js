const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Import routes
const chatbotRoutes = require('./routes/chatbot');
const orderRoutes = require('./routes/orders');
const productRoutes = require('./routes/products');
const userRoutes = require('./routes/users');

// Use routes
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);

// Serve main pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/products', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'products.html'));
});

app.get('/account', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'account.html'));
});

// Initialize data files if they don't exist
const initializeDataFiles = () => {
    const dataDir = path.join(__dirname, 'data');
    
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir);
    }

    const files = {
        'products.json': [
            {
                id: '1',
                name: 'Quantum Wireless Headphones',
                price: 299.99,
                category: 'Electronics',
                stock: 25,
                image: '/images/headphones.jpg',
                description: 'Advanced quantum-powered wireless headphones with neural connectivity.'
            },
            {
                id: '2',
                name: 'HoloDisplay Monitor',
                price: 1299.99,
                category: 'Electronics',
                stock: 10,
                image: '/images/monitor.jpg',
                description: 'Futuristic holographic display with 4K resolution and AR capabilities.'
            },
            {
                id: '3',
                name: 'Neural Interface Keyboard',
                price: 899.99,
                category: 'Electronics',
                stock: 15,
                image: '/images/keyboard.jpg',
                description: 'Mind-controlled keyboard with haptic feedback and AI prediction.'
            },
            {
                id: '4',
                name: 'Quantum Storage Device',
                price: 499.99,
                category: 'Storage',
                stock: 30,
                image: '/images/storage.jpg',
                description: 'Ultra-fast quantum storage with infinite capacity simulation.'
            },
            {
                id: '5',
                name: 'AI Smart Watch',
                price: 799.99,
                category: 'Wearables',
                stock: 20,
                image: '/images/smartwatch.jpg',
                description: 'Advanced AI companion watch with health monitoring and prediction.'
            },
            {
                id: '6',
                name: 'Cyber Security Suite',
                price: 199.99,
                category: 'Software',
                stock: 100,
                image: '/images/security.jpg',
                description: 'Complete cybersecurity solution with AI threat detection.'
            }
        ],
        'orders.json': [],
        'users.json': [
            {
                id: 'demo-user',
                email: 'demo@example.com',
                name: 'Demo User',
                orders: []
            }
        ],
        'chat_logs.json': []
    };

    Object.entries(files).forEach(([filename, data]) => {
        const filePath = path.join(dataDir, filename);
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        }
    });
};

// Start server
app.listen(PORT, () => {
    console.log(`🚀 E-commerce Order Management Bot server running on http://localhost:${PORT}`);
    console.log('📦 Initializing data files...');
    initializeDataFiles();
    console.log('✅ Server ready!');
});

module.exports = app;
