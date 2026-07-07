const mongoose = require('mongoose');

const ESTADOS_TAREA = {
    PENDIENTE: 'pendiente',
    EN_PROGRESO: 'en_progreso',
    COMPLETADA: 'completada'
};

const TaskSchema = new mongoose.Schema({
    titulo: {
        type: String,
        required: [true, 'El título es obligatorio'],
        trim: true,
        maxlength: [100, 'El título no puede tener más de 100 caracteres']
    },

    descripcion: {
        type: String,
        trim: true,
        maxlength: [500, 'La descripción no puede tener más de 500 caracteres'],
        default: ''
    },

    estado: {
        type: String,
        enum: Object.values(ESTADOS_TAREA),
        default: ESTADOS_TAREA.PENDIENTE
    },

    prioridad: {
        type: String,
        enum: ['baja', 'media', 'alta'],
        default: 'media'
    },

    fechaVencimiento: {
        type: Date,
        default: null
    },

    usuarioId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'El usuario es obligatorio']
    },

    creadoPor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'El creador es obligatorio']
    },

    asignadoPor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },

    completadaEn: {
        type: Date,
        default: null
    }

}, {
    timestamps: true
});

// ============================================
// ÍNDICES
// ============================================

TaskSchema.index({ usuarioId: 1, estado: 1 });
TaskSchema.index({ estado: 1, fechaVencimiento: 1 });

// ============================================
// MIDDLEWARE
// ============================================

TaskSchema.pre('save', function () {

    if (
        this.isModified('estado') &&
        this.estado === ESTADOS_TAREA.COMPLETADA &&
        !this.completadaEn
    ) {
        this.completadaEn = new Date();
    }

});

// ============================================
// MÉTODOS
// ============================================

TaskSchema.methods.estaVencida = function () {

    if (!this.fechaVencimiento) {
        return false;
    }

    return (
        this.fechaVencimiento < new Date() &&
        this.estado !== ESTADOS_TAREA.COMPLETADA
    );
};

// ============================================

module.exports = {
    Task: mongoose.model('Task', TaskSchema),
    ESTADOS_TAREA
}; 