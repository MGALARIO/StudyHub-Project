// Theme Management System
(() => {
  const THEME_KEY = 'studyhub_theme';
  const themeToggle = document.getElementById('themeToggle');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

  function applyTheme(theme, save = true) {
    if (!theme) theme = 'light';
    document.body.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    
    if (themeToggle) {
      themeToggle.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    }
    
    if (save) {
      localStorage.setItem(THEME_KEY, theme);
    }
    
    // Re-render feather icons after theme change
    if (window.feather) {
      setTimeout(() => feather.replace(), 50);
    }
  }

  function loadInitialTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) {
      return applyTheme(saved, false);
    }
    if (prefersDark && prefersDark.matches) {
      return applyTheme('dark', false);
    }
    applyTheme('light', false);
  }

  // Watch OS preference changes
  if (prefersDark && prefersDark.addEventListener) {
    prefersDark.addEventListener('change', e => {
      applyTheme(e.matches ? 'dark' : 'light');
    });
  }

  // Toggle button click handler
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = document.body.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  // Load theme on page load
  loadInitialTheme();
})();




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

// Enable audio autoplay after first user interaction (MOBILE-FRIENDLY)
  let audioUnlocked = false;
  
  function unlockAudio() { 
    if (audioUnlocked) return;
    
    const base = document.getElementById('alarmAudio'); 
    if (base) { 
      // Try to play and immediately pause to unlock audio context
      base.play().then(() => {
        base.pause();
        base.currentTime = 0;
        audioUnlocked = true;
        console.log('✅ Audio unlocked for alarms');
      }).catch(err => {
        console.warn('⚠️ Audio unlock failed:', err);
      }); 
    }
  }
  
  // Listen to multiple interaction events for better mobile support
  ['click', 'touchstart', 'touchend', 'keydown'].forEach(eventType => {
    document.addEventListener(eventType, unlockAudio, { once: true, passive: true });
  });

  // Test Alarm Button (Mobile-friendly)
  document.getElementById('testAlarmBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    const audio = document.getElementById('alarmAudio');
    
    if (!audio) {
      alert('❌ Alarm audio not found');
      return;
    }
    
    // Force unlock audio first
    unlockAudio();
    
    // Play test alarm after short delay
    setTimeout(() => {
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log('✅ Test alarm playing');
          alert('🔔 Alarm test successful! You should hear a beep sound.');
          
          // Stop after 2 seconds
          setTimeout(() => {
            audio.pause();
            audio.currentTime = 0;
          }, 2000);
        }).catch(error => {
          console.error('❌ Test alarm failed:', error);
          
          // Try vibration on mobile
          if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200, 100, 200]);
            alert('⚠️ Sound blocked by browser.\n📳 Using vibration instead.\n\nTip: Allow sound in browser settings.');
          } else {
            alert('⚠️ Alarm sound blocked by your browser.\n\nPlease:\n1. Check browser sound settings\n2. Make sure phone is not on silent\n3. Allow notifications for this site');
          }
        });
      }
    }, 100);
  });
  
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



/* ================================
   Radio Class Code
   ================================ */
class ModernRadio {
  constructor() {
    this.stations = [];
    this.currentStationIndex = 0;
    this.currentCountry = 'PH';
    this.workingEndpoints = [];
    this.isLoading = false;

    // Radio Browser API endpoints
    this.API_ENDPOINTS = [
      'https://at1.api.radio-browser.info',
      'https://de1.api.radio-browser.info',
      'https://nl1.api.radio-browser.info',
      'https://fr1.api.radio-browser.info'
    ];

    // Status icons
    this.STATUS_ICONS = {
      success: '\u2705',       
      warning: '\u26A0\uFE0F', 
      error: '\u274C'          
    };

    // Fallback stations if API fails
    this.FALLBACK_STATIONS = {
      PH: [
        { name: "DZMM TeleRadyo", url: "http://sg-icecast-1.eradioportal.com:8060/dzmm_teleradyo", country: "Philippines", tags: "news, talk", codec: "MP3", bitrate: "128" },
        { name: "Love Radio Manila", url: "http://sg-icecast-1.eradioportal.com:8060/love_radio_manila", country: "Philippines", tags: "pop, opm", codec: "MP3", bitrate: "128" },
        { name: "Magic 89.9", url: "http://sg-icecast-1.eradioportal.com:8060/magic_899", country: "Philippines", tags: "pop, hits", codec: "MP3", bitrate: "128" },
        { name: "DWRR 101.1", url: "http://sg-icecast-1.eradioportal.com:8060/dwrr_1011", country: "Philippines", tags: "pop, rock", codec: "MP3", bitrate: "128" },
        { name: "DZBB Super Radyo", url: "http://sg-icecast-1.eradioportal.com:8060/dzbb_super_radyo", country: "Philippines", tags: "news, talk", codec: "MP3", bitrate: "128" }
      ],
      US: [
        { name: "NPR News", url: "https://npr-ice.streamguys1.com/live.mp3", country: "United States", tags: "news, talk", codec: "MP3", bitrate: "128" },
        { name: "KEXP 90.3", url: "https://kexp-mp3-128.streamguys1.com/kexp128.mp3", country: "United States", tags: "alternative, indie", codec: "MP3", bitrate: "128" },
        { name: "WNYC FM", url: "https://fm939.wnyc.org/wnycfm", country: "United States", tags: "public radio, news", codec: "MP3", bitrate: "128" }
      ],
      GB: [
        { name: "BBC Radio 1", url: "http://bbcmedia.ic.llnwd.net/stream/bbcmedia_radio1_mf_p", country: "United Kingdom", tags: "pop, hits", codec: "AAC", bitrate: "128" },
        { name: "BBC Radio 2", url: "http://bbcmedia.ic.llnwd.net/stream/bbcmedia_radio2_mf_p", country: "United Kingdom", tags: "pop, classic hits", codec: "AAC", bitrate: "128" }
      ],
      CA: [
        { name: "CBC Radio One", url: "https://cbc_r1_tor.akacast.akamaistream.net/7/750/451661/v1/rc.akacast.akamaistream.net/cbc_r1_tor", country: "Canada", tags: "news, talk", codec: "MP3", bitrate: "128" }
      ],
      AU: [
        { name: "ABC Classic", url: "https://live-radio01.mediahubaustralia.com/2CLW/mp3/", country: "Australia", tags: "classical", codec: "MP3", bitrate: "128" }
      ]
    };

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadStations();
  }

  setupEventListeners() {
    // Country buttons
    document.querySelectorAll('.country-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.country-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentCountry = btn.dataset.country;
        this.currentStationIndex = 0;
        this.loadStations();
      });
    });

    // Prev / Next
    document.getElementById('prevBtn').addEventListener('click', () => this.previousStation());
    document.getElementById('nextBtn').addEventListener('click', () => this.nextStation());

    // Audio events
    const audio = document.getElementById('mainAudio');
    audio.addEventListener('play', () => this.onAudioPlay());
    audio.addEventListener('pause', () => this.onAudioPause());
    audio.addEventListener('ended', () => this.onAudioPause());
    audio.addEventListener('error', () => this.onAudioError());
  }

  showLoading(show) {
    this.isLoading = show;
    document.getElementById('loadingIndicator').style.display = show ? 'block' : 'none';
    document.getElementById('prevBtn').disabled = show;
    document.getElementById('nextBtn').disabled = show;
  }

  showStatus(message, type = 'success', duration = 3000) {
    const statusElement = document.getElementById('statusMessage');
    statusElement.className = `status-message status-${type}`;
    statusElement.textContent = message;
    statusElement.style.display = 'block';

    setTimeout(() => {
      statusElement.style.display = 'none';
    }, duration);
  }

  async testEndpoints() {
    this.workingEndpoints = [];

    for (let endpoint of this.API_ENDPOINTS) {
      try {
        const response = await fetch(`${endpoint}/json/stats`, {
          method: 'GET',
          signal: AbortSignal.timeout(8000)
        });

        if (response.ok) {
          this.workingEndpoints.push(endpoint);
        }
      } catch (error) {
        console.warn(`Endpoint ${endpoint} failed`);
      }
    }

    return this.workingEndpoints.length > 0;
  }

  async fetchStationsFromAPI() {
    if (this.workingEndpoints.length === 0) {
      const hasWorking = await this.testEndpoints();
      if (!hasWorking) {
        throw new Error('No working API endpoints');
      }
    }

    for (let endpoint of this.workingEndpoints) {
      try {
        const response = await fetch(`${endpoint}/json/stations/bycountrycodeexact/${this.currentCountry}`, {
          signal: AbortSignal.timeout(10000)
        });

        if (response.ok) {
          const data = await response.json();
          return data.filter(station => station.url_resolved || station.url);
        }
      } catch (error) {
        console.warn(`API fetch failed for ${endpoint}`);
      }
    }

    throw new Error('All API requests failed');
  }

  async loadStations() {
    this.showLoading(true);

    try {
      const apiStations = await this.fetchStationsFromAPI();
      this.stations = apiStations.slice(0, 50);
      const icon = this.STATUS_ICONS.success;
      this.showStatus(`${icon} Loaded ${this.stations.length} stations from API`, 'success');
    } catch (error) {
      this.stations = this.FALLBACK_STATIONS[this.currentCountry] || [];
      if (this.stations.length > 0) {
        const icon = this.STATUS_ICONS.warning;
        this.showStatus(`${icon} Using backup stations (${this.stations.length} available)`, 'warning');
      } else {
        const icon = this.STATUS_ICONS.error;
        this.showStatus(`${icon} No stations available for this country`, 'error');
      }
    }

    this.currentStationIndex = 0;
    this.updateDisplay();
    this.showLoading(false);
  }

  updateDisplay() {
    if (this.stations.length === 0) {
      document.getElementById('stationName').textContent = 'No stations available';
      document.getElementById('stationInfo').textContent = 'Try selecting a different country';
      document.getElementById('stationCounter').textContent = '';
      // keep static SVG in HTML
      return;
    }

    const station = this.stations[this.currentStationIndex];
    const avatar = document.getElementById('stationAvatar');
    const name = document.getElementById('stationName');
    const info = document.getElementById('stationInfo');
    const counter = document.getElementById('stationCounter');
    const audio = document.getElementById('mainAudio');

    name.textContent = station.name || 'Unknown Station';

    const tags = station.tags || 'No genre info';
    const bitrate = station.bitrate ? `${station.bitrate} kbps` : 'Unknown quality';
    const codec = station.codec || 'Unknown format';
    info.textContent = `${tags} • ${bitrate} • ${codec}`;
    counter.textContent = `Station ${this.currentStationIndex + 1} of ${this.stations.length}`;

    // Always keep same radio SVG icon
    avatar.innerHTML = this.getStationIcon();

    const streamUrl = station.url_resolved || station.url;
    if (streamUrl) {
      audio.src = streamUrl;
      audio.load();
    }

    document.getElementById('prevBtn').disabled = this.currentStationIndex === 0;
    document.getElementById('nextBtn').disabled = this.currentStationIndex === this.stations.length - 1;
  }

  // Always static SVG icon
  getStationIcon() {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"
           viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 7.24V6a2 2 0 0 0-2-2H6.76l9.72-3.24-.64 1.91L6 5.5V6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a.76.76 0 0 0-.76-.76zM8 14a2 2 0 1 1 4 0 2 2 0 0 1-4 0zm8-4h-4v-2h4z"/>
      </svg>
    `;
  }

  previousStation() {
    if (this.currentStationIndex > 0 && !this.isLoading) {
      this.currentStationIndex--;
      this.updateDisplay();
    }
  }

  nextStation() {
    if (this.currentStationIndex < this.stations.length - 1 && !this.isLoading) {
      this.currentStationIndex++;
      this.updateDisplay();
    }
  }

  onAudioPlay() {
    document.getElementById('stationAvatar').classList.add('playing');
    document.getElementById('equalizer').classList.add('active');
  }

  onAudioPause() {
    document.getElementById('stationAvatar').classList.remove('playing');
    document.getElementById('equalizer').classList.remove('active');
  }

  onAudioError() {
    const icon = this.STATUS_ICONS.error;
    this.showStatus(`${icon} Failed to play this station. Try the next one.`, 'error');
    this.onAudioPause();
  }
}

// Initialize the radio app
window.addEventListener('load', () => {
  new ModernRadio();
});




 // ==========================
  // JITSI MEETING: dock/float + draggable/resizable (MOBILE-FRIENDLY)
  // ==========================
  document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const floatBtn = document.getElementById('floatBtn');
  const openBtn = document.getElementById('openBtn');
  const roomInput = document.getElementById('roomInput');
  const videoContainer = document.getElementById('videoContainer');
  const floatingJitsi = document.getElementById('floatingJitsi');
  const floatingJitsiInner = document.getElementById('floatingJitsiInner');
  const closeJitsiBtn = document.getElementById('closeJitsiBtn');

  let jitsiIframe = null;
  let isFloating = false;

  function sanitizeRoom(name) {
    if (!name || !name.trim()) return 'StudyHubRoom';
    return name.trim().replace(/[^A-Za-z0-9_-]/g, '_') || 'StudyHubRoom';
  }

  function createJitsiIframe(room) {
    const f = document.createElement('iframe');
    f.src = `https://meet.jit.si/${encodeURIComponent(room)}`;
    f.allow = 'camera; microphone; fullscreen; display-capture; autoplay';
    f.style.width = '100%';
    f.style.height = '100%';
    f.style.border = '0';
    f.loading = 'lazy';
    return f;
  }

  function startMeeting() {
    if (jitsiIframe) return;
    const room = sanitizeRoom(roomInput?.value || '');
    jitsiIframe = createJitsiIframe(room);
    videoContainer.innerHTML = '';
    videoContainer.appendChild(jitsiIframe);
    videoContainer.style.display = 'block';
    startBtn.disabled = true;
    stopBtn.disabled = false;
    floatBtn.disabled = false;
    openBtn.onclick = () => window.open(jitsiIframe.src, '_blank', 'noopener');
  }

  function stopMeeting() {
    if (jitsiIframe) {
      try { jitsiIframe.src = 'about:blank'; } catch (e) {}
      try { jitsiIframe.remove(); } catch (e) {}
      jitsiIframe = null;
    }
    videoContainer.innerHTML = '';
    videoContainer.style.display = 'none';
    floatingJitsiInner.innerHTML = '';
    floatingJitsi.style.display = 'none';
    floatingJitsi.style.left = '';
    floatingJitsi.style.top = '';
    isFloating = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    floatBtn.disabled = true;
    floatBtn.textContent = '📌 Float';
  }

  function toggleFloat() {
    if (!jitsiIframe) return;
    if (!isFloating) {
      floatingJitsiInner.appendChild(jitsiIframe);
      floatingJitsi.style.display = 'flex';
      videoContainer.style.display = 'none';
      isFloating = true;
      floatBtn.textContent = '📍 Dock';
    } else {
      videoContainer.appendChild(jitsiIframe);
      floatingJitsi.style.display = 'none';
      videoContainer.style.display = 'block';
      isFloating = false;
      floatBtn.textContent = '📌 Float';
    }
  }

  // Close button handler
  if (closeJitsiBtn) {
    closeJitsiBtn.addEventListener('click', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      stopMeeting();
    });
  }

  // ENHANCED: Mobile-friendly drag and resize with touch support
  (function initFloatingControls() {
    const el = floatingJitsi;
    const header = el.querySelector('.fw-header');
    if (!el || !header) return;

    // Touch/Pointer Drag Support
    let dragging = false, startX = 0, startY = 0, startLeft = 0, startTop = 0;
    
    header.style.cursor = 'grab';
    header.style.touchAction = 'none';
    
    function startDrag(e) {
      // Don't start drag if clicking close button
      if (e.target.id === 'closeJitsiBtn' || e.target.closest('#closeJitsiBtn')) {
        return;
      }
      
      e.preventDefault();
      
      dragging = true;
      header.style.cursor = 'grabbing';
      
      const rect = el.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;
      
      // Support both touch and mouse
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      
      startX = clientX;
      startY = clientY;
      
      // Capture pointer for mouse
      if (e.pointerId) {
        header.setPointerCapture(e.pointerId);
      }
    }
    
    function doDrag(e) {
      if (!dragging) return;
      
      // Get current position (touch or mouse)
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      
      const deltaX = clientX - startX;
      const deltaY = clientY - startY;
      
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const rect = el.getBoundingClientRect();
      
      // Calculate new position with boundaries
      let newLeft = Math.max(0, Math.min(startLeft + deltaX, viewportWidth - rect.width));
      let newTop = Math.max(0, Math.min(startTop + deltaY, viewportHeight - rect.height));
      
      el.style.left = newLeft + 'px';
      el.style.top = newTop + 'px';
      el.style.right = 'auto';
      el.style.bottom = 'auto';
    }
    
    function endDrag() {
      if (!dragging) return;
      dragging = false;
      header.style.cursor = 'grab';
    }
    
    // Add event listeners for both touch and mouse
    header.addEventListener('pointerdown', startDrag);
    header.addEventListener('touchstart', startDrag, { passive: false });
    
    window.addEventListener('pointermove', doDrag);
    window.addEventListener('touchmove', doDrag, { passive: false });
    
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('touchend', endDrag);
    window.addEventListener('touchcancel', endDrag);

    // ENHANCED: Mobile-friendly resize handle
    let resizeHandle = el.querySelector('.jitsi-resize-handle');
    if (!resizeHandle) {
      resizeHandle = document.createElement('div');
      resizeHandle.className = 'jitsi-resize-handle';
      Object.assign(resizeHandle.style, {
        position: 'absolute',
        width: '32px',  // Larger for touch
        height: '32px',
        right: '0',
        bottom: '0',
        cursor: 'nwse-resize',
        zIndex: '1100',
        background: 'rgba(255,107,95,0.3)',
        borderRadius: '0 0 10px 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '16px',
        color: 'rgba(255,255,255,0.7)',
        touchAction: 'none'
      });
      resizeHandle.innerHTML = '⇲';
      el.appendChild(resizeHandle);
    }
    
    let resizing = false, resizeStartW = 0, resizeStartH = 0, resizeStartX = 0, resizeStartY = 0;
    const aspectRatio = 16 / 9;
    const minWidth = 200;
    const minHeight = 150;
    
    function startResize(e) {
      e.preventDefault();
      e.stopPropagation();
      
      resizing = true;
      const rect = el.getBoundingClientRect();
      resizeStartW = rect.width;
      resizeStartH = rect.height;
      
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      
      resizeStartX = clientX;
      resizeStartY = clientY;
      
      if (e.pointerId) {
        resizeHandle.setPointerCapture(e.pointerId);
      }
    }
    
    function doResize(e) {
      if (!resizing) return;
      
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      
      const deltaX = clientX - resizeStartX;
      const deltaY = clientY - resizeStartY;
      
      // Use the larger delta to maintain aspect ratio
      const delta = Math.max(deltaX, deltaY);
      
      let newWidth = Math.max(minWidth, resizeStartW + delta);
      newWidth = Math.min(newWidth, window.innerWidth - 20);
      
      let newHeight = newWidth / aspectRatio;
      newHeight = Math.max(minHeight, newHeight);
      
      el.style.width = newWidth + 'px';
      el.style.height = newHeight + 'px';
    }
    
    function endResize() {
      resizing = false;
    }
    
    resizeHandle.addEventListener('pointerdown', startResize);
    resizeHandle.addEventListener('touchstart', startResize, { passive: false });
    
    window.addEventListener('pointermove', doResize);
    window.addEventListener('touchmove', doResize, { passive: false });
    
    window.addEventListener('pointerup', endResize);
    window.addEventListener('touchend', endResize);
    window.addEventListener('touchcancel', endResize);
    
    console.log('✅ Jitsi floating controls initialized (mobile-friendly)');
  })();

  // Event listeners
  startBtn?.addEventListener('click', startMeeting);
  stopBtn?.addEventListener('click', stopMeeting);
  floatBtn?.addEventListener('click', toggleFloat);
});

// =========================
// YouTube Search Module
// =========================

const YT_KEY = "AIzaSyCEhAQaMVE0_FF9voohcCOmN2xj0bTcF8I";

// Element references
const ytBtn = document.getElementById('ytSearchBtn');
const ytResults = document.getElementById('ytResults');
const ytSearchInput = document.getElementById('ytSearch');
const ytInlinePlayer = document.getElementById('ytInlinePlayer');
const ytInlineIframe = document.getElementById('ytInlineIframe');
const floatingVideo = document.getElementById('floatingVideo');
const floatingVideoInner = document.getElementById('floatingVideoInner');
const ytFloatClose = document.getElementById('ytFloatClose');

// Escape HTML function
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ADDED: Stop all players
function stopAllPlayers() {
  // Stop inline player
  if (ytInlineIframe && ytInlinePlayer.style.display !== 'none') {
    ytInlineIframe.src = '';
    ytInlinePlayer.style.display = 'none';
  }
  
  // Stop floating player
  if (floatingVideoInner && floatingVideo.style.display !== 'none') {
    floatingVideoInner.innerHTML = '';
    floatingVideo.style.display = 'none';
  }
}

// Create YouTube card with proper button handlers
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
  
  if (typeof feather !== 'undefined') {
    setTimeout(() => feather.replace(), 10);
  }
  
  return col;
}

// Main search function
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
                `q=${encodeURIComponent(query)}&key=${YT_KEY}`;
    
    console.log('🔍 YouTube Search:', query);
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('📦 API Response:', data);
    
    if (data.error) {
      console.error('❌ YouTube API Error:', data.error);
      
      let errorMessage = data.error.message;
      let errorDetails = '';
      
      if (data.error.code === 403) {
        if (data.error.message.includes('quotaExceeded')) {
          errorMessage = 'Daily API quota exceeded';
          errorDetails = 'The YouTube API key has reached its daily limit. Try again tomorrow.';
        } else if (data.error.message.includes('keyInvalid')) {
          errorMessage = 'Invalid API key';
          errorDetails = 'The YouTube API key is invalid or has been disabled.';
        } else {
          errorMessage = 'Access forbidden';
          errorDetails = 'The API key may be restricted. Check Google Cloud Console.';
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
      if (typeof feather !== 'undefined') feather.replace();
      return;
    }
    
    console.log(`✅ Found ${data.items.length} videos`);
    ytResults.innerHTML = '';
    
    data.items.forEach(item => {
      ytResults.appendChild(createYTCard(item));
    });
    
    // CHANGED: Play button stops other player and shows inline
    ytResults.querySelectorAll('[data-video]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const videoId = e.currentTarget.getAttribute('data-video');
        console.log('▶️ Playing inline:', videoId);
        playInlineVideo(videoId);
      });
    });
    
    // CHANGED: Float button stops other player and opens floating
    ytResults.querySelectorAll('[data-video-float]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const videoId = e.currentTarget.getAttribute('data-video-float');
        console.log('🔳 Opening floating player:', videoId);
        openFloatingVideo(videoId);
      });
    });
    
    if (typeof feather !== 'undefined') {
      feather.replace();
    }
    
  } catch (error) {
    console.error('❌ Network Error:', error);
    
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

// CHANGED: Play video inline (stops floating player first)
function playInlineVideo(videoId) {
  // Stop floating player if it's playing
  if (floatingVideo.style.display !== 'none') {
    floatingVideoInner.innerHTML = '';
    floatingVideo.style.display = 'none';
    console.log('🔴 Stopped floating player');
  }
  
  ytInlineIframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
  ytInlinePlayer.style.display = 'block';
  
  // Scroll to player
  ytInlinePlayer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  
  console.log('✅ Inline player opened');
}

// CHANGED: Open floating video window (stops inline player first)
function openFloatingVideo(videoId) {
  if (!floatingVideo || !floatingVideoInner) {
    console.error('❌ Floating video elements not found');
    alert('Floating player not available. Make sure the HTML includes the floating video container.');
    return;
  }
  
  // Stop inline player if it's playing
  if (ytInlinePlayer.style.display !== 'none') {
    ytInlineIframe.src = '';
    ytInlinePlayer.style.display = 'none';
    console.log('🔴 Stopped inline player');
  }
  
  console.log('🎬 Loading video in floating player:', videoId);
  
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
  
  // Re-render feather icons
  if (typeof feather !== 'undefined') {
    setTimeout(() => feather.replace(), 10);
  }
  
  console.log('✅ Floating player opened');
}

// Close floating player
ytFloatClose?.addEventListener('click', () => {
  floatingVideoInner.innerHTML = '';
  floatingVideo.style.display = 'none';
  console.log('🔴 Floating player closed');
});

// Make floating window draggable (if jQuery UI available)
if (typeof $ !== 'undefined' && $.fn.draggable) {
  $(document).ready(function() {
    $('#floatingVideo').draggable({
      handle: '.fv-header',
      containment: 'window'
    });
    console.log('✅ Floating video is draggable');
  });
}

// Event listeners
ytBtn?.addEventListener('click', (e) => {
  e.preventDefault();
  searchYouTube();
});

ytSearchInput?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    searchYouTube();
  }
});

// Public API
window.openFloatingYTEmbed = openFloatingVideo;
window.playInlineYT = playInlineVideo;
window.stopAllYTPlayers = stopAllPlayers;

// Diagnostic function
function testYouTubeAPI() {
  console.log('🧪 Testing YouTube API...');
  fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=1&q=test&key=${YT_KEY}`)
    .then(r => r.json())
    .then(data => {
      if (data.error) {
        console.error('❌ API Test Failed:', data.error);
      } else {
        console.log('✅ API Test Successful!');
      }
    })
    .catch(err => console.error('❌ Network Error:', err));
}

window.testYouTubeAPI = testYouTubeAPI;

console.log('✅ YouTube module loaded');