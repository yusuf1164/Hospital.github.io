// ==========================================
// 1. FIREBASE CONFIGURATION
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyAeoi7_GAJ1bJkHdnKGaLPRrnH3RirI1H4",
  authDomain: "deen-hospital.firebaseapp.com",
  projectId: "deen-hospital",
  storageBucket: "deen-hospital.firebasestorage.app",
  messagingSenderId: "96445469484",
  appId: "1:96445469484:web:2efb94ababdc39c79a1289"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ==========================================
// 2. HELPER FUNCTIONS
// ==========================================
function calculateAge(dobString) {
    if (!dobString) return "";
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
}

function logActivity(user, action, details) {
    if (!user) return;
    db.collection('users').doc(user.uid).get().then(doc => {
        const data = doc.data() || {};
        db.collection('auditLogs').add({
            userId: user.uid, 
            staffName: data.firstName ? `${data.firstName} ${data.lastName}` : 'Staff Member', 
            staffId: data.staffId || 'N/A', 
            action: action, 
            details: details,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    });
}

function enforceAuth(allowedRoles) {
    auth.onAuthStateChanged((user) => {
        if (!user || !user.emailVerified) { 
            window.location.href = '../login.html'; 
            return; 
        }
        db.collection('users').doc(user.uid).get().then(doc => {
            if (!doc.exists) { window.location.href = '../login.html'; return; }
            const data = doc.data();
            let userRoles = data.roles || [];
            if (userRoles.includes('admin')) return; 
            const hasAccess = allowedRoles.some(role => userRoles.includes(role));
            if (!hasAccess) {
                showAlert("Access Denied", "You do not have permission to view this page.", "🚫");
                setTimeout(() => window.location.href = '../dashboard.html', 2000);
            }
        });
    });
}

// ==========================================
// 3. LOAD HEADER/FOOTER & FORMS
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    loadHeader();
    loadFooter();
    initForms();
    setupInactivityTimer();
});

function loadHeader() {
    const inPages = window.location.pathname.includes('/pages/');
    fetch(inPages ? '../header.html' : 'header.html', { cache: "no-store" })
        .then(res => res.text()).then(data => {
            const ph = document.getElementById('header-placeholder');
            if (ph) { ph.innerHTML = data; initMobileMenu(); updateAuthUI(); }
        });
}

function loadFooter() {
    const inPages = window.location.pathname.includes('/pages/');
    fetch(inPages ? '../footer.html' : 'footer.html', { cache: "no-store" })
        .then(res => res.text()).then(data => {
            const ph = document.getElementById('footer-placeholder');
            if (ph) ph.innerHTML = data;
        });
}

function initMobileMenu() {
    const toggle = document.getElementById('menu-toggle');
    const nav = document.getElementById('nav-links');
    if (toggle && nav) toggle.addEventListener('click', () => nav.classList.toggle('active'));
}

function updateAuthUI() {
    const authButtons = document.getElementById('auth-buttons');
    if (!authButtons) return;
    const inPages = window.location.pathname.includes('/pages/');
    const prefix = inPages ? '../' : '';

    auth.onAuthStateChanged((user) => {
        if (user && user.emailVerified) {
            authButtons.innerHTML = `<a href="${prefix}dashboard.html" class="btn btn-outline">Dashboard</a><a href="#" id="logoutLink" class="btn btn-primary">Logout</a>`;
            document.getElementById('logoutLink').addEventListener('click', (e) => {
                e.preventDefault(); auth.signOut().then(() => window.location.href = prefix + 'index.html');
            });
        } else {
            authButtons.innerHTML = `<a href="${prefix}login.html" class="btn btn-outline">Login</a><a href="${prefix}choose-register.html" class="btn btn-primary">Register</a>`;
        }
    });
}

// ==========================================
// 4. FORM LOGIC & EMAIL VERIFICATION
// ==========================================
function initForms() {
    
    // --- LIVE AGE CALCULATION ---
    document.querySelectorAll('input[type="date"]').forEach(input => {
        input.addEventListener('change', function() {
            const displayDiv = this.nextElementSibling;
            if (displayDiv && displayDiv.id.includes('ageDisplay')) {
                displayDiv.textContent = `Age: ${calculateAge(this.value)}`;
            }
        });
    });

    // --- LOGIN FORM ---
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const errorDiv = document.getElementById('loginError');
            const resendSection = document.getElementById('resendSection');
            const btn = document.getElementById('loginBtn');
            
            btn.textContent = 'Signing in...'; btn.disabled = true;
            errorDiv.style.display = 'none';

            auth.signInWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    if (!userCredential.user.emailVerified) {
                        // If not verified, block them
                        errorDiv.style.display = 'block';
                        errorDiv.textContent = "Please verify your email. Check your inbox.";
                        resendSection.style.display = 'block'; // Show resend button
                        btn.textContent = 'Sign In'; btn.disabled = false;
                        auth.signOut(); // Log them out immediately
                    } else {
                        // If verified, let them in
                        window.location.href = 'dashboard.html';
                    }
                })
                .catch(err => {
                    errorDiv.style.display = 'block';
                    errorDiv.textContent = err.message;
                    btn.textContent = 'Sign In'; btn.disabled = false;
                });
        });

        // --- RESEND VERIFICATION EMAIL ---
        document.getElementById('resendBtn')?.addEventListener('click', () => {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            if(!email || !password) { showAlert("Error", "Please enter your email and password first.", "❌"); return; }

            // Re-authenticate temporarily to send email
            auth.signInWithEmailAndPassword(email, password).then(cred => {
                cred.user.sendEmailVerification().then(() => {
                    showAlert("Success", "Verification email resent! Check your inbox.", "✔️");
                    auth.signOut();
                });
            }).catch(err => showAlert("Error", err.message, "❌"));
        });
    }

    // --- PATIENT REGISTER FORM ---
    const patientRegisterForm = document.getElementById('patientRegisterForm');
    if (patientRegisterForm) {
        patientRegisterForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('registerBtn');
            const errorDiv = document.getElementById('registerError');
            const password = document.getElementById('password').value;
            const confirm = document.getElementById('confirmPassword').value;

            if (password !== confirm) {
                document.getElementById('passwordError').style.display = 'block';
                return;
            }
            document.getElementById('passwordError').style.display = 'none';
            btn.textContent = 'Creating Account...'; btn.disabled = true;

            const firstName = document.getElementById('firstname').value;
            const lastName = document.getElementById('lastname').value;
            const email = document.getElementById('email').value;
            const phone = document.getElementById('phone').value;

            try {
                const cred = await auth.createUserWithEmailAndPassword(email, password);
                
                // 1. Send Verification Email
                await cred.user.sendEmailVerification();

                // 2. Create User Profile in Database
                await db.collection('users').doc(cred.user.uid).set({
                    firstName, lastName, email, phone, roles: ['patient'], linkedPatientIds: [],
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                // 3. Sign them out and redirect to login with a success message
                await auth.signOut();
                showAlert("Success", "Account created! Please check your email inbox to verify your account before logging in.", "✔️");
                window.location.href = 'login.html?verified=pending';

            } catch (err) {
                errorDiv.style.display = 'block';
                errorDiv.textContent = err.message;
                btn.textContent = 'Create Account'; btn.disabled = false;
            }
        });
    }

    // --- STAFF REGISTER FORM ---
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const inviteCode = document.getElementById('inviteCode').value.trim();
            const btn = document.getElementById('registerBtn');
            const errorDiv = document.getElementById('registerError');
            const password = document.getElementById('password').value;
            const confirm = document.getElementById('confirmPassword').value;

            if (password !== confirm) {
                document.getElementById('passwordError').style.display = 'block';
                return;
            }
            document.getElementById('passwordError').style.display = 'none';
            errorDiv.style.display = 'none';
            btn.textContent = 'Verifying...'; btn.disabled = true;

            try {
                // 1. Check Invite Code
                const configDoc = await db.collection('settings').doc('config').get();
                if (!configDoc.exists || inviteCode !== configDoc.data().inviteCode) {
                    throw new Error("Invalid Invite Code. Please contact HR.");
                }

                btn.textContent = 'Creating Account...';
                const email = document.getElementById('email').value;
                
                // 2. Create Account
                const cred = await auth.createUserWithEmailAndPassword(email, password);
                
                // 3. Send Verification Email
                await cred.user.sendEmailVerification();

                // 4. Generate Staff ID & Save
                const counterRef = db.collection('settings').doc('counters');
                const newStaffId = await db.runTransaction(async (transaction) => {
                    const doc = await transaction.get(counterRef);
                    let nextId = 1002; 
                    if (doc.exists && doc.data().lastStaffId) nextId = doc.data().lastStaffId + 1;
                    transaction.set(counterRef, { lastStaffId: nextId }, { merge: true });
                    return String(nextId); 
                });

                await db.collection('users').doc(cred.user.uid).set({
                    firstName: document.getElementById('firstname').value,
                    lastName: document.getElementById('lastname').value,
                    gender: document.getElementById('gender').value,
                    religion: document.getElementById('religion').value,
                    dob: document.getElementById('dob').value,
                    age: calculateAge(document.getElementById('dob').value),
                    email: email,
                    phone: document.getElementById('phone').value,
                    staffId: newStaffId, 
                    roles: [],
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                await auth.signOut();
                showAlert("Success", "Account created! Please check your email inbox to verify your account before logging in.", "✔️");
                window.location.href = 'login.html?verified=pending';

            } catch (err) {
                errorDiv.style.display = 'block';
                errorDiv.textContent = err.message;
                btn.textContent = 'Create Account'; btn.disabled = false;
            }
        });
    }
}

// Check URL for verification success message
if (window.location.search.includes('verified=pending')) {
    document.getElementById('verifySuccessMsg').style.display = 'block';
}

// ==========================================
// 5. AUTO-LOGOUT (INACTIVITY)
// ==========================================
let inactivityTimer;
function setupInactivityTimer() {
    const reset = () => {
        clearTimeout(inactivityTimer);
        if (auth.currentUser && auth.currentUser.emailVerified) {
            inactivityTimer = setTimeout(() => {
                auth.signOut().then(() => {
                    showAlert("Session Expired", "Logged out due to inactivity.", "⏰");
                    setTimeout(() => window.location.href = 'login.html', 2000);
                });
            }, 15 * 60 * 1000); // 15 minutes
        }
    };
    ['mousemove', 'keydown', 'click', 'scroll'].forEach(ev => document.addEventListener(ev, reset));
    auth.onAuthStateChanged(user => { if(user) reset(); else clearTimeout(inactivityTimer); });
}
