// ============================================================================
// KCTC Admin Dashboard - Application Logic
// Modern Light Theme with Glassmorphism
// ============================================================================

let db = null;
let currentAdmin = null;
let courseChartInstance = null;
let revenueChartInstance = null;

// Initialize Supabase
try {
    if (typeof supabase !== 'undefined' && 
        typeof SUPABASE_CONFIG !== 'undefined' &&
        SUPABASE_CONFIG.URL !== 'url.supabase.co' && 
        SUPABASE_CONFIG.ANON_KEY !== 'anonkey') {
        db = supabase.createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.ANON_KEY);
        console.log('Admin: Supabase connected.');
    } else {
        console.warn('Admin: Running in MOCK mode.');
    }
} catch (e) {
    console.error('Admin: Supabase init error:', e);
}

// Mock Data
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

// State
let allStudents = [];
let allInquiries = [];
let editingStudentId = null;
let pendingDeleteId = null;

// Toast Notification System
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle';
    toast.innerHTML = `<i class="fas fa-${icon}"></i><span>${message}</span>`;
    
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// Helper Functions
function escHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function delay(ms) {
    return new Promise(r => setTimeout(r, ms));
}

function switchToPage(page) {
    const navItem = document.querySelector(`.nav-item[data-page="${page}"]`);
    if (navItem) navItem.click();
}

// DOM Ready
document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const loginScreen = document.getElementById('admin-login-screen');
    const adminApp = document.getElementById('admin-app');
    const loginForm = document.getElementById('admin-login-form');
    const loginStatus = document.getElementById('login-status');
    const adminEmailDisplay = document.getElementById('admin-email-display');
    const btnSidebarLogout = document.getElementById('btn-sidebar-logout');
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.querySelector('.sidebar');

    const navItems = document.querySelectorAll('.nav-item[data-page]');
    const pages = document.querySelectorAll('.page');
    const topbarTitle = document.getElementById('topbar-title');
    const btnRefreshData = document.getElementById('btn-refresh-data');

    const statTotal = document.getElementById('stat-total');
    const statVerified = document.getElementById('stat-verified');
    const statPending = document.getElementById('stat-pending');
    const statRevenue = document.getElementById('stat-revenue');

    const studentTbody = document.getElementById('student-tbody');
    const recentStudentsTbody = document.getElementById('recent-students-tbody');
    const searchStudent = document.getElementById('search-student');
    const filterCourse = document.getElementById('filter-course');
    const filterFees = document.getElementById('filter-fees');
    const filterEmail = document.getElementById('filter-email');

    const inquiryTbody = document.getElementById('inquiry-tbody');
    const searchInquiry = document.getElementById('search-inquiry');
    const filterInqStatus = document.getElementById('filter-inq-status');

    const editModal = document.getElementById('edit-modal-overlay');
    const editModalClose = document.getElementById('edit-modal-close');
    const editForm = document.getElementById('edit-student-form');
    const editStatus = document.getElementById('edit-status');

    const deleteModal = document.getElementById('delete-modal-overlay');
    const deleteModalClose = document.getElementById('delete-modal-close');
    const deleteModalCancel = document.getElementById('delete-modal-cancel');
    const deleteConfirmName = document.getElementById('delete-confirm-name');
    const btnConfirmDelete = document.getElementById('btn-confirm-delete');

    // Auth Functions
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
            showApp({ email: 'admin@komalcreations.com (MOCK)' });
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

    // Login Form
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('admin-login-email').value.trim();
        const password = document.getElementById('admin-login-password').value;
        const btn = loginForm.querySelector('button[type="submit"]');
        
        loginStatus.className = 'status-message';
        loginStatus.style.display = 'none';
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';

        try {
            if (db) {
                const { data, error } = await db.auth.signInWithPassword({ email, password });
                if (error) throw error;
            } else {
                if (email && password.length >= 6) {
                    showApp({ email });
                    return;
                } else {
                    throw new Error('Enter any email and password (min 6 chars) for mock mode.');
                }
            }
        } catch (err) {
            loginStatus.textContent = err.message;
            loginStatus.className = 'status-message error';
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
        }
    });

    // Logout
    btnSidebarLogout.addEventListener('click', async () => {
        if (db) {
            await db.auth.signOut();
        } else {
            showLoginScreen();
        }
    });

    // Mobile Menu Toggle
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });

    // Navigation
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
            sidebar.classList.remove('open');
        });
    });

    btnRefreshData.addEventListener('click', () => {
        loadAllData();
        showToast('Data refreshed successfully!', 'success');
    });

    // Load Data
    async function loadAllData() {
        await Promise.all([loadStudents(), loadInquiries()]);
        renderCharts();
    }

    async function loadStudents() {
        studentTbody.innerHTML = `<tr class="loading-row"><td colspan="7"><div class="spinner"></div> Loading students...</td></tr>`;
        try {
            if (db) {
                let { data, error } = await db.from('admin_students').select('*').order('enrollment_date', { ascending: false });
                if (error) {
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
        renderRecentStudents(allStudents.slice(0, 5));
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

    // Render Charts
    function renderCharts() {
        // Course Distribution Chart
        const courseCtx = document.getElementById('courseChart');
        if (courseCtx && typeof Chart !== 'undefined') {
            const courseCounts = {};
            allStudents.forEach(s => {
                const course = s.enrolled_course || 'Unknown';
                courseCounts[course] = (courseCounts[course] || 0) + 1;
            });

            if (courseChartInstance) courseChartInstance.destroy();

            courseChartInstance = new Chart(courseCtx, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(courseCounts),
                    datasets: [{
                        data: Object.values(courseCounts),
                        backgroundColor: ['#6366f1', '#8b5cf6', '#3b82f6', '#06b6d4', '#10b981'],
                        borderWidth: 0,
                        hoverOffset: 10
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '70%',
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                font: { family: 'Inter', size: 12 },
                                usePointStyle: true
                            }
                        }
                    }
                }
            });
        }

        // Revenue Chart
        const revenueCtx = document.getElementById('revenueChart');
        if (revenueCtx && typeof Chart !== 'undefined') {
            if (revenueChartInstance) revenueChartInstance.destroy();

            revenueChartInstance = new Chart(revenueCtx, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                        label: 'Revenue',
                        data: [12000, 19000, 15000, 25000, 22000, 30000],
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(148, 163, 184, 0.1)' }
                        },
                        x: {
                            grid: { display: false }
                        }
                    }
                }
            });
        }
    }

    // Render Stats
    function renderStats() {
        const total = allStudents.length;
        const verified = allStudents.filter(s => s.email_status === 'Verified' || s.email_confirmed_at).length;
        const pending = allStudents.filter(s => !s.email_confirmed_at && s.email_status !== 'Verified').length;
        const revenue = allStudents.reduce((acc, s) => acc + (parseFloat(s.fees_amount) || 0), 0);

        animateCount(statTotal, total);
        animateCount(statVerified, verified);
        animateCount(statPending, pending);
        statRevenue.textContent = '₹' + revenue.toLocaleString('en-IN');
    }

    function animateCount(el, target) {
        if (!el) return;
        let start = 0;
        const duration = 600;
        const step = Math.ceil(target / (duration / 16));
        const timer = setInterval(() => {
            start += step;
            if (start >= target) {
                el.textContent = target;
                clearInterval(timer);
            } else {
                el.textContent = start;
            }
        }, 16);
    }

    // Render Students Table
    function renderStudents(students) {
        if (!students.length) {
            studentTbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><i class="fas fa-user-graduate"></i><p>No student enrollments found.</p></div></td></tr>`;
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
                    <small>${escHtml(s.father_name || '-')}</small>
                </td>
                <td data-label="Contact">
                    <strong>${escHtml(s.email)}</strong>
                    <small>${escHtml(s.phone || '-')}</small>
                </td>
                <td data-label="Course"><span class="badge badge-primary">${escHtml(s.enrolled_course)}</span></td>
                <td data-label="Email Status">${emailBadge}</td>
                <td data-label="Fees">${feesBadge}</td>
                <td data-label="Enrolled">${date}</td>
                <td data-label="Actions">
                    <div class="actions-cell">
                        <button class="btn-action" onclick="openEditModal('${s.id}')"><i class="fas fa-edit"></i> Edit</button>
                        <button class="btn-action ${s.fees_paid ? '' : 'success'}" onclick="toggleFees('${s.id}', ${!s.fees_paid})">
                            <i class="fas fa-${s.fees_paid ? 'times' : 'check'}"></i> ${s.fees_paid ? 'Unpaid' : 'Paid'}
                        </button>
                        <button class="btn-action danger" onclick="openDeleteModal('${s.id}', '${escHtml(s.full_name)}')"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>`;
        }).join('');
    }

    // Render Recent Students
    function renderRecentStudents(students) {
        if (!students.length) {
            recentStudentsTbody.innerHTML = `<tr><td colspan="4"><div class="empty-state"><p>No recent enrollments.</p></div></td></tr>`;
            return;
        }
        recentStudentsTbody.innerHTML = students.map(s => {
            const emailVerified = s.email_confirmed_at || s.email_status === 'Verified';
            const statusBadge = emailVerified
                ? `<span class="badge badge-success">Verified</span>`
                : `<span class="badge badge-warning">Pending</span>`;
            const date = s.enrollment_date ? new Date(s.enrollment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '-';

            return `<tr>
                <td data-label="Student"><strong>${escHtml(s.full_name)}</strong></td>
                <td data-label="Course"><span class="badge badge-primary">${escHtml(s.enrolled_course)}</span></td>
                <td data-label="Status">${statusBadge}</td>
                <td data-label="Date">${date}</td>
            </tr>`;
        }).join('');
    }

    // Render Inquiries Table
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
                <td data-label="Course"><span class="badge badge-primary">${escHtml(inq.course_interested)}</span></td>
                <td data-label="Status">${statusBadge}</td>
                <td data-label="Actions">
                    <div class="actions-cell">
                        <select class="btn-action" onchange="updateInquiryStatus('${inq.id}', this.value)">
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

    // Filters
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

    // Toggle Fees
    window.toggleFees = async (id, newValue) => {
        try {
            if (db) {
                const { error } = await db.from('profiles').update({ fees_paid: newValue }).eq('id', id);
                if (error) throw error;
            }
            const s = allStudents.find(s => s.id === id);
            if (s) {
                s.fees_paid = newValue;
                if (!newValue) s.fees_amount = 0;
            }
            renderStudents(allStudents);
            renderRecentStudents(allStudents.slice(0, 5));
            renderStats();
            renderCharts();
            showToast(newValue ? 'Fees marked as paid!' : 'Fees marked as unpaid.', 'success');
        } catch (err) {
            showToast('Error updating fees: ' + err.message, 'error');
        }
    };

    // Update Inquiry Status
    window.updateInquiryStatus = async (id, newStatus) => {
        try {
            if (db) {
                const { error } = await db.from('inquiries').update({ status: newStatus }).eq('id', id);
                if (error) throw error;
            }
            const inq = allInquiries.find(i => i.id === id);
            if (inq) inq.status = newStatus;
            renderStats();
            showToast(`Inquiry status updated to ${newStatus}.`, 'success');
        } catch (err) {
            showToast('Error updating status: ' + err.message, 'error');
        }
    };

    // Delete Inquiry
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
            showToast('Inquiry deleted successfully!', 'success');
        } catch (err) {
            showToast('Error deleting inquiry: ' + err.message, 'error');
        }
    };

    // Export CSV
    window.exportToCSV = () => {
        if (!allStudents.length) {
            showToast('No data to export!', 'error');
            return;
        }
        const headers = ['Name', 'Father Name', 'Email', 'Phone', 'Course', 'Fees Paid', 'Fees Amount', 'Enrollment Date', 'Notes'];
        const csvContent = [
            headers.join(','),
            ...allStudents.map(s => [
                `"${(s.full_name || '').replace(/"/g, '""')}"`,
                `"${(s.father_name || '').replace(/"/g, '""')}"`,
                `"${(s.email || '').replace(/"/g, '""')}"`,
                `"${(s.phone || '').replace(/"/g, '""')}"`,
                `"${(s.enrolled_course || '').replace(/"/g, '""')}"`,
                s.fees_paid ? 'Yes' : 'No',
                s.fees_amount || 0,
                s.enrollment_date ? new Date(s.enrollment_date).toLocaleDateString() : '',
                `"${(s.admin_notes || '').replace(/"/g, '""')}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `students_export_${new Date().toISOString().slice(0,10)}.csv`;
        link.click();
        showToast('Data exported successfully!', 'success');
    };

    // Edit Modal
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
        editStatus.className = 'status-message';
        editStatus.style.display = 'none';
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
            const idx = allStudents.findIndex(s => s.id === editingStudentId);
            if (idx !== -1) allStudents[idx] = { ...allStudents[idx], ...updates };

            renderStudents(allStudents);
            renderRecentStudents(allStudents.slice(0, 5));
            renderStats();
            renderCharts();
            showToast('Student record updated successfully!', 'success');
            setTimeout(() => editModal.classList.remove('open'), 800);
        } catch (err) {
            editStatus.textContent = 'Error: ' + err.message;
            editStatus.className = 'status-message error';
            editStatus.style.display = 'block';
        }
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
    });

    // Delete Modal
    window.openDeleteModal = (id, name) => {
        pendingDeleteId = id;
        deleteConfirmName.textContent = name;
        deleteModal.classList.add('open');
    };

    deleteModalClose.addEventListener('click', () => deleteModal.classList.remove('open'));
    deleteModalCancel.addEventListener('click', () => deleteModal.classList.remove('open'));
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
            renderRecentStudents(allStudents.slice(0, 5));
            renderStats();
            renderCharts();
            deleteModal.classList.remove('open');
            showToast('Student deleted successfully!', 'success');
        } catch (err) {
            showToast('Delete failed: ' + err.message, 'error');
        }
        btnConfirmDelete.disabled = false;
        btnConfirmDelete.innerHTML = '<i class="fas fa-trash"></i> Yes, Delete';
        pendingDeleteId = null;
    });

    // Initialize
    initAuth();
});
