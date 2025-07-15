// Products page functionality for Quantum Commerce

class ProductsManager {
    constructor() {
        this.products = [];
        this.filteredProducts = [];
        this.currentProduct = null;
        this.modalQuantity = 1;
        
        this.init();
    }

    async init() {
        await this.loadProducts();
        this.setupEventListeners();
        this.setupFilters();
        this.checkURLParams();
    }

    async loadProducts() {
        try {
            const loadingElement = document.getElementById('products-loading');
            const gridElement = document.getElementById('products-grid');
            
            if (loadingElement) loadingElement.style.display = 'flex';
            if (gridElement) gridElement.style.display = 'none';

            const response = await fetch('/api/products');
            if (!response.ok) {
                throw new Error('Failed to load products');
            }

            this.products = await response.json();
            this.filteredProducts = [...this.products];
            
            // Make products globally available
            window.products = this.products;
            
            this.renderProducts();
            
            if (loadingElement) loadingElement.style.display = 'none';
            if (gridElement) gridElement.style.display = 'grid';

        } catch (error) {
            console.error('Error loading products:', error);
            this.showError('Failed to load products. Please try again.');
        }
    }

    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('product-search');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce((e) => {
                this.filterProducts();
            }, 300));
        }

        // Category filter
        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => {
                this.filterProducts();
            });
        }

        // Sort filter
        const sortFilter = document.getElementById('sort-filter');
        if (sortFilter) {
            sortFilter.addEventListener('change', () => {
                this.sortProducts();
            });
        }

        // Modal close on outside click
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('product-modal');
            if (e.target === modal) {
                this.closeProductModal();
            }
        });

        // ESC key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeProductModal();
            }
        });
    }

    setupFilters() {
        // Populate category filter with unique categories
        const categories = [...new Set(this.products.map(p => p.category))];
        const categoryFilter = document.getElementById('category-filter');
        
        if (categoryFilter && categories.length > 0) {
            // Clear existing options except "All Categories"
            const allOption = categoryFilter.querySelector('option[value=""]');
            categoryFilter.innerHTML = '';
            categoryFilter.appendChild(allOption);
            
            // Add category options
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                categoryFilter.appendChild(option);
            });
        }
    }

    checkURLParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');
        
        if (productId) {
            setTimeout(() => {
                this.openProductModal(productId);
            }, 500);
        }
    }

    filterProducts() {
        const searchTerm = document.getElementById('product-search')?.value.toLowerCase() || '';
        const selectedCategory = document.getElementById('category-filter')?.value || '';

        this.filteredProducts = this.products.filter(product => {
            const matchesSearch = !searchTerm || 
                product.name.toLowerCase().includes(searchTerm) ||
                product.description.toLowerCase().includes(searchTerm);
            
            const matchesCategory = !selectedCategory || product.category === selectedCategory;
            
            return matchesSearch && matchesCategory;
        });

        this.sortProducts();
    }

    sortProducts() {
        const sortBy = document.getElementById('sort-filter')?.value || 'name';

        this.filteredProducts.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'price-low':
                    return a.price - b.price;
                case 'price-high':
                    return b.price - a.price;
                case 'stock':
                    return b.stock - a.stock;
                default:
                    return 0;
            }
        });

        this.renderProducts();
    }

    renderProducts() {
        const container = document.getElementById('products-grid');
        const noResultsElement = document.getElementById('no-products');
        
        if (!container) return;

        if (this.filteredProducts.length === 0) {
            container.style.display = 'none';
            if (noResultsElement) noResultsElement.style.display = 'block';
            return;
        }

        if (noResultsElement) noResultsElement.style.display = 'none';
        container.style.display = 'grid';

        container.innerHTML = this.filteredProducts.map(product => `
            <div class="product-card" data-product-id="${product.id}">
                <div class="product-image" onclick="productsManager.openProductModal('${product.id}')">
                    ${this.getProductIcon(product.category)}
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <div class="product-price">$${product.price.toFixed(2)}</div>
                    <div class="product-category">${product.category}</div>
                    <p class="product-description">${product.description}</p>
                    <div class="product-stock ${product.stock === 0 ? 'out-of-stock' : ''}">
                        ${product.stock > 0 ? 
                            `✅ In Stock (${product.stock} available)` : 
                            '❌ Out of Stock'
                        }
                    </div>
                    <div class="product-actions">
                        <button class="btn btn-primary btn-small" 
                                onclick="addToCart('${product.id}')" 
                                ${product.stock === 0 ? 'disabled' : ''}>
                            <i class="fas fa-shopping-cart"></i>
                            ${product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                        </button>
                        <button class="btn btn-secondary btn-small" 
                                onclick="productsManager.openProductModal('${product.id}')">
                            <i class="fas fa-eye"></i>
                            Details
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        // Add animation to new cards
        container.querySelectorAll('.product-card').forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            
            setTimeout(() => {
                card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    getProductIcon(category) {
        const icons = {
            'Electronics': '<i class="fas fa-microchip"></i>',
            'Storage': '<i class="fas fa-hdd"></i>',
            'Wearables': '<i class="fas fa-clock"></i>',
            'Software': '<i class="fas fa-code"></i>'
        };
        
        return icons[category] || '<i class="fas fa-cube"></i>';
    }

    openProductModal(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        this.currentProduct = product;
        this.modalQuantity = 1;

        // Populate modal
        document.getElementById('modal-product-name').textContent = product.name;
        document.getElementById('modal-product-price').textContent = `$${product.price.toFixed(2)}`;
        document.getElementById('modal-product-category').textContent = product.category;
        document.getElementById('modal-product-description').textContent = product.description;
        document.getElementById('modal-quantity').textContent = this.modalQuantity;
        
        const stockElement = document.getElementById('modal-product-stock');
        stockElement.textContent = product.stock > 0 ? 
            `✅ ${product.stock} in stock` : 
            '❌ Out of stock';
        stockElement.className = `product-detail-stock ${product.stock === 0 ? 'out-of-stock' : ''}`;

        // Update add to cart button
        const addButton = document.getElementById('modal-add-to-cart');
        if (product.stock === 0) {
            addButton.disabled = true;
            addButton.innerHTML = '<i class="fas fa-times"></i> Out of Stock';
        } else {
            addButton.disabled = false;
            addButton.innerHTML = '<i class="fas fa-shopping-cart"></i> Add to Cart';
        }

        // Update URL without page reload
        const newUrl = `${window.location.pathname}?id=${productId}`;
        window.history.pushState({ productId }, '', newUrl);

        // Show modal
        const modal = document.getElementById('product-modal');
        modal.style.display = 'block';
        
        setTimeout(() => {
            modal.querySelector('.modal-content').style.transform = 'scale(1)';
            modal.querySelector('.modal-content').style.opacity = '1';
        }, 10);
    }

    closeProductModal() {
        const modal = document.getElementById('product-modal');
        const content = modal.querySelector('.modal-content');
        
        content.style.transform = 'scale(0.9)';
        content.style.opacity = '0';
        
        setTimeout(() => {
            modal.style.display = 'none';
            content.style.transform = 'scale(1)';
            content.style.opacity = '1';
        }, 200);

        // Update URL to remove product ID
        const newUrl = window.location.pathname;
        window.history.pushState({}, '', newUrl);
        
        this.currentProduct = null;
    }

    updateModalQuantity(change) {
        if (!this.currentProduct) return;
        
        const newQuantity = this.modalQuantity + change;
        
        if (newQuantity >= 1 && newQuantity <= this.currentProduct.stock) {
            this.modalQuantity = newQuantity;
            document.getElementById('modal-quantity').textContent = this.modalQuantity;
        }
    }

    addToCartFromModal() {
        if (!this.currentProduct || this.currentProduct.stock === 0) return;

        // Add multiple items to cart
        for (let i = 0; i < this.modalQuantity; i++) {
            addToCart(this.currentProduct.id);
        }

        // Show feedback
        const button = document.getElementById('modal-add-to-cart');
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i> Added to Cart!';
        button.style.background = 'var(--accent-green)';
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.style.background = '';
            this.closeProductModal();
        }, 1500);
    }

    showError(message) {
        const container = document.getElementById('products-grid');
        const loadingElement = document.getElementById('products-loading');
        
        if (loadingElement) loadingElement.style.display = 'none';
        
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error Loading Products</h3>
                    <p>${message}</p>
                    <button class="btn btn-primary" onclick="location.reload()">
                        <i class="fas fa-refresh"></i>
                        Try Again
                    </button>
                </div>
            `;
            container.style.display = 'flex';
        }
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Initialize products manager
let productsManager;

document.addEventListener('DOMContentLoaded', function() {
    productsManager = new ProductsManager();
    
    // Add products page specific styles
    if (!document.querySelector('#products-styles')) {
        const styles = document.createElement('style');
        styles.id = 'products-styles';
        styles.textContent = `
            .products-header {
                background: var(--gradient-hero);
                padding: 8rem 0 4rem;
                text-align: center;
            }
            
            .page-title {
                font-size: 3rem;
                background: linear-gradient(135deg, var(--text-primary), var(--primary-blue));
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                margin-bottom: 1rem;
            }
            
            .page-subtitle {
                font-size: 1.2rem;
                color: var(--text-secondary);
                margin-bottom: 3rem;
            }
            
            .products-controls {
                display: flex;
                gap: 2rem;
                align-items: center;
                justify-content: center;
                flex-wrap: wrap;
                max-width: 800px;
                margin: 0 auto;
            }
            
            .search-box {
                position: relative;
                flex: 1;
                min-width: 300px;
            }
            
            .search-box i {
                position: absolute;
                left: 1rem;
                top: 50%;
                transform: translateY(-50%);
                color: var(--text-muted);
            }
            
            .search-box input {
                width: 100%;
                padding: 0.75rem 1rem 0.75rem 3rem;
                background: var(--bg-card);
                border: 1px solid var(--border-primary);
                border-radius: 0.5rem;
                color: var(--text-primary);
                font-size: 1rem;
            }
            
            .search-box input:focus {
                outline: none;
                border-color: var(--primary-blue);
                box-shadow: 0 0 0 2px rgba(0, 102, 255, 0.1);
            }
            
            .filter-controls {
                display: flex;
                gap: 1rem;
            }
            
            .filter-controls select {
                padding: 0.75rem;
                background: var(--bg-card);
                border: 1px solid var(--border-primary);
                border-radius: 0.5rem;
                color: var(--text-primary);
                cursor: pointer;
            }
            
            .filter-controls select:focus {
                outline: none;
                border-color: var(--primary-blue);
            }
            
            .products-section {
                padding: 4rem 0;
                background: var(--bg-primary);
            }
            
            .loading-state {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 1rem;
                padding: 4rem;
                color: var(--text-secondary);
            }
            
            .loading-state i {
                font-size: 2rem;
                color: var(--primary-blue);
            }
            
            .no-results {
                text-align: center;
                padding: 4rem;
                color: var(--text-secondary);
            }
            
            .no-results i {
                font-size: 3rem;
                color: var(--text-muted);
                margin-bottom: 1rem;
            }
            
            .error-state {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 1rem;
                padding: 4rem;
                color: var(--accent-red);
                text-align: center;
            }
            
            .error-state i {
                font-size: 3rem;
            }
            
            .product-category {
                color: var(--text-muted);
                font-size: 0.9rem;
                margin-bottom: 0.5rem;
            }
            
            .product-modal-content {
                max-width: 800px;
            }
            
            .product-detail-grid {
                display: grid;
                grid-template-columns: 1fr 2fr;
                gap: 2rem;
                align-items: start;
            }
            
            .product-detail-image {
                background: var(--gradient-primary);
                height: 300px;
                border-radius: 1rem;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 4rem;
                color: var(--text-primary);
            }
            
            .product-detail-price {
                font-size: 2rem;
                font-weight: bold;
                color: var(--primary-blue);
                margin-bottom: 1rem;
            }
            
            .product-detail-category {
                color: var(--text-muted);
                font-size: 1rem;
                margin-bottom: 1rem;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            
            .product-detail-stock {
                font-size: 1.1rem;
                margin-bottom: 1.5rem;
                padding: 0.5rem;
                border-radius: 0.5rem;
                background: rgba(0, 184, 148, 0.1);
                color: var(--accent-green);
            }
            
            .product-detail-stock.out-of-stock {
                background: rgba(225, 112, 85, 0.1);
                color: var(--accent-red);
            }
            
            .product-detail-description {
                color: var(--text-secondary);
                line-height: 1.6;
                margin-bottom: 2rem;
            }
            
            .product-detail-actions {
                display: flex;
                align-items: center;
                gap: 2rem;
            }
            
            .quantity-selector {
                display: flex;
                align-items: center;
                gap: 1rem;
            }
            
            .quantity-selector label {
                color: var(--text-primary);
                font-weight: 600;
            }
            
            .quantity-controls {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                background: var(--bg-tertiary);
                border-radius: 0.5rem;
                padding: 0.5rem;
            }
            
            .quantity-controls button {
                background: var(--primary-blue);
                border: none;
                color: var(--text-primary);
                width: 35px;
                height: 35px;
                border-radius: 0.25rem;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
            }
            
            .quantity-controls button:hover {
                background: var(--primary-dark);
                transform: scale(1.05);
            }
            
            .quantity-controls span {
                color: var(--text-primary);
                font-weight: 600;
                min-width: 40px;
                text-align: center;
                font-size: 1.1rem;
            }
            
            @media (max-width: 768px) {
                .products-controls {
                    flex-direction: column;
                    gap: 1rem;
                }
                
                .search-box {
                    min-width: auto;
                    width: 100%;
                }
                
                .filter-controls {
                    width: 100%;
                    justify-content: center;
                }
                
                .filter-controls select {
                    flex: 1;
                }
                
                .product-detail-grid {
                    grid-template-columns: 1fr;
                }
                
                .product-detail-actions {
                    flex-direction: column;
                    align-items: stretch;
                    gap: 1rem;
                }
                
                .quantity-selector {
                    justify-content: center;
                }
                
                .page-title {
                    font-size: 2rem;
                }
            }
        `;
        document.head.appendChild(styles);
    }
});

// Global functions for HTML onclick handlers
function closeProductModal() {
    if (productsManager) {
        productsManager.closeProductModal();
    }
}

function updateModalQuantity(change) {
    if (productsManager) {
        productsManager.updateModalQuantity(change);
    }
}

function addToCartFromModal() {
    if (productsManager) {
        productsManager.addToCartFromModal();
    }
}

// Export for global use
window.productsManager = productsManager;
