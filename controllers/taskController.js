const { Task, ESTADOS_TAREA } = require('../models/task');
const { User, ROLES } = require('../models/user');

// @desc    Crear tarea
// @route   POST /api/tareas
// @access  Private (Admin, Supervisor, Operador)
const crearTarea = async (req, res) => {
    try {
        const { titulo, descripcion, estado, prioridad, fechaVencimiento, usuarioId } = req.body;

        let usuarioAsignado = req.user._id;
        if (req.user.rol === ROLES.ADMIN || req.user.rol === ROLES.SUPERVISOR) {
            usuarioAsignado = usuarioId || req.user._id;
        }

        const task = await Task.create({
            titulo,
            descripcion: descripcion || '',
            estado: estado || ESTADOS_TAREA.PENDIENTE,
            prioridad: prioridad || 'media',
            fechaVencimiento: fechaVencimiento || null,
            usuarioId: usuarioAsignado,
            creadoPor: req.user._id,
            asignadoPor: req.user._id
        });

        await task.populate('usuarioId', 'nombre email');

        res.status(201).json({
            success: true,
            message: 'Tarea creada exitosamente',
            data: task
        });

    } catch (error) {
        console.error('Error creando tarea:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear tarea',
            code: 'CREATE_TASK_ERROR'
        });
    }
};

// @desc    Obtener todas las tareas
// @route   GET /api/tareas
// @access  Private (Admin: todas, Supervisor: todas, Operador: solo sus tareas)
const obtenerTareas = async (req, res) => {
    try {
        const { estado, prioridad, page = 1, limit = 10 } = req.query;
        
        const filtro = {};
        
        if (req.user.rol === ROLES.OPERADOR) {
            filtro.usuarioId = req.user._id;
        }
        
        if (estado) filtro.estado = estado;
        if (prioridad) filtro.prioridad = prioridad;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const [tasks, total] = await Promise.all([
            Task.find(filtro)
                .populate('usuarioId', 'nombre email')
                .populate('creadoPor', 'nombre')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Task.countDocuments(filtro)
        ]);

        res.json({
            success: true,
            data: {
                tasks,
                paginacion: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / parseInt(limit))
                }
            }
        });

    } catch (error) {
        console.error('Error obteniendo tareas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener tareas',
            code: 'GET_TASKS_ERROR'
        });
    }
};

// @desc    Obtener una tarea por ID
// @route   GET /api/tareas/:id
// @access  Private (Admin, Supervisor, Operador dueño)
const obtenerTareaPorId = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id)
            .populate('usuarioId', 'nombre email')
            .populate('creadoPor', 'nombre email')
            .populate('asignadoPor', 'nombre email');

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Tarea no encontrada',
                code: 'TASK_NOT_FOUND'
            });
        }

        if (!req.user.puedeAccederATarea(task)) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para ver esta tarea',
                code: 'FORBIDDEN'
            });
        }

        res.json({
            success: true,
            data: task
        });

    } catch (error) {
        console.error('Error obteniendo tarea:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener tarea',
            code: 'GET_TASK_ERROR'
        });
    }
};

// @desc    Actualizar tarea
// @route   PUT /api/tareas/:id
// @access  Private (Admin, Supervisor, Operador dueño)
const actualizarTarea = async (req, res) => {
    try {
        const { titulo, descripcion, estado, prioridad, fechaVencimiento, usuarioId } = req.body;
        
        let task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Tarea no encontrada',
                code: 'TASK_NOT_FOUND'
            });
        }

        if (!req.user.puedeModificarTarea(task)) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para modificar esta tarea',
                code: 'FORBIDDEN'
            });
        }

        // Solo Admin y Supervisor pueden reasignar
        if (usuarioId && (req.user.rol === ROLES.ADMIN || req.user.rol === ROLES.SUPERVISOR)) {
            task.usuarioId = usuarioId;
            task.asignadoPor = req.user._id;
        }

        if (titulo) task.titulo = titulo;
        if (descripcion !== undefined) task.descripcion = descripcion;
        if (estado) {
            task.estado = estado;
            if (estado === ESTADOS_TAREA.COMPLETADA) {
                task.completadaEn = new Date();
            }
        }
        if (prioridad) task.prioridad = prioridad;
        if (fechaVencimiento !== undefined) task.fechaVencimiento = fechaVencimiento;

        await task.save();
        await task.populate('usuarioId', 'nombre email');

        res.json({
            success: true,
            message: 'Tarea actualizada exitosamente',
            data: task
        });

    } catch (error) {
        console.error('Error actualizando tarea:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar tarea',
            code: 'UPDATE_TASK_ERROR'
        });
    }
};

// @desc    Eliminar tarea
// @route   DELETE /api/tareas/:id
// @access  Private (Admin, Supervisor)
const eliminarTarea = async (req, res) => {
    try {
        if (req.user.rol === ROLES.OPERADOR) {
            return res.status(403).json({
                success: false,
                message: 'Los Operadores no pueden eliminar tareas',
                code: 'FORBIDDEN'
            });
        }

        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Tarea no encontrada',
                code: 'TASK_NOT_FOUND'
            });
        }

        await task.deleteOne();

        res.json({
            success: true,
            message: 'Tarea eliminada exitosamente'
        });

    } catch (error) {
        console.error('Error eliminando tarea:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar tarea',
            code: 'DELETE_TASK_ERROR'
        });
    }
};

// @desc    Obtener estadísticas de tareas
// @route   GET /api/tareas/estadisticas
// @access  Private (Admin, Supervisor)
const obtenerEstadisticas = async (req, res) => {
    try {
        if (req.user.rol === ROLES.OPERADOR) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para ver estadísticas',
                code: 'FORBIDDEN'
            });
        }

        const filtro = {};
        
        const [total, pendientes, enProgreso, completadas] = await Promise.all([
            Task.countDocuments(filtro),
            Task.countDocuments({ ...filtro, estado: ESTADOS_TAREA.PENDIENTE }),
            Task.countDocuments({ ...filtro, estado: ESTADOS_TAREA.EN_PROGRESO }),
            Task.countDocuments({ ...filtro, estado: ESTADOS_TAREA.COMPLETADA })
        ]);

        res.json({
            success: true,
            data: {
                total,
                pendientes,
                enProgreso,
                completadas,
                tasaCompletado: total > 0 ? Math.round((completadas / total) * 100) : 0
            }
        });

    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas',
            code: 'STATS_ERROR'
        });
    }
};

module.exports = {
    crearTarea,
    obtenerTareas,
    obtenerTareaPorId,
    actualizarTarea,
    eliminarTarea,
    obtenerEstadisticas
}; 