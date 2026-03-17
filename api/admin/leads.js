import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token' });

  const token = authHeader.split(' ')[1];
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  
  // Use service key if available, otherwise anon key
  const keyToUse = supabaseServiceKey || supabaseAnonKey;

  if (!supabaseUrl || !keyToUse) {
    return res.status(500).json({ error: 'Server config error: missing keys' });
  }

  // Create client with CSK schema for admin operations
  const supabase = createClient(supabaseUrl, keyToUse, {
    db: { schema: 'CSK' }
  });

  // 1. Verificar o token e obter o usuário
  // Use a separate anon-schema client for auth (auth is schema-agnostic)
  const authClient = createClient(supabaseUrl, keyToUse);
  const { data: { user }, error: authError } = await authClient.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Invalid token' });

  // 2. Verificar se o e-mail está na tabela CSK.usuarios
  const { data: adminUser, error: adminError } = await supabase
    .from('usuarios')
    .select('email')
    .eq('email', user.email)
    .single();

  if (adminError || !adminUser) {
    console.error('Admin lookup failed:', adminError, 'for email:', user.email);
    return res.status(403).json({ error: 'Not authorized as admin', detail: adminError?.message });
  }

  // 3. Se for admin, buscar os leads
  const { data: leads, error: leadsError } = await supabase
    .from('formularios')
    .select('*')
    .order('criado_em', { ascending: false });

  if (leadsError) return res.status(500).json({ error: leadsError.message });

  return res.status(200).json(leads);
}
