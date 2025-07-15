# E-commerce Order Management Bot

An AI-driven e-commerce order management bot with integrated website showcasing automated customer service capabilities powered by Groq's Llama-3.3-70b-versatile model.

## Features

### AI-Powered Order Management Bot
- **Natural Language Understanding**: Advanced AI powered by Groq's Llama-3.3-70b-versatile model
- **Order Status Inquiries**: Intelligent order status queries with context awareness
- **Return/Exchange Processing**: Automated return and exchange workflow
- **Shipping Updates**: Real-time shipping status and notifications
- **Inventory Integration**: Smart inventory checking and product recommendations
- **Conversational Memory**: Maintains conversation context for natural interactions
- **Clear Context**: Easy conversation reset functionality

### E-commerce Website
- **Product Catalog**: Browse available quantum-enhanced products
- **Mock Order Placement**: Place orders without actual payment processing
- **Customer Account**: View order history and manage account
- **Chat Integration**: Seamless AI chatbot integration with clear context button
- **Responsive Design**: Modern, futuristic UI with dark theme

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **AI/LLM**: Groq Llama-3.3-70b-versatile
- **Data Storage**: JSON files (easily upgradeable to databases)
- **Styling**: Futuristic dark blue theme with quantum elements

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your Groq API key:
   ```
   GROQ_API_KEY=your_groq_api_key_here
   PORT=3000
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open http://localhost:3000 in your browser

## Getting Your Groq API Key

1. Visit [https://console.groq.com/](https://console.groq.com/)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Generate a new API key
5. Copy the key to your `.env` file

## Project Structure

```
├── server.js              # Main server file
├── public/                # Static frontend files
│   ├── index.html         # Homepage
│   ├── products.html      # Product catalog
│   ├── account.html       # Customer account page
│   ├── css/               # Stylesheets
│   └── js/                # Frontend JavaScript
├── data/                  # JSON data files
├── routes/                # API routes
│   ├── chatbot.js         # AI chatbot endpoints
│   ├── orders.js          # Order management
│   ├── products.js        # Product catalog
│   └── users.js           # User management
└── .env                   # Environment variables
```

## Usage

### Chatbot Features
1. **Order Tracking**: Ask about order status using order numbers (format: ORD-1234567890123-ABC12)
2. **Product Search**: Find products and check availability
3. **Returns & Exchanges**: Get help with returns and exchanges
4. **Inventory Checks**: Check product stock levels
5. **General Support**: Get help with any e-commerce questions
6. **Clear Context**: Use the clear button or Ctrl/Cmd + Shift + C to reset conversation

### Sample Interactions
- "What's the status of order ORD-1752612878560-PV5EO?"
- "Show me some wireless headphones"
- "I want to return an item"
- "Check if Neural Interface Keyboard is in stock"
- "Help me with my account"

## API Endpoints

### Chatbot
- `POST /api/chatbot/chat` - Send message to AI assistant
- `POST /api/chatbot/clear` - Clear conversation context
- `GET /api/chatbot/history/:sessionId` - Get chat history

### Orders
- `GET /api/orders` - Get all orders
- `POST /api/orders` - Create new order
- `GET /api/orders/:id` - Get specific order

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get specific product

### Users
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - User login
- `GET /api/users/:id` - Get user profile

## AI Model Information

This bot uses Groq's **Llama-3.3-70b-versatile** model, which provides:
- High-quality conversational AI
- Fast inference speeds
- Advanced reasoning capabilities
- Excellent context understanding
- Concise, helpful responses

## License

MIT License
