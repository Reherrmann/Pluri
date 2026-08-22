// Autenticação da Clinic via Supabase.
// O login é centralizado em /pluri-login/ e esta aplicação sempre retorna para /clinic/.
const SUPABASE_URL = 'https://nsvdyewfnkulrwvzviqi.supabase.co';
const SUPABASE_KEY = 'sb_publishable_nGSbNQ4Pbpkg2trgWaQuZA_Mu-TpHY';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const CLINIC_LOGIN_URL = '/pluri-login/?next=%2Fclinic%2F';

function goToClinicLogin() {
  try { sessionStorage.setItem('pluri_login_return', '/clinic/'); } catch (_) {}
  window.location.replace(CLINIC_LOGIN_URL);
}

window.PLURI_AUTH_READY = (async () => {
  try {
    const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
    if (sessionError || !session) throw new Error('Sessão não encontrada.');

    const { data: clinic, error: clinicError } = await supabaseClient
      .from('clinic_clinics')
      .select('id,name,slug')
      .eq('slug', 'clinic')
      .single();
    if (clinicError || !clinic) throw new Error('Clínica da Clinic não encontrada.');

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('id,clinic_name,platform_slug')
      .eq('id', session.user.id)
      .maybeSingle();

    window.PLURI_SUPABASE = supabaseClient;
    window.PLURI_AUTH_SESSION = session;
    window.PLURI_PROFILE = profile || {
      id: session.user.id,
      clinic_name: clinic.name,
      platform_slug: 'clinic'
    };
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
        clinica: clinic.name || 'Clinic',
        clinicaSlug: 'clinic'
      },
      loggedAt: new Date().toISOString()
    }));
    return { session, profile: window.PLURI_PROFILE, clinic };
  } catch (err) {
    console.error('Falha na autenticação da Clinic:', err);
    localStorage.removeItem('pluri_session');
    goToClinicLogin();
    throw err;
  }
})();

window.PLURI_LOGOUT = async function () {
  try { await supabaseClient.auth.signOut(); }
  finally {
    localStorage.removeItem('pluri_session');
    goToClinicLogin();
  }
};
