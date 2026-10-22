// --- State Management ---
        const STORAGE_KEY = 'KAI_GUEST_BOOK_DATA';
        const GUEST_ID_PREFIX = 'GST-';
        const TIME_FORMAT_LENGTH = 5;
        const SIGNATURE_TARGETS = {
            TAMU_MASUK: 'tamu_masuk',
            SATPAM: 'satpam',
            TAMU_KELUAR: 'tamu_keluar'
        };
        
        let guests = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        
        // Modal Instances
        let formModal, signatureModal, checkoutModal, summaryModal;
        
        // Signature Pad Variables
        let canvas, ctx, isDrawing = false;
        let lastX = 0, lastY = 0;
        let canvasRatio = 1;

        // --- Initialization ---
        document.addEventListener('DOMContentLoaded', () => {
            try {
                // Set header date
                const today = new Date();
                const options = { day: 'numeric', month: 'long', year: 'numeric' };
                const formattedDate = today.toLocaleDateString('id-ID', options);
                document.getElementById('header-date').innerText = formattedDate;
                document.getElementById('print-header-date').innerText = formattedDate;

                // Init modal instances with error handling
                try {
                    formModal = new bootstrap.Modal(document.getElementById('formModal'));
                    signatureModal = new bootstrap.Modal(document.getElementById('signatureModal'));
                    checkoutModal = new bootstrap.Modal(document.getElementById('checkoutModal'));
                    summaryModal = new bootstrap.Modal(document.getElementById('summaryModal'));
                } catch(error) {
                    console.error('Bootstrap modal initialization error:', error);
                }

                // Init canvas and signature pad
                canvas = document.getElementById('signaturePad');
                if(!canvas) {
                    console.error('Canvas element not found');
                    Swal.fire('Error', 'Elemen kanvas tidak ditemukan.', 'error');
                    return;
                }
                ctx = canvas.getContext('2d');
                
                initSignaturePad();

                // Validate localStorage data
                try {
                    const storedData = localStorage.getItem(STORAGE_KEY);
                    if(storedData) {
                        guests = JSON.parse(storedData);
                        // Validate guest data structure
                        guests = guests.filter(g => g && g.id && g.nama);
                    }
                } catch(error) {
                    console.warn('Error parsing localStorage data, starting fresh:', error);
                    guests = [];
                    localStorage.removeItem(STORAGE_KEY);
                }

                // Attach event listeners
                const searchInput = document.getElementById('searchInput');
                const filterStatus = document.getElementById('filterStatus');
                
                if(searchInput) searchInput.addEventListener('input', renderTable);
                if(filterStatus) filterStatus.addEventListener('change', renderTable);
                const filterDateFrom = document.getElementById('filterDateFrom');
                const filterDateTo = document.getElementById('filterDateTo');
                if(filterDateFrom) filterDateFrom.addEventListener('change', renderTable);
                if(filterDateTo) filterDateTo.addEventListener('change', renderTable);

                // Initial render
                renderTable();
            } catch(error) {
                console.error('Initialization error:', error);
                Swal.fire('Error', 'Terjadi kesalahan saat memulai aplikasi.', 'error');
            }
        });

        // --- Core Functions ---

        function saveData() {
            // 1. Validasi Form
            const form = document.getElementById('guestForm');
            if(!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            // 2. Validasi Signatures
            const id = document.getElementById('dataId').value;
            const ttdMasuk = document.getElementById('ttdTamuMasukBase64').value;
            const ttdSatpam = document.getElementById('ttdSatpamBase64').value;

            if(!ttdMasuk || ttdMasuk.trim() === '') {
                Swal.fire('Peringatan', 'Tanda tangan Tamu wajib diisi!', 'warning'); 
                return;
            }
            if(!ttdSatpam || ttdSatpam.trim() === '') {
                Swal.fire('Peringatan', 'Tanda tangan Petugas wajib diisi!', 'warning'); 
                return;
            }

            // 3. Validasi No HP hanya angka
            const noHp = document.getElementById('noHp').value;
                if(!/^\d{10,13}$/.test(noHp)) {
                    Swal.fire('Peringatan', 'No HP tidak valid (10-13 digit angka)!', 'warning');
                    return;
                }
            // 4. Generate timestamp
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
            const timeStr = formatTime(now);

            // 5. Prepare data object
            const newGuest = {
                id: id ? id : GUEST_ID_PREFIX + Date.now(),
                tanggal: dateStr,
                businessArea: sanitizeInput(document.getElementById('businessArea').value),
                noVisitor: sanitizeInput(document.getElementById('noVisitor').value),
                noHp: noHp,
                nama: sanitizeInput(document.getElementById('nama').value),
                instansi: sanitizeInput(document.getElementById('instansi').value),
                keperluan: sanitizeInput(document.getElementById('keperluan').value),
                personil: sanitizeInput(document.getElementById('personil').value),
                namaSatpam: sanitizeInput(document.getElementById('namaSatpam').value),
                
                jamMasuk: timeStr,
                ttdMasuk: ttdMasuk,
                ttdSatpam: ttdSatpam,
                
                // Fields for checkout
                jamKeluar: null,
                ttdKeluar: null
            };

            // 6. Save or Update
            if (id) {
                // Update existing record
                const index = guests.findIndex(g => g.id === id);
                if(index > -1) {
                    // Preserve original timestamps and checkout data
                    newGuest.jamMasuk = guests[index].jamMasuk;
                    newGuest.tanggal = guests[index].tanggal;
                    newGuest.jamKeluar = guests[index].jamKeluar;
                    newGuest.ttdKeluar = guests[index].ttdKeluar;
                    
                    guests[index] = newGuest;
                    Swal.fire('Sukses', 'Data berhasil diupdate.', 'success');
                }
            } else {
                // Create new record
                guests.unshift(newGuest); // Add at the beginning
                Swal.fire('Sukses', 'Data tamu berhasil disimpan.', 'success');
            }

            // 7. Persist and refresh
            saveToStorage();
            formModal.hide();
            renderTable();
        }

        // Helper: Sanitize input to prevent XSS
        function sanitizeInput(value) {
            const div = document.createElement('div');
            div.textContent = value;
            return div.innerHTML;
        }

        // Helper: Format time HH:MM
        function formatTime(date) {
            return date.toTimeString().split(' ')[0].substring(0, TIME_FORMAT_LENGTH);
        }

        function saveToStorage() {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(guests));
            updateDashboard();
        }

        // --- UI & Rendering ---

        function renderTable() {
            const tbody = document.getElementById('tableBody');
            tbody.innerHTML = '';

            const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
            const statusFilter = document.getElementById('filterStatus').value;
            const dateFrom = document.getElementById('filterDateFrom').value;
            const dateTo = document.getElementById('filterDateTo').value;

        // Apply filters
            let filteredGuests = guests.filter(guest => {
        // Search filter
            const matchSearch = 
                guest.nama.toLowerCase().includes(searchTerm) || 
                guest.instansi.toLowerCase().includes(searchTerm) || 
                (guest.noVisitor || '').toLowerCase().includes(searchTerm) ||                
                (guest.noHp || '').includes(searchTerm);
        
        // Status filter
                let matchStatus = true;
                if(statusFilter === 'active') matchStatus = guest.jamKeluar === null || guest.jamKeluar === '';
                if(statusFilter === 'done') matchStatus = guest.jamKeluar !== null && guest.jamKeluar !== '';

        // Date range filter
                let matchDate = true;
                if(dateFrom && dateFrom !== '') matchDate = matchDate && (guest.tanggal >= dateFrom);
                if(dateTo && dateTo !== '') matchDate = matchDate && (guest.tanggal <= dateTo);

                return matchSearch && matchStatus && matchDate;
            });

            const printGuest = filteredGuests[0] || guests[0];
            document.getElementById('print-business-area').innerText = printGuest?.businessArea || '-';

            // Render rows
            if(filteredGuests.length === 0) {
                tbody.innerHTML = `<tr><td colspan="13" class="text-center py-4 text-muted">Tidak ada data ditemukan.</td></tr>`;
                updateDashboard(); // Update dashboard even when empty
                return;
            }

            filteredGuests.forEach((guest, index) => {
                const tr = document.createElement('tr');
                
                // Create signature images or dash
                const ttdMasukImg = guest.ttdMasuk ? `<img src="${guest.ttdMasuk}" class="signature-img" alt="TTD Masuk">` : '-';
                const ttdKeluarImg = guest.ttdKeluar ? `<img src="${guest.ttdKeluar}" class="signature-img" alt="TTD Keluar">` : (guest.jamKeluar ? '-' : `<button class="btn btn-sm btn-outline-warning" onclick="openCheckoutModal('${guest.id}')"><i class="fas fa-signature"></i> TTD</button>`);
                const ttdSatpamImg = guest.ttdSatpam ? `<img src="${guest.ttdSatpam}" class="signature-img" alt="TTD ${guest.namaSatpam}"><br><small class="text-muted">${sanitizeInput(guest.namaSatpam)}</small>` : '-';
                const jamKeluarText = guest.jamKeluar && guest.jamKeluar !== '' ? guest.jamKeluar : '<span class="badge bg-warning text-dark">Visiting</span>';

                // Action buttons
                const actionButtons = '';

                tr.innerHTML = `
                    <td class="text-center">${index + 1}</td>
                    <td><b>${sanitizeInput(guest.nama)}</b></td>                        <td>${sanitizeInput(guest.instansi)}</td>
                    <td>${sanitizeInput(guest.keperluan)}</td>
                    <td>${sanitizeInput(guest.personil)}</td>
                    <td>${guest.noHp}</td>
                    <td class="text-center">${guest.noVisitor || '-'}</td>
                    
                    <td class="text-center"><b>${guest.jamMasuk}</b></td>
                    <td class="text-center p-1 signature-cell">${ttdMasukImg}</td>
                    
                    <td class="text-center">${jamKeluarText}</td>
                    <td class="text-center p-1 signature-cell">${ttdKeluarImg}</td>
                    
                    <td class="text-center p-1 signature-cell">${ttdSatpamImg}</td>
                    
                    <td class="text-center no-print">
                        <div class="btn-group btn-group-sm" role="group" aria-label="Aksi">
                            ${actionButtons}
                            <button class="btn btn-info text-white" title="Edit" onclick="editData('${guest.id}')" aria-label="Edit ${guest.nama}"><i class="fas fa-edit"></i></button>
                            <button class="btn btn-danger" title="Hapus" onclick="deleteData('${guest.id}')" aria-label="Hapus ${guest.nama}"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            updateDashboard();
        }

        function updateDashboard() {
            const today = new Date().toISOString().split('T')[0];
            
            const totalSistem = guests.length;
            const totalToday = guests.filter(g => g.tanggal === today).length;
            const activeNow = guests.filter(g => g.jamKeluar === null).length;
            const doneTotal = guests.filter(g => g.jamKeluar !== null).length;

            document.getElementById('stat-total').innerText = totalSistem;
            document.getElementById('stat-today').innerText = totalToday;
            document.getElementById('stat-active').innerText = activeNow;
            document.getElementById('stat-done').innerText = doneTotal;
        }

        function showSummary(type) {
            const today = new Date().toISOString().split('T')[0];
            let filtered = [];
            let title = '';

            if(type === 'today') {
                filtered = guests.filter(g => g.tanggal === today);
                title = 'Total Tamu Hari Ini';
            } else if(type === 'active') {
                filtered = guests.filter(g => g.jamKeluar === null || g.jamKeluar === '');
                title = 'Sedang Berkunjung';
            } else if(type === 'done') {
                filtered = guests.filter(g => g.jamKeluar !== null && g.jamKeluar !== '');
                title = 'Sudah Keluar';
            } else if(type === 'total') {
                filtered = guests;
                title = 'Total Data Sistem';
            }

            document.getElementById('summaryModalTitle').innerText = title;

            const tbody = document.getElementById('summaryTableBody');
            tbody.innerHTML = '';

            if(filtered.length === 0) {
                tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-3">Tidak ada data.</td></tr>`;
            } else {
                filtered.forEach(g => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td class="text-center">${g.tanggal}</td>
                        <td>${sanitizeInput(g.nama)}</td>
                        <td>${sanitizeInput(g.instansi)}</td>
                        <td>${sanitizeInput(g.keperluan)}</td>
                        <td>${sanitizeInput(g.personil)}</td>
                        <td class="text-center">${g.jamMasuk}</td>
                        <td class="text-center">${g.jamKeluar || '-'}</td>
                    `;
                    tbody.appendChild(tr);
                });
            }

    summaryModal.show();
}

        // --- Actions (Edit, Delete, Checkout) ---

        function openAddModal() {
    document.getElementById('guestForm').reset();
    document.getElementById('dataId').value = '';
    document.getElementById('noVisitor').value = generateNoVisitor();
    document.getElementById('ttdTamuMasukBase64').value = '';
    document.getElementById('ttdSatpamBase64').value = '';
    formModal.show();
    setTimeout(() => {
        initAllSignaturePads();
                resetFormSignaturePads();
    }, 300);
}

        function editData(id) {
            const guest = guests.find(g => g.id === id);
            if(!guest) {
                Swal.fire('Error', 'Data tamu tidak ditemukan!', 'error');
                return;
            }

            document.getElementById('dataId').value = guest.id;
            document.getElementById('businessArea').value = guest.businessArea || '';
            document.getElementById('noVisitor').value = guest.noVisitor || '';
            document.getElementById('noHp').value = guest.noHp || '';
            document.getElementById('nama').value = guest.nama || '';
            document.getElementById('instansi').value = guest.instansi || '';
            document.getElementById('keperluan').value = guest.keperluan || '';
            document.getElementById('personil').value = guest.personil || '';
            document.getElementById('namaSatpam').value = guest.namaSatpam || '';

            // Set Signatures Preview
            if(guest.ttdMasuk) {
                document.getElementById('ttdTamuMasukBase64').value = guest.ttdMasuk;
            } else {
                document.getElementById('ttdTamuMasukBase64').value = '';
            }
            
            if(guest.ttdSatpam) {
                document.getElementById('ttdSatpamBase64').value = guest.ttdSatpam;
            } else {
                document.getElementById('ttdSatpamBase64').value = '';
            }

            resetFormSignaturePads();
            formModal.show();
        }

        function deleteData(id) {
            Swal.fire({
                title: 'Apakah Anda Yakin?',
                text: "Data tamu ini akan dihapus permanen!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Ya, Hapus!',
                cancelButtonText: 'Batal'
            }).then((result) => {
                if (result.isConfirmed) {
                    guests = guests.filter(g => g.id !== id);
                    saveToStorage();
                    renderTable();
                    Swal.fire('Terhapus!', 'Data berhasil dihapus.', 'success');
                }
            });
        }

        function openCheckoutModal(id) {
            const guest = guests.find(g => g.id === id);
            if(!guest) {
                Swal.fire('Error', 'Data tamu tidak ditemukan!', 'error');
                return;
            }

            document.getElementById('checkoutId').value = id;
            document.getElementById('ttdTamuKeluarBase64').value = '';
            
            openSignaturePad('tamu_keluar');   // 👈 langsung buka canvas
        }

        function processCheckout() {
            const id = document.getElementById('checkoutId').value;
            const ttdKeluar = document.getElementById('ttdTamuKeluarBase64').value;

            if(!ttdKeluar || ttdKeluar.trim() === '') {
                Swal.fire('Peringatan', 'Tamu wajib tanda tangan sebelum keluar!', 'warning');
                return;
            }

            const index = guests.findIndex(g => g.id === id);
            if(index < 0) {
                Swal.fire('Error', 'Data tamu tidak ditemukan!', 'error');
                return;
            }

            const now = new Date();
            guests[index].jamKeluar = formatTime(now);
            guests[index].ttdKeluar = ttdKeluar;
            
            saveToStorage();
            renderTable();
            checkoutModal.hide();
            Swal.fire('Check Out Sukses', 'Waktu keluar berhasil dicatat.', 'success');
        }

        // --- Signature Pad Logic (untuk Modal Checkout - TTD Tamu Keluar) ---
function initSignaturePad() {
    canvas = document.getElementById('signaturePad');
    ctx = canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    canvas.addEventListener('touchstart', handleTouchStart, {passive: false});
    canvas.addEventListener('touchmove', handleTouchMove, {passive: false});
    canvas.addEventListener('touchend', stopDrawing);
}

function resizeCanvas() {
    canvasRatio = window.devicePixelRatio || 1;
    const displayWidth = canvas.offsetWidth;
    const displayHeight = canvas.offsetHeight;
    canvas.width = displayWidth * canvasRatio;
    canvas.height = displayHeight * canvasRatio;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2 * canvasRatio;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
}

function getPosition(event) {
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if (event.touches && event.touches.length > 0) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
    } else {
        clientX = event.clientX;
        clientY = event.clientY;
    }
    return {
        x: (clientX - rect.left) * (canvas.width / rect.width),
        y: (clientY - rect.top) * (canvas.height / rect.height)
    };
}

function startDrawing(e) {
    isDrawing = true;
    const pos = getPosition(e);
    lastX = pos.x;
    lastY = pos.y;
}

function draw(e) {
    if (!isDrawing) return;
    const pos = getPosition(e);
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastX = pos.x;
    lastY = pos.y;
}

function stopDrawing() {
    isDrawing = false;
}

function handleTouchStart(e) {
    e.preventDefault();
    startDrawing(e);
}

function handleTouchMove(e) {
    e.preventDefault();
    draw(e);
}

function openSignaturePad(target) {
    if(!Object.values(SIGNATURE_TARGETS).includes(target)) {
        Swal.fire('Error', 'Target signature tidak valid!', 'error');
        return;
    }
    document.getElementById('currentSignatureTarget').value = target;
    signatureModal.show();
    setTimeout(() => {
        try {
            resizeCanvas();
            clearSignature();
        } catch(error) {
            console.error('Canvas initialization error:', error);
            Swal.fire('Error', 'Gagal menginisialisasi kanvas tanda tangan.', 'error');
        }
    }, 300);
}

function clearSignature() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function saveSignature() {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    let isEmpty = true;
    for (let i = 3; i < data.length; i += 4) {
        if (data[i] !== 0) { isEmpty = false; break; }
    }
    if(isEmpty) {
        Swal.fire('Info', 'Coretan tanda tangan masih kosong. Silakan tanda tangan terlebih dahulu.', 'info');
        return;
    }
    const dataURL = trimCanvasToDataURL(canvas);
    const target = document.getElementById('currentSignatureTarget').value;
    const targetMap = {
        [SIGNATURE_TARGETS.TAMU_MASUK]: { input: 'ttdTamuMasukBase64', preview: 'previewTamuMasuk' },
        [SIGNATURE_TARGETS.SATPAM]: { input: 'ttdSatpamBase64', preview: 'previewSatpam' },
        [SIGNATURE_TARGETS.TAMU_KELUAR]: { input: 'ttdTamuKeluarBase64', preview: 'previewTamuKeluar' }
    };
    if(!targetMap[target]) {
        Swal.fire('Error', 'Target signature tidak valid!', 'error');
        return;
    }
    const { input: inputId, preview: previewId } = targetMap[target];
    document.getElementById(inputId).value = dataURL;
    const preview = document.getElementById(previewId);
    if (preview) {
        preview.innerHTML = `<img src="${dataURL}" alt="TTD Preview">`;
    }
    signatureModal.hide();
    if(target === SIGNATURE_TARGETS.TAMU_KELUAR) {
        processCheckout();
    } else {
        Swal.fire('Sukses', 'Tanda tangan berhasil disimpan.', 'success');
    }
}

// --- Signature Pad Baru (langsung di Form Tambah Tamu) ---
const canvasContexts = {};

function initAllSignaturePads() {
    ['canvasTamuMasuk', 'canvasSatpam'].forEach(id => {
        const cv = document.getElementById(id);
        if (!cv || cv.dataset.signatureReady === 'true') return;
        const cctx = cv.getContext('2d');
        canvasContexts[id] = { canvas: cv, ctx: cctx, isDrawing: false, lastX: 0, lastY: 0 };
        cv.dataset.signatureReady = 'true';
        resizeCanvasEl(id);

        cv.addEventListener('mousedown', e => startDrawingNew(id, e));
        cv.addEventListener('mousemove', e => drawNew(id, e));
        cv.addEventListener('mouseup', () => stopDrawingNew(id));
        cv.addEventListener('mouseout', () => stopDrawingNew(id));

        cv.addEventListener('touchstart', e => { e.preventDefault(); startDrawingNew(id, e); }, {passive: false});
        cv.addEventListener('touchmove', e => { e.preventDefault(); drawNew(id, e); }, {passive: false});
        cv.addEventListener('touchend', () => stopDrawingNew(id));
    });
}

function resizeCanvasEl(id) {
    const state = canvasContexts[id];
    const ratio = window.devicePixelRatio || 1;
    const w = state.canvas.offsetWidth;
    const h = state.canvas.offsetHeight;
    state.canvas.width = w * ratio;
    state.canvas.height = h * ratio;
    state.ctx.setTransform(1, 0, 0, 1, 0, 0);
    state.ctx.strokeStyle = "#000000";
    state.ctx.lineWidth = 2 * ratio;
    state.ctx.lineCap = "round";
    state.ctx.lineJoin = "round";
}

function getPosNew(cv, event) {
    const rect = cv.getBoundingClientRect();
    let clientX, clientY;
    if (event.touches && event.touches.length > 0) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
    } else {
        clientX = event.clientX;
        clientY = event.clientY;
    }
    return {
        x: (clientX - rect.left) * (cv.width / rect.width),
        y: (clientY - rect.top) * (cv.height / rect.height)
    };
}

function startDrawingNew(id, e) {
    const state = canvasContexts[id];
    state.isDrawing = true;
    const pos = getPosNew(state.canvas, e);
    state.lastX = pos.x;
    state.lastY = pos.y;
}

function trimCanvasToDataURL(sourceCanvas) {
    const sourceContext = sourceCanvas.getContext('2d');
    const imageData = sourceContext.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
    const pixels = imageData.data;
    let minX = sourceCanvas.width;
    let minY = sourceCanvas.height;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < sourceCanvas.height; y++) {
        for (let x = 0; x < sourceCanvas.width; x++) {
            if (pixels[(y * sourceCanvas.width + x) * 4 + 3] > 10) {
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
            }
        }
    }

    if (maxX < 0) return '';

    const padding = 12;
    const trimmedCanvas = document.createElement('canvas');
    trimmedCanvas.width = maxX - minX + 1 + padding * 2;
    trimmedCanvas.height = maxY - minY + 1 + padding * 2;
    trimmedCanvas.getContext('2d').drawImage(
        sourceCanvas,
        minX,
        minY,
        maxX - minX + 1,
        maxY - minY + 1,
        padding,
        padding,
        maxX - minX + 1,
        maxY - minY + 1
    );
    return trimmedCanvas.toDataURL('image/png');
}

function drawNew(id, e) {
    const state = canvasContexts[id];
    if (!state.isDrawing) return;
    const pos = getPosNew(state.canvas, e);
    state.ctx.beginPath();
    state.ctx.moveTo(state.lastX, state.lastY);
    state.ctx.lineTo(pos.x, pos.y);
    state.ctx.stroke();
    state.lastX = pos.x;
    state.lastY = pos.y;
    const inputMap = { canvasTamuMasuk: 'ttdTamuMasukBase64', canvasSatpam: 'ttdSatpamBase64' };
    document.getElementById(inputMap[id]).value = trimCanvasToDataURL(state.canvas);
}

function stopDrawingNew(id) {
    canvasContexts[id].isDrawing = false;
}

function clearCanvas(id) {
    const state = canvasContexts[id];
    if (!state) return;
    state.ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);
    const inputMap = { canvasTamuMasuk: 'ttdTamuMasukBase64', canvasSatpam: 'ttdSatpamBase64' };
    document.getElementById(inputMap[id]).value = '';
}

function resetFormSignaturePads() {
    Object.keys(canvasContexts).forEach(id => {
        resizeCanvasEl(id);
        canvasContexts[id].ctx.clearRect(0, 0, canvasContexts[id].canvas.offsetWidth, canvasContexts[id].canvas.offsetHeight);
    });
}

        // --- Export Feature ---
        function exportExcel() {
            if(guests.length === 0) {
                Swal.fire('Info', 'Tidak ada data untuk di-export', 'info'); 
                return;
            }

            try {
                let csvContent = "data:text/csv;charset=utf-8,";
                
                // CSV Header
                const headers = ["Tanggal", "Nama", "Instansi", "Keperluan", "Personil Dituju", "No HP", "No Visitor", "Jam Masuk", "Jam Keluar", "Nama Satpam"];
                csvContent += headers.map(h => `"${h}"`).join(",") + "\n";
                
                // CSV Data Rows
                guests.forEach(guest => {
                    const row = [
                        guest.tanggal,
                        escapeCSV(guest.nama),
                        escapeCSV(guest.instansi),
                        escapeCSV(guest.keperluan),
                        escapeCSV(guest.personil),
                        guest.noHp,
                        guest.noVisitor,
                        guest.jamMasuk,
                        guest.jamKeluar || "Belum Keluar",
                        escapeCSV(guest.namaSatpam)
                    ];
                    csvContent += row.join(",") + "\n";
                });

                // Create and trigger download
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", `Data_Buku_Tamu_KAI_${new Date().toISOString().split('T')[0]}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                Swal.fire('Sukses', 'Data berhasil di-export.', 'success');
            } catch(error) {
                console.error('Export error:', error);
                Swal.fire('Error', 'Gagal mengexport data.', 'error');
            }
        }

        // Helper: Escape CSV special characters
        function escapeCSV(value) {
            if(!value) return '""';
            value = String(value);
            if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return `"${value}"`;
        }

        function generateNoVisitor() {
            const now = new Date();
            const yyyy = now.getFullYear();
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const prefix = `V-${yyyy}-${mm}-`;

            let maxUrut = 0;
            guests.forEach(g => {
                if (g.noVisitor && g.noVisitor.startsWith(prefix)) {
                    const urut = parseInt(g.noVisitor.replace(prefix, ''), 10);
                    if (!isNaN(urut) && urut > maxUrut) maxUrut = urut;
                }
            });

            return prefix + String(maxUrut + 1).padStart(3, '0');
    }
