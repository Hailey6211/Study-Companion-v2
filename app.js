const STORAGE_KEY = 'studyBloomData';
const THEME_KEY = 'studyBloomTheme';
const DARK_KEY = 'studyBloomDark';

const clone = (value) => JSON.parse(JSON.stringify(value));

const defaultData = {
  user: { name: 'Hailey', email: 'hailey@example.com' },
  tasks: [
    { id: 't1', text: 'Review biology chapter 4', tag: 'Biology', done: false },
    { id: 't2', text: 'Finish history essay outline', tag: 'History', done: true },
    { id: 't3', text: 'Practice Spanish vocabulary', tag: 'Spanish', done: false }
  ],
  notes: [
    { id: 'n1', title: 'Study tip', body: 'Use 25-minute focus sprints and short breaks to stay energized.' },
    { id: 'n2', title: 'Math reminder', body: 'Rework the quadratic formula examples before the quiz on Friday.' }
  ],
  classes: [
    {
      id: 'c1',
      name: 'Biology',
      teacher: 'Dr. Morgan',
      color: '#8b7cf6',
      assignments: [
        { id: 'a1', title: 'Chapter 4 quiz', type: 'Quiz', dueDate: getISODateOffset(1), notes: 'Review photosynthesis diagram.' },
        { id: 'a2', title: 'Lab write-up', type: 'Homework', dueDate: getISODateOffset(4), notes: 'Turn in the microscope summary.' }
      ]
    },
    {
      id: 'c2',
      name: 'History',
      teacher: 'Ms. Rivera',
      color: '#f6a977',
      assignments: [
        { id: 'a3', title: 'Essay outline', type: 'Assignment', dueDate: getISODateOffset(2), notes: 'Include causes and consequences.' }
      ]
    },
    {
      id: 'c3',
      name: 'Spanish',
      teacher: 'Señora Cruz',
      color: '#7ecbb8',
      assignments: [
        { id: 'a4', title: 'Vocabulary practice', type: 'Practice', dueDate: getISODateOffset(3), notes: 'Memorize 20 verbs.' }
      ]
    }
  ],
  flashcardSets: [
    {
      id: 'f1',
      name: 'Biology Basics',
      cards: [
        { front: 'What is photosynthesis?', back: 'The process by which plants turn light into chemical energy.' },
        { front: 'What is a cell?', back: 'The basic unit of life.' },
        { front: 'What is DNA?', back: 'The molecule that carries genetic information.' }
      ]
    },
    {
      id: 'f2',
      name: 'Spanish Verbs',
      cards: [
        { front: '¿Cómo se dice “to study”?', back: 'estudiar' },
        { front: '¿Cómo se dice “homework”?', back: 'la tarea' }
      ]
    }
  ],
  messages: [
    { id: 'm1', from: 'Maya', body: 'Want to study for the history quiz together later?', time: 'Today, 6:00 PM' },
    { id: 'm2', from: 'Theo', body: 'I shared my biology notes with you.', time: 'Yesterday' }
  ]
};

let currentPage = 'dashboard';
let currentCalendarMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let timerInterval = null;
let timerSeconds = 25 * 60;
let timerRunning = false;

function getISODateOffset(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return clone(defaultData);
  try {
    const parsed = JSON.parse(saved);
    const merged = clone(defaultData);
    return { ...merged, ...parsed, classes: parsed.classes || merged.classes, tasks: parsed.tasks || merged.tasks, notes: parsed.notes || merged.notes, flashcardSets: parsed.flashcardSets || merged.flashcardSets, messages: parsed.messages || merged.messages };
  } catch (error) {
    return clone(defaultData);
  }
}

let state = loadState();

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2600);
}

function openModal(html) {
  $('#modalContent').innerHTML = html;
  $('#modal').classList.remove('hidden');
}

function closeModal() {
  $('#modal').classList.add('hidden');
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getAllAssignments() {
  return state.classes.flatMap((cls) =>
    cls.assignments.map((assignment) => ({
      ...assignment,
      classId: cls.id,
      className: cls.name,
      classColor: cls.color
    }))
  );
}

function getUpcomingAssignments() {
  return getAllAssignments().sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
}

function getMonthlyAssignments(date) {
  const month = date.getMonth();
  const year = date.getFullYear();
  return getAllAssignments().filter((assignment) => {
    const assignmentDate = new Date(assignment.dueDate + 'T00:00:00');
    return assignmentDate.getMonth() === month && assignmentDate.getFullYear() === year;
  });
}

function renderDashboard() {
  const totalTasks = state.tasks.length;
  const completedTasks = state.tasks.filter((task) => task.done).length;
  const totalAssignments = getAllAssignments().length;
  const nextAssignment = getUpcomingAssignments()[0];
  const progressPercent = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return `
    <div class="grid two">
      <div class="card welcome">
        <span class="eyebrow">TODAY'S VIBE</span>
        <h2>Small steps, big progress.</h2>
        <p>You are building momentum. Keep your goals calm, clear, and consistent.</p>
        <div class="plant">🌱</div>
      </div>

      <div class="card">
        <div class="section-title">
          <h3>Progress</h3>
          <span class="pill purple">${progressPercent}% complete</span>
        </div>
        <div class="progress-bar"><i style="width:${progressPercent}%"></i></div>
        <p class="muted">${completedTasks} of ${totalTasks} tasks are done.</p>
        <div class="mini-stack">
          <div class="mini-row"><span>Next assignment</span><strong>${nextAssignment ? escapeHtml(nextAssignment.title) : 'None'}</strong></div>
          <div class="mini-row"><span>Classes</span><strong>${state.classes.length}</strong></div>
        </div>
      </div>
    </div>

    <div class="grid three" style="margin-top:18px">
      <div class="card stat">
        <div class="stat-icon mint">✓</div>
        <div>
          <b>${completedTasks}</b>
          <small>Tasks done</small>
        </div>
      </div>
      <div class="card stat">
        <div class="stat-icon peach">◷</div>
        <div>
          <b>25:00</b>
          <small>Study timer</small>
        </div>
      </div>
      <div class="card stat">
        <div class="stat-icon blue">✦</div>
        <div>
          <b>${totalAssignments}</b>
          <small>Assignments</small>
        </div>
      </div>
    </div>

    <div class="grid two" style="margin-top:18px">
      <div class="card">
        <div class="section-title">
          <h3>My tasks</h3>
          <button class="link-btn" data-action="addTask">+ Add task</button>
        </div>
        ${state.tasks.length ? state.tasks.map((task, index) => `
          <label class="task ${task.done ? 'done' : ''}">
            <input type="checkbox" data-task-toggle="${index}" ${task.done ? 'checked' : ''}>
            <span>${escapeHtml(task.text)}</span>
            <small>${escapeHtml(task.tag)}</small>
          </label>
        `).join('') : '<div class="empty">No tasks yet.</div>'}
      </div>

      <div class="card">
        <div class="section-title">
          <h3>Study timer</h3>
          <span class="pill green">Focus</span>
        </div>
        <div class="timer-box">
          <div id="timerDisplay" class="timer-display">25:00</div>
          <p class="muted">A calm rhythm can help you learn better.</p>
          <button class="primary wide" data-action="toggleTimer">${timerRunning ? 'Pause timer' : 'Start timer'}</button>
        </div>
      </div>
    </div>
  `;
}

function renderCalendar() {
  const monthLabel = currentCalendarMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const monthStart = new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth(), 1);
  const firstWeekday = monthStart.getDay();
  const daysInMonth = new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth() + 1, 0).getDate();
  const assignments = getMonthlyAssignments(currentCalendarMonth);

  const cells = [];
  for (let i = 0; i < firstWeekday; i += 1) {
    cells.push('<div class="calendar-empty"></div>');
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateKey = `${currentCalendarMonth.getFullYear()}-${String(currentCalendarMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayAssignments = assignments.filter((assignment) => assignment.dueDate === dateKey);
    const isToday = new Date().toISOString().split('T')[0] === dateKey;
    const eventMarkup = dayAssignments.length
      ? dayAssignments.map((assignment) => `
          <span class="calendar-event" style="background:${assignment.classColor};">
            ${escapeHtml(assignment.title)}
          </span>
        `).join('')
      : '';

    cells.push(`
      <div class="calendar-day ${isToday ? 'today' : ''}">
        <div class="day-number">${day}</div>
        <div class="day-events">${eventMarkup}</div>
      </div>
    `);
  }

  const upcoming = getUpcomingAssignments().slice(0, 6).map((assignment) => `
    <div class="mini-assignment" style="border-left:4px solid ${assignment.classColor};">
      <strong>${escapeHtml(assignment.title)}</strong>
      <span>${escapeHtml(assignment.className)} • ${escapeHtml(assignment.type)}</span>
      <small>${new Date(assignment.dueDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</small>
    </div>
  `).join('') || '<div class="empty">No upcoming assignments.</div>';

  return `
    <div class="page-head">
      <h2>Calendar</h2>
      <button class="primary" data-action="addAssignment">+ Add assignment</button>
    </div>

    <div class="calendar-wrap">
      <div class="card">
        <div class="calendar-header">
          <button class="soft-btn" data-action="prevMonth">←</button>
          <h3>${monthLabel}</h3>
          <button class="soft-btn" data-action="nextMonth">→</button>
        </div>
        <div class="calendar-grid">
          <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
          ${cells.join('')}
        </div>
      </div>

      <div class="card">
        <div class="section-title">
          <h3>Upcoming</h3>
          <span class="pill purple">${getUpcomingAssignments().length}</span>
        </div>
        ${upcoming}
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
    <div class="class-grid">
      ${state.classes.map((cls) => `
        <div class="card class-card" style="border-left: 5px solid ${cls.color};">
          <div class="class-topline">
            <div>
              <h3>${escapeHtml(cls.name)}</h3>
              <small>${escapeHtml(cls.teacher)}</small>
            </div>
            <span class="pill" style="background:${cls.color}22; color:${cls.color};">${cls.assignments.length} items</span>
          </div>

          <div class="assignment-list">
            ${cls.assignments.length ? cls.assignments.map((assignment) => `
              <div class="assignment-item">
                <div>
                  <strong>${escapeHtml(assignment.title)}</strong>
                  <small>${escapeHtml(assignment.type)} • ${new Date(assignment.dueDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</small>
                </div>
              </div>
            `).join('') : '<div class="empty small">No assignments yet.</div>'}
          </div>

          <div class="card-actions">
            <button class="btn" data-action="addAssignmentToClass" data-class-id="${cls.id}">+ Assignment</button>
            <button class="btn danger" data-action="deleteClass" data-class-id="${cls.id}">Delete</button>
          </div>
        </div>
      `).join('') || '<div class="empty">No classes yet.</div>'}
    </div>
  `;
}

function renderFlashcards() {
  return `
    <div class="page-head">
      <h2>Flashcard sets</h2>
      <button class="primary" data-action="addFlashcardSet">+ New set</button>
    </div>
    <div class="grid three">
      ${state.flashcardSets.map((deck) => `
        <div class="card deck-card">
          <div class="section-title">
            <h3>${escapeHtml(deck.name)}</h3>
            <span class="pill purple">${deck.cards.length} cards</span>
          </div>
          <p class="muted">Flip through your prompts and answers.</p>
          <button class="primary wide" data-action="studyDeck" data-deck-id="${deck.id}">Study set →</button>
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
    <div class="notes-grid">
      ${state.notes.map((note) => `
        <div class="card note-card">
          <div class="section-title">
            <h3>${escapeHtml(note.title)}</h3>
            <button class="link-btn" data-action="deleteNote" data-note-id="${note.id}">Delete</button>
          </div>
          <p>${escapeHtml(note.body)}</p>
        </div>
      `).join('') || '<div class="empty">No notes yet.</div>'}
    </div>
  `;
}

function renderInbox() {
  return `
    <div class="page-head">
      <h2>Inbox</h2>
      <button class="primary" data-action="composeMessage">✎ New message</button>
    </div>
    <div class="card">
      ${state.messages.length ? state.messages.map((message) => `
        <div class="message-item">
          <div class="avatar small">${escapeHtml(message.from.charAt(0).toUpperCase())}</div>
          <div class="message-copy">
            <b>${escapeHtml(message.from)}</b>
            <p>${escapeHtml(message.body)}</p>
          </div>
          <small>${escapeHtml(message.time)}</small>
        </div>
      `).join('') : '<div class="empty">No messages yet.</div>'}
    </div>
  `;
}

function renderPage() {
  const pageRenderer = {
    dashboard: renderDashboard,
    calendar: renderCalendar,
    classes: renderClasses,
    flashcards: renderFlashcards,
    notes: renderNotes,
    inbox: renderInbox
  };

  const pageTitleMap = {
    dashboard: 'Good morning, ' + state.user.name + ' ✦',
    calendar: 'Your calendar',
    classes: 'My classes',
    flashcards: 'Flashcards',
    notes: 'Your notes',
    inbox: 'Inbox'
  };

  $('#pageTitle').textContent = pageTitleMap[currentPage] || 'Study Bloom';
  $('#pageContent').innerHTML = pageRenderer[currentPage] ? pageRenderer[currentPage]() : renderDashboard();
  bindActionButtons();
  bindTaskToggles();
  updateInboxBadge();
}

function bindActionButtons() {
  $$('[data-action]').forEach((button) => {
    button.onclick = handleAction;
  });
}

function bindTaskToggles() {
  $$('[data-task-toggle]').forEach((checkbox) => {
    checkbox.onchange = (event) => {
      const index = Number(event.target.getAttribute('data-task-toggle'));
      state.tasks[index].done = event.target.checked;
      saveState();
      renderPage();
    };
  });
}

function updateInboxBadge() {
  const badge = $('#inboxBadge');
  if (!badge) return;
  badge.textContent = String(state.messages.length);
}

function startTimer() {
  if (timerRunning) {
    clearInterval(timerInterval);
    timerInterval = null;
    timerRunning = false;
    updateTimerDisplay();
    renderPage();
    return;
  }

  timerRunning = true;
  timerInterval = setInterval(() => {
    if (timerSeconds <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      timerRunning = false;
      timerSeconds = 25 * 60;
      showToast('Focus session complete!');
      updateTimerDisplay();
      renderPage();
      return;
    }

    timerSeconds -= 1;
    updateTimerDisplay();
  }, 1000);

  updateTimerDisplay();
  renderPage();
}

function updateTimerDisplay() {
  const timerDisplay = $('#timerDisplay');
  if (!timerDisplay) return;
  const minutes = String(Math.floor(timerSeconds / 60)).padStart(2, '0');
  const seconds = String(timerSeconds % 60).padStart(2, '0');
  timerDisplay.textContent = `${minutes}:${seconds}`;
}

function handleAction(event) {
  const button = event.currentTarget;
  const action = button.dataset.action;

  if (!action) return;

  switch (action) {
    case 'addTask': {
      openModal(`
        <h2>Add a task</h2>
        <form id="taskForm" class="sheet-form">
          <label>Task <input name="text" required placeholder="Study chapter 5"></label>
          <label>Category <input name="tag" placeholder="Math"></label>
          <button class="primary wide" type="submit">Save task</button>
        </form>
      `);
      $('#taskForm').addEventListener('submit', (formEvent) => {
        formEvent.preventDefault();
        const formData = new FormData(formEvent.target);
        const payload = Object.fromEntries(formData.entries());
        state.tasks.unshift({
          id: 'task-' + Date.now(),
          text: payload.text,
          tag: payload.tag || 'General',
          done: false
        });
        saveState();
        closeModal();
        renderPage();
        showToast('Task added.');
      });
      break;
    }

    case 'addClass': {
      openModal(`
        <h2>Create a class</h2>
        <form id="classForm" class="sheet-form">
          <label>Class name <input name="name" required placeholder="Chemistry"></label>
          <label>Teacher <input name="teacher" placeholder="Mr. Lee"></label>
          <label>Color
            <select name="color">
              <option value="#8b7cf6">Lavender</option>
              <option value="#f6a977">Peach</option>
              <option value="#7ecbb8">Mint</option>
              <option value="#86b6ff">Sky</option>
              <option value="#f7a8d2">Pink</option>
              <option value="#f9d76d">Sun</option>
            </select>
          </label>
          <button class="primary wide" type="submit">Create class</button>
        </form>
      `);
      $('#classForm').addEventListener('submit', (formEvent) => {
        formEvent.preventDefault();
        const formData = new FormData(formEvent.target);
        const payload = Object.fromEntries(formData.entries());
        state.classes.push({
          id: 'class-' + Date.now(),
          name: payload.name,
          teacher: payload.teacher || 'Teacher',
          color: payload.color || '#8b7cf6',
          assignments: []
        });
        saveState();
        closeModal();
        renderPage();
        showToast('Class created.');
      });
      break;
    }

    case 'deleteClass': {
      const classId = button.dataset.classId;
      state.classes = state.classes.filter((cls) => cls.id !== classId);
      saveState();
      renderPage();
      break;
    }

    case 'addAssignment': {
      const selectOptions = state.classes.map((cls) => `<option value="${cls.id}">${escapeHtml(cls.name)}</option>`).join('');
      openModal(`
        <h2>Add assignment</h2>
        <form id="assignmentForm" class="sheet-form">
          <label>Class
            <select name="classId" required>
              ${selectOptions}
            </select>
          </label>
          <label>Assignment title <input name="title" required placeholder="Essay draft"></label>
          <label>Type
            <select name="type">
              <option>Assignment</option>
              <option>Homework</option>
              <option>Quiz</option>
              <option>Project</option>
              <option>Reading</option>
              <option>Practice</option>
            </select>
          </label>
          <label>Due date <input type="date" name="dueDate" required></label>
          <label>Notes <textarea name="notes" placeholder="Optional details"></textarea></label>
          <button class="primary wide" type="submit">Add to calendar</button>
        </form>
      `);
      $('#assignmentForm').addEventListener('submit', (formEvent) => {
        formEvent.preventDefault();
        const formData = new FormData(formEvent.target);
        const payload = Object.fromEntries(formData.entries());
        const targetClass = state.classes.find((cls) => cls.id === payload.classId);
        if (!targetClass) return;

        targetClass.assignments.push({
          id: 'assignment-' + Date.now(),
          title: payload.title,
          type: payload.type || 'Assignment',
          dueDate: payload.dueDate,
          notes: payload.notes || ''
        });
        saveState();
        closeModal();
        renderPage();
        showToast('Assignment added.');
      });
      break;
    }

    case 'addAssignmentToClass': {
      const classId = button.dataset.classId;
      const selectOptions = state.classes.map((cls) => `<option value="${cls.id}" ${cls.id === classId ? 'selected' : ''}>${escapeHtml(cls.name)}</option>`).join('');
      openModal(`
        <h2>Add assignment to class</h2>
        <form id="assignmentToClassForm" class="sheet-form">
          <label>Class
            <select name="classId" required>
              ${selectOptions}
            </select>
          </label>
          <label>Assignment title <input name="title" required placeholder="Essay draft"></label>
          <label>Type
            <select name="type">
              <option>Assignment</option>
              <option>Homework</option>
              <option>Quiz</option>
              <option>Project</option>
              <option>Reading</option>
              <option>Practice</option>
            </select>
          </label>
          <label>Due date <input type="date" name="dueDate" required></label>
          <label>Notes <textarea name="notes" placeholder="Optional details"></textarea></label>
          <button class="primary wide" type="submit">Save</button>
        </form>
      `);
      $('#assignmentToClassForm').addEventListener('submit', (formEvent) => {
        formEvent.preventDefault();
        const formData = new FormData(formEvent.target);
        const payload = Object.fromEntries(formData.entries());
        const targetClass = state.classes.find((cls) => cls.id === payload.classId);
        if (!targetClass) return;
        targetClass.assignments.push({
          id: 'assignment-' + Date.now(),
          title: payload.title,
          type: payload.type || 'Assignment',
          dueDate: payload.dueDate,
          notes: payload.notes || ''
        });
        saveState();
        closeModal();
        renderPage();
        showToast('Assignment saved.');
      });
      break;
    }

    case 'addNote': {
      openModal(`
        <h2>New note</h2>
        <form id="noteForm" class="sheet-form">
          <label>Title <input name="title" required></label>
          <label>Note <textarea name="body" required></textarea></label>
          <button class="primary wide" type="submit">Save note</button>
        </form>
      `);
      $('#noteForm').addEventListener('submit', (formEvent) => {
        formEvent.preventDefault();
        const formData = new FormData(formEvent.target);
        const payload = Object.fromEntries(formData.entries());
        state.notes.unshift({
          id: 'note-' + Date.now(),
          title: payload.title,
          body: payload.body
        });
        saveState();
        closeModal();
        renderPage();
        showToast('Note saved.');
      });
      break;
    }

    case 'deleteNote': {
      const noteId = button.dataset.noteId;
      state.notes = state.notes.filter((note) => note.id !== noteId);
      saveState();
      renderPage();
      break;
    }

    case 'addFlashcardSet': {
      openModal(`
        <h2>New flashcard set</h2>
        <form id="deckForm" class="sheet-form">
          <label>Set name <input name="name" required placeholder="Biology vocabulary"></label>
          <label>Cards<br><textarea name="cards" placeholder="Front :: Back\nWhat is a cell? :: The basic unit of life."></textarea></label>
          <button class="primary wide" type="submit">Save set</button>
        </form>
      `);
      $('#deckForm').addEventListener('submit', (formEvent) => {
        formEvent.preventDefault();
        const formData = new FormData(formEvent.target);
        const payload = Object.fromEntries(formData.entries());
        const parsedCards = (payload.cards || '')
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line) => {
            const [front, ...rest] = line.split('::');
            return { front: front.trim(), back: rest.join('::').trim() };
          })
          .filter((card) => card.front && card.back);

        state.flashcardSets.push({
          id: 'deck-' + Date.now(),
          name: payload.name,
          cards: parsedCards
        });
        saveState();
        closeModal();
        renderPage();
        showToast('Flashcard set added.');
      });
      break;
    }

    case 'studyDeck': {
      const deckId = button.dataset.deckId;
      const deck = state.flashcardSets.find((item) => item.id === deckId);
      if (!deck || !deck.cards.length) {
        showToast('This deck is empty.');
        return;
      }

      let index = 0;
      let showingBack = false;

      const renderCard = () => {
        const card = deck.cards[index];
        openModal(`
          <div class="study-deck-wrap">
            <div class="section-title">
              <h2>${escapeHtml(deck.name)}</h2>
              <span class="pill purple">${index + 1}/${deck.cards.length}</span>
            </div>
            <div class="study-card" data-side="${showingBack ? 'back' : 'front'}" id="studyCard">
              <strong>${showingBack ? 'Answer' : 'Question'}</strong>
              <p>${escapeHtml(showingBack ? card.back : card.front)}</p>
            </div>
            <div class="card-actions">
              <button class="btn" id="flipCard">Flip</button>
              <button class="btn" id="nextCard">Next</button>
            </div>
          </div>
        `);

        $('#flipCard').onclick = () => {
          showingBack = !showingBack;
          renderCard();
        };

        $('#nextCard').onclick = () => {
          index = (index + 1) % deck.cards.length;
          showingBack = false;
          renderCard();
        };
      };

      renderCard();
      break;
    }

    case 'composeMessage': {
      openModal(`
        <h2>Send message</h2>
        <form id="messageForm" class="sheet-form">
          <label>To <input name="to" required placeholder="Maya"></label>
          <label>Message <textarea name="body" required placeholder="Study with me after class?"></textarea></label>
          <button class="primary wide" type="submit">Send</button>
        </form>
      `);
      $('#messageForm').addEventListener('submit', (formEvent) => {
        formEvent.preventDefault();
        const formData = new FormData(formEvent.target);
        const payload = Object.fromEntries(formData.entries());
        state.messages.unshift({
          id: 'msg-' + Date.now(),
          from: payload.to,
          body: payload.body,
          time: 'Now'
        });
        saveState();
        closeModal();
        renderPage();
        showToast('Message sent.');
      });
      break;
    }

    case 'toggleTimer': {
      startTimer();
      break;
    }

    case 'prevMonth': {
      currentCalendarMonth = new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth() - 1, 1);
      renderPage();
      break;
    }

    case 'nextMonth': {
      currentCalendarMonth = new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth() + 1, 1);
      renderPage();
      break;
    }
  }
}

function bindSidebarNavigation() {
  $$('.nav-item').forEach((button) => {
    button.onclick = () => {
      currentPage = button.dataset.page;
      renderPage();
    };
  });
}

function initializeTheme() {
  const darkMode = localStorage.getItem(DARK_KEY) === 'true';
  document.body.classList.toggle('dark', darkMode);
  const selectedTheme = localStorage.getItem(THEME_KEY) || '#8b7cf6';
  document.documentElement.style.setProperty('--primary', selectedTheme);
  document.documentElement.style.setProperty('--primary-dark', mixHex(selectedTheme, '#1a1a1a', 0.25));
}

function mixHex(hex1, hex2, weight) {
  const color1 = hex1.replace('#', '');
  const color2 = hex2.replace('#', '');
  const newColor = [0, 1, 2].map((index) => {
    const value1 = parseInt(color1.substr(index * 2, 2), 16);
    const value2 = parseInt(color2.substr(index * 2, 2), 16);
    const mixed = Math.round(value1 * (1 - weight) + value2 * weight);
    return mixed.toString(16).padStart(2, '0');
  }).join('');
  return '#' + newColor;
}

$('#loginForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const emailInput = $('#loginEmail');
  const email = emailInput.value.trim();
  if (!email) return;

  state.user.email = email;
  state.user.name = email.split('@')[0].replace(/[._-]/g, ' ');
  state.user.name = state.user.name.charAt(0).toUpperCase() + state.user.name.slice(1);

  localStorage.setItem('studyBloomLoggedIn', 'true');
  saveState();
  $('#loginScreen').classList.add('hidden');
  $('#app').classList.remove('hidden');
  $('#userName').textContent = state.user.name;
  $('#avatar').textContent = state.user.name.charAt(0).toUpperCase();
  renderPage();
});

$('#logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('studyBloomLoggedIn');
  $('#app').classList.add('hidden');
  $('#loginScreen').classList.remove('hidden');
});

$('#themeBtn').addEventListener('click', () => {
  const isDark = document.body.classList.toggle('dark');
  localStorage.setItem(DARK_KEY, String(isDark));
});

$('#themePickerBtn').addEventListener('click', () => {
  const palette = ['#8b7cf6', '#f6a977', '#7ecbb8', '#86b6ff', '#f7a8d2', '#f9d76d', '#ff9fb7'];
  openModal(`
    <h2>Choose a color</h2>
    <div class="palette-grid">
      ${palette.map((color) => `
        <button class="palette-swatch" data-theme-color="${color}" style="background:${color};"></button>
      `).join('')}
    </div>
  `);

  $$('.palette-swatch').forEach((button) => {
    button.onclick = () => {
      const selected = button.dataset.themeColor;
      document.documentElement.style.setProperty('--primary', selected);
      document.documentElement.style.setProperty('--primary-dark', mixHex(selected, '#1a1a1a', 0.2));
      localStorage.setItem(THEME_KEY, selected);
      closeModal();
      showToast('Theme updated.');
    };
  });
});

$('#quickAdd').addEventListener('click', () => {
  currentPage = 'classes';
  renderPage();
  setTimeout(() => {
    const firstAddButton = document.querySelector('[data-action="addAssignmentToClass"]');
    if (firstAddButton) firstAddButton.click();
  }, 50);
});

$('#closeModal').addEventListener('click', closeModal);
$('#modal').addEventListener('click', (event) => {
  if (event.target.id === 'modal') closeModal();
});

function initializeLoginState() {
  const loggedIn = localStorage.getItem('studyBloomLoggedIn') === 'true';
  if (loggedIn) {
    $('#loginScreen').classList.add('hidden');
    $('#app').classList.remove('hidden');
    $('#userName').textContent = state.user.name;
    $('#avatar').textContent = state.user.name.charAt(0).toUpperCase();
  }
}

initializeTheme();
initializeLoginState();
renderPage();
updateTimerDisplay();
bindSidebarNavigation();
