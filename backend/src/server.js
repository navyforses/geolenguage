require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { WebSocketServer } = require('ws');
const http = require('http');

const logger = require('./utils/logger');
const apiRoutes = require('./api');
const DataCollector = require('./services/DataCollector');

const app = express();
const server = http.createServer(app);

// WebSocket server for real-time updates
const wss = new WebSocketServer({ server, path: '/ws' });

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: { error: 'Too many requests, please try again later' }
});
app.use('/api', limiter);

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '2.0.0'
    });
});

// API Routes
app.use('/api', apiRoutes);

// WebSocket connection handling
wss.on('connection', (ws) => {
    logger.info('New WebSocket connection established');

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            handleWebSocketMessage(ws, data);
        } catch (error) {
            ws.send(JSON.stringify({ error: 'Invalid message format' }));
        }
    });

    ws.on('close', () => {
        logger.info('WebSocket connection closed');
    });

    // Send initial connection confirmation
    ws.send(JSON.stringify({
        type: 'connected',
        message: 'Connected to Digital Oligopoly Forecast',
        timestamp: new Date().toISOString()
    }));
});

function handleWebSocketMessage(ws, data) {
    switch (data.type) {
        case 'subscribe':
            // Subscribe to platform updates
            ws.subscribedPlatforms = data.platforms || [];
            ws.send(JSON.stringify({
                type: 'subscribed',
                platforms: ws.subscribedPlatforms
            }));
            break;
        case 'ping':
            ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
            break;
        default:
            ws.send(JSON.stringify({ error: 'Unknown message type' }));
    }
}

// Broadcast to all connected clients
function broadcast(data) {
    wss.clients.forEach((client) => {
        if (client.readyState === 1) { // WebSocket.OPEN
            client.send(JSON.stringify(data));
        }
    });
}

// Make broadcast available globally for services
global.broadcast = broadcast;

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`WebSocket server available at ws://localhost:${PORT}/ws`);

    // Start data collection if in production or explicitly enabled
    if (process.env.NODE_ENV === 'production' || process.env.ENABLE_COLLECTION === 'true') {
        DataCollector.start();
        logger.info('Data collection scheduler started');
    }
});

module.exports = { app, server, wss, broadcast };
