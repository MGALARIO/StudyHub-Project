// StudyHub Dashboard JavaScript - Complete Implementation
// Initialize Feather icons when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  try { 
    if (window.feather) feather.replace(); 
  } catch(e) { 
    console.warn('Feather icons failed to load', e); 
  }
});

document.addEventListener('DOMContentLoaded', () => {
  // --- NAVIGATION SYSTEM ---
  const sections = document.querySelectorAll('[data-section-content]');
  const sectionTitle = document.getElementById('sectionTitle');
  const sectionSubtitle = document.getElementById('sectionSubtitle');

  // Wire up navigation for both desktop sidebar and mobile menu
  function wireNav() {
    document.querySelectorAll('.nav-link[data-section]').forEach(a => {
      a.addEventListener('click', (e) => { 
        e.preventDefault(); 
        showSection(a.dataset.section); 
      });
    });
    // Mobile navigation links
    document.querySelectorAll('.offcanvas [data-section]').forEach(a => {
      a.addEventListener('click', (e) => { 
        e.preventDefault(); 
        showSection(a.dataset.section); 
      });
    });
  }

  // Show specific section and update UI accordingly
  function showSection(name) {
    // Show/hide content sections
    sections.forEach(s => s.style.display = (s.dataset.sectionContent === name ? '' : 'none'));
    
    // Update active navigation states
    document.querySelectorAll('.nav-link[data-section]').forEach(a => 
      a.classList.toggle('active', a.dataset.section === name)
    );
    document.querySelectorAll('.offcanvas [data-section]').forEach(a => 
      a.classList.toggle('active', a.dataset.section === name)
    );
    
    // Update page titles
    if (name === 'dashboard') { 
      sectionTitle.textContent = 'Dashboard'; 
      sectionSubtitle.textContent = 'Overview — quick glance'; 
    }
    if (name === 'notes') { 
      sectionTitle.textContent = 'Notes & Tasks'; 
      sectionSubtitle.textContent = 'Manage tasks and set repeating alarms'; 
    }
    if (name === 'meetings') { 
      sectionTitle.textContent = 'Meetings'; 
      sectionSubtitle.textContent = 'Start or join study calls'; 
    }
    if (name === 'music') { 
      sectionTitle.textContent = 'Live Radio'; 
      sectionSubtitle.textContent = 'Play, Listen, Relax and Enjoy!'; 
    }
    if (name === 'youtube') { 
      sectionTitle.textContent = 'YouTube'; 
      sectionSubtitle.textContent = 'Search videos quickly'; 
    }
    
    // Handle iframe placement for meetings
    handleIframePlacement(name);

    // Close mobile menu if open
    const mobileSidebar = document.getElementById('mobileSidebar');
    if (mobileSidebar && mobileSidebar.classList.contains('show')) {
      const offcanvasInstance = bootstrap.Offcanvas.getInstance(mobileSidebar);
      if (offcanvasInstance) offcanvasInstance.hide();
    }

    // Auto-focus appropriate inputs
    setTimeout(() => {
      if (name === 'notes') document.getElementById('titleInput')?.focus();
      if (name === 'meetings') document.getElementById('roomInput')?.focus();
      if (name === 'youtube') document.getElementById('ytSearch')?.focus();
    }, 200);
  }

  wireNav();
  
  // --- QUICK ACTION BUTTONS ---
  // These provide shortcuts to common actions
  document.getElementById('startMeetBtn')?.addEventListener('click', e => { 
    e.preventDefault(); 
    showSection('meetings'); 
    setTimeout(() => startMeeting(), 100);
  });

  // --- NOTE FORM TOGGLE ---
  // Show/hide the note creation form
  const noteFormWrap = document.getElementById('noteFormWrap');
  const toggleNoteFormBtn = document.getElementById('toggleNoteFormBtn');
  
  function toggleNoteForm(show) {
    if (!noteFormWrap) return;
    if (show === undefined) {
      show = noteFormWrap.style.display === 'none';
    }
    noteFormWrap.style.display = show ? '' : 'none';
    if (show) document.getElementById('titleInput')?.focus();
  }
  
  toggleNoteFormBtn?.addEventListener('click', () => toggleNoteForm());

  // --- CLOCK AND CALENDAR WIDGETS ---
  // Real-time clock display
  function updateClock() {
    const now = new Date();
    const clockEl = document.getElementById('clock');
    const dateEl = document.getElementById('date');
    if (clockEl) clockEl.textContent = now.toLocaleTimeString();
    if (dateEl) dateEl.textContent = now.toLocaleDateString(undefined, {
      weekday: "long", 
      year: "numeric", 
      month: "long", 
      day: "numeric"
    });
  }
  
  updateClock();
  setInterval(updateClock, 1000);

  // Mini calendar widget
  function renderMiniCalendar() {
    const today = new Date();
    const month = today.getMonth();
    const year = today.getFullYear();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthName = today.toLocaleString(undefined, { month: 'long' });
    
    let html = `<div class="mb-2 text-center"><strong>${monthName} ${year}</strong></div>`;
    html += `<table class="table table-sm"><thead><tr>`;
    ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(d => html += `<th>${d}</th>`);
    html += `</tr></thead><tbody><tr>`;
    
    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) html += `<td></td>`;
    
    // Calendar days
    for (let d = 1; d <= daysInMonth; d++) {
      const isToday = d === today.getDate();
      html += `<td class="${isToday ? 'today' : ''}">${d}</td>`;
      if ((d + firstDay) % 7 === 0) html += `</tr><tr>`;
    }
    html += `</tr></tbody></table>`;
    
    const el = document.getElementById('miniCalendar');
    if (el) el.innerHTML = html;
  }
  
  renderMiniCalendar();

  // --- WEATHER WIDGET ---
  // Display current weather using OpenWeatherMap API
  const weatherBox = document.getElementById('weather');
  const OPENWEATHER_API = "2f916c415ef8bb8eb43cf1fe69a59d66";
  const fallbackCity = "London";

  function renderWeather(data) {
    if (!weatherBox) return;
    if (!data || !data.main) { 
      weatherBox.textContent = "⚠️ Weather unavailable"; 
      return; 
    }
    const temp = Math.round(data.main.temp);
    const desc = data.weather[0].description;
    const city = data.name;
    const icon = data.weather[0].icon;
    weatherBox.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;justify-content:center">
        <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${desc}" style="width:56px;height:56px">
        <div style="text-align:left;">
          <div style="font-weight:700">${city}</div>
          <div class="small-muted">${temp}°C — ${desc}</div>
        </div>
      </div>
    `;
  }

  function getWeatherByCoords(lat, lon) {
    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API}&units=metric`)
      .then(r => r.json())
      .then(renderWeather)
      .catch(() => weatherBox && (weatherBox.textContent = "⚠️ Weather unavailable"));
  }

  function getWeatherByCity(city) {
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${OPENWEATHER_API}&units=metric`)
      .then(r => r.json())
      .then(renderWeather)
      .catch(() => weatherBox && (weatherBox.textContent = "⚠️ Weather unavailable"));
  }

  // Try to get location, fallback to default city
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => getWeatherByCoords(pos.coords.latitude, pos.coords.longitude),
      () => getWeatherByCity(fallbackCity),
      { timeout: 6000 }
    );
  } else {
    getWeatherByCity(fallbackCity);
  }

  // --- NOTES AND TASK MANAGEMENT SYSTEM ---
  // Core elements for note management
  const noteForm = document.getElementById('noteForm');
  const titleInput = document.getElementById('titleInput');
  const contentInput = document.getElementById('contentInput');
  const deadlineInput = document.getElementById('deadlineInput');
  const alarmToggle = document.getElementById('alarmToggle');
  const notesList = document.getElementById('notesList');
  const editingIdInput = document.getElementById('editingId');

  // Data storage - using localStorage for persistence
  let notes = JSON.parse(localStorage.getItem('studyhub_notes') || '[]');
  let missedHistory = JSON.parse(localStorage.getItem('studyhub_missed') || '[]');
  const activeAlarms = new Map();

  // Utility functions
  function saveNotes() { 
    localStorage.setItem('studyhub_notes', JSON.stringify(notes)); 
  }
  
  function saveMissed() { 
    localStorage.setItem('studyhub_missed', JSON.stringify(missedHistory)); 
  }
  
  function escapeHtml(s) { 
    return (s || '').toString()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;'); 
  }

  // Determine task status based on deadline and current time
  function getTaskStatus(note) {
    if (!note.deadline) return { key: 'upcoming', label: 'Upcoming' };
    const now = new Date();
    const dl = new Date(note.deadline);
    if (dl > now) return { key: 'upcoming', label: 'Upcoming' };
    const diffMin = (now - dl) / 60000;
    if (diffMin <= 5) return { key: 'due', label: 'Due now' };
    if (note.alarmAcknowledged) return { key: 'dismissed', label: 'Dismissed' };
    return { key: 'missed', label: 'Missed' };
  }

  // Render all notes in the notes list
  function renderNotes() {
    if (!notesList) return;
    notesList.innerHTML = '';
    
    if (!notes.length) { 
      notesList.innerHTML = `<div class="small-muted">No notes yet — create one from the form above.</div>`; 
      renderMissedHistory(); 
      return; 
    }
    
    // Sort notes by deadline (soonest first)
    const sorted = [...notes].sort((a, b) => {
      if (!a.deadline && !b.deadline) return 0;
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline) - new Date(b.deadline);
    });
    
    sorted.forEach(note => {
      const status = getTaskStatus(note);
      const card = document.createElement('div');
      card.className = 'note-card card-ui mb-2';
      card.id = `task-${note.id}`;
      
      const deadlineHtml = note.deadline ? 
        `<div class="meta">Deadline: ${new Date(note.deadline).toLocaleString()}</div>` : '';
      const alarmBadge = note.alarmEnabled ? 
        `<span class="badge bg-danger ms-2">Alarm</span>` : '';
      
      let actionHtml = '';
      if (note.alarmActive) {
        actionHtml = `<button class="btn btn-sm btn-warning mb-1" data-dismiss="${note.id}">Dismiss</button>`;
      } else {
        actionHtml = `<button class="btn btn-sm btn-outline-primary mb-1" data-edit="${note.id}">Edit</button>`;
      }
      
      card.innerHTML = `
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:.6rem">
            <div style="font-weight:700;word-break:break-word;">${escapeHtml(note.title)}</div>
            ${alarmBadge}
            <div class="ms-2 small-muted">(${status.label})</div>
          </div>
          <div style="margin-top:.4rem; color:var(--muted);">${escapeHtml(note.content || '')}</div>
          ${deadlineHtml}
        </div>
        <div style="min-width:92px;text-align:right">
          ${actionHtml}<br />
          <button class="btn btn-sm btn-outline-danger" data-del="${note.id}">Delete</button>
        </div>
      `;
      notesList.appendChild(card);
    });
    renderMissedHistory();
  }

  // Handle note form submission (create/edit)
  noteForm?.addEventListener('submit', e => {
    e.preventDefault();
    const title = titleInput.value.trim();
    if (!title) return alert('Please enter a title.');
    
    const content = contentInput.value.trim();
    const deadline = deadlineInput.value ? new Date(deadlineInput.value).toISOString() : null;
    const alarmEnabled = !!alarmToggle.checked;
    const editingId = editingIdInput.value;
    
    if (editingId) {
      // Edit existing note
      notes = notes.map(n => (String(n.id) === String(editingId) ? 
        { ...n, title, content, deadline, alarmEnabled, alarmAcknowledged: false, alarmActive: false } : n));
      editingIdInput.value = '';
    } else {
      // Create new note
      notes.push({ 
        id: Date.now(), 
        title, 
        content, 
        deadline, 
        alarmEnabled, 
        alarmAcknowledged: false, 
        alarmActive: false 
      });
    }
    
    saveNotes(); 
    noteForm.reset(); 
    toggleNoteForm(false); 
    renderNotes(); 
    updateAnnouncements();
  });

  // Handle note actions (edit/delete/dismiss)
  notesList?.addEventListener('click', e => {
    const editId = e.target.getAttribute('data-edit');
    const delId = e.target.getAttribute('data-del');
    const dismissId = e.target.getAttribute('data-dismiss');
    
    if (delId) {
      // Delete note
      stopAlarmForNote(delId); 
      notes = notes.filter(n => String(n.id) !== String(delId)); 
      saveNotes(); 
      renderNotes(); 
      updateAnnouncements();
    } else if (editId) {
      // Edit note - populate form
      const n = notes.find(x => String(x.id) === String(editId)); 
      if (!n) return;
      titleInput.value = n.title; 
      contentInput.value = n.content || ''; 
      deadlineInput.value = n.deadline ? new Date(n.deadline).toISOString().slice(0, 16) : ''; 
      alarmToggle.checked = !!n.alarmEnabled; 
      editingIdInput.value = n.id;
      stopAlarmForNote(n.id); 
      n.alarmActive = false; 
      saveNotes(); 
      renderNotes();
      toggleNoteForm(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (dismissId) {
      // Dismiss alarm
      acknowledgeAlarm(dismissId);
    }
  });

  // --- ALARM SYSTEM ---
  // Request notification permissions
  function ensureNotificationPermission() { 
    if (!("Notification" in window)) return Promise.resolve(false); 
    if (Notification.permission === "granted") return Promise.resolve(true); 
    if (Notification.permission === "denied") return Promise.resolve(false); 
    return Notification.requestPermission().then(p => p === "granted"); 
  }

  // Trigger alarm for overdue task
  function triggerAlarmForNote(note) {
    if (note.alarmAcknowledged) return;
    note.alarmActive = true; 
    saveNotes(); 
    renderNotes();
    
    // Play alarm sound
    let entry = activeAlarms.get(String(note.id));
    if (!entry) {
      const audioEl = document.getElementById('alarmAudio')?.cloneNode(true);
      if (audioEl) {
        audioEl.id = 'alarmAudio_' + note.id; 
        audioEl.loop = true;
        audioEl.play().catch(() => {}); 
        document.body.appendChild(audioEl);
        activeAlarms.set(String(note.id), { audioEl });
      }
    } else { 
      try { entry.audioEl.play().catch(() => {}); } catch(e) {} 
    }
    
    // Show browser notification
    ensureNotificationPermission().then(granted => {
      if (granted) {
        try {
          const notif = new Notification('StudyHub Reminder', { 
            body: `${note.title} — ${note.deadline ? new Date(note.deadline).toLocaleString() : 'due now'}`, 
            tag: 'studyhub-reminder-' + note.id, 
            renotify: true 
          });
          notif.onclick = () => { 
            window.focus(); 
            notif.close(); 
            showSection('notes'); 
            const el = document.getElementById('task-' + note.id); 
            if (el) el.scrollIntoView({ behavior: 'smooth' }); 
          };
        } catch(e) {}
      }
    });
  }

  // Stop alarm for specific note
  function stopAlarmForNote(noteId) {
    const entry = activeAlarms.get(String(noteId));
    if (entry && entry.audioEl) { 
      try { entry.audioEl.pause(); entry.audioEl.currentTime = 0; } catch(e) {} 
      try { if (entry.audioEl.parentNode) entry.audioEl.parentNode.removeChild(entry.audioEl); } catch(e) {} 
    }
    activeAlarms.delete(String(noteId));
    const n = notes.find(x => String(x.id) === String(noteId));
    if (n) { n.alarmActive = false; saveNotes(); renderNotes(); }
  }

  // Acknowledge alarm (stop and mark as dismissed)
  function acknowledgeAlarm(noteId) {
    stopAlarmForNote(noteId);
    const n = notes.find(x => String(x.id) === String(noteId));
    if (n) { 
      n.alarmAcknowledged = true; 
      n.alarmActive = false; 
      saveNotes(); 
      renderNotes(); 
      updateAnnouncements(); 
    }
  }

  // Monitor for due tasks every second
  setInterval(() => {
    const now = new Date();
    notes.forEach(n => {
      if (!n.deadline || !n.alarmEnabled) return;
      if (n.alarmAcknowledged || n.alarmActive) return;
      
      const dl = new Date(n.deadline);
      if (now >= dl) {
        triggerAlarmForNote(n);
        const diffMin = (now - dl) / 60000;
        
        // Add to missed history if overdue by more than 5 minutes
        if (diffMin > 5) {
          if (!missedHistory.some(m => String(m.id) === String(n.id))) {
            missedHistory.unshift({ 
              id: n.id, 
              title: n.title, 
              deadline: n.deadline, 
              missedAt: new Date().toISOString() 
            });
            if (missedHistory.length > 200) missedHistory.pop();
            saveMissed();
          }
        }
      }
    });
  }, 1000);

  // Enable audio autoplay after first user interaction
  function unlockAudioOnce() { 
    const base = document.getElementById('alarmAudio'); 
    if (base) { 
      base.play().then(() => base.pause()).catch(() => {}); 
    } 
    document.removeEventListener('click', unlockAudioOnce); 
  }
  document.addEventListener('click', unlockAudioOnce);

  // --- ANNOUNCEMENTS SYSTEM ---
  // Update dashboard announcements with due/overdue tasks
  const announcementsEl = document.getElementById('announcements');
  
  function updateAnnouncements() {
    if (!announcementsEl) return;
    const now = new Date();
    const items = notes.filter(n => {
      if (!n.deadline) return false;
      const dl = new Date(n.deadline);
      return dl <= now; // Only include due or overdue tasks
    }).map(n => {
      const status = getTaskStatus(n);
      return { id: n.id, title: n.title, status: status.label };
    });
    
    if (items.length === 0) {
      announcementsEl.innerHTML = `<div class="small-muted">No reminders yet — add tasks in Notes & Tasks.</div>`;
    } else {
      announcementsEl.innerHTML = items.map(it => 
        `<div class="announcement mb-2" data-task="${it.id}">${escapeHtml(it.title)} — ${escapeHtml(it.status)}</div>`
      ).join('');
    }
  }
  
  // Click announcements to jump to specific task
  announcementsEl?.addEventListener('click', (e) => {
    const tid = e.target.getAttribute('data-task');
    if (!tid) return;
    showSection('notes');
    setTimeout(() => { 
      const el = document.getElementById('task-' + tid); 
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); 
    }, 300);
  });
  
  setInterval(updateAnnouncements, 15000); // Update every 15 seconds
  updateAnnouncements();

  // --- MISSED HISTORY MANAGEMENT ---
  const missedHistoryEl = document.getElementById('missedHistory');
  
  function renderMissedHistory() {
    if (!missedHistoryEl) return;
    if (missedHistory.length === 0) {
      missedHistoryEl.innerHTML = `<div class="small-muted">No missed tasks yet.</div>`;
      return;
    }
    missedHistoryEl.innerHTML = missedHistory.map(m => 
      `<div style="padding:.35rem 0;">❌ <strong>${escapeHtml(m.title)}</strong> — missed at ${new Date(m.missedAt).toLocaleString()}</div>`
    ).join('');
  }
  
  renderMissedHistory();
  
  document.getElementById('clearMissed')?.addEventListener('click', () => { 
    if (confirm('Clear missed task history?')) { 
      missedHistory = []; 
      saveMissed(); 
      renderMissedHistory(); 
    } 
  });

});

const mobileSidebar = document.getElementById('mobileSidebar');
const mobileOverlay = document.getElementById('mobileOverlay');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');

// Open / Close sidebar
mobileMenuBtn.addEventListener('click', () => {
  mobileSidebar.classList.add('active');
  mobileOverlay.classList.add('active');
});

// Close sidebar on overlay click
mobileOverlay.addEventListener('click', () => {
  mobileSidebar.classList.remove('active');
  mobileOverlay.classList.remove('active');
});

// Optional: close sidebar on ESC key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    mobileSidebar.classList.remove('active');
    mobileOverlay.classList.remove('active');
  }
});
