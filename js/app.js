/**
 * CBT EXAM MANAGEMENT SYSTEM - FRONTEND ENGINE
 */

// 1. SUPABASE CLIENT INITIALIZATION
// Catatan: Ganti placeholder ini dengan project Supabase milik Anda.
const SUPABASE_URL = "https://YOUR_SUPABASE_PROJECT_ID.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

// APP STATE
let currentUser = null;
let activeSessionTimer = null;
let currentExamSession = null;

// FALLBACK IN-MEMORY STORAGE (Jika belum terhubung ke Supabase)
let dbFallback = {
  classes: [
    { id: 1, name: 'X-MIPA-1' },
    { id: 2, name: 'X-MIPA-2' },
    { id: 3, name: 'XI-IPS-1' }
  ],
  rooms: [
    { id: 1, name: 'LAB-KOMP-01', capacity: 30 },
    { id: 2, name: 'LAB-KOMP-02', capacity: 30 }
  ],
  users: [
    { id: 1, username: 'admin', password: 'admin123', full_name: 'Administrator CBT', role: 'admin', class_id: null, room_id: null, exam_number: null },
    { id: 2, username: 'pengawas01', password: 'pass123', full_name: 'Budi Santoso, M.Pd', role: 'proctor', class_id: null, room_id: 1, exam_number: null },
    { id: 3, username: '2026001', password: 'siswa123', full_name: 'Ahmad Farhan', role: 'student', class_id: 1, room_id: 1, exam_number: 'CBT-001' },
    { id: 4, username: '2026002', password: 'siswa123', full_name: 'Siti Nurhaliza', role: 'student', class_id: 1, room_id: 1, exam_number: 'CBT-002' }
  ],
  exams: [
    { id: 1, title: 'Penilaian Tengah Semester - Matematika', subject: 'Matematika', duration_minutes: 90 }
  ],
  sessions: [
    { id: 1, exam_id: 1, room_id: 1, proctor_id: 2, session_name: 'Sesi 1 Pagi', token: 'WXYZ89', status: 'active' }
  ]
};

// ==========================================
// AUTH CONTROLLER
// ==========================================
function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value.trim();

  // Verifikasi Pengguna
  const user = dbFallback.users.find(u => u.username === username && u.password === password);
  if (!user) {
    alert('Username atau Password salah!');
    return;
  }

  currentUser = user;
  setupSessionView();
}

function setupSessionView() {
  document.getElementById('view-login').style.display = 'none';
  const actions = document.getElementById('auth-actions');
  actions.style.display = 'flex';
  document.getElementById('current-user-info').innerText = currentUser.full_name;
  document.getElementById('current-role-badge').innerText = currentUser.role;

  if (currentUser.role === 'admin') {
    document.getElementById('view-admin').style.display = 'block';
    renderAdminData();
  } else if (currentUser.role === 'proctor') {
    document.getElementById('view-proctor').style.display = 'block';
    renderProctorView();
  } else if (currentUser.role === 'student') {
    document.getElementById('view-student').style.display = 'block';
    renderStudentView();
  }
}

function logout() {
  currentUser = null;
  if (activeSessionTimer) clearInterval(activeSessionTimer);
  document.getElementById('view-admin').style.display = 'none';
  document.getElementById('view-proctor').style.display = 'none';
  document.getElementById('view-student').style.display = 'none';
  document.getElementById('auth-actions').style.display = 'none';
  document.getElementById('view-login').style.display = 'flex';
  document.getElementById('form-login').reset();
}

// ==========================================
// ADMIN MODULE
// ==========================================
function switchAdminTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.admin-tab-content').forEach(c => c.style.display = 'none');
  
  if (event) event.target.classList.add('active');
  document.getElementById(`tab-${tabName}`).style.display = 'block';

  if (tabName === 'print-center') populatePrintOptions();
}

function renderAdminData() {
  renderClasses();
  renderRooms();
  renderUsers();
  renderSessions();
}

function renderClasses() {
  const tbody = document.getElementById('tbody-classes');
  tbody.innerHTML = '';
  dbFallback.classes.forEach((c, i) => {
    tbody.innerHTML += `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${c.name}</strong></td>
        <td><button class="btn btn-danger btn-sm" onclick="deleteClass(${c.id})">Hapus</button></td>
      </tr>
    `;
  });
}

function addClass() {
  const name = document.getElementById('input-class-name').value.trim();
  if (!name) return alert('Nama kelas tidak boleh kosong');
  dbFallback.classes.push({ id: Date.now(), name });
  document.getElementById('input-class-name').value = '';
  renderClasses();
}

function deleteClass(id) {
  if (confirm('Hapus kelas ini?')) {
    dbFallback.classes = dbFallback.classes.filter(c => c.id !== id);
    renderClasses();
  }
}

function renderRooms() {
  const tbody = document.getElementById('tbody-rooms');
  tbody.innerHTML = '';
  dbFallback.rooms.forEach((r, i) => {
    tbody.innerHTML += `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${r.name}</strong></td>
        <td>${r.capacity} Siswa</td>
        <td><button class="btn btn-danger btn-sm" onclick="deleteRoom(${r.id})">Hapus</button></td>
      </tr>
    `;
  });
}

function addRoom() {
  const name = document.getElementById('input-room-name').value.trim();
  const capacity = parseInt(document.getElementById('input-room-capacity').value) || 30;
  if (!name) return alert('Nama ruang wajib diisi');
  dbFallback.rooms.push({ id: Date.now(), name, capacity });
  document.getElementById('input-room-name').value = '';
  renderRooms();
}

function deleteRoom(id) {
  if (confirm('Hapus ruang ini?')) {
    dbFallback.rooms = dbFallback.rooms.filter(r => r.id !== id);
    renderRooms();
  }
}

function renderUsers() {
  const tbody = document.getElementById('tbody-users');
  tbody.innerHTML = '';
  dbFallback.users.forEach(u => {
    const className = dbFallback.classes.find(c => c.id === u.class_id)?.name || '-';
    const roomName = dbFallback.rooms.find(r => r.id === u.room_id)?.name || '-';
    tbody.innerHTML += `
      <tr>
        <td>${u.exam_number || u.username}</td>
        <td>${u.full_name}</td>
        <td><span class="role-tag">${u.role}</span></td>
        <td>${className}</td>
        <td>${roomName}</td>
        <td>
          ${u.role !== 'admin' ? `<button class="btn btn-danger btn-sm" onclick="deleteUser(${u.id})">Hapus</button>` : '-'}
        </td>
      </tr>
    `;
  });
}

function deleteUser(id) {
  if (confirm('Hapus pengguna ini?')) {
    dbFallback.users = dbFallback.users.filter(u => u.id !== id);
    renderUsers();
  }
}

// CSV IMPORT ENGINE
function triggerImportCSV() {
  document.getElementById('csv-file-input').click();
}

function importUsersCSV(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const text = e.target.result;
    const lines = text.split('\n');
    let imported = 0;

    // Format CSV: username,password,full_name,role,class_name,room_name,exam_number
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const [username, password, full_name, role, className, roomName, exam_number] = line.split(',');

      if (username && password && role) {
        const cls = dbFallback.classes.find(c => c.name.toLowerCase() === (className||'').trim().toLowerCase());
        const rm = dbFallback.rooms.find(r => r.name.toLowerCase() === (roomName||'').trim().toLowerCase());

        dbFallback.users.push({
          id: Date.now() + i,
          username: username.trim(),
          password: password.trim(),
          full_name: full_name.trim(),
          role: role.trim(),
          class_id: cls ? cls.id : null,
          room_id: rm ? rm.id : null,
          exam_number: (exam_number || '').trim() || null
        });
        imported++;
      }
    }
    alert(`Berhasil mengimpor ${imported} data pengguna!`);
    renderUsers();
  };
  reader.readAsText(file);
}

function renderSessions() {
  const tbody = document.getElementById('tbody-sessions');
  tbody.innerHTML = '';
  dbFallback.sessions.forEach(s => {
    const exam = dbFallback.exams.find(e => e.id === s.exam_id);
    const room = dbFallback.rooms.find(r => r.id === s.room_id);
    tbody.innerHTML += `
      <tr>
        <td><strong>${exam ? exam.title : '-'}</strong></td>
        <td>${s.session_name}</td>
        <td>${room ? room.name : '-'}</td>
        <td><strong style="color: var(--primary); font-family: monospace; font-size: 1.1rem;">${s.token}</strong></td>
        <td><span class="role-tag">${s.status}</span></td>
        <td>
          <button class="btn btn-outline btn-sm" onclick="refreshTokenSession(${s.id})">Refresh Token</button>
        </td>
      </tr>
    `;
  });
}

function refreshTokenSession(sessionId) {
  const session = dbFallback.sessions.find(s => s.id === sessionId);
  if (session) {
    session.token = generateRandomToken();
    renderSessions();
    alert(`Token baru dirilis: ${session.token}`);
  }
}

function generateRandomToken() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let res = '';
  for (let i = 0; i < 6; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return res;
}

// ==========================================
// PROCTOR MODULE
// ==========================================
function renderProctorView() {
  const room = dbFallback.rooms.find(r => r.id === currentUser.room_id) || dbFallback.rooms[0];
  document.getElementById('proctor-room-info').innerText = `Ruang: ${room ? room.name : '-'}`;

  const session = dbFallback.sessions.find(s => s.room_id === room?.id && s.status === 'active');
  currentExamSession = session || dbFallback.sessions[0];

  document.getElementById('proctor-token-display').innerText = currentExamSession ? currentExamSession.token : 'TIDAK ADA';

  // Render Mahasiswa di Ruangan Pengawas
  const tbody = document.getElementById('tbody-proctor-students');
  tbody.innerHTML = '';
  const students = dbFallback.users.filter(u => u.role === 'student' && u.room_id === (room ? room.id : null));

  students.forEach(s => {
    const cls = dbFallback.classes.find(c => c.id === s.class_id)?.name || '-';
    tbody.innerHTML += `
      <tr>
        <td>${s.exam_number || s.username}</td>
        <td><strong>${s.full_name}</strong></td>
        <td>${cls}</td>
        <td><span class="role-tag" style="background:#dcfce7; color:#15803d;">Siap Ujian</span></td>
      </tr>
    `;
  });
}

function proctorRefreshToken() {
  if (currentExamSession) {
    currentExamSession.token = generateRandomToken();
    document.getElementById('proctor-token-display').innerText = currentExamSession.token;
  }
}

// ==========================================
// STUDENT MODULE & REAL-TIME TIMER
// ==========================================
function renderStudentView() {
  const activeExam = dbFallback.exams[0];
  document.getElementById('student-exam-name').innerText = activeExam.title + ` (${activeExam.duration_minutes} Menit)`;
  document.getElementById('student-token-screen').style.display = 'block';
  document.getElementById('student-exam-screen').style.display = 'none';
}

function startStudentExam() {
  const inputToken = document.getElementById('input-exam-token').value.trim().toUpperCase();
  const session = dbFallback.sessions.find(s => s.room_id === currentUser.room_id) || dbFallback.sessions[0];

  if (!inputToken || inputToken !== session.token) {
    return alert('Token ujian tidak valid atau belum dirilis oleh pengawas!');
  }

  document.getElementById('student-token-screen').style.display = 'none';
  document.getElementById('student-exam-screen').style.display = 'block';
  document.getElementById('cbt-exam-title').innerText = dbFallback.exams[0].title;
  document.getElementById('cbt-student-name').innerText = `Peserta: ${currentUser.full_name} (${currentUser.exam_number || currentUser.username})`;

  // Start Countdown Timer
  const durationSeconds = dbFallback.exams[0].duration_minutes * 60;
  runExamCountdown(durationSeconds);
}

function runExamCountdown(totalSeconds) {
  let remaining = totalSeconds;
  const clock = document.getElementById('cbt-timer-clock');

  activeSessionTimer = setInterval(() => {
    remaining--;

    const hours = Math.floor(remaining / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    const seconds = remaining % 60;

    clock.innerText = 
      `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    if (remaining <= 0) {
      clearInterval(activeSessionTimer);
      alert('Waktu ujian telah berakhir! Lembar jawaban dikumpulkan otomatis.');
      finishStudentExam();
    }
  }, 1000);
}

function finishStudentExam() {
  if (activeSessionTimer) clearInterval(activeSessionTimer);
  alert('Ujian berhasil dikumpulkan. Terima kasih.');
  logout();
}

// ==========================================
// PRINT MODULE (KARTU & DAFTAR HADIR)
// ==========================================
function populatePrintOptions() {
  const select = document.getElementById('select-print-room');
  select.innerHTML = '<option value="">-- Pilih Ruang --</option>';
  dbFallback.rooms.forEach(r => {
    select.innerHTML += `<option value="${r.id}">${r.name}</option>`;
  });
}

function previewPrintData() {
  const roomId = parseInt(document.getElementById('select-print-room').value);
  const container = document.getElementById('print-preview-container');
  if (!roomId) {
    container.innerHTML = '<div style="color: var(--text-muted); text-align: center; padding: 2rem;">Pilih ruang untuk melihat pratinjau dokumen cetak</div>';
    return;
  }

  const room = dbFallback.rooms.find(r => r.id === roomId);
  const students = dbFallback.users.filter(u => u.role === 'student' && u.room_id === roomId);

  container.innerHTML = `
    <h4>Pratinjau Ruang: ${room.name}</h4>
    <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1rem;">Total peserta di ruangan ini: ${students.length} orang</p>
    <div class="table-responsive">
      <table>
        <thead><tr><th>No. Peserta</th><th>Nama</th><th>Kelas</th></tr></thead>
        <tbody>
          ${students.map(s => `<tr><td>${s.exam_number || s.username}</td><td>${s.full_name}</td><td>${dbFallback.classes.find(c => c.id === s.class_id)?.name || '-'}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function printDocument(type) {
  const roomId = parseInt(document.getElementById('select-print-room').value);
  if (!roomId) return alert('Silakan pilih ruang ujian terlebih dahulu!');

  const room = dbFallback.rooms.find(r => r.id === roomId);
  const students = dbFallback.users.filter(u => u.role === 'student' && u.room_id === roomId);
  const printSection = document.getElementById('print-section');
  printSection.innerHTML = '';

  if (type === 'attendance') {
    // Format Daftar Hadir / Presensi Ruangan
    printSection.innerHTML = `
      <div style="padding: 2rem;">
        <h2 style="text-align: center; margin-bottom: 0.25rem;">DAFTAR HADIR PESERTA UJIAN BERBASIS KOMPUTER (CBT)</h2>
        <p style="text-align: center; margin-bottom: 1.5rem;">Ruang Ujian: <strong>${room.name}</strong></p>
        <table style="width: 100%; border: 1px solid #000; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 1px solid #000; background: #eee;">
              <th style="border: 1px solid #000; padding: 8px;">No</th>
              <th style="border: 1px solid #000; padding: 8px;">No. Peserta</th>
              <th style="border: 1px solid #000; padding: 8px;">Nama Lengkap</th>
              <th style="border: 1px solid #000; padding: 8px;">Kelas</th>
              <th style="border: 1px solid #000; padding: 8px; width: 150px;">Tanda Tangan</th>
            </tr>
          </thead>
          <tbody>
            ${students.map((s, idx) => `
              <tr>
                <td style="border: 1px solid #000; padding: 8px; text-align: center;">${idx + 1}</td>
                <td style="border: 1px solid #000; padding: 8px;">${s.exam_number || s.username}</td>
                <td style="border: 1px solid #000; padding: 8px;"><strong>${s.full_name}</strong></td>
                <td style="border: 1px solid #000; padding: 8px;">${dbFallback.classes.find(c => c.id === s.class_id)?.name || '-'}</td>
                <td style="border: 1px solid #000; padding: 8px; height: 35px;">${idx + 1}. ................</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } else if (type === 'cards') {
    // Format Cetak Kartu Peserta
    let cardsHtml = '<div style="padding: 1rem;">';
    students.forEach(s => {
      cardsHtml += `
        <div class="student-card">
          <h4 style="text-align: center; border-bottom: 1px solid #000; padding-bottom: 5px;">KARTU PESERTA CBT</h4>
          <p style="margin-top: 8px;"><strong>Nama:</strong> ${s.full_name}</p>
          <p><strong>No. Peserta:</strong> ${s.exam_number || s.username}</p>
          <p><strong>Kelas:</strong> ${dbFallback.classes.find(c => c.id === s.class_id)?.name || '-'}</p>
          <p><strong>Ruang:</strong> ${room.name}</p>
          <p style="margin-top: 8px; font-size: 0.75rem; border-top: 1px dashed #aaa; padding-top: 4px;">Username: <code>${s.username}</code> | Password: <code>${s.password}</code></p>
        </div>
      `;
    });
    cardsHtml += '</div>';
    printSection.innerHTML = cardsHtml;
  }

  window.print();
}