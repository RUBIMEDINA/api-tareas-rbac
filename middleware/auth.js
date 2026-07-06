const jwt = require('jsonwebtoken');
const { User } = require('../models/user');

/**
 * Middleware de Autenticación
 * Verifica que el token JWT sea válido y el usuario exista
 */
const verificarAutenticacion = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No hay token de autenticación. Por favor, inicia sesión.',
                code: 'NO_TOKEN'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no encontrado',
                code: 'USER_NOT_FOUND'
            });
        }

        if (!user.activo) {
            return res.status(403).json({
                success: false,
                message: 'Usuario inactivo. Contacta al administrador.',
                code: 'USER_INACTIVE'
            });
        }

        req.user = user;
        next();
        
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Token inválido',
                code: 'INVALID_TOKEN'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expirado. Inicia sesión nuevamente.',
                code: 'TOKEN_EXPIRED'
            });
        }

        console.error('Error en autenticación:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno en autenticación',
            code: 'AUTH_ERROR'
        });
    }
};

module.exports = verificarAutenticacion; 