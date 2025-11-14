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

          // número del cliente (ej: 5698584xxxx)
          const from = msg.from;
          // texto que escribió (si es que hay)
          const text = msg.text?.body || '';

          console.log('👤 De:', from);
          console.log('💬 Texto:', text);

          // --- RESPUESTA SIMPLE DE BIENVENIDA ---

          // Si no tenemos token configurado, no intentamos responder
          if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
            console.error(
              '⚠️ Falta WHATSAPP_TOKEN o WHATSAPP_PHONE_NUMBER_ID en las env vars'
            );
          } else {
            const nombreContacto =
              value?.contacts?.[0]?.profile?.name || 'amig@';

            // Mensaje básico de bienvenida (después lo cambiamos a plantilla)
            const replyText = `Hola ${nombreContacto} 👋\n\nSoy *Edu*, el asistente virtual de *Delicias Porteñas* 🧁\n\nPuedo ayudarte con:\n1️⃣ Ver la carta de productos\n2️⃣ Consultar precios y porciones\n3️⃣ Hacer o consultar un pedido existente\n\nEscribe el número de la opción que prefieras.`;

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
