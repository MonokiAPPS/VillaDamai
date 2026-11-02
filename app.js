const rooms = [1, 2, 3, 4];
const monthNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const dayNames = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
let viewDate = new Date(); viewDate.setDate(1);
let bookings = [];
let supabaseClient = null;
const $ = (id) => document.getElementById(id);

function dateKey(date) { const y = date.getFullYear(); const m = String(date.getMonth() + 1).padStart(2, '0'); const d = String(date.getDate()).padStart(2, '0'); return `${y}-${m}-${d}`; }
function parseDate(value) { const [y,m,d] = value.split('-').map(Number); return new Date(y, m - 1, d); }
function formatMoney(value) { return new Intl.NumberFormat('id-ID', { style:'currency', currency:'IDR', maximumFractionDigits:0 }).format(Number(value) || 0); }
function formatDate(value) { return parseDate(value).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' }); }
function makeId() { return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`; }

async function initStorage() {
  const configured = window.APP_CONFIG?.SUPABASE_URL && window.APP_CONFIG?.SUPABASE_PUBLISHABLE_KEY && window.supabase;
  if (configured) {
    supabaseClient = window.supabase.createClient(window.APP_CONFIG.SUPABASE_URL, window.APP_CONFIG.SUPABASE_PUBLISHABLE_KEY);
    const { data, error } = await supabaseClient.from('bookings').select('*').order('check_in');
    if (error) throw error;
    bookings = data || [];
    $('connectionStatus').textContent = 'Tersambung untuk semua admin';
  } else {
    bookings = JSON.parse(localStorage.getItem('villa-bookings') || '[]');
    $('connectionStatus').textContent = 'Mode lokal â€” isi Supabase untuk berbagi data';
  }
}
async function persistBooking(booking, isEdit) {
  if (supabaseClient) {
    const result = isEdit ? await supabaseClient.from('bookings').update(booking).eq('id', booking.id).select().single() : await supabaseClient.from('bookings').insert(booking).select().single();
    if (result.error) throw result.error;
    return result.data;
  }
  const index = bookings.findIndex(item => item.id === booking.id);
  if (index >= 0) bookings[index] = booking; else bookings.push(booking);
  localStorage.setItem('villa-bookings', JSON.stringify(bookings));
  return booking;
}
async function removeBooking(id) {
  if (supabaseClient) { const { error } = await supabaseClient.from('bookings').delete().eq('id', id); if (error) throw error; }
  bookings = bookings.filter(item => item.id !== id);
  if (!supabaseClient) localStorage.setItem('villa-bookings', JSON.stringify(bookings));
}
function overlaps(candidate, ignoreId) {
  return bookings.some(item => item.id !== ignoreId && Number(item.room) === Number(candidate.room) && candidate.check_in <= item.check_out && candidate.check_out >= item.check_in);
}
function renderCalendar() {
  const year = viewDate.getFullYear(), month = viewDate.getMonth();
  $('monthTitle').textContent = `${monthNames[month]} ${year}`;
  const days = new Date(year, month + 1, 0).getDate();
  const grid = $('calendar'); grid.innerHTML = '';
  const blank = document.createElement('div'); blank.className = 'calendar-cell calendar-head room-label'; blank.textContent = 'KAMAR'; grid.appendChild(blank);
  for (let day = 1; day <= days; day++) {
    const date = new Date(year, month, day);
    const head = document.createElement('div');
    head.className = `calendar-cell calendar-head ${[0, 6].includes(date.getDay()) ? 'weekend' : ''}`;
    head.innerHTML = `<span class="day-name">${dayNames[date.getDay()]}</span><span class="day-number">${day}</span>`;
    grid.appendChild(head);
  }
  rooms.forEach(room => {
    const label = document.createElement('div'); label.className = 'calendar-cell room-label'; label.textContent = `Kamar ${room}`; grid.appendChild(label);
    for (let day = 1; day <= days; day++) {
      const date = new Date(year, month, day), key = dateKey(date);
      const cell = document.createElement('div');
      cell.className = `calendar-cell date-cell ${key === dateKey(new Date()) ? 'today' : ''}`;
      const booking = bookings.find(item => Number(item.room) === room && item.check_in <= key && item.check_out >= key);
      if (booking) {
        cell.innerHTML = '<button type="button" class="occupied-mark" aria-label="Lihat detail reservasi">&#10003;</button>';
        cell.querySelector('.occupied-mark').addEventListener('click', () => openDetailsModal(booking));
      } else {
        cell.innerHTML = '<div class="empty-slot"></div>';
      }
      grid.appendChild(cell);
    }
  });
}
function escapeHtml(text) { return String(text).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char])); }
function openModal(booking) {
  $('bookingModal').classList.remove('hidden'); $('formError').textContent = '';
  const editing = Boolean(booking); $('modalEyebrow').textContent = editing ? 'Ubah reservasi' : 'Reservasi baru'; $('modalTitle').textContent = editing ? 'Edit check-in' : 'Tambah check-in'; $('deleteButton').classList.toggle('hidden', !editing);
  $('bookingId').value = editing ? booking.id : ''; $('guestName').value = editing ? booking.guest_name : ''; $('room').value = editing ? booking.room : '1'; $('deposit').value = editing ? booking.deposit : ''; $('checkIn').value = editing ? booking.check_in : dateKey(new Date()); $('checkOut').value = editing ? booking.check_out : dateKey(new Date(Date.now()+86400000));
  $('guestName').focus();
}

function closeModal() { $('bookingModal').classList.add('hidden'); }
let selectedBooking = null;
function openDetailsModal(booking) {
  selectedBooking = booking;
  $('detailsContent').innerHTML = `
    <div class="detail-item"><span>Nama tamu</span><strong>${escapeHtml(booking.guest_name)}</strong></div>
    <div class="detail-item"><span>Kamar</span><strong>Kamar ${booking.room}</strong></div>
    <div class="detail-item"><span>Check-in</span><strong>${formatDate(booking.check_in)}</strong></div>
    <div class="detail-item"><span>Check-out</span><strong>${formatDate(booking.check_out)}</strong></div>
    <div class="detail-item"><span>Jumlah DP</span><strong>${formatMoney(booking.deposit)}</strong></div>`;
  $('detailsModal').classList.remove('hidden');
}
function closeDetailsModal() { $('detailsModal').classList.add('hidden'); selectedBooking = null; }
function getReportBookings() {
  const from = $('reportFrom').value, to = $('reportTo').value;
  return bookings.filter(item => (!from || item.check_out >= from) && (!to || item.check_in <= to)).sort((a, b) => a.check_in.localeCompare(b.check_in));
}
function renderReport() {
  const rows = getReportBookings();
  const total = rows.reduce((sum, item) => sum + Number(item.deposit || 0), 0);
  $('reportSummary').innerHTML = `<div class="report-stat"><span>Total reservasi</span><strong>${rows.length}</strong></div><div class="report-stat"><span>Total DP</span><strong>${formatMoney(total)}</strong></div>`;
  $('reportRows').innerHTML = rows.length ? rows.map((item, index) => `<tr><td>${index + 1}</td><td>${escapeHtml(item.guest_name)}</td><td>${item.room}</td><td>${formatDate(item.check_in)}</td><td>${formatDate(item.check_out)}</td><td>${formatMoney(item.deposit)}</td></tr>`).join('') : '<tr><td colspan="6">Tidak ada reservasi pada periode ini.</td></tr>';
}
function openReportModal() {
  const year = new Date().getFullYear();
  $('reportFrom').value = `${year}-01-01`; $('reportTo').value = `${year}-12-31`;
  renderReport(); $('reportModal').classList.remove('hidden');
}
function closeReportModal() { $('reportModal').classList.add('hidden'); }
function downloadReportPdf() {
  const rows = getReportBookings();
  if (!window.jspdf || !window.jspdf.jsPDF) return alert('Fitur PDF belum termuat. Periksa koneksi internet lalu coba lagi.');
  const doc = new window.jspdf.jsPDF();
  const total = rows.reduce((sum, item) => sum + Number(item.deposit || 0), 0);
  doc.setFontSize(18); doc.text('Laporan Reservasi Villa Kamar', 14, 18);
  doc.setFontSize(10); doc.text(`Periode: ${$('reportFrom').value || '-'} s/d ${$('reportTo').value || '-'}`, 14, 26);
  doc.text(`Total reservasi: ${rows.length}    Total DP: ${formatMoney(total)}`, 14, 33);
  doc.autoTable({ startY: 40, head: [['No', 'Tamu', 'Kamar', 'Check-in', 'Check-out', 'DP']], body: rows.map((item, index) => [index + 1, item.guest_name, `Kamar ${item.room}`, formatDate(item.check_in), formatDate(item.check_out), formatMoney(item.deposit)]), theme: 'grid', headStyles: { fillColor: [11, 107, 99] }, styles: { fontSize: 9 } });
  doc.save(`laporan-reservasi-${$('reportFrom').value || 'semua'}-${$('reportTo').value || 'data'}.pdf`);
}

$('newBookingButton').addEventListener('click', () => openModal());
$('closeModal').addEventListener('click', closeModal); $('cancelButton').addEventListener('click', closeModal);
$('bookingModal').addEventListener('click', event => { if (event.target.id === 'bookingModal') closeModal(); });
$('closeDetails').addEventListener('click', closeDetailsModal); $('closeDetailsButton').addEventListener('click', closeDetailsModal);
$('detailsModal').addEventListener('click', event => { if (event.target.id === 'detailsModal') closeDetailsModal(); });
$('editDetailsButton').addEventListener('click', () => { const booking = selectedBooking; closeDetailsModal(); if (booking) openModal(booking); });
$('reportButton').addEventListener('click', openReportModal); $('closeReport').addEventListener('click', closeReportModal); $('cancelReport').addEventListener('click', closeReportModal);
$('reportModal').addEventListener('click', event => { if (event.target.id === 'reportModal') closeReportModal(); });
$('reportFrom').addEventListener('change', renderReport); $('reportTo').addEventListener('change', renderReport); $('downloadReport').addEventListener('click', downloadReportPdf);
$('previousMonth').addEventListener('click', () => { viewDate.setMonth(viewDate.getMonth()-1); renderCalendar(); }); $('nextMonth').addEventListener('click', () => { viewDate.setMonth(viewDate.getMonth()+1); renderCalendar(); }); $('todayButton').addEventListener('click', () => { viewDate = new Date(); viewDate.setDate(1); renderCalendar(); });
$('bookingForm').addEventListener('submit', async event => { event.preventDefault(); const booking = { id: $('bookingId').value || makeId(), guest_name: $('guestName').value.trim(), room: Number($('room').value), deposit: Number(String($('deposit').value).replace(/[^0-9]/g,'')), check_in: $('checkIn').value, check_out: $('checkOut').value }; $('formError').textContent = '';
  if (!booking.guest_name || !booking.check_in || !booking.check_out || !booking.deposit) return $('formError').textContent = 'Lengkapi semua data terlebih dahulu.';
  if (booking.check_out <= booking.check_in) return $('formError').textContent = 'Tanggal check-out harus setelah check-in.';
  if (overlaps(booking, booking.id)) return $('formError').textContent = 'Kamar ini sudah terisi pada rentang tanggal tersebut.';
  const button = $('saveButton'); button.disabled = true; button.textContent = 'Menyimpanâ€¦';
  try { const saved = await persistBooking(booking, Boolean($('bookingId').value)); const index = bookings.findIndex(item => item.id === saved.id); if (index >= 0) bookings[index] = saved; else bookings.push(saved); renderCalendar(); closeModal(); } catch (error) { $('formError').textContent = 'Gagal menyimpan. Periksa koneksi atau konfigurasi Supabase.'; console.error(error); } finally { button.disabled = false; button.textContent = 'Simpan'; }
});
$('deleteButton').addEventListener('click', async () => { const id = $('bookingId').value; if (!id || !confirm('Batalkan check-in ini?')) return; try { await removeBooking(id); renderCalendar(); closeModal(); } catch (error) { $('formError').textContent = 'Gagal membatalkan data.'; console.error(error); } });
(async function start() { try { await initStorage(); renderCalendar(); } catch(error) { $('connectionStatus').textContent = 'Gagal terhubung â€” cek konfigurasi'; console.error(error); } })();





