(() => {
  const ACCOUNT_KEY = 'studyBloomAccounts';
  const USER_KEY = 'bloomUser';
  const DATA_KEY = 'bloomData';

  const getAccounts = () => {
    try { return JSON.parse(localStorage.getItem(ACCOUNT_KEY) || '{}'); }
    catch { return {}; }
  };

  const saveAccounts = (accounts) => localStorage.setItem(ACCOUNT_KEY, JSON.stringify(accounts));
  const accountName = (email) => String(email).split('@')[0] || 'Student';

  const style = document.createElement('style');
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@500;600;700&display=swap');
    .topbar h1, .page-head h2, .calendar-head h2, .welcome h2, .section-title h3,
    .class-card h3, .note-card h3, .login-card h2, .login-art h1, .logo strong {
      font-family: 'Caveat', cursive !important;
      font-weight: 700;
      letter-spacing: .01em;
    }
    .topbar h1 { font-size: 46px; }
    .page-head h2 { font-size: 40px; }
    .welcome h2 { font-size: 44px; }
    .calendar-wrap { grid-template-columns: minmax(0, 1.8fr) minmax(260px, .8fr); }
    .calendar-grid { min-height: 620px; }
    .calendar-empty, .calendar-day { min-height: 132px; }
    .calendar-day b { font-size: 18px; }
    .deck-card { position: relative; min-height: 245px; padding: 22px; overflow: hidden; background: linear-gradient(145deg, var(--surface), color-mix(in srgb, var(--primary) 12%, white)); border-top: 8px solid var(--primary); transform: rotate(-.5deg); transition: transform .18s ease, box-shadow .18s ease; }
    .deck-card:nth-child(even) { transform: rotate(.6deg); }
    .deck-card:hover { transform: translateY(-5px) rotate(0deg); box-shadow: 0 18px 34px rgba(40, 29, 61, .14); }
    .deck-card::before, .deck-card::after { content: ''; position: absolute; width: 16px; height: 16px; border-radius: 50%; background: color-mix(in srgb, var(--primary) 26%, white); opacity: .7; }
    .deck-card::before { top: 16px; right: 18px; }
    .deck-card::after { bottom: 18px; left: 18px; }
    .deck-card h3 { font-size: 30px; }
    .deck-card .deck-actions { position: relative; z-index: 1; }
    .auth-switch { text-align: center; color: var(--muted); font-size: 13px; }
    .auth-switch button { background: none; color: var(--primary-dark); font-weight: 700; padding: 0 3px; }
    #logoutBtn { cursor: pointer; }
    @media (max-width: 900px) { .calendar-grid { min-height: 0; } .calendar-empty, .calendar-day { min-height: 112px; } }
  `;
  document.head.appendChild(style);

  const loginScreen = document.querySelector('#loginScreen');
  const app = document.querySelector('#app');
  const loginForm = document.querySelector('#loginForm');
  if (!loginScreen || !app || !loginForm) return;

  const existingLogin = loginForm.innerHTML;
  loginForm.insertAdjacentHTML('beforeend', '<div class="auth-switch" id="authSwitch"></div>');
  const authSwitch = document.querySelector('#authSwitch');
  let mode = 'signin';

  const renderAuth = () => {
    const signup = mode === 'signup';
    loginForm.querySelector('h2').textContent = signup ? 'Create your study space' : 'Ready to bloom?';
    loginForm.querySelector('.muted').textContent = signup ? 'Save your progress and pick up wherever you are.' : 'Sign in to your personal study space.';
    const password = loginForm.querySelector('input[type="password"]');
    password.insertAdjacentHTML('afterend', signup ? '<input id="confirmPassword" type="password" placeholder="Confirm password" required />' : '');
    const button = loginForm.querySelector('button[type="submit"]');
    button.textContent = signup ? 'Create account →' : 'Sign in →';
    authSwitch.innerHTML = signup
      ? 'Already have an account? <button type="button" data-auth-mode="signin">Sign in</button>'
      : 'New here? <button type="button" data-auth-mode="signup">Create an account</button>';
    authSwitch.querySelector('button').onclick = () => { mode = signup ? 'signin' : 'signup'; renderAuth(); };
  };

  loginForm.onsubmit = (event) => {
    event.preventDefault();
    const email = String(document.querySelector('#loginEmail')?.value || '').trim().toLowerCase();
    const password = String(loginForm.querySelector('input[type="password"]')?.value || '');
    if (!email || !password) return;
    const accounts = getAccounts();

    if (mode === 'signup') {
      if (accounts[email]) return alert('An account with that email already exists.');
      const confirm = String(document.querySelector('#confirmPassword')?.value || '');
      if (password !== confirm) return alert('Passwords do not match.');
      accounts[email] = { password, data: null };
      saveAccounts(accounts);
    } else if (!accounts[email]) {
      accounts[email] = { password, data: null };
      saveAccounts(accounts);
    } else if (accounts[email].password !== password) {
      return alert('That password does not match this account.');
    }

    if (accounts[email].data) localStorage.setItem(DATA_KEY, JSON.stringify(accounts[email].data));
    else accounts[email].data = JSON.parse(localStorage.getItem(DATA_KEY) || 'null');
    localStorage.setItem(USER_KEY, email);
    saveAccounts(accounts);
    location.reload();
  };

  const persistAccount = () => {
    const email = localStorage.getItem(USER_KEY);
    if (!email) return;
    const accounts = getAccounts();
    if (!accounts[email]) accounts[email] = { password: '', data: null };
    try { accounts[email].data = JSON.parse(localStorage.getItem(DATA_KEY) || 'null'); } catch { /* keep prior data */ }
    saveAccounts(accounts);
  };

  const logout = document.querySelector('#logoutBtn');
  if (logout) logout.onclick = () => { persistAccount(); localStorage.removeItem(USER_KEY); location.reload(); };
  window.addEventListener('beforeunload', persistAccount);

  if (!localStorage.getItem(USER_KEY)) {
    app.classList.add('hidden');
    loginScreen.classList.remove('hidden');
  } else {
    loginScreen.classList.add('hidden');
    app.classList.remove('hidden');
  }
  renderAuth();
})();
