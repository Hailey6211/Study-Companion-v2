(() => {
  const SUPABASE_URL = 'https://mvuifnigeyjjqvwqrszi.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12dWlmbmlnZXlqanF2d3Fyc3ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxOTgyMTUsImV4cCI6MjEwNTc3NDIxNX0.6BteadGijqH2RcYLJPunWpE5FAjsptjF5bnHBbLNQGI';
  const DATA_KEY = 'bloomData';
  const USER_KEY = 'bloomUser';
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const style = document.createElement('style');
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@500;600;700&display=swap');
    .topbar h1,.page-head h2,.calendar-head h2,.welcome h2,.section-title h3,.class-card h3,.note-card h3,.login-card h2,.login-art h1,.logo strong{font-family:'Caveat',cursive!important;font-weight:700;letter-spacing:.01em}
    .topbar h1{font-size:46px}.page-head h2{font-size:40px}.welcome h2{font-size:44px}
    .calendar-wrap{grid-template-columns:minmax(0,1.8fr) minmax(260px,.8fr)}.calendar-grid{min-height:620px}.calendar-empty,.calendar-day{min-height:132px}.calendar-day b{font-size:18px}
    .deck-card{position:relative;min-height:245px;padding:22px;overflow:hidden;background:linear-gradient(145deg,var(--surface),color-mix(in srgb,var(--primary) 12%,white));border-top:8px solid var(--primary);transform:rotate(-.5deg);transition:transform .18s ease,box-shadow .18s ease}.deck-card:nth-child(even){transform:rotate(.6deg)}.deck-card:hover{transform:translateY(-5px) rotate(0);box-shadow:0 18px 34px rgba(40,29,61,.14)}.deck-card::before,.deck-card::after{content:'';position:absolute;width:16px;height:16px;border-radius:50%;background:color-mix(in srgb,var(--primary) 26%,white);opacity:.7}.deck-card::before{top:16px;right:18px}.deck-card::after{bottom:18px;left:18px}.deck-card h3{font-size:30px}.deck-card .deck-actions{position:relative;z-index:1}.auth-switch{text-align:center;color:var(--muted);font-size:13px}.auth-switch button{background:none;color:var(--primary-dark);font-weight:700;padding:0 3px}#logoutBtn{cursor:pointer}
    @media(max-width:900px){.calendar-grid{min-height:0}.calendar-empty,.calendar-day{min-height:112px}}
  `;
  document.head.appendChild(style);

  const loginScreen = document.querySelector('#loginScreen');
  const app = document.querySelector('#app');
  const loginForm = document.querySelector('#loginForm');
  if (!loginScreen || !app || !loginForm || !window.supabase) return;

  let mode = 'signin';
  const authSwitch = document.createElement('div');
  authSwitch.className = 'auth-switch';
  loginForm.appendChild(authSwitch);

  const setBusy = (busy) => {
    const button = loginForm.querySelector('button[type="submit"]');
    if (button) { button.disabled = busy; button.textContent = busy ? 'Please wait…' : (mode === 'signup' ? 'Create account →' : 'Sign in →'); }
  };

  const renderAuth = () => {
    const signup = mode === 'signup';
    loginForm.querySelector('h2').textContent = signup ? 'Create your study space' : 'Ready to bloom?';
    loginForm.querySelector('.muted').textContent = signup ? 'Save your progress and access it on any device.' : 'Sign in to your personal study space.';
    const oldConfirm = document.querySelector('#confirmPassword');
    if (oldConfirm) oldConfirm.remove();
    const password = loginForm.querySelector('input[type="password"]');
    if (signup) password.insertAdjacentHTML('afterend','<input id="confirmPassword" type="password" placeholder="Confirm password" required />');
    authSwitch.innerHTML = signup ? 'Already have an account? <button type="button">Sign in</button>' : 'New here? <button type="button">Create an account</button>';
    authSwitch.querySelector('button').onclick = () => { mode = signup ? 'signin' : 'signup'; renderAuth(); };
  };

  const showError = (error) => alert(error?.message || 'Something went wrong. Please try again.');

  loginForm.onsubmit = async (event) => {
    event.preventDefault();
    const email = String(document.querySelector('#loginEmail')?.value || '').trim();
    const password = String(loginForm.querySelector('input[type="password"]')?.value || '');
    if (!email || !password) return;
    if (mode === 'signup' && password !== String(document.querySelector('#confirmPassword')?.value || '')) return alert('Passwords do not match.');
    setBusy(true);
    const result = mode === 'signup'
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (result.error) return showError(result.error);
    if (mode === 'signup' && !result.data.session) return alert('Account created. Check your email to confirm it, then sign in.');
    await startSession(result.data.session?.user || result.data.user);
  };

  const startSession = async (user) => {
    if (!user) return;
    localStorage.setItem(USER_KEY, user.email || user.id);
    const saved = user.user_metadata?.study_bloom_data;
    if (saved) localStorage.setItem(DATA_KEY, JSON.stringify(saved));
    loginScreen.classList.add('hidden');
    app.classList.remove('hidden');
    location.reload();
  };

  const syncData = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) return;
    try {
      const data = JSON.parse(localStorage.getItem(DATA_KEY) || 'null');
      if (data) await supabase.auth.updateUser({ data: { study_bloom_data: data } });
    } catch { /* Ignore malformed local data. */ }
  };

  const init = async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      localStorage.setItem(USER_KEY, data.session.user.email || data.session.user.id);
      const remote = data.session.user.user_metadata?.study_bloom_data;
      if (remote) localStorage.setItem(DATA_KEY, JSON.stringify(remote));
      loginScreen.classList.add('hidden');
      app.classList.remove('hidden');
    } else {
      localStorage.removeItem(USER_KEY);
      app.classList.add('hidden');
      loginScreen.classList.remove('hidden');
    }
    renderAuth();
  };

  const logout = document.querySelector('#logoutBtn');
  if (logout) logout.onclick = async () => { await syncData(); await supabase.auth.signOut(); localStorage.removeItem(USER_KEY); location.reload(); };
  window.addEventListener('beforeunload', () => { syncData(); });
  setInterval(syncData, 15000);
  init();
})();
