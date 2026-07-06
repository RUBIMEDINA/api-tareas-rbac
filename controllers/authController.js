const jwt = require('jsonwebtoken');
const { User, ROLES } = require('../models/user');

// Generar JWT
const generarToken = (user) => {
    return jwt.sign(
        { 
            id: user._id, 
            email: user.email, 
            rol: user.rol 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

// @desc    Registrar usuario
// @route   POST /api/auth/registrar
// @access  Public
const registrar = async (req, res) => {
    try {
        const { nombre, email, password, rol } = req.body;

        const userExistente = await User.findOne({ email });
        if (userExistente) {
            return res.status(400).json({
                success: false,
                message: 'El email ya está registrado',
                code: 'EMAIL_EXISTS'
            });
        }

        const user = await User.create({
            nombre,
            email,
            password,
            rol: rol || ROLES.OPERADOR
        });

        const token = generarToken(user);

        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            data: {
                user,
                token
            }
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({
            success: false,
            message: 'Error al registrar usuario',
            code: 'REGISTER_ERROR'
        });
    }
};

// @desc    Iniciar sesión
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email y contraseña son obligatorios',
                code: 'MISSING_FIELDS'
            });
        }

        const user = await User.findOne({ email }).select('+password');
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas',
                code: 'INVALID_CREDENTIALS'
            });
        }

        const esValida = await user.compararPassword(password);
        
        if (!esValida) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas',
                code: 'INVALID_CREDENTIALS'
            });
        }

        if (!user.activo) {
            return res.status(403).json({
                success: false,
                message: 'Usuario inactivo. Contacta al administrador',
                code: 'USER_INACTIVE'
            });
        }

        await user.actualizarAcceso();

        const token = generarToken(user);

        const userResponse = user.toObject();
        delete userResponse.password;

        res.json({
            success: true,
            message: 'Login exitoso',
            data: {
                user: userResponse,
                token
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error al iniciar sesión',
            code: 'LOGIN_ERROR'
        });
    }
};

// @desc    Obtener perfil del usuario autenticado
// @route   GET /api/auth/perfil
// @access  Private
const obtenerPerfil = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        
        res.json({
            success: true,
            data: user
        });

    } catch (error) {
        console.error('Error obteniendo perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener perfil',
            code: 'PROFILE_ERROR'
        });
    }
};

// @desc    Actualizar perfil
// @route   PUT /api/auth/perfil
// @access  Private
const actualizarPerfil = async (req, res) => {
    try {
        const { nombre, password } = req.body;
        const user = await User.findById(req.user._id);

        if (nombre) user.nombre = nombre;
        if (password) user.password = password;

        await user.save();

        res.json({
            success: true,
            message: 'Perfil actualizado exitosamente',
            data: user
        });

    } catch (error) {
        console.error('Error actualizando perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar perfil',
            code: 'UPDATE_PROFILE_ERROR'
        });
    }
};

module.exports = {
    registrar,
    login,
    obtenerPerfil,
    actualizarPerfil
}; 