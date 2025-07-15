const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Get user profile
router.get('/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const usersPath = path.join(__dirname, '..', 'data', 'users.json');
        const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
        
        const user = users.find(u => u.id === userId);
        
        if (user) {
            // Don't send sensitive data
            const { password, ...userProfile } = user;
            res.json(userProfile);
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve user' });
    }
});

// Create/register user
router.post('/register', (req, res) => {
    try {
        const { email, name } = req.body;
        
        if (!email || !name) {
            return res.status(400).json({ error: 'Email and name are required' });
        }

        const usersPath = path.join(__dirname, '..', 'data', 'users.json');
        const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
        
        // Check if user already exists
        const existingUser = users.find(u => u.email === email);
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists with this email' });
        }

        // Create new user
        const user = {
            id: uuidv4(),
            email,
            name,
            createdAt: new Date().toISOString(),
            orders: []
        };

        users.push(user);
        fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));

        res.status(201).json({
            message: 'User registered successfully',
            user: { id: user.id, email: user.email, name: user.name }
        });

    } catch (error) {
        res.status(500).json({ error: 'Failed to register user' });
    }
});

// Simple login (for demo purposes)
router.post('/login', (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const usersPath = path.join(__dirname, '..', 'data', 'users.json');
        const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
        
        const user = users.find(u => u.email === email);
        
        if (user) {
            res.json({
                message: 'Login successful',
                user: { id: user.id, email: user.email, name: user.name }
            });
        } else {
            res.status(401).json({ error: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to login' });
    }
});

// Update user profile
router.patch('/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const updates = req.body;
        
        const usersPath = path.join(__dirname, '..', 'data', 'users.json');
        const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
        
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex === -1) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update user (don't allow changing id, email)
        const allowedUpdates = ['name'];
        allowedUpdates.forEach(field => {
            if (updates[field] !== undefined) {
                users[userIndex][field] = updates[field];
            }
        });

        users[userIndex].updatedAt = new Date().toISOString();

        fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));

        const { password, ...updatedUser } = users[userIndex];
        res.json({
            message: 'User updated successfully',
            user: updatedUser
        });

    } catch (error) {
        res.status(500).json({ error: 'Failed to update user' });
    }
});

module.exports = router;
