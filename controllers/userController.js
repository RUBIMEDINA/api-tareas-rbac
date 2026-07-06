const { User, ROLES } = require('../models/user');

// @desc    Obtener todos los usuarios
// @route   GET /api/usuarios
// @access  Private (Admin)
const obtenerUsuarios = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [users, total] = await Promise.all([
            User.find({})
                .select('-password')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            User.countDocuments()
        ]);

        res.json({
            success: true,
            data: {
                users,
                paginacion: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / parseInt(limit))
                }
            }
        });

    } catch (error) {
        console.error('Error obteniendo usuarios:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener usuarios',
            code: 'GET_USERS_ERROR'
        });
    }
};

// @desc    Obtener usuario por ID
// @route   GET /api/usuarios/:id
// @access  Private (Admin)
const obtenerUsuarioPorId = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado',
                code: 'USER_NOT_FOUND'
            });
        }

        res.json({
            success: true,
            data: user
        });

    } catch (error) {
        console.error('Error obteniendo usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener usuario',
            code: 'GET_USER_ERROR'
        });
    }
};

// @desc    Actualizar usuario
// @route   PUT /api/usuarios/:id
// @access  Private (Admin)
const actualizarUsuario = async (req, res) => {
    try {
        const { nombre, email, activo } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado',
                code: 'USER_NOT_FOUND'
            });
        }

        if (nombre) user.nombre = nombre;
        if (email) user.email = email;
        if (activo !== undefined) user.activo = activo;

        await user.save();

        res.json({
            success: true,
            message: 'Usuario actualizado exitosamente',
            data: user
        });

    } catch (error) {
        console.error('Error actualizando usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar usuario',
            code: 'UPDATE_USER_ERROR'
        });
    }
};

// @desc    Eliminar usuario
// @route   DELETE /api/usuarios/:id
// @access  Private (Admin)
const eliminarUsuario = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado',
                code: 'USER_NOT_FOUND'
            });
        }

        // No permitir eliminar a sí mismo
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'No puedes eliminarte a ti mismo',
                code: 'CANNOT_DELETE_SELF'
            });
        }

        await user.deleteOne();

        res.json({
            success: true,
            message: 'Usuario eliminado exitosamente'
        });

    } catch (error) {
        console.error('Error eliminando usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar usuario',
            code: 'DELETE_USER_ERROR'
        });
    }
};

// @desc    Cambiar rol de usuario
// @route   PATCH /api/usuarios/:id/rol
// @access  Private (Admin)
const cambiarRol = async (req, res) => {
    try {
        const { rol } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado',
                code: 'USER_NOT_FOUND'
            });
        }

        // No permitir cambiar el rol de sí mismo
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'No puedes cambiar tu propio rol',
                code: 'CANNOT_CHANGE_OWN_ROLE'
            });
        }

        // Validar rol
        if (!Object.values(ROLES).includes(rol)) {
            return res.status(400).json({
                success: false,
                message: `Rol inválido. Roles permitidos: ${Object.values(ROLES).join(', ')}`,
                code: 'INVALID_ROLE'
            });
        }

        user.rol = rol;
        await user.save();

        res.json({
            success: true,
            message: `Rol cambiado a ${rol} exitosamente`,
            data: user
        });

    } catch (error) {
        console.error('Error cambiando rol:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cambiar rol',
            code: 'CHANGE_ROLE_ERROR'
        });
    }
};

module.exports = {
    obtenerUsuarios,
    obtenerUsuarioPorId,
    actualizarUsuario,
    eliminarUsuario,
    cambiarRol
};