// Account page functionality for Quantum Commerce

class AccountManager {
    constructor() {
        this.currentUser = null;
        this.orders = [];
        this.currentOrder = null;
        
        this.init();
    }

    init() {
        this.checkAuthentication();
        this.setupEventListeners();
        this.loadUserData();
    }

    checkAuthentication() {
        const savedUser = localStorage.getItem('currentUser');
        
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.showDashboard();
        } else {
            this.showLogin();
        }
    }

    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Register form
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }

        // Modal close handlers
        window.addEventListener('click', (e) => {
            const orderModal = document.getElementById('order-modal');
            if (e.target === orderModal) {
                this.closeOrderModal();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeOrderModal();
            }
        });
    }

    showLogin() {
        document.getElementById('login-section').style.display = 'block';
        document.getElementById('dashboard-section').style.display = 'none';
    }

    showDashboard() {
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('dashboard-section').style.display = 'block';
        
        if (this.currentUser) {
            this.updateUserProfile();
            this.loadOrders();
        }
    }

    async handleLogin() {
        const email = document.getElementById('login-email').value.trim();
        
        if (!email) {
            window.QuantumCommerce.showErrorMessage('Please enter an email address');
            return;
        }

        try {
            // For demo purposes, we'll accept any email
            this.currentUser = {
                id: 'demo-user',
                email: email,
                name: this.extractNameFromEmail(email),
                createdAt: new Date().toISOString()
            };

            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            
            window.QuantumCommerce.showSuccessMessage('Welcome back! Logged in successfully.');
            this.showDashboard();

        } catch (error) {
            console.error('Login error:', error);
            window.QuantumCommerce.showErrorMessage('Login failed. Please try again.');
        }
    }

    async handleRegister() {
        const name = document.getElementById('register-name').value.trim();
        const email = document.getElementById('register-email').value.trim();
        
        if (!name || !email) {
            window.QuantumCommerce.showErrorMessage('Please fill in all fields');
            return;
        }

        try {
            this.currentUser = {
                id: 'user_' + Date.now(),
                email: email,
                name: name,
                createdAt: new Date().toISOString()
            };

            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            
            window.QuantumCommerce.showSuccessMessage('Account created successfully! Welcome to Quantum Commerce.');
            this.showDashboard();

        } catch (error) {
            console.error('Registration error:', error);
            window.QuantumCommerce.showErrorMessage('Registration failed. Please try again.');
        }
    }

    loginAsDemoUser() {
        this.currentUser = {
            id: 'demo-user',
            email: 'demo@example.com',
            name: 'Demo User',
            createdAt: '2025-01-01T00:00:00.000Z'
        };

        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        
        window.QuantumCommerce.showSuccessMessage('Welcome! You\'re now logged in as a demo user.');
        this.showDashboard();
    }

    extractNameFromEmail(email) {
        const localPart = email.split('@')[0];
        return localPart.split('.').map(part => 
            part.charAt(0).toUpperCase() + part.slice(1)
        ).join(' ');
    }

    updateUserProfile() {
        if (!this.currentUser) return;

        document.getElementById('user-name').textContent = this.currentUser.name;
        document.getElementById('user-email').textContent = this.currentUser.email;
        
        const memberSince = new Date(this.currentUser.createdAt).getFullYear();
        document.getElementById('member-since').textContent = memberSince;
    }

    async loadUserData() {
        if (!this.currentUser) return;

        try {
            await this.loadOrders();
            this.updateStatistics();
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    async loadOrders() {
        try {
            const response = await fetch(`/api/orders/user/${this.currentUser.id}`);
            
            if (response.ok) {
                this.orders = await response.json();
            } else {
                this.orders = [];
            }

            // Load any orders from localStorage (for demo purposes)
            const localOrders = this.getLocalOrders();
            this.orders = [...this.orders, ...localOrders];
            
            this.renderOrders();
            this.updateStatistics();

        } catch (error) {
            console.error('Error loading orders:', error);
            this.orders = this.getLocalOrders();
            this.renderOrders();
        }
    }

    getLocalOrders() {
        const localOrders = [];
        
        // Check for latest order from checkout
        const latestOrder = localStorage.getItem('latestOrder');
        if (latestOrder) {
            localOrders.push(JSON.parse(latestOrder));
        }

        // Check for demo order
        const demoOrder = localStorage.getItem('demoOrder');
        if (demoOrder) {
            localOrders.push(JSON.parse(demoOrder));
        }

        return localOrders;
    }

    renderOrders() {
        const container = document.getElementById('orders-container');
        const noOrdersElement = document.getElementById('no-orders');
        
        if (!container || !noOrdersElement) return;

        if (this.orders.length === 0) {
            container.style.display = 'none';
            noOrdersElement.style.display = 'block';
            return;
        }

        container.style.display = 'block';
        noOrdersElement.style.display = 'none';

        // Sort orders by date (newest first)
        const sortedOrders = [...this.orders].sort((a, b) => 
            new Date(b.createdAt || b.timestamp) - new Date(a.createdAt || a.timestamp)
        );

        container.innerHTML = sortedOrders.map(order => `
            <div class="order-card" onclick="accountManager.openOrderModal('${order.id}')">
                <div class="order-header">
                    <div class="order-info">
                        <h4>Order #${order.id}</h4>
                        <span class="order-date">${this.formatDate(order.createdAt || order.timestamp)}</span>
                    </div>
                    <div class="order-status ${order.status}">
                        <i class="fas ${this.getStatusIcon(order.status)}"></i>
                        ${this.capitalizeFirst(order.status)}
                    </div>
                </div>
                <div class="order-details">
                    <div class="order-items">
                        ${order.items ? order.items.slice(0, 2).map(item => `
                            <span class="order-item">${item.name || item.productId} (${item.quantity})</span>
                        `).join('') : 'Items loading...'}
                        ${order.items && order.items.length > 2 ? `<span class="more-items">+${order.items.length - 2} more</span>` : ''}
                    </div>
                    <div class="order-total">$${(order.total || 0).toFixed(2)}</div>
                </div>
                <div class="order-actions">
                    <button class="btn btn-secondary btn-small" onclick="event.stopPropagation(); accountManager.trackOrder('${order.id}')">
                        <i class="fas fa-search"></i>
                        Track
                    </button>
                    <button class="btn btn-primary btn-small" onclick="event.stopPropagation(); accountManager.askAIAboutOrder('${order.id}')">
                        <i class="fas fa-robot"></i>
                        Ask AI
                    </button>
                </div>
            </div>
        `).join('');
    }

    updateStatistics() {
        const totalOrders = this.orders.length;
        const pendingOrders = this.orders.filter(o => ['pending', 'processing'].includes(o.status)).length;
        const deliveredOrders = this.orders.filter(o => o.status === 'delivered').length;
        const totalSpent = this.orders.reduce((sum, o) => sum + (o.total || 0), 0);

        document.getElementById('total-orders').textContent = totalOrders;
        document.getElementById('pending-orders').textContent = pendingOrders;
        document.getElementById('delivered-orders').textContent = deliveredOrders;
        document.getElementById('total-spent').textContent = totalSpent.toFixed(2);
    }

    openOrderModal(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        this.currentOrder = order;

        document.getElementById('modal-order-title').textContent = `Order #${order.id}`;
        
        const content = document.getElementById('order-detail-content');
        content.innerHTML = `
            <div class="order-detail-grid">
                <div class="order-detail-section">
                    <h4><i class="fas fa-info-circle"></i> Order Information</h4>
                    <div class="detail-row">
                        <span class="detail-label">Order ID:</span>
                        <span class="detail-value">${order.id}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Status:</span>
                        <span class="detail-value order-status ${order.status}">
                            <i class="fas ${this.getStatusIcon(order.status)}"></i>
                            ${this.capitalizeFirst(order.status)}
                        </span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Order Date:</span>
                        <span class="detail-value">${this.formatDate(order.createdAt || order.timestamp)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Total Amount:</span>
                        <span class="detail-value order-total">$${(order.total || 0).toFixed(2)}</span>
                    </div>
                    ${order.trackingNumber ? `
                        <div class="detail-row">
                            <span class="detail-label">Tracking:</span>
                            <span class="detail-value">${order.trackingNumber}</span>
                        </div>
                    ` : ''}
                    ${order.estimatedDelivery ? `
                        <div class="detail-row">
                            <span class="detail-label">Estimated Delivery:</span>
                            <span class="detail-value">${this.formatDate(order.estimatedDelivery)}</span>
                        </div>
                    ` : ''}
                </div>

                <div class="order-detail-section">
                    <h4><i class="fas fa-shopping-bag"></i> Items Ordered</h4>
                    <div class="order-items-list">
                        ${order.items ? order.items.map(item => `
                            <div class="order-item-detail">
                                <div class="item-info">
                                    <span class="item-name">${item.name || item.productId}</span>
                                    <span class="item-quantity">Qty: ${item.quantity}</span>
                                </div>
                                <div class="item-price">$${((item.price || 0) * item.quantity).toFixed(2)}</div>
                            </div>
                        `).join('') : '<p>Loading items...</p>'}
                    </div>
                </div>

                ${order.shippingAddress ? `
                    <div class="order-detail-section">
                        <h4><i class="fas fa-truck"></i> Shipping Information</h4>
                        <div class="detail-row">
                            <span class="detail-label">Address:</span>
                            <span class="detail-value">${order.shippingAddress}</span>
                        </div>
                        ${order.paymentMethod ? `
                            <div class="detail-row">
                                <span class="detail-label">Payment:</span>
                                <span class="detail-value">${order.paymentMethod}</span>
                            </div>
                        ` : ''}
                    </div>
                ` : ''}
            </div>
        `;

        const modal = document.getElementById('order-modal');
        modal.style.display = 'block';
        
        setTimeout(() => {
            modal.querySelector('.modal-content').style.transform = 'scale(1)';
            modal.querySelector('.modal-content').style.opacity = '1';
        }, 10);
    }

    closeOrderModal() {
        const modal = document.getElementById('order-modal');
        const content = modal.querySelector('.modal-content');
        
        content.style.transform = 'scale(0.9)';
        content.style.opacity = '0';
        
        setTimeout(() => {
            modal.style.display = 'none';
            content.style.transform = 'scale(1)';
            content.style.opacity = '1';
        }, 200);
        
        this.currentOrder = null;
    }

    trackOrder(orderId) {
        this.askAI(`Track order ${orderId}`);
    }

    askAIAboutOrder(orderId) {
        this.askAI(`Tell me about order ${orderId}`);
    }

    askAI(message) {
        // Open chatbot and send predefined message
        window.openChatbot();
        
        setTimeout(() => {
            const input = document.getElementById('chatbot-input-field');
            if (input) {
                input.value = message;
                window.sendChatbotMessage();
            }
        }, 500);
    }

    async createTestOrder() {
        try {
            const testOrder = {
                userId: this.currentUser.id,
                items: [
                    { productId: '1', quantity: 1 },
                    { productId: '2', quantity: 1 }
                ],
                shippingAddress: '123 Test Street, Demo City, DC 12345',
                paymentMethod: 'Test Payment'
            };

            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(testOrder)
            });

            if (response.ok) {
                const result = await response.json();
                window.QuantumCommerce.showSuccessMessage('Test order created successfully!');
                
                // Reload orders
                setTimeout(() => {
                    this.loadOrders();
                }, 1000);
            } else {
                throw new Error('Failed to create test order');
            }

        } catch (error) {
            console.error('Error creating test order:', error);
            window.QuantumCommerce.showErrorMessage('Failed to create test order');
        }
    }

    orderAction() {
        if (this.currentOrder) {
            this.closeOrderModal();
            this.askAIAboutOrder(this.currentOrder.id);
        }
    }

    editProfile() {
        // For demo purposes, just show a message
        window.QuantumCommerce.showSuccessMessage('Profile editing feature coming soon!');
    }

    logout() {
        localStorage.removeItem('currentUser');
        this.currentUser = null;
        this.orders = [];
        
        window.QuantumCommerce.showSuccessMessage('Logged out successfully');
        this.showLogin();
        
        // Clear forms
        document.getElementById('login-email').value = '';
        document.getElementById('register-name').value = '';
        document.getElementById('register-email').value = '';
    }

    // Utility methods
    getStatusIcon(status) {
        const icons = {
            'pending': 'fa-clock',
            'processing': 'fa-cog fa-spin',
            'shipped': 'fa-shipping-fast',
            'delivered': 'fa-check-circle',
            'cancelled': 'fa-times-circle'
        };
        return icons[status] || 'fa-question-circle';
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return dateString;
        }
    }
}

// Initialize account manager
let accountManager;

document.addEventListener('DOMContentLoaded', function() {
    accountManager = new AccountManager();
    
    // Add account page specific styles
    if (!document.querySelector('#account-styles')) {
        const styles = document.createElement('style');
        styles.id = 'account-styles';
        styles.textContent = `
            .account-header {
                background: var(--gradient-hero);
                padding: 8rem 0 4rem;
                text-align: center;
            }
            
            .login-section {
                padding: 4rem 0;
                background: var(--bg-primary);
                min-height: 60vh;
                display: flex;
                align-items: center;
            }
            
            .login-card {
                background: var(--gradient-card);
                border: 1px solid var(--border-primary);
                border-radius: 1rem;
                padding: 3rem;
                max-width: 500px;
                margin: 0 auto;
                box-shadow: var(--shadow-large);
                text-align: center;
            }
            
            .login-card h2 {
                margin-bottom: 1rem;
                color: var(--text-primary);
            }
            
            .auth-tabs {
                display: flex;
                margin: 2rem 0;
                background: var(--bg-tertiary);
                border-radius: 0.5rem;
                padding: 0.25rem;
            }
            
            .auth-tab {
                flex: 1;
                background: none;
                border: none;
                padding: 0.75rem;
                color: var(--text-secondary);
                border-radius: 0.25rem;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .auth-tab.active {
                background: var(--primary-blue);
                color: var(--text-primary);
            }
            
            .auth-form {
                text-align: left;
            }
            
            .form-group {
                margin-bottom: 1.5rem;
            }
            
            .form-group label {
                display: block;
                margin-bottom: 0.5rem;
                color: var(--text-primary);
                font-weight: 600;
            }
            
            .form-group input {
                width: 100%;
                padding: 0.75rem;
                background: var(--bg-secondary);
                border: 1px solid var(--border-primary);
                border-radius: 0.5rem;
                color: var(--text-primary);
                font-size: 1rem;
            }
            
            .form-group input:focus {
                outline: none;
                border-color: var(--primary-blue);
                box-shadow: 0 0 0 2px rgba(0, 102, 255, 0.1);
            }
            
            .auth-note {
                margin-top: 1rem;
                color: var(--text-muted);
                font-size: 0.9rem;
            }
            
            .demo-account {
                margin-top: 2rem;
                padding-top: 2rem;
                border-top: 1px solid var(--border-primary);
            }
            
            .dashboard-section {
                padding: 4rem 0;
                background: var(--bg-primary);
            }
            
            .dashboard-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 2rem;
                margin-bottom: 3rem;
            }
            
            .dashboard-card {
                background: var(--gradient-card);
                border: 1px solid var(--border-primary);
                border-radius: 1rem;
                overflow: hidden;
                box-shadow: var(--shadow);
                transition: all 0.3s ease;
            }
            
            .dashboard-card:hover {
                transform: translateY(-2px);
                box-shadow: var(--shadow-large);
            }
            
            .card-header {
                padding: 1.5rem;
                border-bottom: 1px solid var(--border-primary);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .card-header h3 {
                color: var(--text-primary);
                margin: 0;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .card-content {
                padding: 1.5rem;
            }
            
            .profile-info {
                display: flex;
                align-items: center;
                gap: 1rem;
                margin-bottom: 1.5rem;
            }
            
            .profile-avatar {
                font-size: 3rem;
                color: var(--primary-blue);
            }
            
            .profile-details h4 {
                margin: 0 0 0.5rem 0;
                color: var(--text-primary);
            }
            
            .profile-details p {
                margin: 0;
                color: var(--text-secondary);
            }
            
            .user-since {
                font-size: 0.9rem;
                color: var(--text-muted);
            }
            
            .logout-btn {
                width: 100%;
            }
            
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 1rem;
            }
            
            .stat-item {
                text-align: center;
                padding: 1rem;
                background: var(--bg-secondary);
                border-radius: 0.5rem;
            }
            
            .stat-number {
                font-size: 2rem;
                font-weight: bold;
                color: var(--primary-blue);
            }
            
            .stat-label {
                color: var(--text-secondary);
                font-size: 0.9rem;
                margin-top: 0.5rem;
            }
            
            .ai-actions {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }
            
            .section-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 2rem;
            }
            
            .section-header h2 {
                color: var(--text-primary);
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .orders-container {
                display: grid;
                gap: 1rem;
            }
            
            .order-card {
                background: var(--gradient-card);
                border: 1px solid var(--border-primary);
                border-radius: 1rem;
                padding: 1.5rem;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: var(--shadow);
            }
            
            .order-card:hover {
                transform: translateY(-2px);
                box-shadow: var(--shadow-large);
                border-color: var(--primary-blue);
            }
            
            .order-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 1rem;
            }
            
            .order-info h4 {
                margin: 0 0 0.5rem 0;
                color: var(--text-primary);
            }
            
            .order-date {
                color: var(--text-muted);
                font-size: 0.9rem;
            }
            
            .order-status {
                padding: 0.25rem 0.75rem;
                border-radius: 1rem;
                font-size: 0.9rem;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 0.25rem;
            }
            
            .order-status.pending { background: rgba(255, 193, 7, 0.2); color: #ffc107; }
            .order-status.processing { background: rgba(0, 123, 255, 0.2); color: #007bff; }
            .order-status.shipped { background: rgba(0, 184, 148, 0.2); color: var(--accent-green); }
            .order-status.delivered { background: rgba(40, 167, 69, 0.2); color: #28a745; }
            .order-status.cancelled { background: rgba(225, 112, 85, 0.2); color: var(--accent-red); }
            
            .order-details {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1rem;
            }
            
            .order-items {
                flex: 1;
            }
            
            .order-item {
                color: var(--text-secondary);
                font-size: 0.9rem;
                margin-right: 1rem;
            }
            
            .more-items {
                color: var(--text-muted);
                font-style: italic;
            }
            
            .order-total {
                font-size: 1.2rem;
                font-weight: bold;
                color: var(--primary-blue);
            }
            
            .order-actions {
                display: flex;
                gap: 0.5rem;
                justify-content: flex-end;
            }
            
            .no-orders {
                text-align: center;
                padding: 4rem;
                color: var(--text-secondary);
            }
            
            .no-orders i {
                font-size: 3rem;
                color: var(--text-muted);
                margin-bottom: 1rem;
            }
            
            .order-modal-content {
                max-width: 900px;
            }
            
            .order-detail-grid {
                display: grid;
                gap: 2rem;
            }
            
            .order-detail-section {
                background: var(--bg-secondary);
                padding: 1.5rem;
                border-radius: 0.5rem;
                border: 1px solid var(--border-primary);
            }
            
            .order-detail-section h4 {
                color: var(--text-primary);
                margin-bottom: 1rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .detail-row {
                display: flex;
                justify-content: space-between;
                padding: 0.5rem 0;
                border-bottom: 1px solid var(--border-secondary);
            }
            
            .detail-row:last-child {
                border-bottom: none;
            }
            
            .detail-label {
                color: var(--text-secondary);
                font-weight: 600;
            }
            
            .detail-value {
                color: var(--text-primary);
            }
            
            .order-items-list {
                display: grid;
                gap: 1rem;
            }
            
            .order-item-detail {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1rem;
                background: var(--bg-tertiary);
                border-radius: 0.5rem;
            }
            
            .item-name {
                font-weight: 600;
                color: var(--text-primary);
            }
            
            .item-quantity {
                color: var(--text-muted);
                font-size: 0.9rem;
            }
            
            .item-price {
                font-weight: bold;
                color: var(--primary-blue);
            }
            
            @media (max-width: 768px) {
                .dashboard-grid {
                    grid-template-columns: 1fr;
                }
                
                .stats-grid {
                    grid-template-columns: 1fr;
                }
                
                .order-header {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 0.5rem;
                }
                
                .order-details {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 0.5rem;
                }
                
                .order-actions {
                    width: 100%;
                    justify-content: center;
                }
                
                .section-header {
                    flex-direction: column;
                    gap: 1rem;
                    align-items: flex-start;
                }
            }
        `;
        document.head.appendChild(styles);
    }
});

// Global functions for HTML onclick handlers
function showLoginForm() {
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('register-form').style.display = 'none';
    
    document.querySelectorAll('.auth-tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
}

function showRegisterForm() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
    
    document.querySelectorAll('.auth-tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
}

function loginAsDemoUser() {
    if (accountManager) {
        accountManager.loginAsDemoUser();
    }
}

function editProfile() {
    if (accountManager) {
        accountManager.editProfile();
    }
}

function logout() {
    if (accountManager) {
        accountManager.logout();
    }
}

function closeOrderModal() {
    if (accountManager) {
        accountManager.closeOrderModal();
    }
}

function createTestOrder() {
    if (accountManager) {
        accountManager.createTestOrder();
    }
}

function orderAction() {
    if (accountManager) {
        accountManager.orderAction();
    }
}

function askAI(message) {
    if (accountManager) {
        accountManager.askAI(message);
    }
}

// Export for global use
window.accountManager = accountManager;
