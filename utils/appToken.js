const jwt = require('jsonwebtoken');

// Clave secreta para el token de aplicación (debe ser diferente a JWT_SECRET)
const APP_TOKEN_SECRET = process.env.APP_TOKEN_SECRET || 'app_token_secret_super_seguro_2026';

/**
 * Genera un token de aplicación fijo
 * Este token será usado por los clientes para autenticarse en la API
 */
const generarAppToken = () => {
    const payload = {
        type: 'app_token',
        name: 'API Tareas RBAC',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    };

    return jwt.sign(payload, APP_TOKEN_SECRET, {
        expiresIn: '365d' // Token válido por 1 año
    });
};

/**
 * Verifica si el token de aplicación es válido
 * @param {string} token - Token a validar
 * @returns {boolean} true si es válido, false si no
 */
const verificarAppToken = (token) => {
    try {
        const decoded = jwt.verify(token, APP_TOKEN_SECRET);
        return decoded.type === 'app_token';
    } catch (error) {
        return false;
    }
};

// Generar y mostrar el token al inicio (para obtenerlo fácilmente)
console.log('🔑 ===== TOKEN DE APLICACIÓN =====');
console.log(`📌 TOKEN: ${generarAppToken()}`);
console.log('===================================');

module.exports = {
    generarAppToken,
    verificarAppToken,
    APP_TOKEN_SECRET
}; 