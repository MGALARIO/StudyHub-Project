// ============================================
// STUDYHUB - COMPLETE FIXED JAVASCRIPT
// Single file, cleaned and optimized
// ============================================

// ============================================
// GLOBAL NAMESPACE - Single object to avoid pollution
// ============================================
const StudyHub = {
  // App state
  notes: [],
  missedHistory: [],
  activeAlarms: new Map(),
  currentSection: 'dashboard',
  meetingActive: false,
  jitsiIframe: null,
  isFloating: false,
  audioUnlocked: false,
  
  // Configuration
  config: {
    OPENWEATHER_API: "2f916c415ef8bb8eb43cf1fe69a59d66", // TODO: Move to backend when learning backend
    YOUTUBE_API: "AIzaSyCEhAQaMVE0_FF9voohcCOmN2xj0bTcF8I", // TODO: Move to backend when learning backend
    STORAGE_KEYS: {
      NOTES: 'studyhub_notes',
      MISSED: 'studyhub_missed',
      THEME: 'studyhub_theme'
    }
  }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function sanitizeRoomName(name) {
  if (!name || !name.trim()) return 'StudyHubRoom';
  return name.trim().replace(/[^A-Za-z0-9_-]/g, '_') || 'StudyHubRoom';
}

// ============================================
// THEME MANAGEMENT
// ============================================
function initTheme() {
  const themeToggle = document.getElementById('themeToggle');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

  function applyTheme(theme, save = true) {
    document.body.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    
    if (themeToggle) {
      themeToggle.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    }
    
    if (save) {
      localStorage.setItem(StudyHub.config.STORAGE_KEYS.THEME, theme);
    }
    
    if (window.feather) {
      setTimeout(() => feather.replace(), 50);
    }
  }

  function loadInitialTheme() {
    const saved = localStorage.getItem(StudyHub.config.STORAGE_KEYS.THEME);
    if (saved) {
      applyTheme(saved, false);
    } else if (prefersDark && prefersDark.matches) {
      applyTheme('dark', false);
    } else {
      applyTheme('light', false);
    }
  }

  if (prefersDark && prefersDark.addEventListener) {
    prefersDark.addEventListener('change', e => {
      const hasSaved = localStorage.getItem(StudyHub.config.STORAGE_KEYS.THEME);
      if (!hasSaved) {
        applyTheme(e.matches ? 'dark' : 'light', false);
      }
    });
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = document.body.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  loadInitialTheme();
}

// ============================================
// NAVIGATION SYSTEM - Single implementation
// ============================================
function showSection(name) {
  const sections = document.querySelectorAll('[data-section-content]');
  const sectionTitle = document.getElementById('sectionTitle');
  const sectionSubtitle = document.getElementById('sectionSubtitle');

  // Show/hide sections
  sections.forEach(s => {
    s.style.display = (s.dataset.sectionContent === name ? '' : 'none');
  });
  
  // Update active states - desktop
  document.querySelectorAll('.nav-link[data-section]').forEach(a => {
    a.classList.toggle('active', a.dataset.section === name);
  });
  
  // Update active states - mobile
  document.querySelectorAll('#mobileSidebar [data-section]').forEach(a => {
    a.classList.toggle('active', a.dataset.section === name);
  });
  
  // Update titles
  const titles = {
    dashboard: { title: 'Dashboard', subtitle: 'Overview — quick glance' },
    notes: { title: 'Notes & Tasks', subtitle: 'Manage tasks and set repeating alarms' },
    meetings: { title: 'Meetings', subtitle: 'Start or join study calls' },
    music: { title: 'Live Radio', subtitle: 'Play, Listen, Relax and Enjoy!' },
    youtube: { title: 'YouTube', subtitle: 'Search videos quickly' }
  };
  
  if (titles[name]) {
    if (sectionTitle) sectionTitle.textContent = titles[name].title;
    if (sectionSubtitle) sectionSubtitle.textContent = titles[name].subtitle;
  }
  
  // Handle iframe placement for meetings
  handleIframePlacement(name);

  // Close mobile menu if open
  const mobileSidebar = document.getElementById('mobileSidebar');
  const mobileOverlay = document.getElementById('mobileOverlay');
  if (mobileSidebar) mobileSidebar.classList.remove('active');
  if (mobileOverlay) mobileOverlay.classList.remove('active');

  // Auto-focus inputs
  setTimeout(() => {
    if (name === 'notes') document.getElementById('titleInput')?.focus();
    if (name === 'meetings') document.getElementById('roomInput')?.focus();
    if (name === 'youtube') document.getElementById('ytSearch')?.focus();
  }, 200);
  
  StudyHub.currentSection = name;
}

function handleIframePlacement(activeSectionName) {
  if (!StudyHub.meetingActive || !StudyHub.jitsiIframe) return;

  const videoContainer = document.getElementById('videoContainer');
  const floatingJitsi = document.getElementById('floatingJitsi');
  const floatingJitsiInner = document.getElementById('floatingJitsiInner');
  const floatBtn = document.getElementById('floatBtn');

  if (activeSectionName === 'meetings') {
    // Dock meeting
    try {
      if (StudyHub.jitsiIframe.parentNode) {
        StudyHub.jitsiIframe.parentNode.removeChild(StudyHub.jitsiIframe);
      }
    } catch (e) {}

    videoContainer.innerHTML = '';
    videoContainer.appendChild(StudyHub.jitsiIframe);
    videoContainer.style.display = 'block';
    
    floatingJitsiInner.innerHTML = '';
    floatingJitsi.style.display = 'none';
    StudyHub.isFloating = false;
    
    if (floatBtn) floatBtn.textContent = '📌 Float';
  } else {
    // Float meeting
    try {
      if (StudyHub.jitsiIframe.parentNode) {
        StudyHub.jitsiIframe.parentNode.removeChild(StudyHub.jitsiIframe);
      }
    } catch (e) {}

    floatingJitsiInner.innerHTML = '';
    floatingJitsiInner.appendChild(StudyHub.jitsiIframe);
    floatingJitsi.style.display = 'flex';
    
    videoContainer.innerHTML = '';
    videoContainer.style.display = 'none';
    StudyHub.isFloating = true;
    
    if (floatBtn) floatBtn.textContent = '📍 Dock';
  }
}

function initNavigation() {
  // Desktop navigation
  document.querySelectorAll('.nav-link[data-section]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      showSection(link.dataset.section);
    });
  });
  
  // Mobile navigation
  document.querySelectorAll('#mobileSidebar [data-section]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      showSection(link.dataset.section);
    });
  });
  
  // Quick Meet button
  const quickMeetBtn = document.getElementById('startMeetBtn');
  if (quickMeetBtn) {
    quickMeetBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showSection('meetings');
      setTimeout(() => startMeeting(), 100);
    });
  }
  
  // View Notes button
  const viewNotesBtn = document.getElementById('viewNotesBtn');
  if (viewNotesBtn) {
    viewNotesBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showSection('notes');
    });
  }
}

// ============================================
// MOBILE MENU
// ============================================
function initMobileMenu() {
  const mobileSidebar = document.getElementById('mobileSidebar');
  const mobileOverlay = document.getElementById('mobileOverlay');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');

  if (!mobileSidebar || !mobileOverlay || !mobileMenuBtn) return;

  mobileMenuBtn.addEventListener('click', () => {
    mobileSidebar.classList.add('active');
    mobileOverlay.classList.add('active');
  });

  mobileOverlay.addEventListener('click', () => {
    mobileSidebar.classList.remove('active');
    mobileOverlay.classList.remove('active');
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileSidebar.classList.contains('active')) {
      mobileSidebar.classList.remove('active');
      mobileOverlay.classList.remove('active');
    }
  });
}

// ============================================
// CLOCK & CALENDAR WIDGETS
// ============================================
function updateClock() {
  const now = new Date();
  const clockEl = document.getElementById('clock');
  const dateEl = document.getElementById('date');
  
  if (clockEl) clockEl.textContent = now.toLocaleTimeString();
  if (dateEl) {
    dateEl.textContent = now.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }
}

function renderMiniCalendar() {
  const calendarEl = document.getElementById('miniCalendar');
  if (!calendarEl) return;

  const today = new Date();
  const month = today.getMonth();
  const year = today.getFullYear();
  const currentDate = today.getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = today.toLocaleString(undefined, { month: 'long' });
  
  let html = `<div class="mb-2 text-center"><strong>${monthName} ${year}</strong></div>`;
  html += `<table class="table table-sm"><thead><tr>`;
  ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(d => html += `<th>${d}</th>`);
  html += `</tr></thead><tbody><tr>`;
  
  for (let i = 0; i < firstDay; i++) html += `<td></td>`;
  
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = d === currentDate;
    html += `<td class="${isToday ? 'today' : ''}">${d}</td>`;
    if ((d + firstDay) % 7 === 0) html += `</tr><tr>`;
  }
  
  html += `</tr></tbody></table>`;
  calendarEl.innerHTML = html;
}

// ============================================
// WEATHER WIDGET
// ============================================
function initWeather() {
  const weatherBox = document.getElementById('weather');
  if (!weatherBox) return;

  weatherBox.textContent = 'Loading weather...';

  function renderWeather(data) {
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
        <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${escapeHtml(desc)}" style="width:56px;height:56px" loading="lazy">
        <div style="text-align:left;">
          <div style="font-weight:700">${escapeHtml(city)}</div>
          <div class="small-muted">${temp}°C — ${escapeHtml(desc)}</div>
        </div>
      </div>
    `;
  }

  function getWeatherByCoords(lat, lon) {
    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${StudyHub.config.OPENWEATHER_API}&units=metric`)
      .then(r => r.json())
      .then(renderWeather)
      .catch(() => weatherBox.textContent = "⚠️ Weather unavailable");
  }

  function getWeatherByCity(city) {
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${StudyHub.config.OPENWEATHER_API}&units=metric`)
      .then(r => r.json())
      .then(renderWeather)
      .catch(() => weatherBox.textContent = "⚠️ Weather unavailable");
  }

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => getWeatherByCoords(pos.coords.latitude, pos.coords.longitude),
      () => getWeatherByCity('London'),
      { timeout: 6000 }
    );
  } else {
    getWeatherByCity('London');
  }
}

// ============================================
// NOTES & TASK MANAGEMENT
// ============================================
function initNotes() {
  // Load data
  StudyHub.notes = JSON.parse(localStorage.getItem(StudyHub.config.STORAGE_KEYS.NOTES) || '[]');
  StudyHub.missedHistory = JSON.parse(localStorage.getItem(StudyHub.config.STORAGE_KEYS.MISSED) || '[]');
  
  const noteForm = document.getElementById('noteForm');
  const titleInput = document.getElementById('titleInput');
  const contentInput = document.getElementById('contentInput');
  const deadlineInput = document.getElementById('deadlineInput');
  const alarmToggle = document.getElementById('alarmToggle');
  const notesList = document.getElementById('notesList');
  const editingIdInput = document.getElementById('editingId');
  const toggleFormBtn = document.getElementById('toggleNoteFormBtn');
  const noteFormWrap = document.getElementById('noteFormWrap');
  const clearMissedBtn = document.getElementById('clearMissed');
  const announcements = document.getElementById('announcements');

  function saveNotes() {
    localStorage.setItem(StudyHub.config.STORAGE_KEYS.NOTES, JSON.stringify(StudyHub.notes));
  }

  function saveMissed() {
    localStorage.setItem(StudyHub.config.STORAGE_KEYS.MISSED, JSON.stringify(StudyHub.missedHistory));
  }

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

  function renderNotes() {
    if (!notesList) return;
    notesList.innerHTML = '';
    
    if (!StudyHub.notes.length) {
      notesList.innerHTML = `<div class="small-muted">No notes yet — create one from the form above.</div>`;
      renderMissedHistory();
      return;
    }
    
    const sorted = [...StudyHub.notes].sort((a, b) => {
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
      
      const actionHtml = note.alarmActive
        ? `<button class="btn btn-sm btn-warning mb-1" data-dismiss="${note.id}">Dismiss</button>`
        : `<button class="btn btn-sm btn-outline-primary mb-1" data-edit="${note.id}">Edit</button>`;
      
      card.innerHTML = `
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:.6rem;flex-wrap:wrap">
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

  function renderMissedHistory() {
    const missedHistoryEl = document.getElementById('missedHistory');
    const missedSection = document.getElementById('missedHistorySection');
    
    if (!missedHistoryEl || !missedSection) return;
    
    if (StudyHub.missedHistory.length === 0) {
      missedSection.style.display = 'none';
      missedHistoryEl.innerHTML = '';
      return;
    }
    
    missedSection.style.display = 'block';
    
    missedHistoryEl.innerHTML = StudyHub.missedHistory.map(m => 
      `<div>
        <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.25rem;">
          <span style="font-size:1.2rem;">❌</span>
          <strong style="color:var(--text-primary);">${escapeHtml(m.title)}</strong>
        </div>
        <div class="small-muted" style="margin-left:1.7rem;">
          Missed at: ${new Date(m.missedAt).toLocaleString()}
        </div>
      </div>`
    ).join('');
    
    if (window.feather) setTimeout(() => feather.replace(), 50);
  }

  function stopAlarmForNote(noteId) {
    const entry = StudyHub.activeAlarms.get(String(noteId));
    if (entry && entry.audioEl) {
      try {
        entry.audioEl.pause();
        entry.audioEl.currentTime = 0;
        if (entry.audioEl.parentNode) entry.audioEl.parentNode.removeChild(entry.audioEl);
      } catch(e) {}
    }
    StudyHub.activeAlarms.delete(String(noteId));
    
    const n = StudyHub.notes.find(x => String(x.id) === String(noteId));
    if (n) {
      n.alarmActive = false;
      saveNotes();
      renderNotes();
    }
  }

  function acknowledgeAlarm(noteId) {
    stopAlarmForNote(noteId);
    const n = StudyHub.notes.find(x => String(x.id) === String(noteId));
    if (n) {
      n.alarmAcknowledged = true;
      n.alarmActive = false;
      saveNotes();
      renderNotes();
      updateAnnouncements();
    }
  }

  function triggerAlarmForNote(note) {
    if (note.alarmAcknowledged) return;
    note.alarmActive = true;
    saveNotes();
    renderNotes();
    
    // Play alarm sound
    let entry = StudyHub.activeAlarms.get(String(note.id));
    if (!entry) {
      const audioEl = document.getElementById('alarmAudio')?.cloneNode(true);
      if (audioEl) {
        audioEl.id = 'alarmAudio_' + note.id;
        audioEl.loop = true;
        audioEl.play().catch(() => {
          if ('vibrate' in navigator) navigator.vibrate([200, 100, 200, 100, 200]);
        });
        document.body.appendChild(audioEl);
        StudyHub.activeAlarms.set(String(note.id), { audioEl });
      }
    }
    
    // Show notification
    if (Notification.permission === "granted") {
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
          setTimeout(() => {
            const el = document.getElementById('task-' + note.id);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }, 300);
        };
      } catch(e) {}
    }
  }

  function updateAnnouncements() {
    if (!announcements) return;
    const now = new Date();
    const items = StudyHub.notes.filter(n => {
      if (!n.deadline) return false;
      return new Date(n.deadline) <= now;
    });
    
    if (items.length === 0) {
      announcements.innerHTML = `<div class="small-muted">No reminders yet — add tasks in Notes & Tasks.</div>`;
    } else {
      announcements.innerHTML = items.map(n => {
        const status = getTaskStatus(n);
        return `<div class="announcement mb-2" data-task="${n.id}">${escapeHtml(n.title)} — ${status.label}</div>`;
      }).join('');
    }
  }

  // Form submission
  if (noteForm) {
    noteForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = titleInput.value.trim();
      if (!title) return alert('Please enter a title.');
      
      const content = contentInput.value.trim();
      const deadline = deadlineInput.value ? new Date(deadlineInput.value).toISOString() : null;
      const alarmEnabled = !!alarmToggle.checked;
      const editingId = editingIdInput.value;
      
      if (editingId) {
        StudyHub.notes = StudyHub.notes.map(n => (String(n.id) === String(editingId) ? 
          { ...n, title, content, deadline, alarmEnabled, alarmAcknowledged: false, alarmActive: false } : n));
        editingIdInput.value = '';
      } else {
        StudyHub.notes.push({
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
      if (noteFormWrap) noteFormWrap.style.display = 'none';
      renderNotes();
      updateAnnouncements();
    });
  }

  // Toggle form
  if (toggleFormBtn && noteFormWrap) {
    toggleFormBtn.addEventListener('click', () => {
      const show = noteFormWrap.style.display === 'none';
      noteFormWrap.style.display = show ? '' : 'none';
      if (show && titleInput) titleInput.focus();
    });
  }

  // Note actions
  if (notesList) {
    notesList.addEventListener('click', (e) => {
      const editId = e.target.getAttribute('data-edit');
      const delId = e.target.getAttribute('data-del');
      const dismissId = e.target.getAttribute('data-dismiss');
      
      if (delId) {
        const note = StudyHub.notes.find(n => String(n.id) === String(delId));
        if (confirm(`Delete "${note?.title || 'this note'}"?`)) {
          stopAlarmForNote(delId);
          StudyHub.notes = StudyHub.notes.filter(n => String(n.id) !== String(delId));
          saveNotes();
          renderNotes();
          updateAnnouncements();
        }
      } else if (editId) {
        const n = StudyHub.notes.find(x => String(x.id) === String(editId));
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
        if (noteFormWrap) noteFormWrap.style.display = '';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (dismissId) {
        acknowledgeAlarm(dismissId);
      }
    });
  }

  // Clear missed
  if (clearMissedBtn) {
    clearMissedBtn.addEventListener('click', () => {
      if (confirm('Clear missed task history?')) {
        StudyHub.missedHistory = [];
        saveMissed();
        renderMissedHistory();
      }
    });
  }

  // Announcement clicks
  if (announcements) {
    announcements.addEventListener('click', (e) => {
      const tid = e.target.getAttribute('data-task');
      if (!tid) return;
      showSection('notes');
      setTimeout(() => {
        const el = document.getElementById('task-' + tid);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    });
  }

  // Monitor alarms
  setInterval(() => {
    const now = new Date();
    StudyHub.notes.forEach(n => {
      if (!n.deadline || !n.alarmEnabled || n.alarmAcknowledged) return;
      
      const dl = new Date(n.deadline);
      const diffMin = (now - dl) / 60000;
      
      if (now >= dl) {
        if (diffMin <= 5) {
          if (!n.alarmActive) triggerAlarmForNote(n);
        } else {
          if (n.alarmActive) stopAlarmForNote(n.id);
          
          if (!StudyHub.missedHistory.some(m => String(m.id) === String(n.id))) {
            StudyHub.missedHistory.unshift({
              id: n.id,
              title: n.title,
              deadline: n.deadline,
              missedAt: new Date().toISOString()
            });
            if (StudyHub.missedHistory.length > 200) StudyHub.missedHistory.pop();
            saveMissed();
            renderMissedHistory();
          }
        }
      }
    });
  }, 1000);

  // Unlock audio
  function unlockAudio() {
    if (StudyHub.audioUnlocked) return;
    const audio = document.getElementById('alarmAudio');
    if (audio) {
      audio.play().then(() => {
        audio.pause();
        audio.currentTime = 0;
        StudyHub.audioUnlocked = true;
      }).catch(() => {});
    }
  }
  ['click', 'touchstart', 'touchend', 'keydown'].forEach(eventType => {
    document.addEventListener(eventType, unlockAudio, { once: true, passive: true });
  });

  // Initial render
  renderNotes();
  updateAnnouncements();
  setInterval(updateAnnouncements, 15000);
  
  // Request notification permission
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

// ============================================
// MEETINGS (JITSI)
// ============================================
function initMeetings() {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const floatBtn = document.getElementById('floatBtn');
  const openBtn = document.getElementById('openBtn');
  const roomInput = document.getElementById('roomInput');
  const videoContainer = document.getElementById('videoContainer');
  const floatingJitsi = document.getElementById('floatingJitsi');
  const floatingJitsiInner = document.getElementById('floatingJitsiInner');
  const closeJitsiBtn = document.getElementById('closeJitsiBtn');

  function startMeeting() {
    if (StudyHub.jitsiIframe) return;
    if (!videoContainer) return;

    const roomName = roomInput?.value || '';
    const sanitizedRoom = sanitizeRoomName(roomName);

    StudyHub.jitsiIframe = document.createElement('iframe');
    StudyHub.jitsiIframe.src = `https://meet.jit.si/${encodeURIComponent(sanitizedRoom)}`;
    StudyHub.jitsiIframe.allow = 'camera; microphone; fullscreen; display-capture; autoplay';
    StudyHub.jitsiIframe.style.width = '100%';
    StudyHub.jitsiIframe.style.height = '100%';
    StudyHub.jitsiIframe.style.border = '0';

    videoContainer.innerHTML = '';
    videoContainer.appendChild(StudyHub.jitsiIframe);
    videoContainer.style.display = 'block';

    StudyHub.meetingActive = true;
    StudyHub.isFloating = false;

    if (startBtn) startBtn.disabled = true;
    if (stopBtn) stopBtn.disabled = false;
    if (floatBtn) {
      floatBtn.disabled = false;
      floatBtn.textContent = '📌 Float';
    }

    if (openBtn) {
      openBtn.onclick = () => {
        if (StudyHub.jitsiIframe) {
          window.open(StudyHub.jitsiIframe.src, '_blank', 'noopener,noreferrer');
        }
      };
    }

    handleIframePlacement(StudyHub.currentSection);
  }

  function stopMeeting() {
    if (StudyHub.jitsiIframe) {
      try {
        StudyHub.jitsiIframe.src = 'about:blank';
        StudyHub.jitsiIframe.remove();
      } catch (e) {}
      StudyHub.jitsiIframe = null;
    }

    if (videoContainer) {
      videoContainer.innerHTML = '';
      videoContainer.style.display = 'none';
    }

    if (floatingJitsiInner) floatingJitsiInner.innerHTML = '';
    if (floatingJitsi) {
      floatingJitsi.style.display = 'none';
      floatingJitsi.style.left = '';
      floatingJitsi.style.top = '';
    }

    StudyHub.meetingActive = false;
    StudyHub.isFloating = false;

    if (startBtn) startBtn.disabled = false;
    if (stopBtn) stopBtn.disabled = true;
    if (floatBtn) {
      floatBtn.disabled = true;
      floatBtn.textContent = '📌 Float';
    }
  }

  function toggleFloat() {
    if (!StudyHub.meetingActive || !StudyHub.jitsiIframe) return;

    if (!StudyHub.isFloating) {
      floatingJitsiInner.innerHTML = '';
      floatingJitsiInner.appendChild(StudyHub.jitsiIframe);
      floatingJitsi.style.display = 'flex';
      videoContainer.style.display = 'none';
      StudyHub.isFloating = true;
      if (floatBtn) floatBtn.textContent = '📍 Dock';
    } else {
      videoContainer.innerHTML = '';
      videoContainer.appendChild(StudyHub.jitsiIframe);
      videoContainer.style.display = 'block';
      floatingJitsiInner.innerHTML = '';
      floatingJitsi.style.display = 'none';
      StudyHub.isFloating = false;
      if (floatBtn) floatBtn.textContent = '📌 Float';
    }
  }

  if (startBtn) startBtn.addEventListener('click', (e) => { e.preventDefault(); startMeeting(); });
  if (stopBtn) stopBtn.addEventListener('click', (e) => { e.preventDefault(); stopMeeting(); });
  if (floatBtn) floatBtn.addEventListener('click', (e) => { e.preventDefault(); toggleFloat(); });
  if (closeJitsiBtn) closeJitsiBtn.addEventListener('click', (e) => { e.preventDefault(); stopMeeting(); });

  // Draggable floating window
  if (floatingJitsi) {
    const header = floatingJitsi.querySelector('.fw-header');
    if (header) {
      let isDragging = false;
      let startX = 0, startY = 0, startLeft = 0, startTop = 0;

      header.style.cursor = 'grab';
      header.style.touchAction = 'none';

      function startDrag(e) {
        if (e.target.id === 'closeJitsiBtn' || e.target.closest('#closeJitsiBtn')) return;
        e.preventDefault();
        isDragging = true;
        header.style.cursor = 'grabbing';

        const rect = floatingJitsi.getBoundingClientRect();
        startLeft = rect.left;
        startTop = rect.top;

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        startX = clientX;
        startY = clientY;

        if (e.pointerId) header.setPointerCapture(e.pointerId);
      }

      function doDrag(e) {
        if (!isDragging) return;

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const deltaX = clientX - startX;
        const deltaY = clientY - startY;

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const rect = floatingJitsi.getBoundingClientRect();

        let newLeft = Math.max(0, Math.min(startLeft + deltaX, viewportWidth - rect.width));
        let newTop = Math.max(0, Math.min(startTop + deltaY, viewportHeight - rect.height));

        floatingJitsi.style.left = newLeft + 'px';
        floatingJitsi.style.top = newTop + 'px';
        floatingJitsi.style.right = 'auto';
        floatingJitsi.style.bottom = 'auto';
      }

      function endDrag() {
        if (!isDragging) return;
        isDragging = false;
        header.style.cursor = 'grab';
      }

      header.addEventListener('pointerdown', startDrag);
      header.addEventListener('touchstart', startDrag, { passive: false });
      window.addEventListener('pointermove', doDrag);
      window.addEventListener('touchmove', doDrag, { passive: false });
      window.addEventListener('pointerup', endDrag);
      window.addEventListener('touchend', endDrag);
    }
  }
}

// ============================================
// RADIO PLAYER
// ============================================
function initRadio() {
  let stations = [];
  let currentStationIndex = 0;
  let currentCountry = 'PH';
  let isLoading = false;

  const API_ENDPOINTS = [
    'https://at1.api.radio-browser.info',
    'https://de1.api.radio-browser.info',
    'https://nl1.api.radio-browser.info'
  ];

  const FALLBACK_STATIONS = {
    PH: [
      { name: "DZMM TeleRadyo", url: "http://sg-icecast-1.eradioportal.com:8060/dzmm_teleradyo", country: "Philippines", tags: "news, talk", codec: "MP3", bitrate: "128" },
      { name: "Love Radio Manila", url: "http://sg-icecast-1.eradioportal.com:8060/love_radio_manila", country: "Philippines", tags: "pop, opm", codec: "MP3", bitrate: "128" },
      { name: "Magic 89.9", url: "http://sg-icecast-1.eradioportal.com:8060/magic_899", country: "Philippines", tags: "pop, hits", codec: "MP3", bitrate: "128" }
    ],
    US: [
      { name: "NPR News", url: "https://npr-ice.streamguys1.com/live.mp3", country: "United States", tags: "news, talk", codec: "MP3", bitrate: "128" },
      { name: "KEXP 90.3", url: "https://kexp-mp3-128.streamguys1.com/kexp128.mp3", country: "United States", tags: "alternative, indie", codec: "MP3", bitrate: "128" }
    ],
    GB: [
      { name: "BBC Radio 1", url: "http://bbcmedia.ic.llnwd.net/stream/bbcmedia_radio1_mf_p", country: "United Kingdom", tags: "pop, hits", codec: "AAC", bitrate: "128" }
    ],
    CA: [
      { name: "CBC Radio One", url: "https://cbc_r1_tor.akacast.akamaistream.net/7/750/451661/v1/rc.akacast.akamaistream.net/cbc_r1_tor", country: "Canada", tags: "news, talk", codec: "MP3", bitrate: "128" }
    ],
    AU: [
      { name: "ABC Classic", url: "https://live-radio01.mediahubaustralia.com/2CLW/mp3/", country: "Australia", tags: "classical", codec: "MP3", bitrate: "128" }
    ]
  };

  const statusMessage = document.getElementById('statusMessage');
  const stationName = document.getElementById('stationName');
  const stationInfo = document.getElementById('stationInfo');
  const stationCounter = document.getElementById('stationCounter');
  const mainAudio = document.getElementById('mainAudio');
  const stationAvatar = document.getElementById('stationAvatar');
  const equalizer = document.getElementById('equalizer');
  const loadingIndicator = document.getElementById('loadingIndicator');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  function showStatus(message, type = 'success', duration = 3000) {
    if (!statusMessage) return;
    statusMessage.textContent = message;
    statusMessage.className = `status-message status-${type}`;
    statusMessage.style.display = 'block';
    setTimeout(() => { statusMessage.style.display = 'none'; }, duration);
  }

  function showLoading(show) {
    isLoading = show;
    if (loadingIndicator) loadingIndicator.style.display = show ? 'block' : 'none';
    if (prevBtn) prevBtn.disabled = show;
    if (nextBtn) nextBtn.disabled = show;
  }

  async function fetchStations() {
    showLoading(true);

    try {
      for (let endpoint of API_ENDPOINTS) {
        try {
          const response = await fetch(`${endpoint}/json/stations/bycountrycodeexact/${currentCountry}`, {
            signal: AbortSignal.timeout(10000)
          });

          if (response.ok) {
            const data = await response.json();
            stations = data.filter(s => s.url_resolved || s.url);
            showStatus(`✅ Loaded ${stations.length} stations from API`, 'success');
            showLoading(false);
            return;
          }
        } catch (e) {
          console.warn(`Endpoint ${endpoint} failed`);
        }
      }
      
      throw new Error('All API endpoints failed');
    } catch (error) {
      stations = FALLBACK_STATIONS[currentCountry] || [];
      if (stations.length > 0) {
        showStatus(`⚠️ Using backup stations (${stations.length} available)`, 'warning');
      } else {
        showStatus('❌ No stations available for this country', 'error');
      }
    }

    showLoading(false);
  }

  function updateDisplay() {
    if (stations.length === 0) {
      if (stationName) stationName.textContent = 'No stations available';
      if (stationInfo) stationInfo.textContent = 'Try selecting a different country';
      if (stationCounter) stationCounter.textContent = '';
      return;
    }

    const station = stations[currentStationIndex];
    if (stationName) stationName.textContent = station.name || 'Unknown Station';

    const tags = station.tags || 'No genre info';
    const bitrate = station.bitrate ? `${station.bitrate} kbps` : 'Unknown quality';
    const codec = station.codec || 'Unknown format';
    if (stationInfo) stationInfo.textContent = `${tags} • ${bitrate} • ${codec}`;
    if (stationCounter) stationCounter.textContent = `Station ${currentStationIndex + 1} of ${stations.length}`;

    const streamUrl = station.url_resolved || station.url;
    if (streamUrl && mainAudio) {
      mainAudio.src = streamUrl;
      mainAudio.load();
    }

    if (prevBtn) prevBtn.disabled = currentStationIndex === 0;
    if (nextBtn) nextBtn.disabled = currentStationIndex === stations.length - 1;
  }

  function previousStation() {
    if (currentStationIndex > 0 && !isLoading) {
      currentStationIndex--;
      updateDisplay();
    }
  }

  function nextStation() {
    if (currentStationIndex < stations.length - 1 && !isLoading) {
      currentStationIndex++;
      updateDisplay();
    }
  }

  // Country buttons
  document.querySelectorAll('.country-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.country-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCountry = btn.dataset.country;
      currentStationIndex = 0;
      fetchStations().then(updateDisplay);
    });
  });

  // Navigation
  if (prevBtn) prevBtn.addEventListener('click', previousStation);
  if (nextBtn) nextBtn.addEventListener('click', nextStation);

  // Audio events
  if (mainAudio) {
    mainAudio.addEventListener('play', () => {
      if (stationAvatar) stationAvatar.classList.add('playing');
      if (equalizer) equalizer.classList.add('active');
    });

    mainAudio.addEventListener('pause', () => {
      if (stationAvatar) stationAvatar.classList.remove('playing');
      if (equalizer) equalizer.classList.remove('active');
    });

    mainAudio.addEventListener('ended', () => {
      if (stationAvatar) stationAvatar.classList.remove('playing');
      if (equalizer) equalizer.classList.remove('active');
    });

    mainAudio.addEventListener('error', () => {
      showStatus('❌ Failed to play this station. Try the next one.', 'error');
      if (stationAvatar) stationAvatar.classList.remove('playing');
      if (equalizer) equalizer.classList.remove('active');
    });
  }

  // Initial load
  fetchStations().then(updateDisplay);
}

// ============================================
// YOUTUBE SEARCH
// ============================================
function initYouTube() {
  const ytBtn = document.getElementById('ytSearchBtn');
  const ytResults = document.getElementById('ytResults');
  const ytSearchInput = document.getElementById('ytSearch');
  const ytInlinePlayer = document.getElementById('ytInlinePlayer');
  const ytInlineIframe = document.getElementById('ytInlineIframe');
  const floatingVideo = document.getElementById('floatingVideo');
  const floatingVideoInner = document.getElementById('floatingVideoInner');
  const ytFloatClose = document.getElementById('ytFloatClose');

  function stopAllPlayers() {
    if (ytInlineIframe && ytInlinePlayer.style.display !== 'none') {
      ytInlineIframe.src = '';
      ytInlinePlayer.style.display = 'none';
    }
    if (floatingVideoInner && floatingVideo.style.display !== 'none') {
      floatingVideoInner.innerHTML = '';
      floatingVideo.style.display = 'none';
    }
  }

  function createYTCard(item) {
    const id = item.id.videoId;
    const title = item.snippet.title;
    const channelTitle = item.snippet.channelTitle || 'Unknown Channel';
    const thumb = item.snippet.thumbnails?.medium?.url || 
                  item.snippet.thumbnails?.default?.url || 
                  'https://via.placeholder.com/320x180?text=No+Thumbnail';
    
    const col = document.createElement('div');
    col.className = 'col-md-3 col-sm-6 col-12';
    
    const card = document.createElement('div');
    card.className = 'yt-card';
    card.innerHTML = `
      <div class="yt-thumb">
        <img src="${thumb}" alt="${escapeHtml(title)}" loading="lazy" onerror="this.src='https://via.placeholder.com/320x180?text=Error'">
      </div>
      <div class="yt-info">
        <div class="yt-title" title="${escapeHtml(title)}">${escapeHtml(title)}</div>
        <div class="yt-channel" title="${escapeHtml(channelTitle)}">${escapeHtml(channelTitle)}</div>
        <div class="yt-actions">
          <button class="btn btn-sm btn-success" data-video="${id}" title="Play inline">
            <i data-feather="play"></i> <span>Play</span>
          </button>
          <button class="btn btn-sm btn-outline-secondary" data-video-float="${id}" title="Open in floating player">
            <i data-feather="maximize-2"></i> <span>Float</span>
          </button>
        </div>
      </div>
    `;
    
    col.appendChild(card);
    if (window.feather) setTimeout(() => feather.replace(), 10);
    return col;
  }
  async function searchYouTube() {
    const query = ytSearchInput?.value?.trim();
    
    if (!query) {
      alert('Please enter a search term to find YouTube videos.');
      ytSearchInput?.focus();
      return;
    }
    
    ytResults.innerHTML = `
      <div class="col-12">
        <div class="yt-loading">
          <div class="spinner"></div>
          <div class="small-muted">Searching YouTube for "${escapeHtml(query)}"...</div>
        </div>
      </div>
    `;
    
    try {
      const url = `https://www.googleapis.com/youtube/v3/search?` + 
                  `part=snippet&type=video&maxResults=12&` +
                  `q=${encodeURIComponent(query)}&key=${StudyHub.config.YOUTUBE_API}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.error) {
        let errorMessage = data.error.message;
        let errorDetails = '';
        
        if (data.error.code === 403) {
          if (data.error.message.includes('quotaExceeded')) {
            errorMessage = 'Daily API quota exceeded';
            errorDetails = 'The YouTube API key has reached its daily limit. Try again tomorrow.';
          } else if (data.error.message.includes('keyInvalid')) {
            errorMessage = 'Invalid API key';
            errorDetails = 'The YouTube API key is invalid or has been disabled.';
          }
        }
        
        ytResults.innerHTML = `
          <div class="col-12">
            <div class="card-ui error-state">
              <div style="text-align:center; padding:2rem;">
                <div style="font-size:3rem; margin-bottom:1rem;">⚠️</div>
                <h5 style="color:var(--accent); margin-bottom:0.5rem;">${escapeHtml(errorMessage)}</h5>
                <p class="small-muted" style="margin-bottom:1rem;">${escapeHtml(errorDetails)}</p>
                <small class="text-muted">Error Code: ${data.error.code}</small>
              </div>
            </div>
          </div>
        `;
        return;
      }
      
      if (!data.items || data.items.length === 0) {
        ytResults.innerHTML = `
          <div class="col-12">
            <div class="yt-empty-state">
              <svg data-feather="search" style="width:64px;height:64px;opacity:0.3;margin-bottom:1rem;"></svg>
              <h5>No results found</h5>
              <p class="small-muted">No videos found for "${escapeHtml(query)}". Try different keywords.</p>
            </div>
          </div>
        `;
        if (window.feather) feather.replace();
        return;
      }
      
      ytResults.innerHTML = '';
      data.items.forEach(item => {
        ytResults.appendChild(createYTCard(item));
      });
      
      // Play button events
      ytResults.querySelectorAll('[data-video]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const videoId = e.currentTarget.getAttribute('data-video');
          playInlineVideo(videoId);
        });
      });
      
      // Float button events
      ytResults.querySelectorAll('[data-video-float]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const videoId = e.currentTarget.getAttribute('data-video-float');
          openFloatingVideo(videoId);
        });
      });
      
      if (window.feather) feather.replace();
      
    } catch (error) {
      ytResults.innerHTML = `
        <div class="col-12">
          <div class="card-ui error-state">
            <div style="text-align:center; padding:2rem;">
              <div style="font-size:3rem; margin-bottom:1rem;">🔌</div>
              <h5 style="color:var(--accent); margin-bottom:0.5rem;">Connection Error</h5>
              <p class="small-muted" style="margin-bottom:1rem;">
                Unable to connect to YouTube API. Check your internet connection.
              </p>
              <small class="text-muted">${escapeHtml(error.message)}</small>
            </div>
          </div>
        </div>
      `;
    }
  }

  function playInlineVideo(videoId) {
    if (floatingVideo.style.display !== 'none') {
      floatingVideoInner.innerHTML = '';
      floatingVideo.style.display = 'none';
    }
    
    ytInlineIframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
    ytInlinePlayer.style.display = 'block';
    ytInlinePlayer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function openFloatingVideo(videoId) {
    if (!floatingVideo || !floatingVideoInner) return;
    
    if (ytInlinePlayer.style.display !== 'none') {
      ytInlineIframe.src = '';
      ytInlinePlayer.style.display = 'none';
    }
    
    floatingVideoInner.innerHTML = `
      <iframe 
        src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
        allowfullscreen
        frameborder="0" 
        style="width:100%; height:100%; border:0; display:block;">
      </iframe>
    `;
    
    floatingVideo.style.display = 'flex';
    if (window.feather) setTimeout(() => feather.replace(), 10);
  }

  if (ytFloatClose) {
    ytFloatClose.addEventListener('click', () => {
      floatingVideoInner.innerHTML = '';
      floatingVideo.style.display = 'none';
    });
  }

  // Draggable floating video
  if (floatingVideo && typeof $ !== 'undefined' && $.fn.draggable) {
    $(document).ready(function() {
      $('#floatingVideo').draggable({
        handle: '.fv-header',
        containment: 'window'
      });
    });
  }

  if (ytBtn) ytBtn.addEventListener('click', (e) => { e.preventDefault(); searchYouTube(); });
  if (ytSearchInput) {
    ytSearchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        searchYouTube();
      }
    });
  }
}

// ============================================
// MAIN INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Feather icons
  if (window.feather) feather.replace();
  
  // Initialize all modules
  initTheme();
  initNavigation();
  initMobileMenu();
  
  // Start clock
  updateClock();
  setInterval(updateClock, 1000);
  
  // Initialize widgets
  renderMiniCalendar();
  initWeather();
  
  // Initialize features
  initNotes();
  initMeetings();
  initRadio();
  initYouTube();
  
  console.log('✅ StudyHub initialized successfully');
});

// Expose to window for debugging (optional - can be removed)
window.StudyHub = StudyHub;