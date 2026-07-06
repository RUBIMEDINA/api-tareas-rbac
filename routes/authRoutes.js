const express = require('express');
const router = express.Router();
const {
    registrar,
    login,
    obtenerPerfil,
    actualizarPerfil
} = require('../controllers/authController');
const verificarAutenticacion = require('../middleware/auth');

// Rutas públicas
router.post('/registrar', registrar);
router.post('/login', login);

// Rutas protegidas
router.get('/perfil', verificarAutenticacion, obtenerPerfil);
router.put('/perfil', verificarAutenticacion, actualizarPerfil);

module.exports = router; 