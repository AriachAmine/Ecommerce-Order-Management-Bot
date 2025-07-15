const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Get all orders
router.get('/', (req, res) => {
    try {
        const ordersPath = path.join(__dirname, '..', 'data', 'orders.json');
        const orders = JSON.parse(fs.readFileSync(ordersPath, 'utf8'));
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve orders' });
    }
});

// Get orders by user
router.get('/user/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const ordersPath = path.join(__dirname, '..', 'data', 'orders.json');
        const orders = JSON.parse(fs.readFileSync(ordersPath, 'utf8'));
        
        const userOrders = orders.filter(order => order.userId === userId);
        res.json(userOrders);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve user orders' });
    }
});

// Get specific order
router.get('/:orderId', (req, res) => {
    try {
        const { orderId } = req.params;
        const ordersPath = path.join(__dirname, '..', 'data', 'orders.json');
        const orders = JSON.parse(fs.readFileSync(ordersPath, 'utf8'));
        
        const order = orders.find(o => o.id === orderId);
        
        if (order) {
            res.json(order);
        } else {
            res.status(404).json({ error: 'Order not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve order' });
    }
});

// Create new order
router.post('/', (req, res) => {
    try {
        const { userId, items, shippingAddress, paymentMethod } = req.body;
        
        if (!userId || !items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Invalid order data' });
        }

        // Load products to calculate total
        const productsPath = path.join(__dirname, '..', 'data', 'products.json');
        const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
        
        let total = 0;
        const orderItems = [];

        for (const item of items) {
            const product = products.find(p => p.id === item.productId);
            if (product) {
                if (product.stock >= item.quantity) {
                    const itemTotal = product.price * item.quantity;
                    total += itemTotal;
                    
                    orderItems.push({
                        productId: product.id,
                        name: product.name,
                        price: product.price,
                        quantity: item.quantity,
                        total: itemTotal
                    });

                    // Update stock
                    product.stock -= item.quantity;
                } else {
                    return res.status(400).json({ 
                        error: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}` 
                    });
                }
            } else {
                return res.status(400).json({ error: `Product not found: ${item.productId}` });
            }
        }

        // Create order
        const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
        const order = {
            id: orderId,
            userId,
            items: orderItems,
            total: parseFloat(total.toFixed(2)),
            status: 'pending',
            createdAt: new Date().toISOString(),
            shippingAddress: shippingAddress || 'Demo Address, Demo City, DC 12345',
            paymentMethod: paymentMethod || 'Demo Payment',
            estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
            trackingNumber: `TRK${Math.random().toString(36).substr(2, 8).toUpperCase()}`
        };

        // Save order
        const ordersPath = path.join(__dirname, '..', 'data', 'orders.json');
        const orders = JSON.parse(fs.readFileSync(ordersPath, 'utf8'));
        orders.push(order);
        fs.writeFileSync(ordersPath, JSON.stringify(orders, null, 2));

        // Update product stock
        fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));

        // Simulate order processing workflow
        setTimeout(() => {
            updateOrderStatus(orderId, 'processing');
        }, 5000); // After 5 seconds, move to processing

        setTimeout(() => {
            updateOrderStatus(orderId, 'shipped');
        }, 15000); // After 15 seconds, mark as shipped

        res.status(201).json({
            message: 'Order created successfully',
            order
        });

    } catch (error) {
        console.error('Order creation error:', error);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// Update order status
router.patch('/:orderId/status', (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;
        
        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const result = updateOrderStatus(orderId, status);
        
        if (result.success) {
            res.json({ message: 'Order status updated', order: result.order });
        } else {
            res.status(404).json({ error: result.error });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to update order status' });
    }
});

// Initialize return/exchange request
router.post('/:orderId/return', (req, res) => {
    try {
        const { orderId } = req.params;
        const { reason, items } = req.body;
        
        const ordersPath = path.join(__dirname, '..', 'data', 'orders.json');
        const orders = JSON.parse(fs.readFileSync(ordersPath, 'utf8'));
        
        const orderIndex = orders.findIndex(o => o.id === orderId);
        
        if (orderIndex === -1) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const order = orders[orderIndex];
        
        if (!['delivered', 'shipped'].includes(order.status)) {
            return res.status(400).json({ error: 'Return not available for this order status' });
        }

        // Create return request
        const returnRequest = {
            id: `RET-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
            orderId,
            reason,
            items: items || order.items,
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        // Add return request to order
        if (!order.returns) {
            order.returns = [];
        }
        order.returns.push(returnRequest);

        fs.writeFileSync(ordersPath, JSON.stringify(orders, null, 2));

        res.json({
            message: 'Return request initiated successfully',
            returnRequest
        });

    } catch (error) {
        res.status(500).json({ error: 'Failed to process return request' });
    }
});

// Helper function to update order status
function updateOrderStatus(orderId, newStatus) {
    try {
        const ordersPath = path.join(__dirname, '..', 'data', 'orders.json');
        const orders = JSON.parse(fs.readFileSync(ordersPath, 'utf8'));
        
        const orderIndex = orders.findIndex(o => o.id === orderId);
        
        if (orderIndex === -1) {
            return { success: false, error: 'Order not found' };
        }

        orders[orderIndex].status = newStatus;
        orders[orderIndex].updatedAt = new Date().toISOString();

        // Add status-specific updates
        if (newStatus === 'shipped') {
            orders[orderIndex].shippedAt = new Date().toISOString();
        } else if (newStatus === 'delivered') {
            orders[orderIndex].deliveredAt = new Date().toISOString();
        }

        fs.writeFileSync(ordersPath, JSON.stringify(orders, null, 2));

        return { success: true, order: orders[orderIndex] };
    } catch (error) {
        return { success: false, error: 'Failed to update order status' };
    }
}

module.exports = router;
