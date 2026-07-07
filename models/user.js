const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ============================================
// ROLES
// ============================================

const ROLES = {
    ADMIN: 'Admin',
    SUPERVISOR: 'Supervisor',
    OPERADOR: 'Operador'
};

// ============================================
// PERMISOS
// ============================================

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

// ============================================
// ESQUEMA
// ============================================

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
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
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

// ============================================
// ENCRIPTAR PASSWORD
// ============================================

UserSchema.pre('save', async function () {

    if (!this.isModified('password')) {
        return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);

});

// ============================================
// MÉTODOS
// ============================================

UserSchema.methods.compararPassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

UserSchema.methods.actualizarAcceso = async function () {
    this.ultimoAcceso = new Date();
    return await this.save();
};

// ============================================
// ROLES
// ============================================

UserSchema.methods.esAdmin = function () {
    return this.rol === ROLES.ADMIN;
};

UserSchema.methods.esSupervisor = function () {
    return (
        this.rol === ROLES.SUPERVISOR ||
        this.rol === ROLES.ADMIN
    );
};

UserSchema.methods.esOperador = function () {
    return this.rol === ROLES.OPERADOR;
};

UserSchema.methods.tienePermiso = function (permiso) {
    const permisos = PERMISOS_POR_ROL[this.rol];
    return permisos && permisos[permiso] === true;
};

UserSchema.methods.obtenerPermisos = function () {
    return PERMISOS_POR_ROL[this.rol];
};

// ============================================
// OBTENER ID DE USUARIO (FUNCIONA CON POPULATE)
// ============================================

function obtenerIdUsuario(usuarioId) {

    if (!usuarioId) return null;

    if (usuarioId._id) {
        return usuarioId._id.toString();
    }

    return usuarioId.toString();
}

// ============================================
// PERMISOS SOBRE TAREAS
// ============================================

UserSchema.methods.puedeAccederATarea = function (task) {

    if (this.esAdmin() || this.esSupervisor()) {
        return true;
    }

    return obtenerIdUsuario(task.usuarioId) === this._id.toString();
};

UserSchema.methods.puedeModificarTarea = function (task) {

    if (this.esAdmin() || this.esSupervisor()) {
        return true;
    }

    return obtenerIdUsuario(task.usuarioId) === this._id.toString();
};

UserSchema.methods.puedeEliminarTarea = function () {
    return this.esAdmin();
};

UserSchema.methods.puedeVerEstadisticas = function () {
    return this.esAdmin() || this.esSupervisor();
};

// ============================================
// TO JSON
// ============================================

UserSchema.set('toJSON', {
    transform: function (doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
    }
});

module.exports = {
    User: mongoose.model('User', UserSchema),
    ROLES,
    PERMISOS_POR_ROL
}; 