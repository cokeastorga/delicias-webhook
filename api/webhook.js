// api/webhook.js

export default async function handler(req, res) {
  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'mi_token_seguro';

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
    console.log('📩 Webhook recibido:', JSON.stringify(req.body, null, 2));

    try {
      if (req.body.object === 'whatsapp_business_account') {
        const entry = req.body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const messages = value?.messages;

        if (messages && messages.length > 0) {
          const msg = messages[0];
          const from = msg.from;            // número del cliente
          const text = msg.text?.body || ''; // texto que envió

          console.log('👤 De:', from);
          console.log('💬 Texto:', text);

          // 👉 Aquí luego vamos a poner la lógica de respuesta (llamar a la API de WhatsApp)
        }
      }

      // Siempre responde 200 para que Meta quede tranquila
      return res.status(200).send('EVENT_RECEIVED');
    } catch (err) {
      console.error('💥 Error procesando webhook:', err);
      return res.status(500).send('Internal server error');
    }
  }

  // Métodos no permitidos
  return res.status(405).send('Method Not Allowed');
}
