const dns = require('dns');
const mongoose = require('mongoose');

console.log('🔍 ===== DIAGNÓSTICO DE CONEXIÓN =====\n');

// 1. Probar resolución DNS
console.log('1. Probando resolución DNS...');
dns.resolve('proyecto-api.ba9mwci.mongodb.net', (err, addresses) => {
    if (err) {
        console.log('❌ Error DNS:', err.message);
        console.log('💡 Probando con nslookup...');
    } else {
        console.log('✅ IPs encontradas:', addresses);
    }
});

// 2. Probar resolución SRV
console.log('\n2. Probando resolución SRV...');
dns.resolveSrv('_mongodb._tcp.proyecto-api.ba9mwci.mongodb.net', (err, addresses) => {
    if (err) {
        console.log('❌ Error SRV:', err.message);
    } else {
        console.log('✅ SRV encontrado:', addresses);
    }
});

// 3. Probar conexión directa con URI estándar
console.log('\n3. Probando conexión estándar...');
const testURI = 'mongodb+srv://rubi:rubi112@proyecto-api.ba9mwci.mongodb.net/?retryWrites=true&w=majority';

mongoose.connect(testURI, {
    serverSelectionTimeoutMS: 5000,
})
.then(() => {
    console.log('✅ ¡Conexión exitosa con URI estándar!');
    console.log('📊 Base de datos:', mongoose.connection.db.databaseName);
    mongoose.connection.close();
})
.catch(err => {
    console.log('❌ Error con URI estándar:', err.message);
    console.log('\n💡 RECOMENDACIÓN:');
    console.log('Usa MongoDB Compass para conectarte y obtener la URI correcta.');
    console.log('Luego copia esa URI a tu archivo .env');
});

console.log('\n🔍 ===== FIN DEL DIAGNÓSTICO ====='); 