const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const paletteMap = {
  red: { primary: '#ee8d9a', dark: '#d16676', bg: '#fff7f8', surface: '#ffffff' },
  orange: { primary: '#f2af75', dark: '#d68248', bg: '#fffaf4', surface: '#ffffff' },
  yellow: { primary: '#f2d67d', dark: '#c89a35', bg: '#fffdf4', surface: '#ffffff' },
  green: { primary: '#8dd1a8', dark: '#4ea274', bg: '#f5fff9', surface: '#ffffff' },
  blue: { primary: '#8bb7eb', dark: '#5d8ec6', bg: '#f4faff', surface: '#ffffff' },
  pink: { primary: '#eba9cb', dark: '#cd739d', bg: '#fff7fb', surface: '#ffffff' },
  purple: { primary: '#ad98ea', dark: '#7765c7', bg: '#faf9ff', surface: '#ffffff' },
};

const defaultData = {
  tasks: [{ text: 'Review biology chapter 4', tag: 'Biology', done: false }],
  classes: [{ id: 'biology', name: 'Biology', teacher: 'Dr. Morgan', color: '#8b7cf6', assignments: [] }],
  notes: [],
  flashcards: [],
  messages: []
};

let data;
try { data = JSON.parse(localStorage.getItem('bloomData')) || defaultData; } catch { data = defaultData; }
data.classes = Array.isArray(data.classes) ? data.classes : [];
data.classes.forEach(c => c.assignments = Array.isArray(c.assignments) ? c.assignments : []);
data.tasks = Array.isArray(data.tasks) ? data.tasks : [];
data.notes = Array.isArray(data.notes) ? data.notes : [];
data.flashcards = Array.isArray(data.flashcards) ? data.flashcards : [];
data.messages = Array.isArray(data.messages) ? data.messages : [];

let currentPage = 'dashboard';
let calendarMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let timer = null;
let timerSeconds = 1500;

function save() { localStorage.setItem('bloomData', JSON.stringify(data)); }
function esc(value) { return String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[char])); }
function toast(message) { const el = $('#toast'); if (!el) return; el.textContent = message; el.classList.add('show'); clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove('show'), 2200); }
function openModal(content) { $('#modalContent').innerHTML = content; $('#modal').classList.remove('hidden'); }
function closeModal() { $('#modal').classList.add('hidden'); }
function uid(prefix) { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }
function dateKey(date) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
function allAssignments() { return data.classes.flatMap(c => (c.assignments || []).map(a => ({ ...a, className: c.name, classColor: c.color, classId: c.id }))); }

function applyPalette(name) {
  const palette = paletteMap[name] || paletteMap.purple;
  document.documentElement.style.setProperty('--primary', palette.primary);
  document.documentElement.style.setProperty('--primary-dark', palette.dark);
  document.documentElement.style.setProperty('--bg', palette.bg);
  document.documentElement.style.setProperty('--surface', palette.surface);
  localStorage.setItem('studyBloomPalette', name);
}

function openColorPicker() {
  const current = localStorage.getItem('studyBloomPalette') || 'purple';
  const options = Object.entries(paletteMap).map(([key, palette]) => `
    <button class="swatch ${key === current ? 'selected' : ''}" data-palette="${key}" style="background:${palette.primary};color:#2f2539;border:3px solid ${key === current ? '#2f2539' : 'transparent'}">${key}</button>
  `).join('');
  openModal(`<h2>Pastel color palette</h2><div class="swatch-grid">${options}</div>`);
  $$('[data-palette]').forEach(button => {
    button.onclick = () => {
      applyPalette(button.dataset.palette);
      closeModal();
      toast('Color updated!');
    };
  });
}

function openCalculator() {
  let expression = '';
  const displayValue = () => expression || '0';
  openModal(`
    <h2>Calculator</h2>
    <div class="calculator-wrap">
      <input id="calcDisplay" class="calc-display" value="${displayValue()}" readonly />
      <div class="calc-grid">
        <button class="calc-btn" data-calc="C">C</button>
        <button class="calc-btn" data-calc="⌫">⌫</button>
        <button class="calc-btn operator" data-calc="/">÷</button>
        <button class="calc-btn operator" data-calc="*">×</button>
        <button class="calc-btn" data-calc="7">7</button>
        <button class="calc-btn" data-calc="8">8</button>
        <button class="calc-btn" data-calc="9">9</button>
        <button class="calc-btn operator" data-calc="-">−</button>
        <button class="calc-btn" data-calc="4">4</button>
        <button class="calc-btn" data-calc="5">5</button>
        <button class="calc-btn" data-calc="6">6</button>
        <button class="calc-btn operator" data-calc="+">+</button>
        <button class="calc-btn" data-calc="1">1</button>
        <button class="calc-btn" data-calc="2">2</button>
        <button class="calc-btn" data-calc="3">3</button>
        <button class="calc-btn equals" data-calc="=">=</button>
        <button class="calc-btn zero" data-calc="0">0</button>
        <button class="calc-btn" data-calc=".">.</button>
      </div>
    </div>
  `);

  const display = $('#calcDisplay');
  $$('[data-calc]').forEach(button => {
    button.onclick = () => {
      const key = button.dataset.calc;
      if (key === 'C') {
        expression = '';
      } else if (key === '⌫') {
        expression = expression.slice(0, -1);
      } else if (key === '=') {
        try {
          expression = String(Function(`"use strict"; return (${expression.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-')})`)());
        } catch {
          expression = 'Error';
        }
      } else if (key === 'Error') {
        expression = '';
      } else {
        if (expression === 'Error') expression = '';
        expression += key;
      }
      display.value = expression || '0';
    };
  });
}

function dashboard() {
  const completed = data.tasks.filter(t => t.done).length;
  const percent = data.tasks.length ? Math.round(completed / data.tasks.length * 100) : 0;
  return `
    <div class="grid two">
      <div class="card welcome">
        <span class="eyebrow">WELCOME BACK</span>
        <h2>Small steps, big progress.</h2>
        <p>Keep your goals gentle and your focus clear.</p>
        <div class="plant">🌱</div>
      </div>
      <div class="card">
        <div class="section-title"><h3>Progress</h3><span class="pill purple">${percent}%</span></div>
        <div class="progress-bar"><i style="width:${percent}%"></i></div>
        <p class="muted">${completed} of ${data.tasks.length} tasks complete.</p>
      </div>
    </div>
    <div class="grid three" style="margin-top:18px">
      <div class="card stat"><div class="stat-icon mint">✓</div><div><b>${completed}</b><small>Tasks done</small></div></div>
      <div class="card stat"><div class="stat-icon peach">◷</div><div><b>${formatTime(timerSeconds)}</b><small>Study time</small></div></div>
      <div class="card stat"><div class="stat-icon yellow">♧</div><div><b>${data.classes.length}</b><small>Classes</small></div></div>
    </div>
    <div class="grid two" style="margin-top:18px">
      <div class="card">
        <div class="section-title"><h3>My tasks</h3><button class="link-btn" data-action="addTask">+ Add task</button></div>
        ${data.tasks.map((task, index) => `
          <label class="task ${task.done ? 'done' : ''}">
            <input type="checkbox" data-task="${index}" ${task.done ? 'checked' : ''}>
            <span>${esc(task.text)}</span>
            <small>${esc(task.tag)}</small>
          </label>
        `).join('') || '<div class="empty">No tasks yet.</div>'}
      </div>
      <div class="card">
        <div class="section-title"><h3>Study timer</h3><span class="pill green">Focus</span></div>
        <div class="timer-box"><div class="timer-display" id="timerDisplay">${formatTime(timerSeconds)}</div><button class="primary wide" data-action="timer">${timer ? 'Pause timer' : 'Start timer'}</button></div>
      </div>
    </div>
  `;
}

function formatTime(value) {
  const minutes = String(Math.floor(value / 60)).padStart(2, '0');
  const seconds = String(value % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function calendar() {
  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  const first = new Date(year, month, 1).getDay();
  const total = new Date(year, month + 1, 0).getDate();
  const label = calendarMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const assignments = allAssignments();

  let cells = '';
  for (let i = 0; i < first; i += 1) cells += '<div class="calendar-empty"></div>';
  for (let day = 1; day <= total; day += 1) {
    const key = dateKey(new Date(year, month, day));
    const items = assignments.filter(a => a.dueDate === key);
    cells += `
      <div class="calendar-day ${key === dateKey(new Date()) ? 'today' : ''}">
        <b>${day}</b>
        <button class="day-add" data-add-date="${key}">+</button>
        ${items.map(item => `<span class="event" style="background:${item.classColor || '#8b7cf6'}"><span>${esc(item.title)}</span><small>${esc(item.className)}</small></span>`).join('')}
      </div>
    `;
  }

  return `
    <div class="page-head"><h2>Calendar</h2><button class="primary" data-add-date="${dateKey(new Date())}">+ Add assignment</button></div>
    <div class="calendar-wrap">
      <div class="card">
        <div class="calendar-head"><button class="btn" data-action="prevMonth">‹</button><h2>${label}</h2><button class="btn" data-action="nextMonth">›</button></div>
        <div class="calendar-grid">
          <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
          ${cells}
        </div>
      </div>
      <div class="card">
        <div class="section-title"><h3>Upcoming</h3></div>
        ${assignments.length ? assignments.sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 8).map(a => `<div class="task"><span>${esc(a.title)}</span><small>${esc(a.className)} · ${a.dueDate}</small></div>`).join('') : '<div class="empty">No assignments yet.</div>'}
      </div>
    </div>
  `;
}

function classes() {
  return `
    <div class="page-head"><h2>My classes</h2><button class="primary" data-action="class">+ New class</button></div>
    <div class="grid three">${data.classes.map((c, index) => `
      <div class="card class-card" style="border-left-color:${c.color || '#8b7cf6'}">
        <h3>${esc(c.name)}</h3>
        <p>${esc(c.teacher)}</p>
        ${(c.assignments || []).length ? (c.assignments || []).map(a => `<div class="task"><span>${esc(a.title)}</span><small>${esc(a.type)} · ${a.dueDate}</small></div>`).join('') : '<div class="empty small">No assignments yet.</div>'}
        <div style="margin-top:12px;">
          <button class="primary wide" data-add-class="${c.id}">+ Add assignment</button>
        </div>
      </div>
    `).join('') || '<div class="empty">No classes yet.</div>'}</div>
  `;
}

function flashcards() {
  return `
    <div class="page-head"><h2>Flashcards</h2><button class="primary" data-action="flashcards">+ New set</button></div>
    <div class="grid three">${(data.flashcards || []).map((set, index) => `
      <div class="card deck-card">
        <div class="section-title"><h3>${esc(set.name)}</h3><span class="pill purple">${(set.cards || []).length}</span></div>
        <p class="muted">${(set.cards || []).length} cards in this set.</p>
        <div class="deck-actions">
          <button class="primary" data-study-set="${index}">Study set</button>
          <button class="btn" data-edit-set="${index}">Edit</button>
          <button class="btn" data-add-card-set="${index}">+ Add card</button>
        </div>
      </div>
    `).join('') || '<div class="empty">No flashcard sets yet.</div>'}</div>
  `;
}

function notes() {
  return `
    <div class="page-head"><h2>Notes</h2><button class="primary" data-action="note">+ New note</button></div>
    <div class="notes-list">${data.notes.map((n, i) => `
      <div class="card note-card"><div class="section-title"><h3>${esc(n.title)}</h3><button class="link-btn" data-delete-note="${i}">Delete</button></div><p>${esc(n.body)}</p></div>
    `).join('') || '<div class="empty">No notes yet.</div>'}</div>
  `;
}

function inbox() {
  return `
    <div class="page-head"><h2>Inbox</h2><button class="primary" data-action="message">+ New message</button></div>
    <div class="card">${(data.messages || []).map(message => `
      <div class="message"><div class="avatar">${esc((message.from || 'A')[0].toUpperCase())}</div><div class="message-copy"><b>${esc(message.from || 'Unknown')}</b><p>${esc(message.body || '')}</p></div><small>${esc(message.time || 'Now')}</small></div>
    `).join('') || '<div class="empty">No messages yet.</div>'}</div>
  `;
}

function render() {
  const views = { dashboard, calendar, classes, flashcards, notes, inbox };
  $('#pageContent').innerHTML = views[currentPage]();
  $('#pageTitle').textContent = {
    dashboard: 'Good morning, Hailey ✦',
    calendar: 'Your calendar',
    classes: 'My classes',
    flashcards: 'Flashcards',
    notes: 'Your notes',
    inbox: 'Inbox'
  }[currentPage];
  $$('.nav-item').forEach(button => button.classList.toggle('active', button.dataset.page === currentPage));
  bindEvents();
}

function bindEvents() {
  $$('[data-page]').forEach(button => {
    button.onclick = () => {
      currentPage = button.dataset.page;
      render();
    };
  });

  $$('[data-task]').forEach(checkbox => {
    checkbox.onchange = () => {
      const index = Number(checkbox.dataset.task);
      data.tasks[index].done = checkbox.checked;
      save();
      render();
    };
  });

  $$('[data-delete-note]').forEach(button => {
    button.onclick = () => {
      const index = Number(button.dataset.deleteNote);
      data.notes.splice(index, 1);
      save();
      render();
    };
  });

  $$('[data-study-set]').forEach(button => {
    button.onclick = () => openStudySet(Number(button.dataset.studySet));
  });

  $$('[data-edit-set]').forEach(button => {
    button.onclick = () => openSetEditor(Number(button.dataset.editSet));
  });

  $$('[data-add-card-set]').forEach(button => {
    button.onclick = () => openSetEditor(Number(button.dataset.addCardSet), true);
  });

  $$('[data-add-class]').forEach(button => {
    button.onclick = () => assignmentForm(dateKey(new Date()), button.dataset.addClass);
  });

  $$('[data-add-date]').forEach(button => {
    button.onclick = () => assignmentForm(button.dataset.addDate);
  });

  $$('[data-action]').forEach(button => {
    button.onclick = () => {
      const action = button.dataset.action;
      if (action === 'addTask') {
        openModal(`
          <h2>Add task</h2>
          <form id="taskForm" class="sheet-form">
            <label>Task<input name="text" required placeholder="Read chapter 5"></label>
            <label>Tag<input name="tag" placeholder="Biology"></label>
            <button class="primary wide">Add task</button>
          </form>
        `);
        $('#taskForm').onsubmit = (e) => { e.preventDefault(); const form = new FormData(e.target); data.tasks.push({ text: String(form.get('text') || '').trim(), tag: String(form.get('tag') || 'General').trim(), done: false }); save(); closeModal(); render(); toast('Task added!'); };
      }

      if (action === 'timer') {
        if (timer) {
          clearInterval(timer);
          timer = null;
        } else {
          timer = setInterval(() => {
            timerSeconds = Math.max(0, timerSeconds - 1);
            if ($('#timerDisplay')) $('#timerDisplay').textContent = formatTime(timerSeconds);
            if (timerSeconds === 0) { clearInterval(timer); timer = null; toast('Time is up!'); }
          }, 1000);
        }
        render();
      }

      if (action === 'prevMonth') {
        calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1);
        render();
      }

      if (action === 'nextMonth') {
        calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
        render();
      }

      if (action === 'class') {
        openModal(`
          <h2>New class</h2>
          <form id="classForm" class="sheet-form">
            <label>Name<input name="name" required></label>
            <label>Teacher<input name="teacher"></label>
            <button class="primary wide">Create class</button>
          </form>
        `);
        $('#classForm').onsubmit = (e) => { e.preventDefault(); const form = new FormData(e.target); data.classes.push({ id: uid('class'), name: String(form.get('name') || '').trim(), teacher: String(form.get('teacher') || 'Teacher').trim(), color: '#8b7cf6', assignments: [] }); save(); closeModal(); render(); toast('Class created!'); };
      }

      if (action === 'flashcards') openSetEditor(null);
      if (action === 'note') {
        openModal(`
          <h2>New note</h2>
          <form id="noteForm" class="sheet-form">
            <label>Title<input name="title" required></label>
            <label>Note<textarea name="body" required></textarea></label>
            <button class="primary wide">Save note</button>
          </form>
        `);
        $('#noteForm').onsubmit = (e) => { e.preventDefault(); const form = new FormData(e.target); data.notes.unshift({ id: uid('note'), title: String(form.get('title') || '').trim(), body: String(form.get('body') || '').trim() }); save(); closeModal(); render(); toast('Note saved!'); };
      }

      if (action === 'message') {
        openModal(`
          <h2>New message</h2>
          <form id="messageForm" class="sheet-form">
            <label>To<input name="from" required></label>
            <label>Message<textarea name="body" required></textarea></label>
            <button class="primary wide">Send</button>
          </form>
        `);
        $('#messageForm').onsubmit = (e) => { e.preventDefault(); const form = new FormData(e.target); (data.messages || []).unshift({ id: uid('message'), from: String(form.get('from') || '').trim(), body: String(form.get('body') || '').trim(), time: 'Now' }); save(); closeModal(); render(); toast('Message sent!'); };
      }
    };
  });
}

function openSetEditor(setIndex, addCardMode = false) {
  const existingSet = setIndex === null ? null : data.flashcards[setIndex];
  let cards = existingSet ? existingSet.cards.map(card => ({ front: card.front || '', back: card.back || '' })) : [{ front: '', back: '' }];
  if (addCardMode && existingSet) cards.push({ front: '', back: '' });

  const renderEditor = () => {
    openModal(`
      <h2>${existingSet ? 'Edit flashcard set' : 'Create new set'}</h2>
      <form id="setEditorForm" class="sheet-form">
        <label>Set name<input name="name" value="${esc(existingSet ? existingSet.name : '')}" required></label>
        <div class="flashcard-editor-list">
          ${cards.map((card, index) => `
            <div class="flashcard-editor-row">
              <div class="editor-row-top"><strong>Card ${index + 1}</strong><button class="link-btn remove-card" type="button" data-remove-card="${index}">Remove</button></div>
              <label>Front / question<textarea name="front-${index}" data-front="${index}">${esc(card.front)}</textarea></label>
              <label>Back / answer<textarea name="back-${index}" data-back="${index}">${esc(card.back)}</textarea></label>
            </div>
          `).join('')}
        </div>
        <button type="button" class="btn" id="addCardRow">+ Add card</button>
        <button class="primary wide" style="margin-top:12px">Save set</button>
      </form>
    `);

    $('#addCardRow').onclick = () => { cards.push({ front: '', back: '' }); renderEditor(); };
    $$('.remove-card').forEach(button => {
      button.onclick = () => {
        const idx = Number(button.dataset.removeCard);
        cards.splice(idx, 1);
        if (!cards.length) cards.push({ front: '', back: '' });
        renderEditor();
      };
    });

    $('#setEditorForm').onsubmit = (event) => {
      event.preventDefault();
      const form = new FormData(event.target);
      const name = String(form.get('name') || '').trim();
      const cleaned = [];
      let i = 0;
      while (form.has(`front-${i}`) || form.has(`back-${i}`)) {
        const front = String(form.get(`front-${i}`) || '').trim();
        const back = String(form.get(`back-${i}`) || '').trim();
        if (front && back) cleaned.push({ front, back });
        i += 1;
      }
      if (!name || !cleaned.length) {
        toast('Please add a set name and at least one complete card.');
        return;
      }
      if (setIndex === null) {
        data.flashcards.push({ id: uid('flashcard'), name, cards: cleaned });
      } else {
        data.flashcards[setIndex] = { ...existingSet, name, cards: cleaned };
      }
      save();
      closeModal();
      render();
      toast('Flashcard set saved!');
    };
  };

  renderEditor();
}

function openStudySet(index) {
  const set = data.flashcards[index];
  if (!set || !set.cards.length) return;
  let cardIndex = 0;
  let flipped = false;

  const showCard = () => {
    const card = set.cards[cardIndex];
    openModal(`
      <h2>${esc(set.name)}</h2>
      <div class="flashcard-box">
        <span class="corner tl">✦</span>
        <span class="corner tr">✦</span>
        <span class="corner bl">✦</span>
        <span class="corner br">✦</span>
        <textarea readonly>${esc(flipped ? card.back : card.front)}</textarea>
      </div>
      <div style="display:flex;justify-content:space-between;gap:8px;margin-top:12px;">
        <button class="btn" id="flipCard">Flip</button>
        <button class="primary" id="nextCard">Next</button>
      </div>
    `);
    $('#flipCard').onclick = () => { flipped = !flipped; showCard(); };
    $('#nextCard').onclick = () => { cardIndex = (cardIndex + 1) % set.cards.length; flipped = false; showCard(); };
  };
  showCard();
}

function assignmentForm(date, classId) {
  openModal(`
    <h2>Add assignment</h2>
    <form id="assignmentForm" class="sheet-form">
      <label>Class<select name="classId">${data.classes.map(c => `<option value="${c.id}" ${classId === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></label>
      <label>Title<input name="title" required></label>
      <label>Due date<input type="date" name="dueDate" value="${date || dateKey(new Date())}" required></label>
      <label>Type<select name="type"><option>Assignment</option><option>Homework</option><option>Quiz</option><option>Project</option></select></label>
      <button class="primary wide">Add assignment</button>
    </form>
  `);
  $('#assignmentForm').onsubmit = (event) => {
    event.preventDefault();
    const form = new FormData(event.target);
    const classItem = (data.classes || []).find(c => c.id === String(form.get('classId')));
    if (!classItem) return;
    classItem.assignments.push({ id: uid('assignment'), title: String(form.get('title') || '').trim(), dueDate: String(form.get('dueDate') || dateKey(new Date())), type: String(form.get('type') || 'Assignment') });
    save();
    closeModal();
    render();
    toast('Assignment added!');
  };
}

$('#loginForm').onsubmit = (event) => {
  event.preventDefault();
  const email = $('#loginEmail').value.trim();
  if (!email) return;
  localStorage.setItem('bloomUser', email);
  $('#loginScreen').classList.add('hidden');
  $('#app').classList.remove('hidden');
  $('#userName').textContent = email.split('@')[0];
  $('#avatar').textContent = email[0].toUpperCase();
  render();
};

$('#logoutBtn').onclick = () => {
  localStorage.removeItem('bloomUser');
  location.reload();
};

$('#quickAdd').onclick = () => {
  currentPage = 'calendar';
  render();
};

$('#closeModal').onclick = closeModal;
$('#modal').onclick = (event) => { if (event.target.id === 'modal') closeModal(); };
$('#toast').onclick = () => $('#toast').classList.remove('show');

$('#themeBtn').onclick = () => document.body.classList.toggle('dark');
$('#themePickerBtn').onclick = openColorPicker;
$('#calcBtn').onclick = openCalculator;

const savedPalette = localStorage.getItem('studyBloomPalette') || 'purple';
applyPalette(savedPalette);

if (localStorage.getItem('bloomUser')) {
  $('#loginScreen').classList.add('hidden');
  $('#app').classList.remove('hidden');
  const user = localStorage.getItem('bloomUser');
  $('#userName').textContent = user.split('@')[0];
  $('#avatar').textContent = user[0].toUpperCase();
}

render();
