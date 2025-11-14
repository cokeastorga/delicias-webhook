// api/webhook.js

export default async function handler(req, res) {
  const VERIFY_TOKEN =
    process.env.WHATSAPP_VERIFY_TOKEN || 'mi_token_seguro';
  const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
  const WHATSAPP_PHONE_NUMBER_ID =
    process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ WEBHOOK_VERIFIED');
      return res.status(200).send(challenge);
    } else {
      console.warn('❌ Verificación fallida');
      return res.status(403).send('Forbidden');
    }
  }

  if (req.method === 'POST') {
    console.log(
      '📩 Webhook recibido:',
      JSON.stringify(req.body, null, 2)
    );

    try {
      if (req.body.object === 'whatsapp_business_account') {
        const entry = req.body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const messages = value?.messages;

        if (messages && messages.length > 0) {
          const msg = messages[0];

          const from = msg.from; // número del cliente
          const text = (msg.text?.body || '').trim();
          const lower = text.toLowerCase();

          console.log('👤 De:', from);
          console.log('💬 Texto:', text);

          if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
            console.error(
              '⚠️ Falta WHATSAPP_TOKEN o WHATSAPP_PHONE_NUMBER_ID en las env vars'
            );
          } else {
            const nombreContacto =
              value?.contacts?.[0]?.profile?.name || 'amig@';

            let replyText = '';

            // --- ROUTER SIMPLE ---

            if (lower === '1' || lower.includes('carta')) {
              // Ver carta de productos
              replyText =
                `Perfecto ${nombreContacto} 😄\n\n` +
                `Aquí tienes el *menú general de productos* de Delicias Porteñas:\n\n` +
                `• Tortas artesanales (hojarasca, bizcocho, panqueque)\n` +
                `• Kuchenes de frutas y crema\n` +
                `• Panadería fresca del día 🥐\n\n` +
                `Escribe:\n` +
                `👉 *Tortas* para ver opciones de tortas\n` +
                `👉 *Kuchenes* para ver opciones de kuchenes\n` +
                `👉 *Panadería* para ver los panes disponibles`;
            } else if (lower === '2' || lower.includes('precio')) {
              // Consultar precios y porciones
              replyText =
                `Claro ${nombreContacto} 😊\n\n` +
                `Para ayudarte con *precios y porciones*, dime primero qué te interesa:\n\n` +
                `• Escribe *Torta* + el tipo (ej: "Torta hojarasca manjar")\n` +
                `• Escribe *Kuchen* + sabor (ej: "Kuchen frambuesa")\n\n` +
                `Yo te respondo con porciones recomendadas y valores aproximados.`;
            } else if (lower === '3' || lower.includes('pedido')) {
              // Hacer o consultar pedido
              replyText =
                `Genial ${nombreContacto} 🧁\n\n` +
                `Para *hacer o consultar un pedido*, por favor envíame:\n\n` +
                `1️⃣ Tipo de producto (torta, kuchen, pan, etc.)\n` +
                `2️⃣ Fecha aproximada de entrega\n` +
                `3️⃣ Para cuántas personas o porciones\n\n` +
                `Con eso te ayudo a crear el pedido o revisar uno existente.`;
            } else {
              // Mensaje por defecto / bienvenida
              replyText =
                `Hola ${nombreContacto} 👋\n\n` +
                `Soy *Edu*, el asistente virtual de *Delicias Porteñas* 🧁\n\n` +
                `Puedo ayudarte con:\n` +
                `1️⃣ Ver la carta de productos\n` +
                `2️⃣ Consultar precios y porciones\n` +
                `3️⃣ Hacer o consultar un pedido existente\n\n` +
                `Escribe el *número de la opción* que prefieras.`;
            }

            const url = `https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

            const payload = {
              messaging_product: 'whatsapp',
              to: from,
              text: {
                body: replyText
              }
            };

            const response = await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${WHATSAPP_TOKEN}`
              },
              body: JSON.stringify(payload)
            });

            const data = await response.json();
            console.log('📤 Respuesta enviada. API dijo:', data);
          }
        }
      }

      return res.status(200).send('EVENT_RECEIVED');
    } catch (err) {
      console.error('💥 Error procesando webhook:', err);
      return res.status(500).send('Internal server error');
    }
  }

  return res.status(405).send('Method Not Allowed');
}
