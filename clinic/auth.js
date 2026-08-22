// Autenticação da Clinic via Supabase.
const SUPABASE_URL = 'https://nsvdyewfnkulrwvzviqi.supabase.co';
const SUPABASE_KEY = 'sb_publishable_nGSbNQ4Pbpkg2trgWaQuZA_Mu-TpHY';
const CLINIC_ID = 'f0b721ad-6704-4097-9fe5-0cdff9575a4b';
const CLINIC_LOGIN_URL = '/pluri-login/?next=%2Fclinic%2F';

let persistedSession = null;
try { persistedSession = JSON.parse(localStorage.getItem('pluri_session') || 'null'); } catch (_) {}

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, persistedSession?.token ? {
  global: { headers: { Authorization: `Bearer ${persistedSession.token}` } }
} : {});

function showClinicAuthError(err) {
  const message = err?.message || String(err || 'Erro desconhecido');
  console.error('Falha na autenticação da Clinic:', err);
  document.body.innerHTML = `<div style="min-height:100vh;display:grid;place-items:center;padding:24px;background:#f6f8fb;font-family:Inter,system-ui,-apple-system,sans-serif"><div style="width:min(720px,100%);background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:28px;box-shadow:0 8px 30px rgba(0,0,0,.06)"><div style="font-size:12px;font-weight:800;letter-spacing:.08em;color:#b42318;text-transform:uppercase">Falha ao entrar na Clinic</div><h1 style="margin:8px 0;color:#002c47;font-size:24px">A sessão não pôde ser carregada.</h1><p style="color:#667085;line-height:1.5">O erro abaixo foi preservado para diagnóstico.</p><pre style="white-space:pre-wrap;word-break:break-word;background:#f8fafc;border:1px solid #e5e7eb;border-radius:10px;padding:16px;font:12px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;color:#344054">${message.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre><div style="margin-top:18px;display:flex;gap:10px;flex-wrap:wrap"><button id="clinicRetry" style="border:1px solid #002c47;border-radius:999px;background:#002c47;color:#fff;padding:10px 18px;font-weight:700;cursor:pointer">Tentar novamente</button><button id="clinicLogin" style="border:1px solid #d0d5dd;border-radius:999px;background:#fff;color:#344054;padding:10px 18px;font-weight:700;cursor:pointer">Voltar ao login</button></div></div></div>`;
  document.getElementById('clinicRetry')?.addEventListener('click', () => location.reload());
  document.getElementById('clinicLogin')?.addEventListener('click', () => { try { sessionStorage.setItem('pluri_login_return', '/clinic/'); } catch (_) {} location.replace(CLINIC_LOGIN_URL); });
}

async function getSession() {
  if (persistedSession?.token && persistedSession?.user?.id) {
    const expiresAt = persistedSession.expiraEm ? Math.floor(new Date(persistedSession.expiraEm).getTime() / 1000) : null;
    return {
      access_token: persistedSession.token,
      expires_at: expiresAt,
      user: {
        id: persistedSession.user.id,
        email: persistedSession.user.email,
        user_metadata: { nome: persistedSession.user.nome || persistedSession.user.email, perfil: persistedSession.user.perfil || 'Usuário' }
      }
    };
  }

  for (let i = 0; i < 12; i += 1) {
    const result = await supabaseClient.auth.getSession();
    if (result.data?.session) return result.data.session;
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  throw new Error('Sessão não disponível.');
}

window.PLURI_AUTH_READY = (async () => {
  try {
    const session = await getSession();
    const profile = { id: session.user.id, clinic_name: 'Clinic', platform_slug: 'clinic' };
    const clinic = { id: CLINIC_ID, name: 'Clinic', slug: 'clinic' };

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
    showClinicAuthError(err);
    throw err;
  }
})();

window.PLURI_LOGOUT = async function () {
  try { await supabaseClient.auth.signOut(); } finally {
    localStorage.removeItem('pluri_session');
    try { sessionStorage.setItem('pluri_login_return', '/clinic/'); } catch (_) {}
    location.replace(CLINIC_LOGIN_URL);
  }
};
