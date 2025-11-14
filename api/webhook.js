const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'mi_token_seguro';

export default function handler(req, res) {
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    } else {
      return res.sendStatus(403);
    }
  }

  if (req.method === 'POST') {
    console.log("📩 Mensaje entrante:", JSON.stringify(req.body, null, 2));
    return res.sendStatus(200);
  }

  return res.setHeader('Allow', ['GET', 'POST']).status(405).end('Method Not Allowed');
}
