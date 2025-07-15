// Shopping Cart functionality for Quantum Commerce

class ShoppingCart {
    constructor() {
        this.items = this.loadCart();
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateCartDisplay();
    }

    bindEvents() {
        // Cart link click
        const cartLink = document.getElementById('cart-link');
        if (cartLink) {
            cartLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.openCart();
            });
        }

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('cart-modal');
            if (e.target === modal) {
                this.closeCart();
            }
        });

        // ESC key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeCart();
            }
        });
    }

    loadCart() {
        const stored = localStorage.getItem('cart');
        return stored ? JSON.parse(stored) : [];
    }

    saveCart() {
        localStorage.setItem('cart', JSON.stringify(this.items));
        this.updateCartCount();
    }

    addItem(productId, quantity = 1) {
        const existingItem = this.items.find(item => item.productId === productId);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            // We'd normally fetch product details here
            // For now, we'll use the global products array
            const product = window.products?.find(p => p.id === productId);
            if (product) {
                this.items.push({
                    productId: productId,
                    name: product.name,
                    price: product.price,
                    quantity: quantity
                });
            }
        }
        
        this.saveCart();
        this.updateCartDisplay();
    }

    removeItem(productId) {
        this.items = this.items.filter(item => item.productId !== productId);
        this.saveCart();
        this.updateCartDisplay();
    }

    updateQuantity(productId, quantity) {
        const item = this.items.find(item => item.productId === productId);
        if (item) {
            if (quantity <= 0) {
                this.removeItem(productId);
            } else {
                item.quantity = quantity;
                this.saveCart();
                this.updateCartDisplay();
            }
        }
    }

    clearCart() {
        this.items = [];
        this.saveCart();
        this.updateCartDisplay();
    }

    getTotal() {
        return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    getItemCount() {
        return this.items.reduce((total, item) => total + item.quantity, 0);
    }

    updateCartCount() {
        const countElement = document.getElementById('cart-count');
        if (countElement) {
            countElement.textContent = this.getItemCount();
            
            // Add animation
            countElement.style.transform = 'scale(1.2)';
            setTimeout(() => {
                countElement.style.transform = 'scale(1)';
            }, 200);
        }
    }

    updateCartDisplay() {
        this.updateCartCount();
        this.renderCartItems();
    }

    renderCartItems() {
        const container = document.getElementById('cart-items');
        const totalElement = document.getElementById('cart-total');
        
        if (!container || !totalElement) return;

        if (this.items.length === 0) {
            container.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
                    <p style="color: var(--text-muted);">Your cart is empty</p>
                    <button class="btn btn-primary" onclick="closeCart(); window.location.href='/products'">
                        Start Shopping
                    </button>
                </div>
            `;
            totalElement.textContent = '0.00';
            return;
        }

        container.innerHTML = this.items.map(item => `
            <div class="cart-item" data-product-id="${item.productId}">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <div class="cart-item-price">$${item.price.toFixed(2)}</div>
                </div>
                <div class="cart-item-controls">
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="cart.updateQuantity('${item.productId}', ${item.quantity - 1})">
                            <i class="fas fa-minus"></i>
                        </button>
                        <span class="quantity">${item.quantity}</span>
                        <button class="quantity-btn" onclick="cart.updateQuantity('${item.productId}', ${item.quantity + 1})">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <button class="remove-btn" onclick="cart.removeItem('${item.productId}')" title="Remove item">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="cart-item-total">
                    $${(item.price * item.quantity).toFixed(2)}
                </div>
            </div>
        `).join('');

        totalElement.textContent = this.getTotal().toFixed(2);
    }

    openCart() {
        const modal = document.getElementById('cart-modal');
        if (modal) {
            modal.style.display = 'block';
            this.renderCartItems();
            
            // Add animation
            setTimeout(() => {
                modal.querySelector('.modal-content').style.transform = 'scale(1)';
                modal.querySelector('.modal-content').style.opacity = '1';
            }, 10);
        }
    }

    closeCart() {
        const modal = document.getElementById('cart-modal');
        if (modal) {
            const content = modal.querySelector('.modal-content');
            content.style.transform = 'scale(0.9)';
            content.style.opacity = '0';
            
            setTimeout(() => {
                modal.style.display = 'none';
                content.style.transform = 'scale(1)';
                content.style.opacity = '1';
            }, 200);
        }
    }

    async checkout() {
        if (this.items.length === 0) {
            window.QuantumCommerce.showErrorMessage('Your cart is empty');
            return;
        }

        let originalText = ''; // Initialize variable

        try {
            // Get current user
            const currentUser = localStorage.getItem('currentUser');
            const userId = currentUser ? JSON.parse(currentUser).id : 'demo-user';
            
            // Prepare order data
            const orderData = {
                userId: userId,
                items: this.items.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity
                })),
                shippingAddress: 'Demo Address, Demo City, DC 12345',
                paymentMethod: 'Demo Payment Method'
            };

            // Show loading state
            const checkoutBtn = document.querySelector('.modal-footer .btn-primary');
            if (checkoutBtn) {
                originalText = checkoutBtn.innerHTML;
                checkoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
                checkoutBtn.disabled = true;
            }

            // Send order to backend
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create order');
            }

            const result = await response.json();
            
            // Clear cart
            this.clearCart();
            this.closeCart();
            
            // Show success message
            window.QuantumCommerce.showSuccessMessage(
                `Order #${result.order.id} created successfully! You can track it using our AI assistant.`
            );
            
            // Store order for demo purposes
            const demoOrder = {
                ...result.order,
                chatbotTestOrder: true
            };
            localStorage.setItem('latestOrder', JSON.stringify(demoOrder));
            
            // Suggest using chatbot
            setTimeout(() => {
                if (confirm('Would you like to try our AI assistant to track your order?')) {
                    window.openChatbot();
                    setTimeout(() => {
                        const input = document.getElementById('chatbot-input-field');
                        if (input) {
                            input.value = `Check order status ${result.order.id}`;
                        }
                    }, 500);
                }
            }, 2000);

        } catch (error) {
            console.error('Checkout error:', error);
            window.QuantumCommerce.showErrorMessage(error.message || 'Failed to process order');
        } finally {
            // Reset button
            const checkoutBtn = document.querySelector('.modal-footer .btn-primary');
            if (checkoutBtn && originalText) {
                checkoutBtn.innerHTML = originalText;
                checkoutBtn.disabled = false;
            }
        }
    }
}

// Initialize cart
let cart;

document.addEventListener('DOMContentLoaded', function() {
    cart = new ShoppingCart();
    
    // Add cart-specific styles
    if (!document.querySelector('#cart-styles')) {
        const styles = document.createElement('style');
        styles.id = 'cart-styles';
        styles.textContent = `
            .cart-item {
                display: grid;
                grid-template-columns: 1fr auto auto;
                gap: 1rem;
                align-items: center;
                padding: 1rem;
                border: 1px solid var(--border-primary);
                border-radius: 0.5rem;
                margin-bottom: 1rem;
                background: var(--bg-secondary);
            }
            
            .cart-item-info h4 {
                margin: 0 0 0.5rem 0;
                color: var(--text-primary);
                font-size: 1rem;
            }
            
            .cart-item-price {
                color: var(--primary-blue);
                font-weight: 600;
            }
            
            .cart-item-controls {
                display: flex;
                align-items: center;
                gap: 1rem;
            }
            
            .quantity-controls {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                background: var(--bg-tertiary);
                border-radius: 0.5rem;
                padding: 0.25rem;
            }
            
            .quantity-btn {
                background: none;
                border: none;
                color: var(--text-secondary);
                width: 30px;
                height: 30px;
                border-radius: 0.25rem;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
            }
            
            .quantity-btn:hover {
                background: var(--primary-blue);
                color: var(--text-primary);
            }
            
            .quantity {
                color: var(--text-primary);
                font-weight: 600;
                min-width: 30px;
                text-align: center;
            }
            
            .remove-btn {
                background: none;
                border: none;
                color: var(--accent-red);
                padding: 0.5rem;
                border-radius: 0.25rem;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .remove-btn:hover {
                background: var(--accent-red);
                color: var(--text-primary);
            }
            
            .cart-item-total {
                font-weight: 600;
                color: var(--primary-blue);
                font-size: 1.1rem;
            }
            
            .empty-cart {
                text-align: center;
                padding: 2rem;
            }
            
            .cart-total {
                text-align: right;
                font-size: 1.2rem;
                padding: 1rem 0;
                border-top: 1px solid var(--border-primary);
                margin-top: 1rem;
                color: var(--text-primary);
            }
            
            @media (max-width: 600px) {
                .cart-item {
                    grid-template-columns: 1fr;
                    gap: 0.5rem;
                }
                
                .cart-item-controls {
                    justify-content: space-between;
                }
                
                .cart-item-total {
                    text-align: right;
                }
            }
        `;
        document.head.appendChild(styles);
    }
});

// Global functions for HTML onclick handlers
function openCart() {
    if (cart) {
        cart.openCart();
    }
}

function closeCart() {
    if (cart) {
        cart.closeCart();
    }
}

function checkout() {
    if (cart) {
        cart.checkout();
    }
}

// Override the global addToCart function to use the cart class
window.addToCart = function(productId) {
    if (cart) {
        // Get product details first
        const product = window.products?.find(p => p.id === productId);
        if (!product) {
            window.QuantumCommerce.showErrorMessage('Product not found');
            return;
        }

        if (product.stock === 0) {
            window.QuantumCommerce.showErrorMessage('Product is out of stock');
            return;
        }

        cart.addItem(productId, 1);
        window.QuantumCommerce.showSuccessMessage(`${product.name} added to cart!`);
        
        // Add visual feedback
        const button = event.target.closest('button');
        if (button) {
            const originalText = button.innerHTML;
            button.innerHTML = '<i class="fas fa-check"></i> Added!';
            button.style.background = 'var(--accent-green)';
            
            setTimeout(() => {
                button.innerHTML = originalText;
                button.style.background = '';
            }, 2000);
        }
    }
};

// Export cart for global use
window.cart = cart;
