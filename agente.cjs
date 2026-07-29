const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('¡Ajá mi llave! Escanea este código QR gigante con tu celular:');
});

client.on('ready', () => {
    console.log('¡BOT RECONECTADO Y CAMELLANDO EN VIVO, NO JODA! 🤖💼');
});

client.on('message', async (msg) => {
    const saludo = msg.body.toLowerCase();
    if (saludo.includes('hola') || saludo.includes('buenas')) {
        client.sendMessage(msg.from, '¡Ajá mi llave! Bienvenido al centro de control del Quinientazo y los Bolis VIP. 🎰\n\n¿En qué te colaboramos el día de hoy, cuadro? Estamos listos para facturar.');
    }
});

client.on('auth_failure', () => {
    console.log('Error de conexión. Vamos a reiniciarlo, cuadro.');
});

client.initialize();

