// ============================================================================
// KCTC Admin Dashboard - Application Logic
// Handles: Admin Login via Supabase Auth, Student Data CRUD, Fee Management
// ============================================================================

// Initialize Supabase (loaded via CDN in admin.html + config.js)
let db = null;
let currentAdmin = null;

try {
    if (typeof supabase !== 'undefined' &&
        SUPABASE_CONFIG.URL !== 'YOUR_SUPABASE_URL' &&
        SUPABASE_CONFIG.ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY') {
        db = supabase.createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.ANON_KEY);
        console.log('Admin: Supabase connected.');
    } else {
        console.warn('Admin: Running in MOCK mode. Set config.js keys to connect live data.');
    }
} catch (e) {
    console.error('Admin: Supabase init error:', e);
}

// --------------------------------------------------------------------------
// MOCK DATA (used when Supabase keys are not yet set)
// --------------------------------------------------------------------------
const MOCK_STUDENTS = [
    { id: 'u1', full_name: 'Aaradhya Sharma', father_name: 'Rajesh Sharma', residence: 'Mumbai, Maharashtra', email: 'aaradhya@gmail.com', phone: '+91 99887 76655', enrolled_course: 'Advanced Fashion Designing Course', fees_paid: true, fees_amount: 8500, admin_notes: 'Attending regularly', enrollment_date: '2026-04-01T10:00:00Z', email_confirmed_at: '2026-04-01T10:30:00Z', email_status: 'Verified' },
    { id: 'u2', full_name: 'Priya Patel', father_name: 'Vijay Patel', residence: 'Pune, Maharashtra', email: 'priya@gmail.com', phone: '+91 98765 43210', enrolled_course: 'Boutique Tailoring & Stitching Course', fees_paid: false, fees_amount: 0, admin_notes: '', enrollment_date: '2026-05-10T09:00:00Z', email_confirmed_at: null, email_status: 'Pending' },
    { id: 'u3', full_name: 'Sneha Sen', father_name: 'Alok Sen', residence: 'Delhi', email: 'sneha@gmail.com', phone: '+91 91234 56789', enrolled_course: 'Hand Embroidery & Zardozi Course', fees_paid: true, fees_amount: 4000, admin_notes: 'Excellent progress', enrollment_date: '2026-06-01T08:30:00Z', email_confirmed_at: '2026-06-01T09:00:00Z', email_status: 'Verified' },
    { id: 'u4', full_name: 'Meera Joshi', father_name: 'Anil Joshi', residence: 'Nagpur, Maharashtra', email: 'meera@yahoo.com', phone: '+91 77889 90011', enrolled_course: 'Advanced Fashion Designing Course', fees_paid: false, fees_amount: 0, admin_notes: 'Needs follow-up for fees', enrollment_date: '2026-06-15T11:00:00Z', email_confirmed_at: '2026-06-15T11:45:00Z', email_status: 'Verified' },
];
const MOCK_INQUIRIES = [
    { id: 'i1', full_name: 'Rekha Desai', phone_number: '+91 98001 23456', age: 24, course_interested: 'Boutique Tailoring & Stitching Course', status: 'new', created_at: '2026-06-20T14:00:00Z' },
    { id: 'i2', full_name: 'Nisha Kumar', phone_number: '+91 90001 34567', age: 19, course_interested: 'Advanced Fashion Designing Course', status: 'contacted', created_at: '2026-06-21T10:00:00Z' },
    { id: 'i3', full_name: 'Pooja Mehta', phone_number: '+91 88776 54321', age: 28, course_interested: 'Hand Embroidery & Zardozi Course', status: 'enrolled', created_at: '2026-06-22T16:30:00Z' },
];

// --------------------------------------------------------------------------
// STATE
// --------------------------------------------------------------------------
let allStudents = [];
let allInquiries = [];
let editingStudentId = null;

// --------------------------------------------------------------------------
// DOM REFS - resolved after DOMContentLoaded
// --------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    // Login screen
    const loginScreen = document.getElementById('admin-login-screen');
    const adminApp = document.getElementById('admin-app');
    const loginForm = document.getElementById('admin-login-form');
    const loginStatus = document.getElementById('login-status');
    const adminEmailDisplay = document.getElementById('admin-email-display');
    const btnSidebarLogout = document.getElementById('btn-sidebar-logout');

    // Nav items
    const navItems = document.querySelectorAll('.nav-item[data-page]');
    const pages = document.querySelectorAll('.page');
    const topbarTitle = document.getElementById('topbar-title');
    const btnRefreshData = document.getElementById('btn-refresh-data');

    // Stat counters
    const statTotal = document.getElementById('stat-total');
    const statVerified = document.getElementById('stat-verified');
    const statFeesPaid = document.getElementById('stat-fees-paid');
    const statPending = document.getElementById('stat-pending');
    const statInquiries = document.getElementById('stat-inquiries');
    const statRevenue = document.getElementById('stat-revenue');

    // Student table
    const studentTbody = document.getElementById('student-tbody');
    const searchStudent = document.getElementById('search-student');
    const filterCourse = document.getElementById('filter-course');
    const filterFees = document.getElementById('filter-fees');
    const filterEmail = document.getElementById('filter-email');

    // Inquiry table
    const inquiryTbody = document.getElementById('inquiry-tbody');
    const searchInquiry = document.getElementById('search-inquiry');
    const filterInqStatus = document.getElementById('filter-inq-status');

    // Edit modal
    const editModal = document.getElementById('edit-modal-overlay');
    const editModalClose = document.getElementById('edit-modal-close');
    const editForm = document.getElementById('edit-student-form');
    const editStatus = document.getElementById('edit-status');

    // Delete modal
    const deleteModal = document.getElementById('delete-modal-overlay');
    const deleteModalClose = document.getElementById('delete-modal-close');
    const deleteConfirmName = document.getElementById('delete-confirm-name');
    const btnConfirmDelete = document.getElementById('btn-confirm-delete');
    let pendingDeleteId = null;

    // -----------------------------------------------------------------------
    // AUTH - Check session on load
    // -----------------------------------------------------------------------
    async function initAuth() {
        if (db) {
            const { data: { session } } = await db.auth.getSession();
            if (session) {
                showApp(session.user);
            } else {
                showLoginScreen();
            }
            db.auth.onAuthStateChange((event, session) => {
                if (session) showApp(session.user);
                else showLoginScreen();
            });
        } else {
            // Mock: show app directly
            showApp({ email: 'admin@komalcreations.com (MOCK MODE)' });
        }
    }

    function showLoginScreen() {
        loginScreen.style.display = 'flex';
        adminApp.style.display = 'none';
    }

    function showApp(user) {
        currentAdmin = user;
        loginScreen.style.display = 'none';
        adminApp.style.display = 'grid';
        if (adminEmailDisplay) adminEmailDisplay.textContent = user.email || 'Admin';
        loadAllData();
    }

    // -----------------------------------------------------------------------
    // LOGIN FORM
    // -----------------------------------------------------------------------
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('admin-login-email').value.trim();
        const password = document.getElementById('admin-login-password').value;
        const btn = loginForm.querySelector('button[type="submit"]');
        loginStatus.className = 'login-status';
        loginStatus.style.display = 'none';
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...';

        try {
            if (db) {
                const { data, error } = await db.auth.signInWithPassword({ email, password });
                if (error) throw error;
            } else {
                // Mock auth
                if (email && password.length >= 6) {
                    showApp({ email });
                    return;
                } else {
                    throw new Error('Enter any email and password (min 6 chars) for mock mode.');
                }
            }
        } catch (err) {
            loginStatus.textContent = err.message;
            loginStatus.className = 'login-status error';
        }
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Access Admin Panel';
    });

    // -----------------------------------------------------------------------
    // LOGOUT
    // -----------------------------------------------------------------------
    btnSidebarLogout.addEventListener('click', async () => {
        if (db) {
            await db.auth.signOut();
        } else {
            showLoginScreen();
        }
    });

    // -----------------------------------------------------------------------
    // NAVIGATION
    // -----------------------------------------------------------------------
    const pageTitles = {
        'overview': 'Dashboard Overview',
        'students': 'Student Enrollments',
        'inquiries': 'Lead Inquiries',
        'certificates': 'Certificates Ledger'
    };
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const target = item.getAttribute('data-page');
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            pages.forEach(p => p.classList.remove('active'));
            document.getElementById(`page-${target}`).classList.add('active');
            topbarTitle.textContent = pageTitles[target] || 'Admin Dashboard';
        });
    });

    btnRefreshData.addEventListener('click', () => loadAllData());

    // -----------------------------------------------------------------------
    // LOAD DATA
    // -----------------------------------------------------------------------
    async function loadAllData() {
        await Promise.all([loadStudents(), loadInquiries()]);
    }

    async function loadStudents() {
        studentTbody.innerHTML = `<tr class="loading-row"><td colspan="8"><div class="spinner"></div> Loading students...</td></tr>`;
        try {
            if (db) {
                // Try the view first, fall back to profiles table
                let { data, error } = await db.from('admin_students').select('*').order('enrollment_date', { ascending: false });
                if (error) {
                    // fallback to profiles directly
                    const res = await db.from('profiles').select('*').order('updated_at', { ascending: false });
                    if (res.error) throw res.error;
                    data = res.data.map(p => ({ ...p, email_status: 'Verified', email_confirmed_at: p.updated_at }));
                }
                allStudents = data || [];
            } else {
                await delay(600);
                allStudents = [...MOCK_STUDENTS];
            }
        } catch (err) {
            console.error('loadStudents error:', err);
            allStudents = [];
        }
        renderStudents(allStudents);
        renderStats();
    }

    async function loadInquiries() {
        inquiryTbody.innerHTML = `<tr class="loading-row"><td colspan="6"><div class="spinner"></div> Loading inquiries...</td></tr>`;
        try {
            if (db) {
                const { data, error } = await db.from('inquiries').select('*').order('created_at', { ascending: false });
                if (error) throw error;
                allInquiries = data || [];
            } else {
                await delay(600);
                allInquiries = [...MOCK_INQUIRIES];
            }
        } catch (err) {
            console.error('loadInquiries error:', err);
            allInquiries = [];
        }
        renderInquiries(allInquiries);
        renderStats();
    }

    // -----------------------------------------------------------------------
    // STATS
    // -----------------------------------------------------------------------
    function renderStats() {
        const total = allStudents.length;
        const verified = allStudents.filter(s => s.email_status === 'Verified' || s.email_confirmed_at).length;
        const feesPaid = allStudents.filter(s => s.fees_paid).length;
        const pending = allStudents.filter(s => !s.email_confirmed_at && s.email_status !== 'Verified').length;
        const revenue = allStudents.reduce((acc, s) => acc + (parseFloat(s.fees_amount) || 0), 0);

        animateCount(statTotal, total);
        animateCount(statVerified, verified);
        animateCount(statFeesPaid, feesPaid);
        animateCount(statPending, pending);
        animateCount(statInquiries, allInquiries.length);
        statRevenue.textContent = '₹' + revenue.toLocaleString('en-IN');
    }

    function animateCount(el, target) {
        if (!el) return;
        let start = 0;
        const duration = 600;
        const step = Math.ceil(target / (duration / 16));
        const timer = setInterval(() => {
            start += step;
            if (start >= target) { el.textContent = target; clearInterval(timer); }
            else el.textContent = start;
        }, 16);
    }

    // -----------------------------------------------------------------------
    // RENDER STUDENTS TABLE
    // -----------------------------------------------------------------------
    function renderStudents(students) {
        if (!students.length) {
            studentTbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><i class="fas fa-user-graduate"></i><p>No student enrollments found.</p></div></td></tr>`;
            return;
        }
        studentTbody.innerHTML = students.map(s => {
            const emailVerified = s.email_confirmed_at || s.email_status === 'Verified';
            const emailBadge = emailVerified
                ? `<span class="badge badge-success"><i class="fas fa-check-circle"></i> Verified</span>`
                : `<span class="badge badge-warning"><i class="fas fa-clock"></i> Pending</span>`;
            const feesBadge = s.fees_paid
                ? `<span class="badge badge-success">✓ Paid ₹${(s.fees_amount || 0).toLocaleString('en-IN')}</span>`
                : `<span class="badge badge-error">✗ Unpaid</span>`;
            const date = s.enrollment_date ? new Date(s.enrollment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

            return `<tr>
                <td data-label="Student">
                    <strong>${escHtml(s.full_name)}</strong>
                    <small>Father: ${escHtml(s.father_name || '-')}</small>
                    <small>${escHtml(s.residence || '-')}</small>
                </td>
                <td data-label="Contact">
                    <strong>${escHtml(s.email)}</strong>
                    <small>${escHtml(s.phone || '-')}</small>
                </td>
                <td data-label="Course"><span class="badge badge-gold">${escHtml(s.enrolled_course)}</span></td>
                <td data-label="Email Status">${emailBadge}</td>
                <td data-label="Fees">${feesBadge}</td>
                <td data-label="Enrolled On">${date}</td>
                <td data-label="Notes"><small style="color:var(--text-secondary)">${escHtml(s.admin_notes || '—')}</small></td>
                <td data-label="Actions">
                    <div class="actions-cell">
                        <button class="btn-action success" onclick="openEditModal('${s.id}')"><i class="fas fa-edit"></i> Edit</button>
                        <button class="btn-action ${s.fees_paid ? '' : 'success'}" onclick="toggleFees('${s.id}', ${!s.fees_paid})">
                            <i class="fas fa-${s.fees_paid ? 'times' : 'check'}"></i> ${s.fees_paid ? 'Unpaid' : 'Mark Paid'}
                        </button>
                        <button class="btn-action danger" onclick="openDeleteModal('${s.id}', '${escHtml(s.full_name)}')"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>`;
        }).join('');
    }

    // -----------------------------------------------------------------------
    // RENDER INQUIRIES TABLE
    // -----------------------------------------------------------------------
    function renderInquiries(inquiries) {
        if (!inquiries.length) {
            inquiryTbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><i class="fas fa-inbox"></i><p>No inquiries found.</p></div></td></tr>`;
            return;
        }
        const statusColors = { new: 'badge-info', contacted: 'badge-warning', enrolled: 'badge-success', cancelled: 'badge-error' };
        inquiryTbody.innerHTML = inquiries.map(inq => {
            const date = new Date(inq.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
            const statusBadge = `<span class="badge ${statusColors[inq.status] || 'badge-info'}">${inq.status.charAt(0).toUpperCase() + inq.status.slice(1)}</span>`;
            return `<tr>
                <td data-label="Name"><strong>${escHtml(inq.full_name)}</strong></td>
                <td data-label="Phone">${escHtml(inq.phone_number)}</td>
                <td data-label="Age">${inq.age || '-'}</td>
                <td data-label="Course Interested"><span class="badge badge-gold">${escHtml(inq.course_interested)}</span></td>
                <td data-label="Status">${statusBadge}</td>
                <td data-label="Received">
                    ${date}
                    <div class="actions-cell" style="margin-top:0.4rem;">
                        <select class="btn-action" style="cursor:pointer;" onchange="updateInquiryStatus('${inq.id}', this.value)">
                            <option value="new" ${inq.status==='new'?'selected':''}>New</option>
                            <option value="contacted" ${inq.status==='contacted'?'selected':''}>Contacted</option>
                            <option value="enrolled" ${inq.status==='enrolled'?'selected':''}>Enrolled</option>
                            <option value="cancelled" ${inq.status==='cancelled'?'selected':''}>Cancelled</option>
                        </select>
                        <button class="btn-action danger" onclick="deleteInquiry('${inq.id}')"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>`;
        }).join('');
    }

    // -----------------------------------------------------------------------
    // FILTERS
    // -----------------------------------------------------------------------
    function applyStudentFilters() {
        const q = (searchStudent.value || '').toLowerCase();
        const course = filterCourse.value;
        const fees = filterFees.value;
        const emailF = filterEmail.value;
        const filtered = allStudents.filter(s => {
            const matchQ = !q || s.full_name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || (s.phone || '').includes(q);
            const matchCourse = !course || s.enrolled_course === course;
            const matchFees = !fees || (fees === 'paid' ? s.fees_paid : !s.fees_paid);
            const emailVerified = s.email_confirmed_at || s.email_status === 'Verified';
            const matchEmail = !emailF || (emailF === 'verified' ? emailVerified : !emailVerified);
            return matchQ && matchCourse && matchFees && matchEmail;
        });
        renderStudents(filtered);
    }

    searchStudent.addEventListener('input', applyStudentFilters);
    filterCourse.addEventListener('change', applyStudentFilters);
    filterFees.addEventListener('change', applyStudentFilters);
    filterEmail.addEventListener('change', applyStudentFilters);

    function applyInquiryFilters() {
        const q = (searchInquiry.value || '').toLowerCase();
        const status = filterInqStatus.value;
        const filtered = allInquiries.filter(i => {
            const matchQ = !q || i.full_name.toLowerCase().includes(q) || (i.phone_number || '').includes(q);
            const matchStatus = !status || i.status === status;
            return matchQ && matchStatus;
        });
        renderInquiries(filtered);
    }
    searchInquiry.addEventListener('input', applyInquiryFilters);
    filterInqStatus.addEventListener('change', applyInquiryFilters);

    // -----------------------------------------------------------------------
    // TOGGLE FEES (quick action button)
    // -----------------------------------------------------------------------
    window.toggleFees = async (id, newValue) => {
        try {
            if (db) {
                const { error } = await db.from('profiles').update({ fees_paid: newValue }).eq('id', id);
                if (error) throw error;
            }
            const s = allStudents.find(s => s.id === id);
            if (s) { s.fees_paid = newValue; if (!newValue) s.fees_amount = 0; }
            renderStudents(allStudents);
            renderStats();
        } catch (err) {
            alert('Error updating fees: ' + err.message);
        }
    };

    // -----------------------------------------------------------------------
    // UPDATE INQUIRY STATUS (quick dropdown)
    // -----------------------------------------------------------------------
    window.updateInquiryStatus = async (id, newStatus) => {
        try {
            if (db) {
                const { error } = await db.from('inquiries').update({ status: newStatus }).eq('id', id);
                if (error) throw error;
            }
            const inq = allInquiries.find(i => i.id === id);
            if (inq) inq.status = newStatus;
            renderStats();
        } catch (err) {
            alert('Error updating inquiry status: ' + err.message);
        }
    };

    // -----------------------------------------------------------------------
    // DELETE INQUIRY
    // -----------------------------------------------------------------------
    window.deleteInquiry = async (id) => {
        if (!confirm('Are you sure you want to delete this inquiry?')) return;
        try {
            if (db) {
                const { error } = await db.from('inquiries').delete().eq('id', id);
                if (error) throw error;
            }
            allInquiries = allInquiries.filter(i => i.id !== id);
            renderInquiries(allInquiries);
            renderStats();
        } catch (err) {
            alert('Error deleting inquiry: ' + err.message);
        }
    };

    // -----------------------------------------------------------------------
    // EDIT STUDENT MODAL
    // -----------------------------------------------------------------------
    window.openEditModal = (id) => {
        const s = allStudents.find(s => s.id === id);
        if (!s) return;
        editingStudentId = id;
        document.getElementById('edit-full-name').value = s.full_name || '';
        document.getElementById('edit-father-name').value = s.father_name || '';
        document.getElementById('edit-residence').value = s.residence || '';
        document.getElementById('edit-phone').value = s.phone || '';
        document.getElementById('edit-course').value = s.enrolled_course || '';
        document.getElementById('edit-fees-paid').checked = !!s.fees_paid;
        document.getElementById('edit-fees-amount').value = s.fees_amount || '';
        document.getElementById('edit-notes').value = s.admin_notes || '';
        editStatus.className = '';
        editStatus.style.display = 'none';
        editStatus.textContent = '';
        editModal.classList.add('open');
    };

    editModalClose.addEventListener('click', () => editModal.classList.remove('open'));
    editModal.addEventListener('click', e => { if (e.target === editModal) editModal.classList.remove('open'); });

    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = editForm.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        const updates = {
            full_name: document.getElementById('edit-full-name').value.trim(),
            father_name: document.getElementById('edit-father-name').value.trim(),
            residence: document.getElementById('edit-residence').value.trim(),
            phone: document.getElementById('edit-phone').value.trim(),
            enrolled_course: document.getElementById('edit-course').value,
            fees_paid: document.getElementById('edit-fees-paid').checked,
            fees_amount: parseFloat(document.getElementById('edit-fees-amount').value) || 0,
            admin_notes: document.getElementById('edit-notes').value.trim(),
        };

        try {
            if (db) {
                const { error } = await db.from('profiles').update(updates).eq('id', editingStudentId);
                if (error) throw error;
            }
            // Update local mock
            const idx = allStudents.findIndex(s => s.id === editingStudentId);
            if (idx !== -1) allStudents[idx] = { ...allStudents[idx], ...updates };

            editStatus.textContent = 'Student record updated successfully!';
            editStatus.className = 'login-status success';
            renderStudents(allStudents);
            renderStats();
            setTimeout(() => editModal.classList.remove('open'), 1200);
        } catch (err) {
            editStatus.textContent = 'Error: ' + err.message;
            editStatus.className = 'login-status error';
        }
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
    });

    // -----------------------------------------------------------------------
    // DELETE STUDENT MODAL
    // -----------------------------------------------------------------------
    window.openDeleteModal = (id, name) => {
        pendingDeleteId = id;
        deleteConfirmName.textContent = name;
        deleteModal.classList.add('open');
    };

    deleteModalClose.addEventListener('click', () => deleteModal.classList.remove('open'));
    deleteModal.addEventListener('click', e => { if (e.target === deleteModal) deleteModal.classList.remove('open'); });

    btnConfirmDelete.addEventListener('click', async () => {
        if (!pendingDeleteId) return;
        btnConfirmDelete.disabled = true;
        btnConfirmDelete.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
        try {
            if (db) {
                const { error } = await db.from('profiles').delete().eq('id', pendingDeleteId);
                if (error) throw error;
            }
            allStudents = allStudents.filter(s => s.id !== pendingDeleteId);
            renderStudents(allStudents);
            renderStats();
            deleteModal.classList.remove('open');
        } catch (err) {
            alert('Delete failed: ' + err.message);
        }
        btnConfirmDelete.disabled = false;
        btnConfirmDelete.innerHTML = '<i class="fas fa-trash"></i> Yes, Delete';
        pendingDeleteId = null;
    });

    // -----------------------------------------------------------------------
    // HELPERS
    // -----------------------------------------------------------------------
    function escHtml(str) {
        if (!str) return '';
        return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }
    function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

    // -----------------------------------------------------------------------
    // INIT
    // -----------------------------------------------------------------------
    initAuth();
});
