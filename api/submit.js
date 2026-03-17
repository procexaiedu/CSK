import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Configurar CORS se necessário (opcional se for tudo na mesma origin da Vercel)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = req.body;

    // Inicializar o cliente do Supabase usando variáveis de ambiente
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      db: { schema: 'CSK' } // Importante para usar o schema correto
    });

    const { error } = await supabase
      .from('formularios')
      .insert([data]);

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Function error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
