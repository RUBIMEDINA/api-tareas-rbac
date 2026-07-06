const express = require('express');
const router = express.Router();
const {
    crearTarea,
    obtenerTareas,
    obtenerTareaPorId,
    actualizarTarea,
    eliminarTarea,
    obtenerEstadisticas
} = require('../controllers/taskController');
const verificarAutenticacion = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { ROLES } = require('../models/user');

// Todas las rutas requieren autenticación
router.use(verificarAutenticacion);

// Rutas de estadísticas (Admin y Supervisor)
router.get('/estadisticas', authorize([ROLES.ADMIN, ROLES.SUPERVISOR]), obtenerEstadisticas);

// Rutas CRUD principales
router.route('/')
    .post(crearTarea) // Admin, Supervisor, Operador
    .get(obtenerTareas); // Admin, Supervisor, Operador (con filtros)

router.route('/:id')
    .get(obtenerTareaPorId) // Admin, Supervisor, Operador dueño
    .put(actualizarTarea) // Admin, Supervisor, Operador dueño
    .delete(authorize([ROLES.ADMIN, ROLES.SUPERVISOR]), eliminarTarea); // Solo Admin y Supervisor

module.exports = router; 