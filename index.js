const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5100;

// Middleware
app.use(express.json());

// Ruta principal
app.get('/', (req, res) => {
    res.send('Hello World! - RBAC API');
});

// Health check
app.get('/health', (req, res) => {
    const dbState = mongoose.connection.readyState;
    const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
    };
    res.json({
        status: 'OK',
        server: 'running',
        port: PORT,
        mongo: states[dbState] || 'unknown',
        mongoHost: mongoose.connection.host || 'not connected'
    });
});

console.log('🔍 ===== CONFIGURACIÓN =====');
console.log(`📌 Puerto: ${PORT}`);
console.log(`📌 MONGO_URI: ${process.env.MONGO_URI ? '✅ Definida' : '❌ No definida'}`);
console.log(`📌 JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Definida' : '❌ No definida'}`);

// ============================================
// CONEXIÓN A MONGODB
// ============================================
console.log('\n🔄 Conectando a MongoDB Atlas...');

mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
})
.then(() => {
    console.log('✅ ===== CONEXIÓN EXITOSA =====');
    console.log(`📊 Base de datos: ${mongoose.connection.db.databaseName}`);
    console.log(`📊 Host: ${mongoose.connection.host}`);
    console.log(`📊 Puerto: ${mongoose.connection.port}`);
    console.log(`📊 Estado: Conectado (${mongoose.connection.readyState})`);
})
.catch(err => {
    console.error('❌ ===== ERROR DE CONEXIÓN =====');
    console.error(`📌 Mensaje: ${err.message}`);
    console.log('\n💡 Verifica:');
    console.log('1. Tu IP está en la lista blanca de Atlas');
    console.log('2. El usuario y contraseña son correctos');
    console.log('3. La URI es correcta');
});

// ============================================
// INICIAR SERVIDOR
// ============================================
app.listen(PORT, () => {
    console.log(`\n🚀 ===== SERVIDOR ACTIVO =====`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`📋 Health Check: http://localhost:${PORT}/health`);
    console.log('===============================\n');
}); 