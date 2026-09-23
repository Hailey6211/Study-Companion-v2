(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

  function saveAndRefresh(message) {
    localStorage.setItem('bloomData', JSON.stringify(data));
    renderPage();
    if (typeof toast === 'function') toast(message);
  }

  function deleteWithConfirmation(message, callback) {
    if (window.confirm(message)) callback();
  }

  function addDeleteButton(parent, label, action, className = 'delete-content') {
    if (!parent || parent.querySelector(`[data-delete-action="${action}"]`)) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.dataset.deleteAction = action;
    button.textContent = 'Delete';
    button.title = `Delete ${label}`;
    parent.appendChild(button);
  }

  function decorate() {
    // Flashcard sets.
    $$('.deck-card').forEach((card, index) => {
      addDeleteButton(card.querySelector('.deck-actions'), 'flashcard set', `set-${index}`);
    });

    // Classes and the assignments inside each class.
    $$('.class-card').forEach((card, classIndex) => {
      addDeleteButton(card, 'class', `class-${classIndex}`, 'delete-content class-delete');
      $$('.task', card).forEach((assignmentRow, assignmentIndex) => {
        addDeleteButton(assignmentRow, 'assignment', `assignment-${classIndex}-${assignmentIndex}`, 'delete-content assignment-delete');
      });
    });

    // Notes are the editable information cards. Existing note delete buttons remain unchanged.
    $$('.note-card').forEach((card, index) => {
      addDeleteButton(card, 'note', `note-${index}`, 'delete-content note-delete');
    });

    // Inbox information/messages.
    $$('.message').forEach((message, index) => {
      addDeleteButton(message, 'message', `message-${index}`, 'delete-content message-delete');
    });

    // Dashboard tasks.
    $$('.task').forEach((task, index) => {
      if (task.closest('.class-card') || task.closest('.calendar-wrap')) return;
      addDeleteButton(task, 'task', `task-${index}`, 'delete-content task-delete');
    });

    // Calendar events and upcoming assignment rows.
    $$('.event').forEach((event, index) => {
      addDeleteButton(event, 'assignment', `event-${index}`, 'delete-content assignment-delete');
    });
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-delete-action]');
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    const action = button.dataset.deleteAction;

    if (action.startsWith('set-')) {
      const index = Number(action.split('-')[1]);
      deleteWithConfirmation('Delete this flashcard set?', () => {
        data.flashcards.splice(index, 1);
        saveAndRefresh('Flashcard set deleted.');
      });
    } else if (action.startsWith('class-')) {
      const index = Number(action.split('-')[1]);
      deleteWithConfirmation(`Delete ${data.classes[index]?.name || 'this class'} and its assignments?`, () => {
        data.classes.splice(index, 1);
        saveAndRefresh('Class deleted.');
      });
    } else if (action.startsWith('assignment-')) {
      const [, classIndex, assignmentIndex] = action.split('-').map(Number);
      deleteWithConfirmation('Delete this assignment?', () => {
        data.classes[classIndex].assignments.splice(assignmentIndex, 1);
        saveAndRefresh('Assignment deleted.');
      });
    } else if (action.startsWith('note-')) {
      const index = Number(action.split('-')[1]);
      deleteWithConfirmation('Delete this note?', () => {
        data.notes.splice(index, 1);
        saveAndRefresh('Note deleted.');
      });
    } else if (action.startsWith('message-')) {
      const index = Number(action.split('-')[1]);
      deleteWithConfirmation('Delete this message?', () => {
        data.messages.splice(index, 1);
        saveAndRefresh('Message deleted.');
      });
    } else if (action.startsWith('task-')) {
      const index = Number(action.split('-')[1]);
      deleteWithConfirmation('Delete this task?', () => {
        data.tasks.splice(index, 1);
        saveAndRefresh('Task deleted.');
      });
    } else if (action.startsWith('event-')) {
      const eventIndex = Number(action.split('-')[1]);
      const events = allAssignments();
      const assignment = events[eventIndex];
      if (!assignment) return;
      deleteWithConfirmation('Delete this assignment?', () => {
        const classItem = data.classes.find((classEntry) => classEntry.id === assignment.classId || classEntry.name === assignment.className);
        const assignmentIndex = classItem?.assignments.findIndex((item) => item.id === assignment.id || item.title === assignment.title);
        if (classItem && assignmentIndex >= 0) {
          classItem.assignments.splice(assignmentIndex, 1);
          saveAndRefresh('Assignment deleted.');
        }
      });
    }
  }, true);

  const observer = new MutationObserver(() => decorate());
  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener('load', decorate);
  setTimeout(decorate, 0);
})();
