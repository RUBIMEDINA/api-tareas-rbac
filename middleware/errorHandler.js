/**
 * Middleware de manejo de errores global
 */
const errorHandler = (err, req, res, next) => {
    console.error('❌ Error:', err);

    // Error de validación de Mongoose
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({
            success: false,
            message: 'Error de validación',
            errors,
            code: 'VALIDATION_ERROR'
        });
    }

    // Error de duplicado (índice único)
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        return res.status(400).json({
            success: false,
            message: `El campo ${field} ya está registrado`,
            code: 'DUPLICATE_ERROR'
        });
    }

    // Error de cast (ID inválido)
    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: 'ID inválido',
            code: 'INVALID_ID'
        });
    }

    // Error por defecto
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Error interno del servidor';

    res.status(statusCode).json({
        success: false,
        message,
        code: err.code || 'INTERNAL_ERROR'
    });
};

module.exports = errorHandler; 