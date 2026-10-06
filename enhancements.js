/* Study Bloom interaction enhancements: real current-month calendar, day add buttons, and card editor */
(function () {
  const extraCss = `
    .calendar-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:18px}.calendar-toolbar h2{font:600 22px Fredoka;margin:0}.calendar-day{min-height:112px;box-sizing:border-box}.flashcard-editor{padding:12px 0}.flashcard-editor-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px}.flashcard-editor-heading h2{margin:0;font-size:28px;font-family:Fredoka}.flashcard-set-title{width:100%;padding:12px 14px;border-radius:12px;border:1px solid var(--line);font-size:16px;margin-bottom:12px}.deck-card.new-card{border:2px dashed var(--line)}.mini-assignment{padding:8px 12px;border-radius:8px;margin-top:4px;font-size:11px;line-height:1.4}.mini-assignment strong{display:block;margin-bottom:2px}
  `;
  const style = document.createElement('style'); style.textContent = extraCss; document.head.appendChild(style);

  function iso(y,m,d){return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;}
  function todayKey(){const d=new Date();return iso(d.getFullYear(),d.getMonth(),d.getDate());}
  function assignRows(){return state.classes.flatMap(cls=>(cls.assignments||[]).map(a=>({...a,classId:cls.id,className:cls.name,classColor:cls.color})));}
  function addAssignmentModal(date, classId){
    const options=state.classes.map(c=>`<option value="${c.id}" ${c.id===classId?'selected':''}>${escapeHtml(c.name)}</option>`).join('');
    openModal(`<h2>Add assignment</h2><p class="calendar-help">It will appear on the selected day and under its class.</p><form id="enhancedAssignmentForm" class="sheet-form"><label>Class<select name="classId" required>${options}</select></label><label>Title<input name="title" placeholder="Assignment name" required></label><label>Due date<input name="dueDate" type="date" value="${date}" required></label><button type="submit" class="primary wide">Add</button></form>`);
    $('#enhancedAssignmentForm').onsubmit=e=>{e.preventDefault();const v=Object.fromEntries(new FormData(e.target));const c=state.classes.find(x=>x.id===v.classId);if(!c)return;c.assignments=c.assignments||[];c.assignments.push({id:Date.now(),title:v.title,dueDate:v.dueDate});saveState();renderPage();closeModal();};
  }
  renderCalendar=function(){
    const y=currentCalendarMonth.getFullYear(),m=currentCalendarMonth.getMonth(),label=currentCalendarMonth.toLocaleString('en-US',{month:'long',year:'numeric'}),first=new Date(y,m,1).getDay(),days=new Date(y,m+1,0).getDate(),rows=assignRows();
    let cells='';for(const dayName of['Sun','Mon','Tue','Wed','Thu','Fri','Sat'])cells+=`<span>${dayName}</span>`;
    for(let i=0;i<first;i++)cells+='<div class="calendar-empty"></div>';
    for(let d=1;d<=days;d++){const key=iso(y,m,d), items=rows.filter(a=>a.dueDate===key), isToday=key===todayKey();cells+=`<div class="calendar-day ${isToday?'today':''}"><div class="day-number"><b>${d}</b></div><div class="day-events">${items.map(a=>`<div class="event" style="background:${a.classColor||'var(--primary)'}"><small>${escapeHtml(a.className)}</small>${escapeHtml(a.title)}</div>`).join('')}</div><button class="day-add" data-enhanced-add="${key}" title="Add">+</button></div>`;}
    const upcoming=rows.sort((a,b)=>a.dueDate.localeCompare(b.dueDate)).slice(0,8).map(a=>`<div class="mini-assignment" style="border-left:4px solid ${a.classColor||'var(--primary)'}"><strong>${escapeHtml(a.className)}</strong>${escapeHtml(a.title)} — ${a.dueDate}</div>`).join('');
    return `<div class="page-head"><h2>Calendar</h2><button class="primary" data-enhanced-add="${todayKey()}">+ Add assignment</button></div><div class="calendar-wrap"><div class="card"><div class="calendar-grid">${cells}</div></div><div class="card"><h3>Upcoming</h3>${upcoming||'<p class="muted">No assignments yet</p>'}</div></div>`;
  };

  function openDeckEditor(deck){
    let cards=(deck?.cards||[]).map(c=>({front:c.front||'',back:c.back||''}));if(!cards.length)cards=[{front:'',back:''}];
    let deckTitle=deck?.title||'';
    const render=()=>{
      const cardList=cards.map((c,i)=>`<div class="flashcard-editor-row"><div class="editor-row-top"><strong>Card ${i+1}</strong><button type="button" class="delete-btn remove-card" onclick="this.closest('.flashcard-editor-row').remove()" title="Remove card"></button></div><textarea placeholder="Front" required>${c.front}</textarea><textarea placeholder="Back" required>${c.back}</textarea></div>`).join('');
      openModal(`<div class="flashcard-editor"><div class="flashcard-editor-heading"><h2>${deck?'Edit':'New'} flashcard set</h2><span class="pill purple">${cards.length} cards</span></div><input class="flashcard-set-title" type="text" id="deckTitle" placeholder="Set title (e.g., Biology 101)" value="${deckTitle}" required /><form id="flashcardEditorForm" class="sheet-form"><div class="flashcard-editor-list">${cardList}</div><button type="button" onclick="this.closest('#flashcardEditorForm').insertAdjacentHTML('beforeend','<div class=\"flashcard-editor-row\"><div class=\"editor-row-top\"><strong>Card ' + (cards.length+1) + '</strong><button type=\"button\" class=\"delete-btn remove-card\" onclick=\"this.closest(\\\\.flashcard-editor-row\\\\).remove()\" title=\"Remove card\"></button></div><textarea placeholder=\"Front\" required></textarea><textarea placeholder=\"Back\" required></textarea></div>')" class="btn" style="width:100%;margin-bottom:12px;">+ Add card</button><button type="submit" class="primary wide">${deck?'Save':'Create'} set</button></form></div>`);
      $('#flashcardEditorForm').onsubmit=e=>{e.preventDefault();deckTitle=$('#deckTitle').value.trim();if(!deckTitle){alert('Please enter a set title');return;}const newCards=[];$$('#flashcardEditorForm .flashcard-editor-row').forEach(row=>{const front=row.querySelector('textarea:first-of-type').value;const back=row.querySelector('textarea:last-of-type').value;if(front||back)newCards.push({front,back});});if(!newCards.length){alert('Add at least one card');return;}if(deck){deck.title=deckTitle;deck.cards=newCards;}else{state.flashcardSets=state.flashcardSets||[];state.flashcardSets.push({id:Date.now(),title:deckTitle,cards:newCards});}saveState();renderPage();closeModal();};
    };
    render();
  }
  function flashcardAction(button){const deck=state.flashcardSets.find(d=>d.id===Number(button.dataset.deckId));if(deck)openDeckEditor(deck);}
  const oldHandleAction=handleAction;
  handleAction=function(e){const b=e.currentTarget;if(b.dataset.enhancedAdd){addAssignmentModal(b.dataset.enhancedAdd);return;}if(b.dataset.action==='addFlashcardSet'){openDeckEditor(null);return;}if(b.dataset.deckId){flashcardAction(b);return;}oldHandleAction.call(this,e);};
  const oldRenderFlashcards=renderFlashcards;
  renderFlashcards=function(){return `<div class="page-head"><h2>Flashcard sets</h2><button class="primary" data-action="addFlashcardSet">+ New set</button></div><div class="grid three">${state.flashcardSets.map(d=>`<div class="deck-card"><h3>${escapeHtml(d.title||'Untitled')}</h3><p class="muted">${d.cards.length} cards</p><div class="deck-actions"><button class="btn" data-deck-id="${d.id}">Study</button><button class="primary" data-deck-id="${d.id}" data-edit="true">Edit</button></div></div>`).join('')||'<p class="empty">No flashcard sets yet. Create one to get started!</p>'}</div>`;};
  $$('#pageContent').forEach(el=>el.addEventListener('click',e=>{const deckIdBtn=e.target.closest('[data-deck-id]');if(deckIdBtn){flashcardAction(deckIdBtn);return;}const enhancedAddBtn=e.target.closest('[data-enhanced-add]');if(enhancedAddBtn){e.preventDefault();e.stopImmediatePropagation();addAssignmentModal(enhancedAddBtn.dataset.enhancedAdd);}}));
  const oldRenderPage=renderPage;renderPage=function(){oldRenderPage();if(currentPage==='calendar'){$$('[data-enhanced-add]').forEach(b=>b.onclick=e=>{e.preventDefault();addAssignmentModal(b.dataset.enhancedAdd);});}};
  $('#quickAdd').onclick=()=>{currentPage='calendar';renderPage();setTimeout(()=>addAssignmentModal(todayKey()),0);};
  renderPage();
})();
