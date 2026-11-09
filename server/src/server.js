const dotenv = require('dotenv');
dotenv.config();

const app = require('./app');
const connectDB = require('./config/db');
const { initEmailTransporter } = require('./config/email');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // 1. Connect Database
    await connectDB();

    // 2. Initialize Email Transporter
    await initEmailTransporter();

    // 3. Start Express HTTP Server
    const server = app.listen(PORT, () => {
      console.log(`\n======================================================`);
      console.log(`🚀 PanelSync Backend Server running on port ${PORT}`);
      console.log(`   Health Check: http://localhost:${PORT}/api/health`);
      console.log(`   Environment : ${process.env.NODE_ENV || 'development'}`);
      console.log(`======================================================\n`);
    });

    // Graceful shutdown handling
    const shutdown = () => {
      console.log('[PanelSync] Gracefully terminating server...');
      server.close(() => {
        console.log('[PanelSync] HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (err) {
    console.error(`[Server Startup Failure] ${err.message}`);
    process.exit(1);
  }
};

startServer();

