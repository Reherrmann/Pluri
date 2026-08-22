// Autenticação da Clinic via Supabase.
// O login é centralizado em /pluri-login/ e este arquivo apenas valida a sessão.
const SUPABASE_URL = 'https://nsvdyewfnkulrwvzviqi.supabase.co';
const SUPABASE_KEY = 'sb_publishable_nGSbNQ4Pbpkg2trgWaQuZA_Mu-TpHY';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

window.PLURI_AUTH_READY = (async () => {
  try {
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    if (error || !session) throw new Error('Sessão não encontrada.');

    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('clinic_name, platform_slug')
      .eq('id', session.user.id)
      .single();
    if (profileError || !profile) throw new Error('Usuário sem clínica vinculada.');

    const { data: clinic, error: clinicError } = await supabaseClient
      .from('clinic_clinics')
      .select('id,name,slug')
      .eq('slug', profile.platform_slug)
      .single();
    if (clinicError || !clinic) throw new Error('Clínica não encontrada.');

    window.PLURI_SUPABASE = supabaseClient;
    window.PLURI_AUTH_SESSION = session;
    window.PLURI_PROFILE = profile;
    window.PLURI_CLINIC = clinic;
    window.PLURI_SESSION_VALIDATED = true;

    localStorage.setItem('pluri_session', JSON.stringify({
      token: session.access_token,
      expiraEm: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
      user: {
        id: session.user.id,
        email: session.user.email,
        nome: session.user.user_metadata?.nome || session.user.user_metadata?.name || session.user.email,
        perfil: session.user.user_metadata?.perfil || 'Usuário',
        clinica: profile.clinic_name || clinic.name,
        clinicaSlug: profile.platform_slug || clinic.slug
      },
      loggedAt: new Date().toISOString()
    }));
    return { session, profile, clinic };
  } catch (err) {
    console.error('Falha na autenticação Supabase:', err);
    localStorage.removeItem('pluri_session');
    window.location.replace('/pluri-login/');
    throw err;
  }
})();

window.PLURI_LOGOUT = async function () {
  try { await supabaseClient.auth.signOut(); }
  finally {
    localStorage.removeItem('pluri_session');
    window.location.replace('/pluri-login/');
  }
};
