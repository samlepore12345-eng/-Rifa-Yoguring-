const express = require('express');
const fs = require('fs');

const app = express();
const PORT = 3000;

let CONOCIMIENTO = {};
try {
  CONOCIMIENTO = JSON.parse(fs.readFileSync('./base_conocimiento.json', 'utf8'));
} catch (e) {
  console.log('⚠️ base_conocimiento.json no encontrado');
}

const CATALOGO = CONOCIMIENTO.productos || {};
const userState = {};

function getOrCreateUserState(userId) {
  if (!userState[userId]) userState[userId] = {step:'START',producto:null,cantidad_paquetes:null,nombre:null,telefono:null,direccion:null,metodo_pago:null,total:0};
  return userState[userId];
}

app.use(express.json());

app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🍦 YOGURING BOT</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; font-family: Arial, sans-serif; }
    .container { width: 95%; max-width: 600px; background: white; border-radius: 15px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); overflow: hidden; display: flex; flex-direction: column; height: 90vh; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
    .header h1 { font-size: 24px; margin-bottom: 5px; }
    .header p { font-size: 12px; opacity: 0.9; }
    .chat { flex: 1; overflow-y: auto; padding: 20px; background: #f5f5f5; }
    .message { margin: 10px 0; display: flex; }
    .message.bot { justify-content: flex-start; }
    .message.user { justify-content: flex-end; }
    .message-box { max-width: 80%; padding: 12px 15px; border-radius: 10px; word-wrap: break-word; }
    .bot .message-box { background: #e0e0e0; color: #333; }
    .user .message-box { background: #667eea; color: white; }
    .input-area { display: flex; gap: 10px; padding: 15px; background: white; border-top: 1px solid #ddd; }
    input { flex: 1; padding: 12px; border: 1px solid #ddd; border-radius: 25px; font-size: 14px; }
    button { padding: 12px 25px; background: #667eea; color: white; border: none; border-radius: 25px; cursor: pointer; font-weight: bold; }
    button:hover { background: #764ba2; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🍦 ASISTENTE YOGURING</h1>
      <p>Bot Inteligente - 27 años de calidad</p>
    </div>
    <div class="chat" id="chat">
      <div class="message bot">
        <div class="message-box">👋 Hola! Bienvenido a Yoguring. ¿En qué te puedo ayudar?</div>
      </div>
    </div>
    <div class="input-area">
      <input type="text" id="input" placeholder="Escribe tu mensaje..." onkeypress="if(event.key=='Enter') sendMessage()">
      <button onclick="sendMessage()">Enviar</button>
    </div>
  </div>

  <script>
    const userId = 'user_' + Date.now();
    
    async function sendMessage() {
      const input = document.getElementById('input');
      const text = input.value.trim();
      if (!text) return;
      
      const chat = document.getElementById('chat');
      const userMsg = document.createElement('div');
      userMsg.className = 'message user';
      userMsg.innerHTML = '<div class="message-box">' + text + '</div>';
      chat.appendChild(userMsg);
      input.value = '';
      chat.scrollTop = chat.scrollHeight;
      
      try {
        const res = await fetch('/chat', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({userId, message: text})
        });
        
        const data = await res.json();
        const botMsg = document.createElement('div');
        botMsg.className = 'message bot';
        botMsg.innerHTML = '<div class="message-box">' + data.reply.replace(/\n/g, '<br>') + '</div>';
        chat.appendChild(botMsg);
        chat.scrollTop = chat.scrollHeight;
      } catch (error) {
        console.error('Error:', error);
      }
    }
  </script>
</body>
</html>`);
});

app.post('/chat', async (req, res) => {
  const { userId, message } = req.body;
  const state = getOrCreateUserState(userId);
  const textLower = message.toLowerCase();

  let reply = '';

  if (state.step === 'START') {
    const productoEncontrado = Object.keys(CATALOGO).find(k => textLower.includes(k));
    if (productoEncontrado) {
      state.producto = CATALOGO[productoEncontrado];
      reply = `✅ ${state.producto.nombre} - $${state.producto.precio.toLocaleString('es-CO')}\n\n¿Cuántos paquetes?`;
      state.step = 'ESPERANDO_CANTIDAD';
    } else {
      reply = '🍦 Nuestros productos: P47, P33, P50, LARGO, EXTRA LARGO. ¿Cuál te interesa?';
      state.step = 'ESPERANDO_PRODUCTO';
    }
  } else if (state.step === 'ESPERANDO_PRODUCTO') {
    const productoEncontrado = Object.keys(CATALOGO).find(k => textLower.includes(k));
    if (!productoEncontrado) {
      reply = '❌ No encontramos ese producto. Elige: P47, P33, P50, LARGO, EXTRA LARGO';
    } else {
      state.producto = CATALOGO[productoEncontrado];
      reply = `✅ ${state.producto.nombre}\n\n¿Cuántos paquetes?`;
      state.step = 'ESPERANDO_CANTIDAD';
    }
  } else if (state.step === 'ESPERANDO_CANTIDAD') {
    const cantidad = parseInt(message.replace(/\D/g, ''));
    if (isNaN(cantidad) || cantidad <= 0) {
      reply = '❌ Número válido por favor';
    } else {
      state.cantidad_paquetes = cantidad;
      state.total = state.producto.precio * cantidad;
      reply = `✅ ${cantidad} paquete(s) = $${state.total.toLocaleString('es-CO')}\n\n¿Tu nombre?`;
      state.step = 'ESPERANDO_NOMBRE';
    }
  } else if (state.step === 'ESPERANDO_NOMBRE') {
    const nombre = message.replace(/[^a-záéíóúñ\s]/gi, '').trim();
    if (nombre.length < 3) {
      reply = '❌ Nombre válido';
    } else {
      state.nombre = nombre;
      reply = `✅ ${nombre}\n\n¿Teléfono? (10 dígitos)`;
      state.step = 'ESPERANDO_TELEFONO';
    }
  } else if (state.step === 'ESPERANDO_TELEFONO') {
    const telefonoLimpio = message.replace(/\D/g, '');
    if (telefonoLimpio.length !== 10) {
      reply = `❌ 10 dígitos exactos`;
    } else {
      state.telefono = telefonoLimpio;
      reply = `✅ ${telefonoLimpio}\n\n¿Dirección?`;
      state.step = 'ESPERANDO_DIRECCION';
    }
  } else if (state.step === 'ESPERANDO_DIRECCION') {
    if (message.length < 5) {
      reply = '❌ Dirección completa';
    } else {
      state.direccion = message.toUpperCase();
      reply = `✅ ${state.direccion}\n\n¿Método de pago?\n1 Efectivo\n2 Nequi\n3 Bancolombia`;
      state.step = 'ESPERANDO_PAGO';
    }
  } else if (state.step === 'ESPERANDO_PAGO') {
    let pago = '';
    if (textLower.includes('1') || textLower.includes('efectivo')) pago = 'EFECTIVO';
    else if (textLower.includes('2') || textLower.includes('nequi')) pago = 'NEQUI';
    else if (textLower.includes('3') || textLower.includes('banco')) pago = 'BANCOLOMBIA';

    if (!pago) {
      reply = '❌ Opción no válida. Elige: 1, 2 o 3';
    } else {
      state.metodo_pago = pago;
      const total = state.total;
      reply = `🎫 PEDIDO CONFIRMADO\n\n${state.producto.nombre} x${state.cantidad_paquetes} = $${total.toLocaleString('es-CO')}\n${state.nombre} / ${state.telefono}\n${state.direccion}\n${pago}\n\n✅ ¡Pedido registrado!`;
      
      fs.appendFileSync('./tickets.log', `${reply}\n\n---\n\n`);
      delete userState[userId];
    }
  }

  res.json({reply});
});

app.listen(PORT, () => {
  console.log(`\n🍦 BOT WEB YOGURING ACTIVO`);
  console.log(`📱 Abre: http://localhost:${PORT}`);
  console.log(`✅ Listo para chatear\n`);
});
