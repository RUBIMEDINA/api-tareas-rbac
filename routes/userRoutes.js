const express = require('express');
const router = express.Router();
const {
    obtenerUsuarios,
    obtenerUsuarioPorId,
    actualizarUsuario,
    eliminarUsuario,
    cambiarRol
} = require('../controllers/userController');
const verificarAutenticacion = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { ROLES } = require('../models/user');

// Todas las rutas requieren autenticación
router.use(verificarAutenticacion);

// Solo Admin puede gestionar usuarios
router.route('/')
    .get(authorize([ROLES.ADMIN]), obtenerUsuarios);

router.route('/:id')
    .get(authorize([ROLES.ADMIN]), obtenerUsuarioPorId)
    .put(authorize([ROLES.ADMIN]), actualizarUsuario)
    .delete(authorize([ROLES.ADMIN]), eliminarUsuario);

// Cambiar rol de usuario (Admin)
router.patch('/:id/rol', authorize([ROLES.ADMIN]), cambiarRol);

module.exports = router; 