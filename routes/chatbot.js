const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Groq = require('groq-sdk');
require('dotenv').config();

// Initialize Groq client
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

console.log('✅ Groq AI client initialized successfully');

// Enhanced AI Chatbot Engine with Groq Llama-3.3-70b-versatile
class EcommerceChatbot {
    constructor() {
        this.model = 'llama-3.3-70b-versatile';
        this.conversations = new Map(); // Store conversation history by sessionId
        this.systemPrompt = `You are an intelligent AI assistant for Quantum Commerce, a futuristic e-commerce platform. You are helpful, friendly, and knowledgeable about orders, products, shipping, returns, and customer service.

Your capabilities include:
- Checking order status and tracking information
- Helping customers find and search for products
- Assisting with cart management and checkout
- Processing returns and exchanges
- Providing shipping information
- Checking product inventory and availability
- General customer support

IMPORTANT: Keep your responses concise and direct while being helpful. Avoid lengthy explanations unless specifically asked for details. Be conversational but brief.

Available product categories: Electronics, Storage, Wearables, Smart Home, Computers, Accessories
Sample products: Quantum Wireless Headphones ($299.99), HoloDisplay Monitor ($1299.99), Neural Interface Keyboard ($899.99), AI Smart Watch ($799.99)

When users ask about orders, try to extract order numbers from their messages. Order numbers follow the format: ORD-[timestamp]-[code] (e.g., ORD-1234567891234-PV5EO).`;
    }

    async analyzeAndRespond(message, context = {}) {
        try {
            const { sessionId } = context;
            
            // Get relevant context data
            const contextData = await this.getContextData(message);
            
            // Get or initialize conversation history
            let conversationHistory = this.conversations.get(sessionId) || [];
            
            // Build conversation messages
            const messages = [
                {
                    role: "system",
                    content: this.systemPrompt + (contextData ? `\n\nCurrent context data:\n${contextData}` : '')
                },
                ...conversationHistory, // Add previous conversation
                {
                    role: "user",
                    content: message
                }
            ];

            // Keep conversation history manageable (last 10 messages)
            if (messages.length > 12) { // 1 system + 10 conversation + 1 current = 12
                messages.splice(1, messages.length - 12);
            }

            // Call Groq API
            const completion = await groq.chat.completions.create({
                messages: messages,
                model: this.model,
                temperature: 0.5,
                max_tokens: 500,
                top_p: 1,
                stream: false
            });

            const response = completion.choices[0]?.message?.content || "I'm sorry, I didn't understand that. How can I help you?";
            
            // Update conversation history
            conversationHistory.push(
                { role: "user", content: message },
                { role: "assistant", content: response }
            );
            
            // Keep only last 10 messages (5 exchanges)
            if (conversationHistory.length > 10) {
                conversationHistory = conversationHistory.slice(-10);
            }
            
            this.conversations.set(sessionId, conversationHistory);
            
            return {
                response: response,
                model: this.model,
                usage: completion.usage,
                timestamp: new Date().toISOString(),
                conversationLength: conversationHistory.length
            };

        } catch (error) {
            console.error('Groq API Error:', error);
            return {
                response: "I'm experiencing some technical difficulties right now. Please try again in a moment, or feel free to browse our products while I get back online!",
                error: true,
                timestamp: new Date().toISOString()
            };
        }
    }

    clearConversation(sessionId) {
        this.conversations.delete(sessionId);
        return { success: true, message: "Conversation context cleared" };
    }

    async getContextData(message) {
        let contextData = '';
        
        try {
            // Check if message contains order-related keywords
            const orderKeywords = ['order', 'track', 'status', 'shipped', 'delivery'];
            const hasOrderKeywords = orderKeywords.some(keyword => 
                message.toLowerCase().includes(keyword)
            );

            if (hasOrderKeywords) {
                // Try to extract order number (format: ORD-1234567891234-PV5EO)
                const orderMatch = message.match(/ORD-\d{13}-[A-Z0-9]{5}/i);
                if (orderMatch) {
                    const orderInfo = this.getOrderInfo(orderMatch[0]);
                    if (orderInfo) {
                        contextData += `Order Information:\n${orderInfo}\n\n`;
                    }
                } else {
                    // Provide sample order info
                    contextData += `Sample Recent Orders:\n- Order #ORD-1234567891234-PV5EO: Shipped, arriving tomorrow\n- Order #ORD-1752612878561-ABC12: Processing, estimated delivery in 2-3 days\n\n`;
                }
            }

            // Check if message contains product-related keywords
            const productKeywords = ['product', 'buy', 'search', 'find', 'show', 'price', 'stock', 'available'];
            const hasProductKeywords = productKeywords.some(keyword => 
                message.toLowerCase().includes(keyword)
            );

            if (hasProductKeywords) {
                const products = this.getProducts();
                contextData += `Available Products (sample):\n${products}\n\n`;
            }

            // Check for inventory keywords
            const inventoryKeywords = ['stock', 'available', 'inventory', 'restock'];
            const hasInventoryKeywords = inventoryKeywords.some(keyword => 
                message.toLowerCase().includes(keyword)
            );

            if (hasInventoryKeywords) {
                const inventory = this.getInventoryInfo();
                contextData += `Inventory Status:\n${inventory}\n\n`;
            }

        } catch (error) {
            console.error('Error getting context data:', error);
        }

        return contextData;
    }

    getOrderInfo(orderNumber) {
        try {
            const ordersPath = path.join(__dirname, '..', 'data', 'orders.json');
            const orders = JSON.parse(fs.readFileSync(ordersPath, 'utf8'));
            
            const order = orders.find(o => o.id === orderNumber || o.id.includes(orderNumber));
            
            if (order) {
                let info = `Order #${order.id}: Status: ${order.status}, Total: $${order.total}, Items: ${order.items?.length || 0} items`;
                
                if (order.trackingNumber) {
                    info += `, Tracking: ${order.trackingNumber}`;
                }
                
                if (order.estimatedDelivery) {
                    info += `, Est. Delivery: ${order.estimatedDelivery}`;
                }
                
                if (order.deliveredAt) {
                    info += `, Delivered: ${new Date(order.deliveredAt).toLocaleDateString()}`;
                }
                
                return info;
            }
        } catch (error) {
            console.error('Error reading orders:', error);
        }
        return null;
    }

    getProducts() {
        try {
            const productsPath = path.join(__dirname, '..', 'data', 'products.json');
            const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
            
            return products.slice(0, 5).map(p => 
                `- ${p.name}: $${p.price} (${p.stock} in stock)`
            ).join('\n');
        } catch (error) {
            console.error('Error reading products:', error);
            return 'Product catalog temporarily unavailable';
        }
    }

    getInventoryInfo() {
        try {
            const productsPath = path.join(__dirname, '..', 'data', 'products.json');
            const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
            
            const inStock = products.filter(p => p.stock > 0).length;
            const outOfStock = products.filter(p => p.stock === 0).length;
            
            return `${inStock} products in stock, ${outOfStock} out of stock`;
        } catch (error) {
            console.error('Error reading inventory:', error);
            return 'Inventory information temporarily unavailable';
        }
    }
}

const nluEngine = new EcommerceChatbot();

// Chat endpoint
router.post('/chat', async (req, res) => {
    try {
        const { message, userId = 'anonymous', sessionId } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        console.log(`💬 User message: ${message}`);

        // Use Groq AI to analyze and respond
        const aiResult = await nluEngine.analyzeAndRespond(message, { userId, sessionId });
        
        const response = aiResult.response;
        
        // Log the conversation
        try {
            const chatLogsPath = path.join(__dirname, '..', 'data', 'chat_logs.json');
            let chatLogs = [];
            
            try {
                chatLogs = JSON.parse(fs.readFileSync(chatLogsPath, 'utf8'));
            } catch (readError) {
                // File doesn't exist or is invalid, start with empty array
                chatLogs = [];
            }
            
            const logEntry = {
                id: uuidv4(),
                timestamp: new Date().toISOString(),
                userId,
                sessionId,
                userMessage: message,
                botResponse: response,
                model: aiResult.model,
                usage: aiResult.usage,
                aiEngine: 'groq-llama-3.3-70b'
            };
            
            chatLogs.push(logEntry);
            
            // Keep only last 1000 entries to prevent file from getting too large
            if (chatLogs.length > 1000) {
                chatLogs = chatLogs.slice(-1000);
            }
            
            fs.writeFileSync(chatLogsPath, JSON.stringify(chatLogs, null, 2));
        } catch (error) {
            console.error('Error logging chat:', error);
        }

        console.log(`🤖 Bot response: ${response.substring(0, 100)}...`);

        res.json({
            response,
            model: aiResult.model,
            usage: aiResult.usage,
            aiEngine: 'groq-llama-3.3-70b',
            timestamp: aiResult.timestamp,
            success: !aiResult.error,
            conversationLength: aiResult.conversationLength || 0
        });

    } catch (error) {
        console.error('Chat endpoint error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            response: "I'm experiencing technical difficulties. Please try again in a moment.",
            success: false
        });
    }
});


// Clear conversation context
router.post('/clear', (req, res) => {
    try {
        const { sessionId } = req.body;
        
        if (!sessionId) {
            return res.status(400).json({ error: 'Session ID is required' });
        }

        // Clear conversation history for the session
        nluEngine.conversations.delete(sessionId);
        
        res.json({
            message: 'Conversation context cleared successfully',
            sessionId
        });

    } catch (error) {
        console.error('Clear context error:', error);
        res.status(500).json({ 
            error: 'Failed to clear conversation context'
        });
    }
});

// Get chat history
router.get('/history/:sessionId', (req, res) => {
    try {
        const { sessionId } = req.params;
        const chatLogsPath = path.join(__dirname, '..', 'data', 'chat_logs.json');
        const chatLogs = JSON.parse(fs.readFileSync(chatLogsPath, 'utf8'));
        
        const sessionHistory = chatLogs.filter(log => log.sessionId === sessionId);
        
        res.json(sessionHistory);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve chat history' });
    }
});

module.exports = router;
