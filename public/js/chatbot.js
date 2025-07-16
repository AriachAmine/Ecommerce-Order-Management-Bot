// Chatbot functionality for Quantum Commerce

class QuantumChatbot {
    constructor() {
        this.isOpen = false;
        this.sessionId = this.generateSessionId();
        this.isTyping = false;
        this.messageHistory = [];
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadChatHistory();
    }

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    bindEvents() {
        // Chat input enter key
        const inputField = document.getElementById('chatbot-input-field');
        if (inputField) {
            inputField.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }
    }

    toggle() {
        const widget = document.getElementById('chatbot-widget');
        const toggle = document.querySelector('.chatbot-toggle');
        
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        const widget = document.getElementById('chatbot-widget');
        const toggle = document.querySelector('.chatbot-toggle');
        
        if (widget && toggle) {
            widget.classList.add('open');
            toggle.style.display = 'none';
            this.isOpen = true;
            
            // Focus on input
            const inputField = document.getElementById('chatbot-input-field');
            if (inputField) {
                setTimeout(() => inputField.focus(), 300);
            }
        }
    }

    close() {
        const widget = document.getElementById('chatbot-widget');
        const toggle = document.querySelector('.chatbot-toggle');
        
        if (widget && toggle) {
            widget.classList.remove('open');
            toggle.style.display = 'inline-block';
            this.isOpen = false;
        }
    }

    async sendMessage() {
        const inputField = document.getElementById('chatbot-input-field');
        const message = inputField.value.trim();
        
        if (!message || this.isTyping) return;
        
        // Clear input
        inputField.value = '';
        
        // Add user message to chat
        this.addMessage(message, 'user');
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            // Send message to backend
            const response = await fetch('/api/chatbot/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    userId: this.getCurrentUserId(),
                    sessionId: this.sessionId
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to send message');
            }
            
            const data = await response.json();
            
            // Remove typing indicator
            this.hideTypingIndicator();
            
            // Add bot response
            this.addMessage(data.response, 'bot', {
                intent: data.intent,
                confidence: data.confidence
            });
            
            // Add quick actions if relevant
            this.addQuickActions(data.intent);
            
        } catch (error) {
            console.error('Chatbot error:', error);
            this.hideTypingIndicator();
            this.addMessage('I apologize, but I\'m having trouble connecting right now. Please try again in a moment.', 'bot');
        }
    }

    addMessage(content, sender, metadata = {}) {
        const messagesContainer = document.getElementById('chatbot-messages');
        if (!messagesContainer) return;
        
        const messageElement = document.createElement('div');
        messageElement.className = `message ${sender}-message`;
        
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageElement.innerHTML = `
            <div class="message-content">${this.formatMessageContent(content)}</div>
            <div class="message-time">${timestamp}</div>
        `;
        
        messagesContainer.appendChild(messageElement);
        this.scrollToBottom();
        
        // Store in history
        this.messageHistory.push({
            content,
            sender,
            timestamp: new Date().toISOString(),
            metadata
        });
        
        // Save to localStorage
        this.saveChatHistory();
    }

    formatMessageContent(content) {
        // Convert URLs to links
        content = content.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
        
        // Convert line breaks to <br>
        content = content.replace(/\n/g, '<br>');
        
        return content;
    }

    showTypingIndicator() {
        if (this.isTyping) return;
        
        this.isTyping = true;
        const messagesContainer = document.getElementById('chatbot-messages');
        
        const typingElement = document.createElement('div');
        typingElement.className = 'message bot-message';
        typingElement.id = 'typing-indicator';
        typingElement.innerHTML = `
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        
        messagesContainer.appendChild(typingElement);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        this.isTyping = false;
        const typingElement = document.getElementById('typing-indicator');
        if (typingElement) {
            typingElement.remove();
        }
    }

    addQuickActions(intent) {
        const messagesContainer = document.getElementById('chatbot-messages');
        const lastMessage = messagesContainer.querySelector('.message:last-child');
        
        if (!lastMessage || lastMessage.querySelector('.quick-actions')) return;
        
        let actions = [];
        
        switch (intent) {
            case 'order_status':
                actions = [
                    'Check order ORD-1234567890',
                    'Track my recent order',
                    'Order history'
                ];
                break;
            case 'return_exchange':
                actions = [
                    'Start a return',
                    'Exchange policy',
                    'Return status'
                ];
                break;
            case 'inventory_check':
                actions = [
                    'Check Quantum Headphones',
                    'HoloDisplay availability',
                    'All products in stock'
                ];
                break;
            case 'greeting':
                actions = [
                    'Check order status',
                    'Product availability',
                    'Return an item'
                ];
                break;
        }
        
        if (actions.length > 0) {
            const actionsElement = document.createElement('div');
            actionsElement.className = 'quick-actions';
            actionsElement.innerHTML = actions.map(action => 
                `<button class="quick-action" onclick="chatbot.sendQuickAction('${action}')">${action}</button>`
            ).join('');
            
            lastMessage.appendChild(actionsElement);
        }
    }

    sendQuickAction(action) {
        const inputField = document.getElementById('chatbot-input-field');
        inputField.value = action;
        this.sendMessage();
    }

    scrollToBottom() {
        const messagesContainer = document.getElementById('chatbot-messages');
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    getCurrentUserId() {
        const currentUser = localStorage.getItem('currentUser');
        if (currentUser) {
            return JSON.parse(currentUser).id;
        }
        return 'demo-user';
    }

    saveChatHistory() {
        localStorage.setItem(`chat_history_${this.sessionId}`, JSON.stringify(this.messageHistory));
    }

    loadChatHistory() {
        const savedHistory = localStorage.getItem(`chat_history_${this.sessionId}`);
        if (savedHistory) {
            this.messageHistory = JSON.parse(savedHistory);
            
            // Restore messages (skip the initial greeting since it's already in HTML)
            this.messageHistory.forEach((msg, index) => {
                if (index > 0) { // Skip first message (greeting)
                    this.addMessageToDOM(msg.content, msg.sender);
                }
            });
        }
    }

    addMessageToDOM(content, sender) {
        const messagesContainer = document.getElementById('chatbot-messages');
        if (!messagesContainer) return;
        
        const messageElement = document.createElement('div');
        messageElement.className = `message ${sender}-message`;
        
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageElement.innerHTML = `
            <div class="message-content">${this.formatMessageContent(content)}</div>
            <div class="message-time">${timestamp}</div>
        `;
        
        messagesContainer.appendChild(messageElement);
    }

    clearHistory() {
        this.messageHistory = [];
        localStorage.removeItem(`chat_history_${this.sessionId}`);
        
        const messagesContainer = document.getElementById('chatbot-messages');
        if (messagesContainer) {
            // Keep only the initial greeting message
            const messages = messagesContainer.querySelectorAll('.message');
            for (let i = 1; i < messages.length; i++) {
                messages[i].remove();
            }
        }
        
        // Clear conversation context on server
        this.clearConversationContext();
    }

    async clearConversationContext() {
        try {
            const response = await fetch('/api/chatbot/clear', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sessionId: this.sessionId
                })
            });
            
            if (response.ok) {
                console.log('✅ Conversation context cleared on server');
                this.addMessage('Conversation context cleared. I\'m ready for a fresh start! How can I help you?', 'bot');
            }
        } catch (error) {
            console.error('Error clearing conversation context:', error);
        }
    }

    // Demo order for testing
    createDemoOrder() {
        const demoOrder = {
            id: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
            status: 'shipped',
            items: [
                { name: 'Quantum Wireless Headphones', quantity: 1, price: 299.99 }
            ],
            total: 299.99,
            estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        };
        
        localStorage.setItem('demoOrder', JSON.stringify(demoOrder));
        return demoOrder;
    }
}

// Initialize chatbot
let chatbot;

document.addEventListener('DOMContentLoaded', function() {
    chatbot = new QuantumChatbot();
    
    // Create a demo order for testing
    if (!localStorage.getItem('demoOrder')) {
        chatbot.createDemoOrder();
    }
});

// Global functions for HTML onclick handlers
function toggleChatbot() {
    if (chatbot) {
        chatbot.toggle();
    }
}

function openChatbot() {
    if (chatbot) {
        chatbot.open();
    }
}

function closeChatbot() {
    if (chatbot) {
        chatbot.close();
    }
}

function clearChatbot() {
    if (chatbot) {
        chatbot.clearHistory();
    }
}

function sendChatbotMessage() {
    if (chatbot) {
        chatbot.sendMessage();
    }
}

function handleChatbotEnter(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendChatbotMessage();
    }
}

// Add chatbot keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + / to toggle chatbot
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        toggleChatbot();
    }
    
    // Escape to close chatbot
    if (e.key === 'Escape' && chatbot && chatbot.isOpen) {
        closeChatbot();
    }
    
    // Ctrl/Cmd + Shift + C to clear chat context
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C' && chatbot && chatbot.isOpen) {
        e.preventDefault();
        clearChatbot();
    }
});

// Export for use in other modules
window.QuantumChatbot = QuantumChatbot;
