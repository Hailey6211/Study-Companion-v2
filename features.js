(function () {
  const STORE = 'bloomData';
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const load = () => { try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch { return {}; } };
  const save = (value) => localStorage.setItem(STORE, JSON.stringify(value));
  const id = () => `card-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;

  const css = document.createElement('style');
  css.textContent = `.calendar-grid{border:1px solid var(--line);border-radius:14px;overflow:hidden;gap:0!important}.calendar-grid>span{border-right:1px solid var(--line);border-bottom:1px solid var(--line);padding:12px 6px}.calendar-grid>span:nth-child(7n){border-right:0}.calendar-day,.calendar-empty{border:0!important;border-right:1px solid var(--line)!important;border-bottom:1px solid var(--line)!important;border-radius:0!important}.calendar-day:nth-child(7n),.calendar-empty:nth-child(7n){border-right:0!important}.calendar-day:nth-last-child(-n+7),.calendar-empty:nth-last-child(-n+7){border-bottom:0!important}.edit-card-list{display:grid;gap:14px}.edit-card-row{border:1px solid var(--line);border-radius:18px;padding:14px;background:var(--bg)}.edit-card-row h4{margin:0 0 10px}.edit-card-row label{display:grid;gap:6px;margin:8px 0}.edit-card-row textarea{min-height:74px}.remove-card{color:#bd5a73;background:transparent}.add-card-button{margin-top:10px}`;
  document.head.appendChild(css);

  function editor(setIndex) {
    const data = load();
    data.cards = Array.isArray(data.cards) ? data.cards : [];
    const existing = setIndex === null ? null : data.cards[setIndex];
    let cards = existing?.items ? existing.items.map((item) => ({front:item[0] || '', back:item[1] || ''})) : (existing?.cards || []).map((card) => ({front:card.front || '', back:card.back || ''}));
    if (!cards.length) cards = [{front:'', back:''}];
    const render = () => {
      openModal(`<h2>${existing ? 'Edit' : 'Create'} flashcard set</h2><form id="cardEditor"><label>Set title<input name="title" required value="${esc(existing?.name || '')}" placeholder="Biology review"></label><div class="edit-card-list">${cards.map((card,index)=>`<div class="edit-card-row"><div style="display:flex;justify-content:space-between;align-items:center"><h4>Card ${index+1}</h4><button type="button" class="remove-card" data-remove="${index}">Remove</button></div><label>Front / question<textarea data-front="${index}" required>${esc(card.front)}</textarea></label><label>Back / answer<textarea data-back="${index}" required>${esc(card.back)}</textarea></label></div>`).join('')}</div><button type="button" class="btn add-card-button" id="addCard">+ Add card to set</button><button class="primary wide" style="margin-top:12px">Save set</button></form>`);
      $$('[data-remove]').forEach((button) => button.onclick = () => { cards.splice(Number(button.dataset.remove), 1); if (!cards.length) cards.push({front:'',back:''}); render(); });
      $('#addCard').onclick = () => { cards.push({front:'',back:''}); render(); };
      $('#cardEditor').onsubmit = (event) => { event.preventDefault(); const form = new FormData(event.target); cards.forEach((card,index) => { card.front = form.get(`front-${index}`) || document.querySelector(`[data-front="${index}"]`).value; card.back = form.get(`back-${index}`) || document.querySelector(`[data-back="${index}"]`).value; }); const title = form.get('title'); const result = cards.filter((card) => card.front.trim() && card.back.trim()); if (!result.length) return; if (existing) { existing.name = title; existing.cards = result; delete existing.items; } else data.cards.push({name:title, cards:result}); save(data); closeModal(); if (typeof render === 'function') window.render(); };
    };
    render();
  }

  function openModal(html) { $('#modalContent').innerHTML = html; $('#modal').classList.remove('hidden'); }
  function closeModal() { $('#modal').classList.add('hidden'); }

  function decorateFlashcards() {
    if (typeof currentPage !== 'undefined' && currentPage !== 'flashcards') return;
    const cards = load().cards || [];
    $$('[data-study]').forEach((button, index) => {
      if (button.dataset.enhanced) return;
      button.dataset.enhanced = 'true';
      const edit = document.createElement('button');
      edit.className = 'btn'; edit.textContent = 'Edit'; edit.dataset.editSet = index;
      button.parentElement.appendChild(edit);
    });
  }

  document.addEventListener('click', (event) => {
    const edit = event.target.closest('[data-edit-set]');
    if (edit) { event.preventDefault(); event.stopImmediatePropagation(); editor(Number(edit.dataset.editSet)); return; }
    const newSet = event.target.closest('[data-action="addSet"]');
    if (newSet) { event.preventDefault(); event.stopImmediatePropagation(); editor(null); return; }
  }, true);

  const oldRender = window.render;
  if (typeof oldRender === 'function') {
    window.render = function () { oldRender(); setTimeout(decorateFlashcards, 0); };
  }
  setTimeout(decorateFlashcards, 100);
})();
