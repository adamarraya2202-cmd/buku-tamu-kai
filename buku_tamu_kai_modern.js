const STORAGE_KEY = 'KAI_GUEST_BOOK_DATA_STABLE';
        const GUEST_ID_PREFIX = 'GST-';
        const DEMO_VISITOR_DETAILS = [
            { nama: 'Siti Nurhayati', instansi: 'PDAM Sleman', noHp: '081345678901', personil: 'Rina Wulandari', keperluan: 'Koordinasi kebutuhan utilitas dan akses lokasi', namaSatpam: 'Andi Prasetyo', jamMasuk: '09:05' },
            { nama: 'Doni Pratama', instansi: 'Dinas Pariwisata Yogyakarta', noHp: '081456789012', personil: 'Eko Setiawan', keperluan: 'Survey akses menuju area stasiun dan pelayanan publik', namaSatpam: 'Rizki Satria', jamMasuk: '09:40' },
            { nama: 'Maya Kartika', instansi: 'CV Artha Karya', noHp: '081567890123', personil: 'Yusuf Ibrahim', keperluan: 'Kunjungan evaluasi kebutuhan ruang kerja dan keamanan', namaSatpam: 'Dimas Ardi', jamMasuk: '10:15' },
            { nama: 'Rizki Hidayat', instansi: 'Bank BCA', noHp: '081678901234', personil: 'Fajar Nugroho', keperluan: 'Audit administrasi dan koordinasi akses masuk pelanggan', namaSatpam: 'Hendra Wijaya', jamMasuk: '10:50' },
            { nama: 'Dewi Lestari', instansi: 'KSP Mitra Sejahtera', noHp: '081789012345', personil: 'Sukma Dewi', keperluan: 'Koordinasi pengajuan kerjasama operasional', namaSatpam: 'Wahyu Candra', jamMasuk: '11:30' },
            { nama: 'Teguh Santoso', instansi: 'PT Nusantara Persada', noHp: '081890123456', personil: 'Budi Hartono', keperluan: 'Rapat koordinasi pemeliharaan fasilitas stasiun', namaSatpam: 'Ega Putra', jamMasuk: '12:10' },
            { nama: 'Anisa Rahma', instansi: 'Universitas Gadjah Mada', noHp: '081901234567', personil: 'Andika Bayu', keperluan: 'Kunjungan riset terkait pengelolaan lalu lintas perkeretaapian', namaSatpam: 'Ferry Nugroho', jamMasuk: '13:00' },
            { nama: 'Luthfi Ramadhan', instansi: 'PT Jaya Sentosa', noHp: '082012345678', personil: 'Nita Susanti', keperluan: 'Pemeriksaan prosedur keamanan dan akses kendaraan operasional', namaSatpam: 'Slamet', jamMasuk: '13:40' },
            { nama: 'Yuliana Putri', instansi: 'Dinas Perhubungan DIY', noHp: '082123456789', personil: 'Agung Pratama', keperluan: 'Monitoring akses keluar masuk penumpang dan kendaraan operasional', namaSatpam: 'Aziz Rahman', jamMasuk: '14:20' }
        ];
        
        let guests = [];
        let formModal, checkoutModal, summaryModal;
        const canvasMap = {};

        // Inisialisasi Aplikasi
        document.addEventListener('DOMContentLoaded', () => {
            initHeaderDate();
            initModals();
            loadStoredData();
            initCanvasContexts();
            attachFilterListeners();
            attachActionListeners();
            renderTable();
        });

        function initHeaderDate() {
            const today = new Date();
            const options = { day: 'numeric', month: 'long', year: 'numeric' };
            const formattedDate = today.toLocaleDateString('id-ID', options);
            document.getElementById('header-date').innerText = formattedDate;
            document.getElementById('print-date').innerText = formattedDate;
        }

        function initModals() {
            formModal = new bootstrap.Modal(document.getElementById('formModal'));
            checkoutModal = new bootstrap.Modal(document.getElementById('checkoutModal'));
            summaryModal = new bootstrap.Modal(document.getElementById('summaryModal'));
        }

        function loadStoredData() {
            try {
                const stored = localStorage.getItem(STORAGE_KEY);
                if (stored) {
                    guests = JSON.parse(stored);
                    const originalDemo = guests.find(guest => guest.id === 'GST-101'
                        && guest.nama === 'Ahmad Fauzi'
                        && guest.noVisitor === 'V-2026-10-001');
                    let shouldSave = false;

                    if (originalDemo && originalDemo.businessArea !== 'DAOP 6 YOGYAKARTA') {
                        originalDemo.businessArea = 'DAOP 6 YOGYAKARTA';
                        shouldSave = true;
                    }

                    if (guests.length === 1 && originalDemo) {
                        guests.push(...DEMO_VISITOR_DETAILS.map((visitor, index) => ({
                            ...originalDemo,
                            ...visitor,
                            id: `GST-${102 + index}`,
                            noVisitor: `V-2026-10-${String(index + 2).padStart(3, '0')}`,
                            businessArea: 'DAOP 6 YOGYAKARTA',
                            jamKeluar: null,
                            ttdKeluar: null
                        })));
                        shouldSave = true;
                    }

                    if (shouldSave) {
                        saveToStorage();
                    }
                } else {
                    // Pre-fill dummy data awal jika kosong
                    guests = [
                        {
                            id: 'GST-101',
                            tanggal: new Date().toISOString().split('T')[0],
                            businessArea: 'DAOP 6 YOGYAKARTA',
                            noVisitor: 'V-2026-10-001',
                            nama: 'Ahmad Fauzi',
                            instansi: 'PT Siemens Indonesia',
                            noHp: '081234567890',
                            personil: 'Bambang S. (Signalling)',
                            keperluan: 'Koordinasi Proyek Persinyalan Otomatis Kereta',
                            namaSatpam: 'Budi Santoso',
                            jamMasuk: '08:30',
                            jamKeluar: null,
                            ttdMasuk: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
                            ttdSatpam: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
                            ttdKeluar: null
                        },
                        {
                            id: 'GST-102',
                            tanggal: new Date().toISOString().split('T')[0],
                            businessArea: 'DAOP 6 YOGYAKARTA',
                            noVisitor: 'V-2026-10-002',
                            nama: 'Siti Nurhayati',
                            instansi: 'PDAM Sleman',
                            noHp: '081345678901',
                            personil: 'Rina Wulandari',
                            keperluan: 'Koordinasi kebutuhan utilitas dan akses lokasi',
                            namaSatpam: 'Andi Prasetyo',
                            jamMasuk: '09:05',
                            jamKeluar: null,
                            ttdMasuk: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
                            ttdSatpam: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
                            ttdKeluar: null
                        },
                        {
                            id: 'GST-103',
                            tanggal: new Date().toISOString().split('T')[0],
                            businessArea: 'DAOP 6 YOGYAKARTA',
                            noVisitor: 'V-2026-10-003',
                            nama: 'Doni Pratama',
                            instansi: 'Dinas Pariwisata Yogyakarta',
                            noHp: '081456789012',
                            personil: 'Eko Setiawan',
                            keperluan: 'Survey akses menuju area stasiun dan pelayanan publik',
                            namaSatpam: 'Rizki Satria',
                            jamMasuk: '09:40',
                            jamKeluar: null,
                            ttdMasuk: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
                            ttdSatpam: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
                            ttdKeluar: null
                        },
                        {
                            id: 'GST-104',
                            tanggal: new Date().toISOString().split('T')[0],
                            businessArea: 'DAOP 6 YOGYAKARTA',
                            noVisitor: 'V-2026-10-004',
                            nama: 'Maya Kartika',
                            instansi: 'CV Artha Karya',
                            noHp: '081567890123',
                            personil: 'Yusuf Ibrahim',
                            keperluan: 'Kunjungan evaluasi kebutuhan ruang kerja dan keamanan',
                            namaSatpam: 'Dimas Ardi',
                            jamMasuk: '10:15',
                            jamKeluar: null,
                            ttdMasuk: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
                            ttdSatpam: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
                            ttdKeluar: null
                        },
                        {
                            id: 'GST-105',
                            tanggal: new Date().toISOString().split('T')[0],
                            businessArea: 'DAOP 6 YOGYAKARTA',
                            noVisitor: 'V-2026-10-005',
                            nama: 'Rizki Hidayat',
                            instansi: 'Bank BCA',
                            noHp: '081678901234',
                            personil: 'Fajar Nugroho',
                            keperluan: 'Audit administrasi dan koordinasi akses masuk pelanggan',
                            namaSatpam: 'Hendra Wijaya',
                            jamMasuk: '10:50',
                            jamKeluar: null,
                            ttdMasuk: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
                            ttdSatpam: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
                            ttdKeluar: null
                        },
                        {
                            id: 'GST-106',
                            tanggal: new Date().toISOString().split('T')[0],
                            businessArea: 'DAOP 6 YOGYAKARTA',
                            noVisitor: 'V-2026-10-006',
                            nama: 'Dewi Lestari',
                            instansi: 'KSP Mitra Sejahtera',
                            noHp: '081789012345',
                            personil: 'Sukma Dewi',
                            keperluan: 'Koordinasi pengajuan kerjasama operasional',
                            namaSatpam: 'Wahyu Candra',
                            jamMasuk: '11:30',
                            jamKeluar: null,
                            ttdMasuk: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
                            ttdSatpam: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
                            ttdKeluar: null
                        },
                        {
                            id: 'GST-107',
                            tanggal: new Date().toISOString().split('T')[0],
                            businessArea: 'DAOP 6 YOGYAKARTA',
                            noVisitor: 'V-2026-10-007',
                            nama: 'Teguh Santoso',
                            instansi: 'PT Nusantara Persada',
                            noHp: '081890123456',
                            personil: 'Budi Hartono',
                            keperluan: 'Rapat koordinasi pemeliharaan fasilitas stasiun',
                            namaSatpam: 'Ega Putra',
                            jamMasuk: '12:10',
                            jamKeluar: null,
                            ttdMasuk: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
                            ttdSatpam: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
                            ttdKeluar: null
                        },
                        {
                            id: 'GST-108',
                            tanggal: new Date().toISOString().split('T')[0],
                            businessArea: 'DAOP 6 YOGYAKARTA',
                            noVisitor: 'V-2026-10-008',
                            nama: 'Anisa Rahma',
                            instansi: 'Universitas Gadjah Mada',
                            noHp: '081901234567',
                            personil: 'Andika Bayu',
                            keperluan: 'Kunjungan riset terkait pengelolaan lalu lintas perkeretaapian',
                            namaSatpam: 'Ferry Nugroho',
                            jamMasuk: '13:00',
                            jamKeluar: null,
                            ttdMasuk: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
                            ttdSatpam: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
                            ttdKeluar: null
                        },
                        {
                            id: 'GST-109',
                            tanggal: new Date().toISOString().split('T')[0],
                            businessArea: 'DAOP 6 YOGYAKARTA',
                            noVisitor: 'V-2026-10-009',
                            nama: 'Luthfi Ramadhan',
                            instansi: 'PT Jaya Sentosa',
                            noHp: '082012345678',
                            personil: 'Nita Susanti',
                            keperluan: 'Pemeriksaan prosedur keamanan dan akses kendaraan operasional',
                            namaSatpam: 'Slamet',
                            jamMasuk: '13:40',
                            jamKeluar: null,
                            ttdMasuk: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
                            ttdSatpam: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
                            ttdKeluar: null
                        },
                        {
                            id: 'GST-110',
                            tanggal: new Date().toISOString().split('T')[0],
                            businessArea: 'DAOP 6 YOGYAKARTA',
                            noVisitor: 'V-2026-10-010',
                            nama: 'Yuliana Putri',
                            instansi: 'Dinas Perhubungan DIY',
                            noHp: '082123456789',
                            personil: 'Agung Pratama',
                            keperluan: 'Monitoring akses keluar masuk penumpang dan kendaraan operasional',
                            namaSatpam: 'Aziz Rahman',
                            jamMasuk: '14:20',
                            jamKeluar: null,
                            ttdMasuk: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
                            ttdSatpam: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
                            ttdKeluar: null
                        }
                    ];
                    saveToStorage();
                }
            } catch (e) {
                console.error("Gagal memuat data dari LocalStorage", e);
                guests = [];
            }
        }

        function saveToStorage() {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(guests));
            updateDashboard();
        }

        function attachFilterListeners() {
            document.getElementById('searchInput').addEventListener('input', renderTable);
            document.getElementById('filterStatus').addEventListener('change', renderTable);
            document.getElementById('filterDateFrom').addEventListener('change', renderTable);
            document.getElementById('filterDateTo').addEventListener('change', renderTable);
        }

        function attachActionListeners() {
            document.addEventListener('click', event => {
                if (!(event.target instanceof Element)) return;
                const target = event.target.closest('[data-action], [data-clear-canvas], [data-summary]');
                if (!target) return;

                if (target.dataset.summary) {
                    showSummary(target.dataset.summary);
                    return;
                }
                if (target.dataset.clearCanvas) {
                    clearCanvas(target.dataset.clearCanvas);
                    return;
                }

                const actions = {
                    export: exportExcel,
                    print: () => window.print(),
                    add: openAddModal,
                    save: saveData,
                    checkout: processCheckout,
                    'checkout-guest': () => openCheckoutModal(target.dataset.guestId),
                    'edit-guest': () => editData(target.dataset.guestId),
                    'delete-guest': () => deleteData(target.dataset.guestId)
                };
                actions[target.dataset.action]?.();
            });

            document.addEventListener('keydown', event => {
                if (!(event.target instanceof Element) || !event.target.matches('[data-summary]')) return;
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault();
                showSummary(event.target.dataset.summary);
            });
        }

        /* --- Canvas Signature Pad Logic --- */
        function initCanvasContexts() {
            ['canvasTamuMasuk', 'canvasSatpam', 'canvasTamuKeluar'].forEach(id => {
                const cv = document.getElementById(id);
                if (!cv) return;
                
                const ctx = cv.getContext('2d');
                canvasMap[id] = {
                    canvas: cv,
                    ctx: ctx,
                    isDrawing: false,
                    lastX: 0,
                    lastY: 0
                };

                setupCanvasResize(id);
                
                // Mouse Events
                cv.addEventListener('mousedown', e => startDrawing(id, e));
                cv.addEventListener('mousemove', e => draw(id, e));
                cv.addEventListener('mouseup', () => stopDrawing(id));
                cv.addEventListener('mouseout', () => stopDrawing(id));

                // Touch Events
                cv.addEventListener('touchstart', e => { e.preventDefault(); startDrawing(id, e); }, {passive: false});
                cv.addEventListener('touchmove', e => { e.preventDefault(); draw(id, e); }, {passive: false});
                cv.addEventListener('touchend', () => stopDrawing(id));
            });
        }

        function setupCanvasResize(id) {
            const state = canvasMap[id];
            const ratio = window.devicePixelRatio || 1;
            const w = state.canvas.offsetWidth || 350;
            const h = state.canvas.offsetHeight || 180;
            
            state.canvas.width = w * ratio;
            state.canvas.height = h * ratio;
            state.ctx.scale(ratio, ratio);
            
            state.ctx.strokeStyle = "#0d2858";
            state.ctx.lineWidth = 2.5;
            state.ctx.lineCap = "round";
            state.ctx.lineJoin = "round";
        }

        function getPos(cv, event) {
            const rect = cv.getBoundingClientRect();
            let clientX = event.clientX;
            let clientY = event.clientY;

            if (event.touches && event.touches.length > 0) {
                clientX = event.touches[0].clientX;
                clientY = event.touches[0].clientY;
            }

            return {
                x: clientX - rect.left,
                y: clientY - rect.top
            };
        }

        function startDrawing(id, e) {
            const state = canvasMap[id];
            state.isDrawing = true;
            const pos = getPos(state.canvas, e);
            state.lastX = pos.x;
            state.lastY = pos.y;
        }

        function draw(id, e) {
            const state = canvasMap[id];
            if (!state.isDrawing) return;
            const pos = getPos(state.canvas, e);

            state.ctx.beginPath();
            state.ctx.moveTo(state.lastX, state.lastY);
            state.ctx.lineTo(pos.x, pos.y);
            state.ctx.stroke();

            state.lastX = pos.x;
            state.lastY = pos.y;

            // Sync ke input hidden
            const inputMap = {
                canvasTamuMasuk: 'ttdTamuMasukBase64',
                canvasSatpam: 'ttdSatpamBase64',
                canvasTamuKeluar: 'ttdTamuKeluarBase64'
            };
            document.getElementById(inputMap[id]).value = state.canvas.toDataURL();
        }

        function stopDrawing(id) {
            if (canvasMap[id]) canvasMap[id].isDrawing = false;
        }

        function clearCanvas(id) {
            const state = canvasMap[id];
            if (!state) return;
            state.ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);
            
            const inputMap = {
                canvasTamuMasuk: 'ttdTamuMasukBase64',
                canvasSatpam: 'ttdSatpamBase64',
                canvasTamuKeluar: 'ttdTamuKeluarBase64'
            };
            document.getElementById(inputMap[id]).value = '';
        }

        /* --- Rendering Data & UI --- */
        function renderTable() {
            const tbody = document.getElementById('tableBody');
            tbody.innerHTML = '';

            const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
            const statusFilter = document.getElementById('filterStatus').value;
            const dateFrom = document.getElementById('filterDateFrom').value;
            const dateTo = document.getElementById('filterDateTo').value;

            const filteredGuests = guests.filter(guest => {
                const matchSearch = 
                    guest.nama.toLowerCase().includes(searchTerm) || 
                    guest.instansi.toLowerCase().includes(searchTerm) || 
                    (guest.noVisitor || '').toLowerCase().includes(searchTerm) ||                
                    (guest.noHp || '').includes(searchTerm);
            
                let matchStatus = true;
                if(statusFilter === 'active') matchStatus = !guest.jamKeluar;
                if(statusFilter === 'done') matchStatus = !!guest.jamKeluar;

                let matchDate = true;
                if(dateFrom) matchDate = matchDate && (guest.tanggal >= dateFrom);
                if(dateTo) matchDate = matchDate && (guest.tanggal <= dateTo);

                return matchSearch && matchStatus && matchDate;
            });

            updatePrintMetadata(filteredGuests);

            if(filteredGuests.length === 0) {
                tbody.innerHTML = `<tr><td colspan="13" class="text-center py-5 text-muted"><i class="fa-solid fa-folder-open fs-3 d-block mb-2"></i>Tidak ada data tamu yang sesuai.</td></tr>`;
                updateDashboard();
                return;
            }

            filteredGuests.forEach((guest, index) => {
                const tr = document.createElement('tr');
                tr.classList.add('table-row-enter');
                
                const ttdMasukImg = guest.ttdMasuk ? `<img src="${guest.ttdMasuk}" class="signature-img" alt="TTD">` : '-';
                
                let ttdKeluarCell = '-';
                if(guest.ttdKeluar) {
                    ttdKeluarCell = `<img src="${guest.ttdKeluar}" class="signature-img" alt="TTD">`;
                } else if(!guest.jamKeluar) {
                    ttdKeluarCell = `<button class="btn btn-sm btn-outline-warning no-print" data-action="checkout-guest" data-guest-id="${escapeHtml(guest.id)}"><i class="fa-solid fa-signature me-1"></i> Checkout</button>`;
                }

                const ttdSatpamImg = guest.ttdSatpam ? `<img src="${guest.ttdSatpam}" class="signature-img" alt="TTD"><small class="text-muted d-block text-center mt-1">${escapeHtml(guest.namaSatpam)}</small>` : '-';
                const jamKeluarText = guest.jamKeluar
                    ? `<span class="badge-status-done"><i class="fa-solid fa-circle-check me-1"></i>${guest.jamKeluar}</span><span class="print-only">${guest.jamKeluar}</span>`
                    : '<span class="badge-status-visiting"><span class="pulse-dot"></span>Berkunjung</span><span class="print-only">-</span>';

                tr.innerHTML = `
                    <td class="text-center fw-bold">${index + 1}</td>
                    <td><strong class="text-dark">${escapeHtml(guest.nama)}</strong></td>
                    <td>${escapeHtml(guest.instansi)}</td>
                    <td>${escapeHtml(guest.keperluan)}</td>
                    <td>${escapeHtml(guest.personil)}</td>
                    <td>${escapeHtml(guest.noHp)}</td>
                    <td class="text-center"><span class="badge bg-light text-dark border">${escapeHtml(guest.noVisitor || '-')}</span></td>
                    <td class="text-center fw-semibold text-primary">${guest.jamMasuk}</td>
                    <td class="text-center">${ttdMasukImg}</td>
                    <td class="text-center">${jamKeluarText}</td>
                    <td class="text-center">${ttdKeluarCell}</td>
                    <td class="text-center">${ttdSatpamImg}</td>
                    <td class="text-center no-print-col">
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-light border text-primary" title="Edit Data" data-action="edit-guest" data-guest-id="${escapeHtml(guest.id)}"><i class="fa-solid fa-pen-to-square"></i></button>
                            <button class="btn btn-light border text-danger" title="Hapus Data" data-action="delete-guest" data-guest-id="${escapeHtml(guest.id)}"><i class="fa-solid fa-trash-can"></i></button>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            updateDashboard();
        }

        function updatePrintMetadata(visibleGuests) {
            const firstGuest = visibleGuests[0];
            const date = firstGuest?.tanggal
                ? new Date(`${firstGuest.tanggal}T00:00:00`)
                : new Date();
            const formattedDate = date.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });

            document.getElementById('print-no-ref').innerText = firstGuest ? '1' : '-';
            document.getElementById('print-guest-date').innerText = formattedDate;
            document.getElementById('print-business-area').innerText = firstGuest?.businessArea || '-';
        }

        function updateDashboard() {
            const today = new Date().toISOString().split('T')[0];
            
            document.getElementById('stat-total').innerText = guests.length;
            document.getElementById('stat-today').innerText = guests.filter(g => g.tanggal === today).length;
            document.getElementById('stat-active').innerText = guests.filter(g => !g.jamKeluar).length;
            document.getElementById('stat-done').innerText = guests.filter(g => !!g.jamKeluar).length;
        }

        /* --- Actions CRUD --- */
        function openAddModal() {
            document.getElementById('guestForm').reset();
            document.getElementById('dataId').value = '';
            document.getElementById('businessArea').value = 'DAOP 6 YOGYAKARTA';
            document.getElementById('noVisitor').value = generateNoVisitor();
            document.getElementById('ttdTamuMasukBase64').value = '';
            document.getElementById('ttdSatpamBase64').value = '';
            
            clearCanvas('canvasTamuMasuk');
            clearCanvas('canvasSatpam');

            formModal.show();
            setTimeout(() => {
                setupCanvasResize('canvasTamuMasuk');
                setupCanvasResize('canvasSatpam');
            }, 300);
        }

        function saveData() {
            const form = document.getElementById('guestForm');
            if(!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const id = document.getElementById('dataId').value;
            const ttdMasuk = document.getElementById('ttdTamuMasukBase64').value;
            const ttdSatpam = document.getElementById('ttdSatpamBase64').value;

            if(!ttdMasuk) {
                Swal.fire('Informasi', 'Tanda tangan Tamu wajib diisi!', 'warning'); 
                return;
            }
            if(!ttdSatpam) {
                Swal.fire('Informasi', 'Tanda tangan Petugas Saksi wajib diisi!', 'warning'); 
                return;
            }

            const now = new Date();
            const timeStr = now.toTimeString().substring(0, 5);

            const newGuest = {
                id: id ? id : GUEST_ID_PREFIX + Date.now(),
                tanggal: now.toISOString().split('T')[0],
                businessArea: document.getElementById('businessArea').value,
                noVisitor: document.getElementById('noVisitor').value,
                nama: document.getElementById('nama').value,
                instansi: document.getElementById('instansi').value,
                noHp: document.getElementById('noHp').value,
                personil: document.getElementById('personil').value,
                keperluan: document.getElementById('keperluan').value,
                namaSatpam: document.getElementById('namaSatpam').value,
                jamMasuk: timeStr,
                ttdMasuk: ttdMasuk,
                ttdSatpam: ttdSatpam,
                jamKeluar: null,
                ttdKeluar: null
            };

            if(id) {
                const idx = guests.findIndex(g => g.id === id);
                if(idx > -1) {
                    newGuest.jamMasuk = guests[idx].jamMasuk;
                    newGuest.tanggal = guests[idx].tanggal;
                    newGuest.jamKeluar = guests[idx].jamKeluar;
                    newGuest.ttdKeluar = guests[idx].ttdKeluar;
                    guests[idx] = newGuest;
                }
            } else {
                guests.unshift(newGuest);
            }

            saveToStorage();
            formModal.hide();
            renderTable();

            Swal.fire({
                icon: 'success',
                title: 'Data Berhasil Disimpan',
                text: 'Registrasi tamu baru berhasil dicatat dalam sistem.',
                timer: 1800,
                showConfirmButton: false
            });
        }

        function editData(id) {
            const guest = guests.find(g => g.id === id);
            if(!guest) return;

            document.getElementById('dataId').value = guest.id;
            setBusinessAreaSelection(guest.businessArea || '');
            document.getElementById('noVisitor').value = guest.noVisitor || '';
            document.getElementById('nama').value = guest.nama || '';
            document.getElementById('instansi').value = guest.instansi || '';
            document.getElementById('noHp').value = guest.noHp || '';
            document.getElementById('personil').value = guest.personil || '';
            document.getElementById('keperluan').value = guest.keperluan || '';
            document.getElementById('namaSatpam').value = guest.namaSatpam || '';

            document.getElementById('ttdTamuMasukBase64').value = guest.ttdMasuk || '';
            document.getElementById('ttdSatpamBase64').value = guest.ttdSatpam || '';

            formModal.show();
        }

        function setBusinessAreaSelection(value) {
            const select = document.getElementById('businessArea');
            const normalizedValue = value.trim().replace(/^KAI\s+/i, '').toUpperCase();
            const matchingOption = Array.from(select.options).find(option => option.value === normalizedValue);

            if (matchingOption) {
                select.value = matchingOption.value;
                return;
            }

            const legacyOption = new Option(`${value} (data tersimpan)`, value);
            select.add(legacyOption);
            select.value = value;
        }

        function deleteData(id) {
            Swal.fire({
                title: 'Hapus Data Tamu?',
                text: "Data yang dihapus tidak dapat dikembalikan!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#ef4444',
                cancelButtonColor: '#64748b',
                confirmButtonText: 'Ya, Hapus',
                cancelButtonText: 'Batal'
            }).then((result) => {
                if (result.isConfirmed) {
                    guests = guests.filter(g => g.id !== id);
                    saveToStorage();
                    renderTable();
                    Swal.fire('Terhapus', 'Data telah dihapus dari sistem.', 'success');
                }
            });
        }

        function openCheckoutModal(id) {
            document.getElementById('checkoutId').value = id;
            document.getElementById('ttdTamuKeluarBase64').value = '';
            clearCanvas('canvasTamuKeluar');
            
            checkoutModal.show();
            setTimeout(() => {
                setupCanvasResize('canvasTamuKeluar');
            }, 300);
        }

        function processCheckout() {
            const id = document.getElementById('checkoutId').value;
            const ttdKeluar = document.getElementById('ttdTamuKeluarBase64').value;

            if(!ttdKeluar) {
                Swal.fire('Informasi', 'Tanda tangan konfirmasi kepulangan wajib diisi!', 'warning');
                return;
            }

            const idx = guests.findIndex(g => g.id === id);
            if(idx > -1) {
                const now = new Date();
                guests[idx].jamKeluar = now.toTimeString().substring(0, 5);
                guests[idx].ttdKeluar = ttdKeluar;
                
                saveToStorage();
                renderTable();
                checkoutModal.hide();
                
                Swal.fire('Selesai', 'Proses checkout tamu berhasil dicatat.', 'success');
            }
        }

        function showSummary(type) {
            const today = new Date().toISOString().split('T')[0];
            let filtered = [];
            let title = '';

            if(type === 'today') {
                filtered = guests.filter(g => g.tanggal === today);
                title = 'Rangkuman Tamu Hari Ini';
            } else if(type === 'active') {
                filtered = guests.filter(g => !g.jamKeluar);
                title = 'Rangkuman Tamu Sedang Berkunjung';
            } else if(type === 'done') {
                filtered = guests.filter(g => !!g.jamKeluar);
                title = 'Rangkuman Tamu Selesai Berkunjung';
            } else {
                filtered = guests;
                title = 'Total Seluruh Data Tamu';
            }

            document.getElementById('summaryModalTitle').innerText = title;
            const tbody = document.getElementById('summaryTableBody');
            tbody.innerHTML = '';

            if(filtered.length === 0) {
                tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">Tidak ada data.</td></tr>`;
            } else {
                filtered.forEach(g => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td class="text-center">${g.tanggal}</td>
                        <td><strong>${escapeHtml(g.nama)}</strong></td>
                        <td>${escapeHtml(g.instansi)}</td>
                        <td>${escapeHtml(g.keperluan)}</td>
                        <td>${escapeHtml(g.personil)}</td>
                        <td class="text-center">${g.jamMasuk}</td>
                        <td class="text-center">${g.jamKeluar || '-'}</td>
                    `;
                    tbody.appendChild(tr);
                });
            }

            summaryModal.show();
        }

        /* --- Utilities --- */
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

        function exportExcel() {
            if (guests.length === 0) {
                Swal.fire('Informasi', 'Belum ada data untuk di-export', 'info');
                return;
            }

            if (!window.XLSX) {
                Swal.fire('Error', 'Fitur Excel tidak dapat dimuat. Periksa koneksi internet lalu coba lagi.', 'error');
                return;
            }

            try {
                const headers = [
                    'No.',
                    'Tanggal',
                    'Business Area',
                    'Nama Tamu',
                    'Instansi',
                    'Keperluan',
                    'Personil yang Dituju',
                    'No. HP',
                    'No. Visitor',
                    'Jam Masuk',
                    'TTD Masuk',
                    'Jam Keluar',
                    'TTD Keluar',
                    'Petugas / Satpam'
                ];
                const rows = guests.map((guest, index) => [
                    index + 1,
                    guest.tanggal || '',
                    guest.businessArea || '',
                    guest.nama || '',
                    guest.instansi || '',
                    guest.keperluan || '',
                    guest.personil || '',
                    String(guest.noHp || ''),
                    guest.noVisitor || '-',
                    guest.jamMasuk || '',
                    guest.ttdMasuk ? 'Sudah ditandatangani' : 'Belum ditandatangani',
                    guest.jamKeluar || 'Belum checkout',
                    guest.ttdKeluar ? 'Sudah ditandatangani' : 'Belum ditandatangani',
                    guest.namaSatpam || ''
                ]);
                const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
                const border = {
                    top: { style: 'thin', color: { rgb: 'D6DEE8' } },
                    bottom: { style: 'thin', color: { rgb: 'D6DEE8' } },
                    left: { style: 'thin', color: { rgb: 'D6DEE8' } },
                    right: { style: 'thin', color: { rgb: 'D6DEE8' } }
                };

                worksheet['!cols'] = [
                    { wch: 6 }, { wch: 14 }, { wch: 24 }, { wch: 24 },
                    { wch: 24 }, { wch: 38 }, { wch: 26 }, { wch: 17 },
                    { wch: 20 }, { wch: 13 }, { wch: 22 }, { wch: 18 },
                    { wch: 22 }, { wch: 24 }
                ];
                worksheet['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2', activePane: 'bottomLeft', state: 'frozen' };
                worksheet['!autofilter'] = { ref: `A1:N${rows.length + 1}` };

                for (let row = 0; row <= rows.length; row++) {
                    for (let column = 0; column < headers.length; column++) {
                        const cell = worksheet[XLSX.utils.encode_cell({ r: row, c: column })];
                        if (!cell) continue;

                        cell.s = {
                            font: row === 0
                                ? { bold: true, color: { rgb: 'FFFFFF' } }
                                : { color: { rgb: '243247' } },
                            fill: row === 0
                                ? { patternType: 'solid', fgColor: { rgb: '0D2858' } }
                                : { patternType: 'solid', fgColor: { rgb: row % 2 === 0 ? 'F3F6FA' : 'FFFFFF' } },
                            alignment: {
                                vertical: 'center',
                                horizontal: column === 0 ? 'center' : 'left',
                                wrapText: true
                            },
                            border
                        };
                    }
                }
                worksheet['!rows'] = [{ hpt: 28 }, ...rows.map(() => ({ hpt: 24 }))];

                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Tamu');
                const today = new Date();
                const filenameDate = [
                    today.getFullYear(),
                    String(today.getMonth() + 1).padStart(2, '0'),
                    String(today.getDate()).padStart(2, '0')
                ].join('-');
                XLSX.writeFile(workbook, `Data_Buku_Tamu_KAI_${filenameDate}.xlsx`);
            } catch (error) {
                console.error('Export Excel error:', error);
                Swal.fire('Error', 'Gagal mengekspor data ke Excel.', 'error');
            }
        }

        function escapeHtml(str) {
            if(!str) return '';
            return str.replace(/[&<>"']/g, function(m) {
                return {
                    '&': '&amp;',
                    '<': '&lt;',
                    '>': '&gt;',
                    '"': '&quot;',
                    "'": '&#039;'
                }[m];
            });
        }
