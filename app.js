// Initialize Supabase Client
let supabaseDb = null;
try {
    // Only attempt initialization if the configuration keys are replaced
    if (typeof supabase !== 'undefined' && SUPABASE_CONFIG.URL && SUPABASE_CONFIG.URL !== 'YOUR_SUPABASE_URL' && 
        SUPABASE_CONFIG.ANON_KEY && SUPABASE_CONFIG.ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY') {
        supabaseDb = supabase.createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.ANON_KEY);
        console.log('Supabase client initialized successfully.');
    } else {
        console.warn('Supabase is not configured yet. Using mock database mode for local preview.');
    }
} catch (err) {
    console.error('Failed to initialize Supabase client:', err);
}

// Mock Database fallback for local development/preview before Supabase is set up
const MOCK_DB = {
    certificates: [
        {
            student_name: 'Aaradhya Sharma',
            father_name: 'Rajesh Sharma',
            roll_number: 'KCTC-2025-089',
            course_name: 'Advance Fashion Designing & Tailoring',
            passing_year: 2025,
            grade: 'A+',
            verification_code: 'KCTC-VERIFY-99A',
            certificate_image_url: 'https://images.unsplash.com/photo-1589330694653-ded6df53f6ee?auto=format&fit=crop&q=80&w=800'
        },
        {
            student_name: 'Priya Patel',
            father_name: 'Vijay Patel',
            roll_number: 'KCTC-2026-012',
            course_name: 'Embroidery & Hand Crafting Masterclass',
            passing_year: 2026,
            grade: 'A',
            verification_code: 'KCTC-VERIFY-12B',
            certificate_image_url: 'https://images.unsplash.com/photo-1606240724602-5b21f896eae8?auto=format&fit=crop&q=80&w=800'
        }
    ]
};

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. THEME SWITCHER LOGIC ---
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = themeToggleBtn.querySelector('i');
    
    // Check saved theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });

    function updateThemeIcon(theme) {
        if (theme === 'dark') {
            themeIcon.className = 'fas fa-sun';
        } else {
            themeIcon.className = 'fas fa-moon';
        }
    }

    // --- 2. MOBILE MENU ---
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const navLinksList = document.querySelector('.nav-links');
    
    mobileMenuBtn.addEventListener('click', () => {
        navLinksList.style.display = navLinksList.style.display === 'flex' ? 'none' : 'flex';
        navLinksList.style.flexDirection = 'column';
        navLinksList.style.position = 'absolute';
        navLinksList.style.top = '80px';
        navLinksList.style.left = '0';
        navLinksList.style.width = '100%';
        navLinksList.style.background = 'var(--bg-glass)';
        navLinksList.style.padding = '1.5rem';
        navLinksList.style.backdropFilter = 'blur(15px)';
        navLinksList.style.borderBottom = '1px solid var(--border-glass)';
    });

    // --- 3. CREATIONS PORTFOLIO FILTER ---
    const filterButtons = document.querySelectorAll('.filter-btn');
    const creationCards = document.querySelectorAll('.creation-card');

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const category = btn.getAttribute('data-filter');

            creationCards.forEach(card => {
                const cardCategory = card.getAttribute('data-category');
                if (category === 'all' || cardCategory === category) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });

    // --- 4. COURSES LIVE SEARCH ---
    const courseSearchInput = document.getElementById('course-search');
    const courseCards = document.querySelectorAll('.course-card');

    courseSearchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();

        courseCards.forEach(card => {
            const title = card.querySelector('h3').textContent.toLowerCase();
            const desc = card.querySelector('p').textContent.toLowerCase();
            
            if (title.includes(query) || desc.includes(query)) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    });

    // --- 5. ADMISSION INQUIRY FORM SUBMISSION (WITH SPAM PROTECTION & VALIDATION) ---
    const inquiryForm = document.getElementById('admission-inquiry-form');
    const formStatus = document.getElementById('form-status-msg');

    inquiryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Hide previous status message
        formStatus.style.display = 'none';
        formStatus.className = 'form-status';

        // 1. Honeypot Anti-Spam Check
        const honeyField = document.getElementById('website_address').value;
        if (honeyField) {
            console.warn('Honeypot field filled. Spam submission detected and ignored.');
            // Show fake success to the bot, or clear silently
            showFormMessage('Inquiry submitted successfully! We will contact you soon.', 'success');
            inquiryForm.reset();
            return;
        }

        // 2. Fetch form inputs
        const fullName = document.getElementById('full_name').value.trim();
        const phoneNumber = document.getElementById('phone_number').value.trim();
        const ageVal = document.getElementById('age').value;
        const courseInterested = document.getElementById('course_interested').value;

        // 3. Client-Side Validation
        if (fullName.length < 2) {
            showFormMessage('Please enter a valid full name (minimum 2 characters).', 'error');
            return;
        }

        const phoneRegex = /^[+]?[0-9\s-]{8,20}$/;
        if (!phoneRegex.test(phoneNumber)) {
            showFormMessage('Please enter a valid phone number (minimum 8 digits, only numbers/spaces/dashes).', 'error');
            return;
        }

        let age = null;
        if (ageVal) {
            age = parseInt(ageVal);
            if (isNaN(age) || age <= 0 || age >= 120) {
                showFormMessage('Please enter a valid age between 1 and 120.', 'error');
                return;
            }
        }

        if (!courseInterested) {
            showFormMessage('Please select a course or service of interest.', 'error');
            return;
        }

        // Disable button while processing
        const submitBtn = inquiryForm.querySelector('button[type="submit"]');
        const origBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

        try {
            if (supabaseDb) {
                // Insert lead into Supabase Inquiries table
                const { error } = await supabaseDb
                    .from('inquiries')
                    .insert([
                        { 
                            full_name: fullName, 
                            phone_number: phoneNumber, 
                            age: age, 
                            course_interested: courseInterested 
                        }
                    ]);

                if (error) throw error;
                
                showFormMessage('Inquiry submitted successfully! Our representative will call you shortly.', 'success');
                inquiryForm.reset();
            } else {
                // Local preview fallback mode
                setTimeout(() => {
                    showFormMessage('Successfully saved inquiry [PREVIEW fall-back mode: Supabase keys not set].', 'success');
                    inquiryForm.reset();
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = origBtnText;
                }, 1000);
                return;
            }
        } catch (err) {
            console.error('Error inserting inquiry:', err);
            showFormMessage('Submission failed: ' + (err.message || 'Server error. Please try again.'), 'error');
        }

        submitBtn.disabled = false;
        submitBtn.innerHTML = origBtnText;
    });

    function showFormMessage(msg, type) {
        formStatus.textContent = msg;
        formStatus.className = `form-status ${type}`;
        formStatus.style.display = 'block';
        
        // Scroll to form status
        formStatus.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // --- 6. CERTIFICATE VERIFICATION PORTAL (ONLINE LEDGER) ---
    const verifyBtn = document.getElementById('btn-verify-cert');
    const certInput = document.getElementById('cert-verify-code');
    const certDisplay = document.getElementById('certificate-result');
    
    // Certificate Detail Nodes
    const nodeStudentName = document.getElementById('cert-student-name');
    const nodeFatherName = document.getElementById('cert-father-name');
    const nodeRollNo = document.getElementById('cert-roll-number');
    const nodeCourseName = document.getElementById('cert-course-name');
    const nodePassingYear = document.getElementById('cert-passing-year');
    const nodeGrade = document.getElementById('cert-grade');
    const nodeVerifyCode = document.getElementById('cert-verification-code');
    const nodeSealDate = document.getElementById('cert-seal-text');
    const nodeImgBtn = document.getElementById('btn-view-cert-img');

    let currentCertImage = '';

    verifyBtn.addEventListener('click', async () => {
        const code = certInput.value.trim().toUpperCase();
        
        // Clear previous state
        certDisplay.style.display = 'none';
        
        if (!code) {
            alert('Please enter a Certificate Verification Code.');
            return;
        }

        verifyBtn.disabled = true;
        verifyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Searching...';

        try {
            let certificateData = null;

            if (supabaseDb) {
                // Fetch certificate from Supabase certificates table
                const { data, error } = await supabaseDb
                    .from('certificates')
                    .select('*')
                    .eq('verification_code', code)
                    .maybeSingle();

                if (error) throw error;
                certificateData = data;
            } else {
                // Mock search for local testing
                certificateData = MOCK_DB.certificates.find(c => c.verification_code === code) || null;
            }

            if (certificateData) {
                // Map database values into the certificate layout
                nodeStudentName.textContent = certificateData.student_name;
                nodeFatherName.textContent = certificateData.father_name;
                nodeRollNo.textContent = certificateData.roll_number;
                nodeCourseName.textContent = certificateData.course_name;
                nodePassingYear.textContent = certificateData.passing_year;
                nodeGrade.textContent = certificateData.grade;
                nodeVerifyCode.textContent = certificateData.verification_code;
                nodeSealDate.textContent = 'VERIFIED ' + certificateData.passing_year;
                
                currentCertImage = certificateData.certificate_image_url || '';
                
                if (currentCertImage) {
                    nodeImgBtn.style.display = 'inline-flex';
                } else {
                    nodeImgBtn.style.display = 'none';
                }

                // Render Certificate block
                certDisplay.style.display = 'block';
                certDisplay.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
                alert('No certificate record found matching this code. Please check spelling or contact management.');
            }
        } catch (err) {
            console.error('Error fetching certificate:', err);
            alert('Failed to connect to ledger database: ' + (err.message || 'Unknown network error.'));
        }

        verifyBtn.disabled = false;
        verifyBtn.innerHTML = '<i class="fas fa-certificate"></i> Verify Credentials';
    });

    // Handle Certificate Image Modal popup
    const modalOverlay = document.getElementById('cert-modal-overlay');
    const modalImg = document.getElementById('modal-cert-image');
    const modalClose = document.getElementById('modal-close-btn');

    nodeImgBtn.addEventListener('click', () => {
        if (currentCertImage) {
            modalImg.src = currentCertImage;
            modalOverlay.classList.add('open');
        }
    });

    modalClose.addEventListener('click', () => {
        modalOverlay.classList.remove('open');
    });

    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            modalOverlay.classList.remove('open');
        }
    });

    // --- 7. INTERACTIVE CUSTOM STITCHING ESTIMATOR (PRICING CALCULATOR) ---
    const apparelCards = document.querySelectorAll('.apparel-card');
    const fabricChips = document.querySelectorAll('[data-group="fabric"] .chip-option');
    const sleeveChips = document.querySelectorAll('[data-group="sleeve"] .chip-option');
    const extraOptions = document.querySelectorAll('.extra-check');
    const quantitySlider = document.getElementById('calc-quantity');
    const quantityVal = document.getElementById('quantity-val');

    // Selected state trackers
    let selectedApparel = 'kurti';
    let selectedFabric = 'cotton';
    let selectedSleeve = 'half';
    let qty = 1;

    // Unit prices map
    const BASE_PRICES = {
        kurti: 450,
        suit: 750,
        lehenga: 1800,
        blouse: 400,
        gown: 1500
    };

    const FABRIC_MULTIPLIER = {
        cotton: 1.0,
        silk: 1.5,
        georgette: 1.3,
        velvet: 1.8,
        crepe: 1.2
    };

    const SLEEVE_PRICES = {
        sleeveless: 0,
        half: 50,
        full: 100,
        designer: 180
    };

    // Card Selection handlers
    apparelCards.forEach(card => {
        card.addEventListener('click', () => {
            apparelCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedApparel = card.getAttribute('data-apparel');
            calculateTotal();
        });
    });

    fabricChips.forEach(chip => {
        chip.addEventListener('click', () => {
            fabricChips.forEach(c => c.classList.remove('selected'));
            chip.classList.add('selected');
            selectedFabric = chip.getAttribute('data-val');
            calculateTotal();
        });
    });

    sleeveChips.forEach(chip => {
        chip.addEventListener('click', () => {
            sleeveChips.forEach(c => c.classList.remove('selected'));
            chip.classList.add('selected');
            selectedSleeve = chip.getAttribute('data-val');
            calculateTotal();
        });
    });

    extraOptions.forEach(opt => {
        opt.addEventListener('change', calculateTotal);
    });

    quantitySlider.addEventListener('input', (e) => {
        qty = parseInt(e.target.value);
        quantityVal.textContent = qty;
        calculateTotal();
    });

    function calculateTotal() {
        // 1. Get base price
        const base = BASE_PRICES[selectedApparel] || 450;
        
        // 2. Apply fabric multiplier
        const mult = FABRIC_MULTIPLIER[selectedFabric] || 1.0;
        let runningTotal = base * mult;
        
        // 3. Add sleeve pricing
        const sleeveAddon = SLEEVE_PRICES[selectedSleeve] || 0;
        runningTotal += sleeveAddon;

        // 4. Add checkbox addons
        let addonsCost = 0;
        extraOptions.forEach(opt => {
            if (opt.checked) {
                addonsCost += parseInt(opt.getAttribute('data-price') || 0);
            }
        });
        runningTotal += addonsCost;

        // 5. Apply quantity
        const grandTotal = Math.round(runningTotal * qty);

        // Update Summary DOM
        document.getElementById('sum-apparel').textContent = selectedApparel.charAt(0).toUpperCase() + selectedApparel.slice(1);
        document.getElementById('sum-fabric').textContent = selectedFabric.charAt(0).toUpperCase() + selectedFabric.slice(1);
        document.getElementById('sum-sleeve').textContent = selectedSleeve.charAt(0).toUpperCase() + selectedSleeve.slice(1);
        document.getElementById('sum-qty').textContent = qty;
        document.getElementById('sum-total').textContent = `₹${grandTotal}`;
    }

    // Initialize Calculator Total
    calculateTotal();

    // Link estimate submission to admission/inquiry form
    const btnSubmitEstimate = document.getElementById('btn-submit-estimate');
    btnSubmitEstimate.addEventListener('click', () => {
        const apparelName = selectedApparel.charAt(0).toUpperCase() + selectedApparel.slice(1);
        const fabricName = selectedFabric.charAt(0).toUpperCase() + selectedFabric.slice(1);
        const sleeveName = selectedSleeve.charAt(0).toUpperCase() + selectedSleeve.slice(1);
        
        // Auto fill inquiry course dropdown with "Custom boutique order"
        const courseDropdown = document.getElementById('course-interested');
        courseDropdown.value = 'Custom Boutique Design / Stitching Order';
        
        // Scroll to inquiry section
        document.getElementById('admission-inquiry').scrollIntoView({ behavior: 'smooth' });

        // Insert prompt or alert to fill name and phone
        alert(`We've filled "Custom Boutique Design" in the form. Please fill in your name and phone number to request a stitch for this ${apparelName} (${fabricName} fabric, ${sleeveName} sleeves)!`);
    });

    // --- 8. TESTIMONIALS SLIDER NAVIGATION ---
    const testimonialsTrack = document.getElementById('testimonials-track');
    const testimonialSlides = document.querySelectorAll('.testimonial-slide');
    const dotsContainer = document.getElementById('testimonial-dots');
    
    let currentSlide = 0;
    
    // Create dots
    testimonialSlides.forEach((_, idx) => {
        const dot = document.createElement('div');
        dot.className = `dot ${idx === 0 ? 'active' : ''}`;
        dot.addEventListener('click', () => goToSlide(idx));
        dotsContainer.appendChild(dot);
    });

    const dots = document.querySelectorAll('.dot');

    function goToSlide(slideIdx) {
        currentSlide = slideIdx;
        testimonialsTrack.style.transform = `translateX(-${slideIdx * 100}%)`;
        dots.forEach((dot, idx) => {
            if (idx === slideIdx) dot.classList.add('active');
            else dot.classList.remove('active');
        });
    }

    // Auto rotate testimonials
    setInterval(() => {
        let next = (currentSlide + 1) % testimonialSlides.length;
        goToSlide(next);
    }, 6000);

    // --- 9. STUDENT PORTAL AUTHENTICATION & DASHBOARD LOGIC ---
    const btnStudentPortal = document.getElementById('btn-student-portal');
    const portalBtnText = document.getElementById('portal-btn-text');
    
    // Auth Modal Elements
    const authModalOverlay = document.getElementById('auth-modal-overlay');
    const authModalClose = document.getElementById('auth-modal-close-btn');
    const tabLoginBtn = document.getElementById('tab-login-btn');
    const tabRegisterBtn = document.getElementById('tab-register-btn');
    const studentLoginForm = document.getElementById('student-login-form');
    const studentRegisterForm = document.getElementById('student-register-form');
    const authStatusMsg = document.getElementById('auth-status-msg');
    
    // Dashboard Modal Elements
    const dashModalOverlay = document.getElementById('dashboard-modal-overlay');
    const dashModalClose = document.getElementById('dashboard-modal-close-btn');
    const dashWelcome = document.getElementById('dash-welcome');
    const dashEmailBadge = document.getElementById('dash-email-badge');
    const dashFatherName = document.getElementById('dash-father-name');
    const dashResidence = document.getElementById('dash-residence');
    const dashEmail = document.getElementById('dash-email');
    const dashPhone = document.getElementById('dash-phone');
    const dashCourseName = document.getElementById('dash-course-name');
    const btnLogout = document.getElementById('btn-logout');

    let currentUserSession = null;
    let mockUserSession = null; // Fallback testing session object

    // Check auth status on page load (if Supabase is initialized)
    if (supabaseDb) {
        checkSession();
        // Set up auth listener
        supabaseDb.auth.onAuthStateChange((event, session) => {
            console.log(`Auth event triggered: ${event}`);
            handleAuthStateChange(session);
        });
    }

    async function checkSession() {
        try {
            const { data: { session }, error } = await supabaseDb.auth.getSession();
            if (error) throw error;
            handleAuthStateChange(session);
        } catch (err) {
            console.error('Session retrieval failed:', err);
        }
    }

    async function handleAuthStateChange(session) {
        currentUserSession = session;
        if (session && session.user) {
            const user = session.user;
            const firstName = user.user_metadata?.full_name ? user.user_metadata.full_name.split(' ')[0] : 'Student';
            portalBtnText.textContent = `Hi, ${firstName}`;
            
            // Try loading database profile
            let profile = null;
            try {
                const { data, error } = await supabaseDb
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .maybeSingle();
                
                if (error) throw error;
                profile = data;
            } catch (err) {
                console.warn('Profile retrieval from public.profiles table failed. Falling back to auth metadata.', err);
            }

            // Map data
            const fullName = profile?.full_name || user.user_metadata?.full_name || 'Student';
            dashWelcome.textContent = `Welcome back, ${fullName}!`;
            dashFatherName.textContent = profile?.father_name || user.user_metadata?.father_name || '-';
            dashResidence.textContent = profile?.residence || user.user_metadata?.residence || '-';
            dashEmail.textContent = user.email || '-';
            dashPhone.textContent = profile?.phone || user.user_metadata?.phone || '-';
            dashCourseName.textContent = profile?.enrolled_course || user.user_metadata?.enrolled_course || 'Not Enrolled';
            
            // Check verification status
            if (user.email_confirmed_at) {
                dashEmailBadge.textContent = 'Email Verified';
                dashEmailBadge.style.background = 'var(--success-color)';
            } else {
                dashEmailBadge.textContent = 'Verification Pending';
                dashEmailBadge.style.background = 'var(--error-color)';
            }
        } else {
            // Logged out
            portalBtnText.textContent = 'Student Portal';
            // Clear fields
            dashWelcome.textContent = 'Student Portal';
            dashFatherName.textContent = '-';
            dashResidence.textContent = '-';
            dashEmail.textContent = '-';
            dashPhone.textContent = '-';
            dashCourseName.textContent = '-';
            
            // Close dashboard modal if open
            dashModalOverlay.classList.remove('open');
        }
    }

    // Modal navigation button
    btnStudentPortal.addEventListener('click', () => {
        if (supabaseDb) {
            if (currentUserSession) {
                dashModalOverlay.classList.add('open');
            } else {
                showAuthStatus('', '');
                authModalOverlay.classList.add('open');
            }
        } else {
            // Mock mode behavior
            if (mockUserSession) {
                dashModalOverlay.classList.add('open');
            } else {
                showAuthStatus('', '');
                authModalOverlay.classList.add('open');
            }
        }
    });

    // Close buttons
    authModalClose.addEventListener('click', () => authModalOverlay.classList.remove('open'));
    dashModalClose.addEventListener('click', () => dashModalOverlay.classList.remove('open'));
    
    // Close on clicking backdrop
    authModalOverlay.addEventListener('click', (e) => {
        if (e.target === authModalOverlay) authModalOverlay.classList.remove('open');
    });
    dashModalOverlay.addEventListener('click', (e) => {
        if (e.target === dashModalOverlay) dashModalOverlay.classList.remove('open');
    });

    // Tabs toggle logic
    tabLoginBtn.addEventListener('click', () => {
        tabLoginBtn.classList.add('active');
        tabRegisterBtn.classList.remove('active');
        studentLoginForm.style.display = 'block';
        studentRegisterForm.style.display = 'none';
        showAuthStatus('', '');
    });

    tabRegisterBtn.addEventListener('click', () => {
        tabRegisterBtn.classList.add('active');
        tabLoginBtn.classList.remove('active');
        studentLoginForm.style.display = 'none';
        studentRegisterForm.style.display = 'block';
        showAuthStatus('', '');
    });

    function showAuthStatus(msg, type) {
        authStatusMsg.textContent = msg;
        if (msg) {
            authStatusMsg.className = `form-status ${type}`;
            authStatusMsg.style.display = 'block';
        } else {
            authStatusMsg.style.display = 'none';
        }
    }

    // --- SUBMIT REGISTRATION ---
    studentRegisterForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        showAuthStatus('', '');

        const fullName = document.getElementById('reg-name').value.trim();
        const fatherName = document.getElementById('reg-father').value.trim();
        const residence = document.getElementById('reg-residence').value.trim();
        const phone = document.getElementById('reg-phone').value.trim();
        const course = document.getElementById('reg-course').value;
        const email = document.getElementById('reg-email').value.trim();
        const password = document.getElementById('reg-password').value;

        // Validation
        if (fullName.length < 2 || fatherName.length < 2 || residence.length < 3) {
            showAuthStatus('Please enter valid details for all fields.', 'error');
            return;
        }

        const phoneRegex = /^[+]?[0-9\s-]{8,20}$/;
        if (!phoneRegex.test(phone)) {
            showAuthStatus('Please enter a valid phone number.', 'error');
            return;
        }

        if (password.length < 6) {
            showAuthStatus('Password must be at least 6 characters.', 'error');
            return;
        }

        const submitBtn = studentRegisterForm.querySelector('button[type="submit"]');
        const origText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';

        try {
            if (supabaseDb) {
                // Call Supabase SignUp Auth
                const { data, error } = await supabaseDb.auth.signUp({
                    email: email,
                    password: password,
                    options: {
                        emailRedirectTo: window.location.origin + window.location.pathname,
                        data: {
                            full_name: fullName,
                            father_name: fatherName,
                            residence: residence,
                            phone: phone,
                            enrolled_course: course
                        }
                    }
                });

                if (error) throw error;

                // Check if signup returned a session (autoverification might be enabled)
                if (data.session) {
                    showAuthStatus('Registration successful and logged in!', 'success');
                    setTimeout(() => {
                        authModalOverlay.classList.remove('open');
                        studentRegisterForm.reset();
                    }, 1500);
                } else {
                    showAuthStatus('Registration successful! Please check your email inbox and verify your email verification link before logging in.', 'success');
                    studentRegisterForm.reset();
                }
            } else {
                // Mock Mode Registration Fallback
                setTimeout(() => {
                    mockUserSession = {
                        user: {
                            id: 'mock-user-uuid-123456',
                            email: email,
                            email_confirmed_at: null, // Pending verification
                            user_metadata: {
                                full_name: fullName,
                                father_name: fatherName,
                                residence: residence,
                                phone: phone,
                                enrolled_course: course
                            }
                        }
                    };
                    
                    showAuthStatus('[MOCK PREVIEW MODE] Registration successful! A mock verification email was sent to your email. Click login tab to sign in.', 'success');
                    studentRegisterForm.reset();
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = origText;
                }, 1200);
                return;
            }
        } catch (err) {
            console.error('Registration failed:', err);
            showAuthStatus('Registration failed: ' + (err.message || 'Server error.'), 'error');
        }

        submitBtn.disabled = false;
        submitBtn.innerHTML = origText;
    });

    // --- SUBMIT LOGIN ---
    studentLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        showAuthStatus('', '');

        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;

        const submitBtn = studentLoginForm.querySelector('button[type="submit"]');
        const origText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging In...';

        try {
            if (supabaseDb) {
                // Call Supabase SignIn
                const { data, error } = await supabaseDb.auth.signInWithPassword({
                    email: email,
                    password: password
                });

                if (error) throw error;

                showAuthStatus('Access granted. Logging in...', 'success');
                setTimeout(() => {
                    authModalOverlay.classList.remove('open');
                    studentLoginForm.reset();
                }, 1000);
            } else {
                // Mock Mode Login Fallback
                setTimeout(() => {
                    // Check if mock registered or load default mock details
                    const mockProfile = mockUserSession?.user?.user_metadata || {
                        full_name: 'Priya Deshmukh',
                        father_name: 'Rajesh Deshmukh',
                        residence: 'Pune, Maharashtra',
                        phone: '+91 98765 43210',
                        enrolled_course: 'Advanced Fashion Designing Course'
                    };

                    mockUserSession = {
                        user: {
                            id: 'mock-uuid-123456',
                            email: email,
                            email_confirmed_at: new Date().toISOString(), // Mock verified
                            user_metadata: mockProfile
                        }
                    };

                    portalBtnText.textContent = `Hi, ${mockProfile.full_name.split(' ')[0]}`;
                    dashWelcome.textContent = `Welcome back, ${mockProfile.full_name}!`;
                    dashFatherName.textContent = mockProfile.father_name;
                    dashResidence.textContent = mockProfile.residence;
                    dashEmail.textContent = email;
                    dashPhone.textContent = mockProfile.phone;
                    dashCourseName.textContent = mockProfile.enrolled_course;
                    dashEmailBadge.textContent = 'Email Verified';
                    dashEmailBadge.style.background = 'var(--success-color)';

                    showAuthStatus('[MOCK PREVIEW] Logged in successfully.', 'success');
                    setTimeout(() => {
                        authModalOverlay.classList.remove('open');
                        studentLoginForm.reset();
                    }, 1000);
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = origText;
                }, 1000);
                return;
            }
        } catch (err) {
            console.error('Login failed:', err);
            showAuthStatus('Login failed: ' + (err.message || 'Check email/password combination.'), 'error');
        }

        submitBtn.disabled = false;
        submitBtn.innerHTML = origText;
    });

    // --- LOGOUT ACTION ---
    btnLogout.addEventListener('click', async () => {
        try {
            if (supabaseDb) {
                const { error } = await supabaseDb.auth.signOut();
                if (error) throw error;
            } else {
                // Mock Mode Logout
                mockUserSession = null;
                portalBtnText.textContent = 'Student Portal';
                dashModalOverlay.classList.remove('open');
                alert('[MOCK PREVIEW] Logged out successfully.');
            }
        } catch (err) {
            console.error('Logout failed:', err);
            alert('Logout failed: ' + err.message);
        }
    });

    // --- 10. ENROLL COURSE BUTTONS CLICK LINKED TO AUTH MODAL ---
    const enrollButtons = document.querySelectorAll('.btn-enroll-course');
    enrollButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const courseVal = btn.getAttribute('data-course');
            
            // Open auth modal
            authModalOverlay.classList.add('open');
            
            // Switch to Register tab
            tabRegisterBtn.click();
            
            // Pre-select course in registration dropdown
            const regCourseSelect = document.getElementById('reg-course');
            if (regCourseSelect) {
                regCourseSelect.value = courseVal;
            }
        });
    });
});

