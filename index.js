const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const helmet = require('helmet');

// Cargar variables de entorno
dotenv.config();

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const userRoutes = require('./routes/userRoutes');

// Importar middleware de errores
const errorHandler = require('./middleware/errorHandler');

// Importar middleware de token de aplicación
const validarAppToken = require('./middleware/appTokenValidator');

// Importar modelos y constantes
const { User, ROLES } = require('./models/user');

// Importar generador de token para mostrar
const { generarAppToken } = require('./utils/appToken');

const app = express();
const PORT = process.env.PORT || 5100;

// ============================================
// MIDDLEWARE DE TOKEN DE APLICACIÓN
// (Se aplica a TODAS las rutas EXCEPTO las públicas)
// ============================================

// Definir rutas públicas que NO requieren app-token
const RUTAS_PUBLICAS = ['/health', '/api/app-token'];

// Middleware que excluye rutas públicas
app.use((req, res, next) => {
    // Si la ruta está en la lista de públicas, saltar validación
    if (RUTAS_PUBLICAS.includes(req.path)) {
        return next();
    }
    // Si no, validar app-token
    validarAppToken(req, res, next);
});

// Middlewares generales
app.use(helmet());
app.use(express.json());

// ============================================
// RUTA PÚBLICA PARA OBTENER EL TOKEN DE APLICACIÓN
// ============================================
app.get('/api/app-token', (req, res) => {
    res.json({
        success: true,
        message: 'Token de aplicación generado',
        data: {
            token: generarAppToken(),
            usage: 'Usa este token en el header "app-token" para todas las peticiones'
        }
    });
});

// Rutas protegidas (requieren app-token)
app.use('/api/auth', authRoutes);
app.use('/api/tareas', taskRoutes);
app.use('/api/usuarios', userRoutes);

// Ruta de health check (pública, sin token)
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        mongo: mongoose.connection.readyState === 1 ? '✅ connected' : '❌ disconnected'
    });
});

// Ruta raíz
app.get('/', (req, res) => {
    res.send('🚀 API RBAC de Tareas Corporativas');
});

// Middleware de errores (debe ir al final)
app.use(errorHandler);

// ============================================
// CONEXIÓN A MONGODB
// ============================================
async function connectToMongo() {
    try {
        const mongoURI = process.env.MONGO_URI;
        
        if (!mongoURI) {
            console.error('❌ MONGO_URI no definida en .env');
            process.exit(1);
        }

        console.log('🔄 Conectando a MongoDB Atlas...');
        
        await mongoose.connect(mongoURI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        
        console.log('✅ Conectado a MongoDB Atlas');
        console.log(`📊 Base de datos: ${mongoose.connection.db.databaseName}`);
        
    } catch (error) {
        console.error('❌ Error de conexión:', error.message);
        
        if (error.message.includes('ENOTFOUND')) {
            console.log('\n💡 Verifica:');
            console.log('1. Tu conexión a internet');
            console.log('2. URI de MongoDB correcta en .env');
            console.log('3. Tu IP en Network Access de Atlas');
        } else if (error.message.includes('Authentication failed')) {
            console.log('\n💡 Verifica:');
            console.log('1. Usuario y contraseña correctos');
            console.log('2. El usuario existe en MongoDB Atlas');
        }
        
        process.exit(1);
    }
}

// ============================================
// CREAR ADMIN POR DEFECTO
// ============================================
async function crearAdminPorDefecto() {
    try {
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@empresa.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
        
        const adminExistente = await User.findOne({ email: adminEmail });
        
        if (!adminExistente) {
            console.log('🔧 Creando usuario Admin por defecto...');
            
            const admin = new User({
                nombre: 'Administrador',
                email: adminEmail,
                password: adminPassword,
                rol: ROLES.ADMIN,
                activo: true
            });
            
            await admin.save();
            console.log('✅ Admin creado exitosamente');
            console.log(`   📧 Email: ${adminEmail}`);
            console.log(`   🔑 Password: ${adminPassword}`);
            console.log('   ⚠️  Cambia estas credenciales en producción');
        } else {
            console.log('✅ Admin ya existe');
        }
        
    } catch (error) {
        console.error('❌ Error creando Admin:', error.message);
    }
}

// ============================================
// INICIAR SERVIDOR
// ============================================
app.listen(PORT, async () => {
    console.log(`\n🚀 Servidor RBAC corriendo en el puerto ${PORT}`);
    console.log(`📡 http://localhost:${PORT}`);
    console.log(`🔗 Health Check: http://localhost:${PORT}/health\n`);
    
    await connectToMongo();
    await crearAdminPorDefecto();
    
    console.log('\n✅ Sistema listo para usar');
    console.log('📋 Endpoints disponibles:');
    console.log('   📌 RUTAS PÚBLICAS (sin app-token):');
    console.log('   GET    /health                  - Health Check');
    console.log('   GET    /api/app-token           - Obtener token de aplicación');
    console.log('   📌 RUTAS PROTEGIDAS (requieren app-token):');
    console.log('   POST   /api/auth/registrar     - Registrar usuario');
    console.log('   POST   /api/auth/login         - Iniciar sesión');
    console.log('   GET    /api/auth/perfil        - Obtener perfil');
    console.log('   CRUD   /api/tareas             - Gestionar tareas');
    console.log('   CRUD   /api/usuarios           - Gestionar usuarios (Admin)\n');
}); 