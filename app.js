const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const defaultData = {
  tasks: [
    { text: 'Review biology chapter 4', tag: 'Biology', done: false },
    { text: 'Finish history essay outline', tag: 'History', done: true },
    { text: 'Practice Spanish vocabulary', tag: 'Spanish', done: false }
  ],
  classes: [
    { id: 'bio', name: 'Biology', teacher: 'Dr. Morgan', color: '#8b7cf6', assignments: [] },
    { id: 'hist', name: 'History', teacher: 'Ms. Rivera', color: '#f49d72', assignments: [] },
    { id: 'span', name: 'Spanish', teacher: 'Señora Cruz', color: '#67c9a2', assignments: [] }
  ],
  notes: [
    { id: 'note-1', title: 'Study tip', body: 'Use the Pomodoro method: 25 mins focus, then 5 minutes rest.' }
  ],
  flashcards: [
    {
      id: 'set-1',
      name: 'Biology basics',
      cards: [
        { front: 'What is photosynthesis?', back: 'The process plants use to turn light into chemical energy.' },
        { front: 'What is a cell?', back: 'The basic unit of life.' }
      ]
    }
  ],
  messages: [
    { id: 'msg-1', from: 'Maya', body: 'Want to study for the quiz together?', time: 'Today' }
  ]
};

const STORAGE_KEY = 'bloomData';
let data = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || defaultData;
let currentPage = 'dashboard';
let calendarMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let timerInt = null;
let timerSeconds = 25 * 60;

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[char]));
}

function toast(message) {
  const x = $('#toast');
  if (!x) return;
  x.textContent = message;
  x.classList.add('show');
  clearTimeout(toast.timeout);
  toast.timeout = setTimeout(() => x.classList.remove('show'), 2200);
}

function openModal(content) {
  $('#modalContent').innerHTML = content;
  $('#modal').classList.remove('hidden');
}

function closeModal() {
  $('#modal').classList.add('hidden');
}

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatTime(totalSeconds) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function allAssignments() {
  return (data.classes || []).flatMap((classItem) =>
    (classItem.assignments || []).map((assignment) => ({
      ...assignment,
      className: classItem.name,
      classColor: classItem.color || '#8b7cf6'
    }))
  );
}

function renderDashboard() {
  const completed = (data.tasks || []).filter((task) => task.done).length;
  const total = (data.tasks || []).length || 1;
  const percent = Math.round((completed / total) * 100);

  return `
    <div class="grid two">
      <div class="card welcome">
        <span class="eyebrow">WELCOME BACK</span>
        <h2>Small steps, big progress.</h2>
        <p>Keep your goals gentle and your focus clear.</p>
        <div class="plant">🌱</div>
      </div>

      <div class="card">
        <div class="section-title">
          <h3>Progress</h3>
          <span class="pill purple">${percent}%</span>
        </div>
        <div class="progress-bar"><i style="width:${percent}%"></i></div>
        <p class="muted">${completed} of ${total} tasks complete.</p>
      </div>
    </div>

    <div class="grid three" style="margin-top:18px">
      <div class="card stat">
        <div class="stat-icon mint">✓</div>
        <div><b>${completed}</b><small>Tasks done</small></div>
      </div>
      <div class="card stat">
        <div class="stat-icon peach">◷</div>
        <div><b>${formatTime(timerSeconds)}</b><small>Study time</small></div>
      </div>
      <div class="card stat">
        <div class="stat-icon yellow">♧</div>
        <div><b>${(data.classes || []).length}</b><small>Classes</small></div>
      </div>
    </div>

    <div class="grid two" style="margin-top:18px">
      <div class="card">
        <div class="section-title">
          <h3>My tasks</h3>
          <button class="link-btn" data-action="addTask">+ Add task</button>
        </div>
        ${(data.tasks || []).length ? (data.tasks || []).map((task, index) => `
          <label class="task ${task.done ? 'done' : ''}">
            <input type="checkbox" data-task="${index}" ${task.done ? 'checked' : ''}>
            <span>${esc(task.text)}</span>
            <small>${esc(task.tag || 'General')}</small>
          </label>
        `).join('') : '<div class="empty">No tasks yet.</div>'}
      </div>

      <div class="card">
        <div class="section-title">
          <h3>Study timer</h3>
          <span class="pill green">Focus</span>
        </div>
        <div class="timer-box">
          <div id="timerDisplay" class="timer-display">${formatTime(timerSeconds)}</div>
          <button class="primary wide" data-action="timer">${timerInt ? 'Pause timer' : 'Start timer'}</button>
        </div>
      </div>
    </div>
  `;
}

function renderCalendar() {
  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const label = calendarMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const assignments = allAssignments();

  let cells = '';
  for (let i = 0; i < firstDay; i += 1) {
    cells += '<div class="calendar-empty"></div>';
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const key = dateKey(new Date(year, month, day));
    const matches = assignments.filter((assignment) => assignment.dueDate === key);
    const isToday = key === dateKey(new Date());
    cells += `
      <div class="calendar-day ${isToday ? 'today' : ''}">
        <b>${day}</b>
        <button class="day-add" data-add-date="${key}" title="Add assignment">+</button>
        ${matches.map((assignment) => `
          <span class="event" style="background:${assignment.classColor || '#8b7cf6'};">
            ${esc(assignment.title)}
            <small>${esc(assignment.className)}</small>
          </span>
        `).join('')}
      </div>
    `;
  }

  return `
    <div class="page-head">
      <h2>Calendar</h2>
      <button class="primary" data-add-date="${dateKey(new Date())}">+ Add assignment</button>
    </div>

    <div class="calendar-wrap">
      <div class="card">
        <div class="calendar-head">
          <button class="btn" data-action="prevMonth">‹</button>
          <h2>${label}</h2>
          <button class="btn" data-action="nextMonth">›</button>
        </div>

        <div class="calendar-grid">
          <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
          ${cells}
        </div>
      </div>

      <div class="card">
        <div class="section-title">
          <h3>Upcoming</h3>
        </div>
        ${assignments.length ? assignments
          .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
          .slice(0, 8)
          .map((assignment) => `
            <div class="task">
              <span>${esc(assignment.title)}</span>
              <small>${esc(assignment.className)} · ${assignment.dueDate}</small>
            </div>
          `).join('') : '<div class="empty">No assignments yet.</div>'}
      </div>
    </div>
  `;
}

function renderClasses() {
  return `
    <div class="page-head">
      <h2>My classes</h2>
      <button class="primary" data-action="addClass">+ New class</button>
    </div>
    <div class="grid three">
      ${(data.classes || []).map((classItem, index) => `
        <div class="card class-card" style="border-left-color:${classItem.color || '#8b7cf6'}">
          <h3>${esc(classItem.name)}</h3>
          <p>${esc(classItem.teacher || 'Teacher')}</p>
          <div class="class-badges">
            <span class="pill purple">${(classItem.assignments || []).length} items</span>
          </div>
          ${(classItem.assignments || []).length ? (classItem.assignments || []).map((assignment) => `
            <div class="task">
              <span>${esc(assignment.title)}</span>
              <small>${esc(assignment.type || 'Assignment')} · ${assignment.dueDate}</small>
            </div>
          `).join('') : '<div class="empty small">No assignments yet.</div>'}
          <div style="margin-top:12px;">
            <button class="primary wide" data-add-class="${classItem.id}">+ Add assignment</button>
          </div>
        </div>
      `).join('') || '<div class="empty">No classes yet.</div>'}
    </div>
  `;
}

function renderFlashcards() {
  return `
    <div class="page-head">
      <h2>Flashcards</h2>
      <button class="primary" data-action="addFlashcardSet">+ New set</button>
    </div>
    <div class="grid three">
      ${(data.flashcards || []).map((set, index) => `
        <div class="card deck-card">
          <div class="section-title">
            <h3>${esc(set.name)}</h3>
            <span class="pill purple">${(set.cards || []).length}</span>
          </div>
          <p class="muted">${(set.cards || []).length} cards in this set</p>
          <div class="deck-actions">
            <button class="primary" data-study-set="${index}">Study set</button>
            <button class="btn" data-edit-set="${index}">Edit</button>
            <button class="btn" data-add-card-set="${index}">+ Add card</button>
          </div>
        </div>
      `).join('') || '<div class="empty">No flashcard sets yet.</div>'}
    </div>
  `;
}

function renderNotes() {
  return `
    <div class="page-head">
      <h2>Notes</h2>
      <button class="primary" data-action="addNote">+ New note</button>
    </div>
    <div class="notes-list">
      ${(data.notes || []).map((note, index) => `
        <div class="card note-card">
          <div class="section-title">
            <h3>${esc(note.title)}</h3>
            <button class="link-btn" data-delete-note="${index}">Delete</button>
          </div>
          <p>${esc(note.body)}</p>
        </div>
      `).join('') || '<div class="empty">No notes yet.</div>'}
    </div>
  `;
}

function renderInbox() {
  return `
    <div class="page-head">
      <h2>Inbox</h2>
      <button class="primary" data-action="composeMessage">+ New message</button>
    </div>
    <div class="card">
      ${(data.messages || []).length ? (data.messages || []).map((message) => `
        <div class="message">
          <div class="avatar">${esc((message.from || 'A')[0].toUpperCase())}</div>
          <div class="message-copy">
            <b>${esc(message.from || 'Unknown')}</b>
            <p>${esc(message.body || '')}</p>
          </div>
          <small>${esc(message.time || 'Now')}</small>
        </div>
      `).join('') : '<div class="empty">No messages yet.</div>'}
    </div>
  `;
}

function renderPage() {
  const pages = {
    dashboard: renderDashboard,
    calendar: renderCalendar,
    classes: renderClasses,
    flashcards: renderFlashcards,
    notes: renderNotes,
    inbox: renderInbox
  };

  $('#pageContent').innerHTML = pages[currentPage]();
  $('#pageTitle').textContent = {
    dashboard: 'Good morning, Hailey ✦',
    calendar: 'Your calendar',
    classes: 'My classes',
    flashcards: 'Flashcards',
    notes: 'Your notes',
    inbox: 'Inbox'
  }[currentPage];

  $$('[data-page]').forEach((button) => {
    button.classList.toggle('active', button.dataset.page === currentPage);
  });

  bindPageActions();
}

function openSetEditor(index, addMode = false) {
  const existing = index === null ? null : (data.flashcards || [])[index];
  let cards = existing ? existing.cards.map((card) => ({ front: card.front || '', back: card.back || '' })) : [{ front: '', back: '' }];

  if (addMode && existing) {
    cards.push({ front: '', back: '' });
  }

  const renderEditor = () => {
    const setName = existing ? existing.name : '';
    openModal(`
      <h2>${existing ? 'Edit flashcard set' : 'Create flashcard set'}</h2>
      <form id="flashSetForm" class="sheet-form">
        <label>Set name
          <input name="name" value="${esc(setName)}" required>
        </label>
        <div class="flashcard-editor-list">
          ${cards.map((card, cardIndex) => `
            <div class="flashcard-editor-row">
              <div class="editor-row-top">
                <strong>Card ${cardIndex + 1}</strong>
                <button type="button" class="link-btn remove-card-btn" data-remove-card="${cardIndex}">Remove</button>
              </div>
              <label>Front / question
                <textarea name="front-${cardIndex}" data-front-input="${cardIndex}">${esc(card.front)}</textarea>
              </label>
              <label>Back / answer
                <textarea name="back-${cardIndex}" data-back-input="${cardIndex}">${esc(card.back)}</textarea>
              </label>
            </div>
          `).join('')}
        </div>
        <button type="button" class="btn add-card-row" id="addCardRow">+ Add card</button>
        <button class="primary wide" style="margin-top:12px">Save set</button>
      </form>
    `);

    $('#addCardRow').onclick = () => {
      cards.push({ front: '', back: '' });
      renderEditor();
    };

    $$('.remove-card-btn').forEach((button) => {
      button.onclick = () => {
        const removeIndex = Number(button.dataset.removeCard);
        cards.splice(removeIndex, 1);
        if (!cards.length) cards.push({ front: '', back: '' });
        renderEditor();
      };
    });

    $('#flashSetForm').onsubmit = (event) => {
      event.preventDefault();
      const form = new FormData(event.target);
      const name = String(form.get('name') || '').trim();
      const cleanCards = [];
      let i = 0;
      while (form.has(`front-${i}`) || form.has(`back-${i}`)) {
        const front = String(form.get(`front-${i}`) || '').trim();
        const back = String(form.get(`back-${i}`) || '').trim();
        if (front && back) cleanCards.push({ front, back });
        i += 1;
      }

      if (!name || !cleanCards.length) {
        toast('Please add a set name and at least one complete card.');
        return;
      }

      const nextSet = {
        id: existing ? existing.id : uid('set'),
        name,
        cards: cleanCards
      };

      if (index === null) {
        (data.flashcards || []).push(nextSet);
      } else {
        data.flashcards[index] = nextSet;
      }

      save();
      closeModal();
      renderPage();
      toast('Flashcard set saved!');
    };
  };

  renderEditor();
}

function openStudyModal(setIndex) {
  const set = (data.flashcards || [])[setIndex];
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
        <textarea readonly>${esc(flipped ? (card.back || '') : (card.front || ''))}</textarea>
      </div>
      <div class="flashcard-actions" style="margin-top:12px;display:flex;justify-content:space-between;gap:8px;">
        <button class="btn" id="flipCardBtn">Flip</button>
        <button class="primary" id="nextCardBtn">Next</button>
      </div>
    `);

    $('#flipCardBtn').onclick = () => {
      flipped = !flipped;
      showCard();
    };

    $('#nextCardBtn').onclick = () => {
      cardIndex = (cardIndex + 1) % set.cards.length;
      flipped = false;
      showCard();
    };
  };

  showCard();
}

function assignmentForm(date, classId) {
  openModal(`
    <h2>Add assignment</h2>
    <form id="assignmentForm" class="sheet-form">
      <label>Class
        <select name="classId">
          ${(data.classes || []).map((classItem) => `
            <option value="${classItem.id}" ${classItem.id === classId ? 'selected' : ''}>${esc(classItem.name)}</option>
          `).join('')}
        </select>
      </label>
      <label>Title
        <input name="title" required placeholder="Read chapter 5">
      </label>
      <label>Due date
        <input type="date" name="dueDate" value="${date || dateKey(new Date())}" required>
      </label>
      <label>Type
        <select name="type">
          <option>Assignment</option>
          <option>Homework</option>
          <option>Quiz</option>
          <option>Project</option>
        </select>
      </label>
      <button class="primary wide">Add assignment</button>
    </form>
  `);

  $('#assignmentForm').onsubmit = (event) => {
    event.preventDefault();
    const form = new FormData(event.target);
    const classIdValue = String(form.get('classId'));
    const myClass = (data.classes || []).find((classItem) => classItem.id === classIdValue);
    if (!myClass) return;

    myClass.assignments = myClass.assignments || [];
    myClass.assignments.push({
      id: uid('assignment'),
      title: String(form.get('title') || '').trim(),
      dueDate: String(form.get('dueDate') || dateKey(new Date())),
      type: String(form.get('type') || 'Assignment')
    });

    save();
    closeModal();
    renderPage();
    toast('Assignment added!');
  };
}

function bindPageActions() {
  $$('[data-page]').forEach((button) => {
    button.onclick = () => {
      currentPage = button.dataset.page;
      renderPage();
    };
  });

  $$('[data-task]').forEach((checkbox) => {
    checkbox.onchange = () => {
      const index = Number(checkbox.dataset.task);
      (data.tasks || [])[index].done = checkbox.checked;
      save();
      renderPage();
    };
  });

  $$('[data-delete-note]').forEach((button) => {
    button.onclick = () => {
      const index = Number(button.dataset.deleteNote);
      (data.notes || []).splice(index, 1);
      save();
      renderPage();
    };
  });

  $$('[data-study-set]').forEach((button) => {
    button.onclick = () => openStudyModal(Number(button.dataset.studySet));
  });

  $$('[data-edit-set]').forEach((button) => {
    button.onclick = () => openSetEditor(Number(button.dataset.editSet));
  });

  $$('[data-add-card-set]').forEach((button) => {
    button.onclick = () => openSetEditor(Number(button.dataset.addCardSet), true);
  });

  $$('[data-action]').forEach((button) => {
    button.onclick = () => {
      const action = button.dataset.action;
      if (action === 'addTask') {
        openModal(`
          <h2>Add a task</h2>
          <form id="taskForm" class="sheet-form">
            <label>Task
              <input name="text" required placeholder="Read chapter 5">
            </label>
            <label>Tag
              <input name="tag" placeholder="Biology">
            </label>
            <button class="primary wide">Add task</button>
          </form>
        `);

        $('#taskForm').onsubmit = (event) => {
          event.preventDefault();
          const form = new FormData(event.target);
          (data.tasks || []).push({
            text: String(form.get('text') || '').trim(),
            tag: String(form.get('tag') || 'General').trim(),
            done: false
          });
          save();
          closeModal();
          renderPage();
          toast('Task added!');
        };
      }

      if (action === 'timer') {
        if (timerInt) {
          clearInterval(timerInt);
          timerInt = null;
          $('#timerDisplay').textContent = formatTime(timerSeconds);
        } else {
          timerInt = setInterval(() => {
            timerSeconds -= 1;
            if (timerSeconds <= 0) {
              clearInterval(timerInt);
              timerInt = null;
              timerSeconds = 25 * 60;
              toast('Time is up! Great work.');
            }
            if ($('#timerDisplay')) {
              $('#timerDisplay').textContent = formatTime(timerSeconds);
            }
          }, 1000);
        }
        renderPage();
      }

      if (action === 'prevMonth') {
        calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1);
        renderPage();
      }

      if (action === 'nextMonth') {
        calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
        renderPage();
      }

      if (action === 'addClass') {
        openModal(`
          <h2>Create a class</h2>
          <form id="classForm" class="sheet-form">
            <label>Class name
              <input name="name" required placeholder="Chemistry">
            </label>
            <label>Teacher
              <input name="teacher" placeholder="Mr. Lee">
            </label>
            <button class="primary wide">Create class</button>
          </form>
        `);

        $('#classForm').onsubmit = (event) => {
          event.preventDefault();
          const form = new FormData(event.target);
          (data.classes || []).push({
            id: uid('class'),
            name: String(form.get('name') || '').trim(),
            teacher: String(form.get('teacher') || 'Teacher').trim(),
            color: '#8b7cf6',
            assignments: []
          });
          save();
          closeModal();
          renderPage();
          toast('Class created!');
        };
      }

      if (action === 'addFlashcardSet') {
        openSetEditor(null);
      }

      if (action === 'addNote') {
        openModal(`
          <h2>New note</h2>
          <form id="noteForm" class="sheet-form">
            <label>Title
              <input name="title" required>
            </label>
            <label>Note
              <textarea name="body" required></textarea>
            </label>
            <button class="primary wide">Save note</button>
          </form>
        `);

        $('#noteForm').onsubmit = (event) => {
          event.preventDefault();
          const form = new FormData(event.target);
          (data.notes || []).unshift({
            id: uid('note'),
            title: String(form.get('title') || '').trim(),
            body: String(form.get('body') || '').trim()
          });
          save();
          closeModal();
          renderPage();
          toast('Note saved!');
        };
      }

      if (action === 'composeMessage') {
        openModal(`
          <h2>New message</h2>
          <form id="messageForm" class="sheet-form">
            <label>To
              <input name="from" required>
            </label>
            <label>Message
              <textarea name="body" required></textarea>
            </label>
            <button class="primary wide">Send</button>
          </form>
        `);

        $('#messageForm').onsubmit = (event) => {
          event.preventDefault();
          const form = new FormData(event.target);
          (data.messages || []).unshift({
            id: uid('message'),
            from: String(form.get('from') || '').trim(),
            body: String(form.get('body') || '').trim(),
            time: 'Now'
          });
          save();
          closeModal();
          renderPage();
          toast('Message sent!');
        };
      }
    };
  });

  $$('[data-add-date]').forEach((button) => {
    button.onclick = () => assignmentForm(button.dataset.addDate);
  });

  $$('[data-add-class]').forEach((button) => {
    button.onclick = () => {
      const classId = button.dataset.addClass;
      assignmentForm(dateKey(new Date()), classId);
    };
  });
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
  renderPage();
};

$('#logoutBtn').onclick = () => {
  localStorage.removeItem('bloomUser');
  location.reload();
};

$('#quickAdd').onclick = () => {
  currentPage = 'calendar';
  renderPage();
};

$('#closeModal').onclick = closeModal;
$('#modal').onclick = (event) => {
  if (event.target.id === 'modal') closeModal();
};

$('#themeBtn').onclick = () => document.body.classList.toggle('dark');

if (localStorage.getItem('bloomUser')) {
  $('#loginScreen').classList.add('hidden');
  $('#app').classList.remove('hidden');
  const user = localStorage.getItem('bloomUser');
  $('#userName').textContent = user.split('@')[0];
  $('#avatar').textContent = user[0].toUpperCase();
}

renderPage();
