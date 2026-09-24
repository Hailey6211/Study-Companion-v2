(() => {
  const SUPABASE_URL = 'https://mvuifnigeyjjqvwqrszi.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12dWlmbmlnZXlqanF2d3Fyc3ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxOTgyMTUsImV4cCI6MjEwNTc3NDIxNX0.6BteadGijqH2RcYLJPunWpE5FAjsptjF5bnHBbLNQGI';
  const DATA_KEY = 'bloomData';
  const USER_KEY = 'bloomUser';
  const supabase = window.supabase?.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const style = document.createElement('style');
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@500;600;700&display=swap');
    .topbar h1,.page-head h2,.calendar-head h2,.welcome h2,.section-title h3,.class-card h3,.note-card h3,.login-card h2,.login-art h1,.logo strong { font-family:'Caveat',cursive!important; font-weight:700; }
    .topbar h1 { font-size:46px; }.page-head h2 { font-size:40px; }.welcome h2 { font-size:44px; }
    .calendar-wrap { grid-template-columns:minmax(0,1.8fr) minmax(260px,.8fr); }.calendar-grid { min-height:620px; }.calendar-empty,.calendar-day { min-height:132px; }.calendar-day b { font-size:18px; }
    .deck-card { position:relative; min-height:245px; padding:22px; overflow:hidden; background:linear-gradient(145deg,var(--surface),color-mix(in srgb,var(--primary) 12%,white)); border-top:8px solid var(--primary); transform:rotate(-.5deg); transition:transform .18s ease,box-shadow .18s ease; }
    .deck-card:nth-child(even) { transform:rotate(.6deg); }.deck-card:hover { transform:translateY(-5px) rotate(0); box-shadow:0 18px 34px rgba(40,29,61,.14); }.deck-card h3 { font-size:30px; }
    .deck-card::before,.deck-card::after { content:''; position:absolute; width:16px; height:16px; border-radius:50%; background:color-mix(in srgb,var(--primary) 26%,white); opacity:.7; }.deck-card::before { top:16px;right:18px; }.deck-card::after { bottom:18px;left:18px; }
    .auth-switch { text-align:center;color:var(--muted);font-size:13px; }.auth-switch button { background:none;color:var(--primary-dark);font-weight:700;padding:0 3px; }
    @media(max-width:900px){.calendar-grid{min-height:0}.calendar-empty,.calendar-day{min-height:112px}}
  `;
  document.head.appendChild(style);

  const loginScreen = document.querySelector('#loginScreen');
  const app = document.querySelector('#app');
  const loginForm = document.querySelector('#loginForm');
  if (!loginScreen || !app || !loginForm || !supabase) return;

  let mode = 'signin';
  const authSwitch = document.createElement('div');
  authSwitch.className = 'auth-switch';
  loginForm.appendChild(authSwitch);
  const redirectTo = `${window.location.origin}${window.location.pathname}`;

  const renderAuth = () => {
    const signup = mode === 'signup';
    const confirm = document.querySelector('#confirmPassword');
    if (confirm) confirm.remove();
    loginForm.querySelector('h2').textContent = signup ? 'Create your study space' : 'Ready to bloom?';
    loginForm.querySelector('.muted').textContent = signup ? 'Save your progress and access it on any device.' : 'Sign in to your personal study space.';
    const password = loginForm.querySelector('input[type="password"]');
    if (signup) password.insertAdjacentHTML('afterend','<input id="confirmPassword" type="password" placeholder="Confirm password" required />');
    loginForm.querySelector('button[type="submit"]').textContent = signup ? 'Create account →' : 'Sign in →';
    authSwitch.innerHTML = signup ? 'Already have an account? <button type="button">Sign in</button>' : 'New here? <button type="button">Create an account</button>';
    authSwitch.querySelector('button').onclick = () => { mode = signup ? 'signin' : 'signup'; renderAuth(); };
  };

  const showError = (error) => alert(error?.message || 'Authentication failed. Please try again.');
  const setAppUser = (user) => {
    const email = user?.email || '';
    localStorage.setItem(USER_KEY, email);
    const name = email.split('@')[0] || 'Student';
    const userName = document.querySelector('#userName');
    const avatar = document.querySelector('#avatar');
    if (userName) userName.textContent = name;
    if (avatar) avatar.textContent = name[0].toUpperCase();
    loginScreen.classList.add('hidden');
    app.classList.remove('hidden');
  };

  loginForm.onsubmit = async (event) => {
    event.preventDefault();
    const email = document.querySelector('#loginEmail').value.trim();
    const password = loginForm.querySelector('input[type="password"]').value;
    if (mode === 'signup' && password !== document.querySelector('#confirmPassword').value) return alert('Passwords do not match.');
    const submit = loginForm.querySelector('button[type="submit"]');
    submit.disabled = true;
    const result = mode === 'signup'
      ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo } })
      : await supabase.auth.signInWithPassword({ email, password });
    submit.disabled = false;
    if (result.error) return showError(result.error);
    if (mode === 'signup' && !result.data.session) return alert('Account created. Check your email, then use the new confirmation link to return here.');
    setAppUser(result.data.user);
    location.reload();
  };

  const syncData = async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session?.user) return;
    try {
      const localData = JSON.parse(localStorage.getItem(DATA_KEY) || 'null');
      if (localData) await supabase.auth.updateUser({ data: { study_bloom_data: localData } });
    } catch { /* Ignore malformed local data. */ }
  };

  const init = async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      const remote = data.session.user.user_metadata?.study_bloom_data;
      if (remote) localStorage.setItem(DATA_KEY, JSON.stringify(remote));
      setAppUser(data.session.user);
    } else {
      localStorage.removeItem(USER_KEY);
      app.classList.add('hidden');
      loginScreen.classList.remove('hidden');
    }
    renderAuth();
  };

  const logout = document.querySelector('#logoutBtn');
  if (logout) logout.onclick = async () => { await syncData(); await supabase.auth.signOut(); localStorage.removeItem(USER_KEY); location.reload(); };
  window.addEventListener('beforeunload', syncData);
  setInterval(syncData, 15000);
  init();
})();
