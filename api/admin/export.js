import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const token = req.query.token;
  if (!token) return res.status(401).send('No token');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).send('Server config error');
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // 1. Verificar o token
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).send('Invalid token');

  // 2. Verificar Admin
  const { data: adminUser, error: adminError } = await supabase
    .from('usuarios')
    .select('email')
    .eq('email', user.email)
    .single();

  if (adminError || !adminUser) {
    return res.status(403).send('Not authorized');
  }

  // 3. Buscar leads
  const { data: leads, error: leadsError } = await supabase
    .from('formularios')
    .select('*')
    .order('criado_em', { ascending: false });

  if (leadsError) return res.status(500).send(leadsError.message);

  // 4. Gerar CSV
  const headers = ['Nome', 'WhatsApp', 'Instagram', 'Profissao', 'Faturamento', 'Data'];
  const rows = leads.map(l => [
    l.nome,
    l.telefone,
    l.instagram,
    l.profissao,
    l.faturamento_empresa,
    new Date(l.criado_em).toLocaleDateString('pt-BR')
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.map(field => `"${field}"`).join(','))
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=leads_csk.csv');
  return res.status(200).send(csvContent);
}
