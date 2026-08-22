// Autenticação da Clinic via Supabase.
// A entrada da aplicação depende apenas da sessão autenticada.
const SUPABASE_URL = 'https://nsvdyewfnkulrwvzviqi.supabase.co';
const SUPABASE_KEY = 'sb_publishable_nGSbNQ4Pbpkg2trgWaQuZA_Mu-TpHY';
const CLINIC_ID = 'f0b721ad-6704-4097-9fe5-0cdff9575a4b';
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

    // A Clinic usa uma identidade fixa nesta implantação; a autorização real continua sendo
    // controlada pelo Supabase/RLS sobre o usuário autenticado.
    const profileResult = await supabaseClient
      .from('profiles')
      .select('id,clinic_name,platform_slug')
      .eq('id', session.user.id)
      .maybeSingle();

    const clinic = { id: CLINIC_ID, name: 'Clinic', slug: 'clinic' };
    const profile = profileResult.data || {
      id: session.user.id,
      clinic_name: 'Clinic',
      platform_slug: 'clinic'
    };

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
        clinica: 'Clinic',
        clinicaSlug: 'clinic'
      },
      loggedAt: new Date().toISOString()
    }));
    return { session, profile, clinic };
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
