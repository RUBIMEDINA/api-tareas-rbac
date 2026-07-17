const { verificarAppToken } = require('../utils/appToken');

/**
 * Middleware para validar el token de aplicación
 * El token debe enviarse en el header 'app-token'
 */
const validarAppToken = (req, res, next) => {
    // Obtener token del header 'app-token'
    const appToken = req.headers['app-token'];

    // Verificar si el token existe
    if (!appToken) {
        return res.status(401).json({
            success: false,
            message: 'Token de aplicación requerido',
            code: 'APP_TOKEN_REQUIRED',
            error: 'El header "app-token" es obligatorio para acceder a la API'
        });
    }

    // Verificar si el token es válido
    if (!verificarAppToken(appToken)) {
        return res.status(401).json({
            success: false,
            message: 'Token de aplicación inválido',
            code: 'APP_TOKEN_INVALID',
            error: 'El token de aplicación no es válido o ha expirado'
        });
    }

    // Token válido, continuar
    next();
};

module.exports = validarAppToken; 