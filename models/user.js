const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Definición de roles como constantes
const ROLES = {
    ADMIN: 'Admin',
    SUPERVISOR: 'Supervisor',
    OPERADOR: 'Operador'
};

// Configuración de permisos por rol
const PERMISOS_POR_ROL = {
    [ROLES.ADMIN]: {
        puedeCrear: true,
        puedeLeer: true,
        puedeLeerTodas: true,
        puedeActualizar: true,
        puedeActualizarTodas: true,
        puedeEliminar: true,
        puedeEliminarTodas: true,
        puedeGestionarUsuarios: true,
        nivel: 1
    },
    [ROLES.SUPERVISOR]: {
        puedeCrear: true,
        puedeLeer: true,
        puedeLeerTodas: true,
        puedeActualizar: true,
        puedeActualizarTodas: true,
        puedeEliminar: false,
        puedeEliminarTodas: false,
        puedeGestionarUsuarios: false,
        nivel: 2
    },
    [ROLES.OPERADOR]: {
        puedeCrear: true,
        puedeLeer: true,
        puedeLeerTodas: false,
        puedeActualizar: true,
        puedeActualizarTodas: false,
        puedeEliminar: false,
        puedeEliminarTodas: false,
        puedeGestionarUsuarios: false,
        nivel: 3
    }
};

const UserSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre es obligatorio'],
        trim: true,
        maxlength: [50, 'El nombre no puede tener más de 50 caracteres']
    },
    email: {
        type: String,
        required: [true, 'El email es obligatorio'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Email inválido'
        ]
    },
    password: {
        type: String,
        required: [true, 'La contraseña es obligatoria'],
        minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
        select: false
    },
    rol: {
        type: String,
        enum: Object.values(ROLES),
        default: ROLES.OPERADOR
    },
    activo: {
        type: Boolean,
        default: true
    },
    fechaRegistro: {
        type: Date,
        default: Date.now
    },
    ultimoAcceso: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Middleware: Hashear contraseña antes de guardar
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// ============================================
// MÉTODOS DE AUTENTICACIÓN
// ============================================

// Método: Comparar contraseñas
UserSchema.methods.compararPassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

// Método: Actualizar último acceso
UserSchema.methods.actualizarAcceso = function() {
    this.ultimoAcceso = new Date();
    return this.save();
};

// ============================================
// MÉTODOS DE VERIFICACIÓN DE ROLES
// ============================================

// Método: Verificar si es Admin
UserSchema.methods.esAdmin = function() {
    return this.rol === ROLES.ADMIN;
};

// Método: Verificar si es Supervisor o Admin
UserSchema.methods.esSupervisor = function() {
    return this.rol === ROLES.SUPERVISOR || this.rol === ROLES.ADMIN;
};

// Método: Verificar si es Operador
UserSchema.methods.esOperador = function() {
    return this.rol === ROLES.OPERADOR;
};

// Método: Verificar si tiene un permiso específico
UserSchema.methods.tienePermiso = function(permiso) {
    const permisos = PERMISOS_POR_ROL[this.rol];
    return permisos && permisos[permiso] === true;
};

// Método: Obtener todos los permisos del usuario
UserSchema.methods.obtenerPermisos = function() {
    return PERMISOS_POR_ROL[this.rol] || {};
};

// ============================================
// MÉTODOS DE VERIFICACIÓN DE TAREAS (RBAC)
// ============================================

// Método: Verificar si puede acceder a una tarea específica
UserSchema.methods.puedeAccederATarea = function(task) {
    // Admin y Supervisor pueden acceder a todas
    if (this.esAdmin() || this.esSupervisor()) {
        return true;
    }
    
    // Operador solo puede acceder a sus propias tareas
    return task.usuarioId.toString() === this._id.toString();
};

// Método: Verificar si puede modificar una tarea específica
UserSchema.methods.puedeModificarTarea = function(task) {
    // Admin puede modificar todas
    if (this.esAdmin()) {
        return true;
    }
    
    // Supervisor puede modificar todas
    if (this.esSupervisor()) {
        return true;
    }
    
    // Operador solo puede modificar sus propias tareas
    return task.usuarioId.toString() === this._id.toString();
};

// Método: Verificar si puede eliminar una tarea
UserSchema.methods.puedeEliminarTarea = function() {
    // Solo Admin y Supervisor pueden eliminar
    return this.esAdmin() || this.esSupervisor();
};

// Método: Verificar si puede ver estadísticas
UserSchema.methods.puedeVerEstadisticas = function() {
    // Solo Admin y Supervisor pueden ver estadísticas
    return this.esAdmin() || this.esSupervisor();
};

// Ocultar password en respuestas JSON
UserSchema.set('toJSON', {
    transform: function(doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
    }
});

// Exportar modelo y constantes
module.exports = {
    User: mongoose.model('User', UserSchema),
    ROLES,
    PERMISOS_POR_ROL
}; 