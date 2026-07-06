const { ROLES } = require('../models/user');

/**
 * Middleware de Autorización por Roles
 * Verifica que el usuario tenga un rol permitido
 */
const authorize = (rolesPermitidos = []) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'No autenticado',
                    code: 'UNAUTHORIZED'
                });
            }

            const { rol } = req.user;

            if (rolesPermitidos.length === 0) {
                return next();
            }

            if (!rolesPermitidos.includes(rol)) {
                return res.status(403).json({
                    success: false,
                    message: `Acceso denegado. Roles permitidos: ${rolesPermitidos.join(', ')}`,
                    code: 'FORBIDDEN',
                    requiredRoles: rolesPermitidos,
                    userRole: rol
                });
            }

            next();
            
        } catch (error) {
            console.error('Error en autorización:', error);
            return res.status(500).json({
                success: false,
                message: 'Error interno en autorización',
                code: 'AUTHZ_ERROR'
            });
        }
    };
};

/**
 * Middleware de Propiedad (Protección IDOR)
 * Verifica que el usuario pueda acceder al recurso
 */
const verificarPropiedad = (modelo, campoUsuario = 'usuarioId') => {
    return async (req, res, next) => {
        try {
            const { id } = req.params;
            
            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'ID del recurso requerido',
                    code: 'MISSING_ID'
                });
            }

            const recurso = await modelo.findById(id);
            
            if (!recurso) {
                return res.status(404).json({
                    success: false,
                    message: 'Recurso no encontrado',
                    code: 'RESOURCE_NOT_FOUND'
                });
            }

            // Usar el método del usuario para verificar acceso
            if (!req.user.puedeAccederATarea(recurso)) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permiso para acceder a este recurso',
                    code: 'IDOR_ATTEMPT'
                });
            }

            req.recurso = recurso;
            next();
            
        } catch (error) {
            console.error('Error verificando propiedad:', error);
            return res.status(500).json({
                success: false,
                message: 'Error interno verificando propiedad',
                code: 'PROPERTY_ERROR'
            });
        }
    };
};

module.exports = { authorize, verificarPropiedad }; 