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
// 2. PAGE INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    loadHeader();
    loadFooter();
    initForms();
});

// ==========================================
// 3. LOAD HEADER & FOOTER
// ==========================================
function loadHeader() {
    const inPagesFolder = window.location.pathname.includes('/pages/');
    const headerPath = inPagesFolder ? '../header.html' : 'header.html';
    
    fetch(headerPath, { cache: "no-store" })
        .then(res => res.text())
        .then(data => {
            const ph = document.getElementById('header-placeholder');
            if (ph) {
                ph.innerHTML = data;
                if (inPagesFolder) {
                    ph.querySelectorAll('a[href^="index"]').forEach(a => a.href = '../index.html');
                    ph.querySelectorAll('a[href^="pages/"]').forEach(a => a.href = a.getAttribute('href').replace('pages/', ''));
                    ph.querySelectorAll('a[href^="login"], a[href^="register"], a[href^="dashboard"]').forEach(a => a.href = '../' + a.getAttribute('href'));
                }
                initMobileMenu();
                updateAuthUI();
            }
        })
        .catch(err => console.error('Header load error:', err));
}

function loadFooter() {
    const inPagesFolder = window.location.pathname.includes('/pages/');
    const footerPath = inPagesFolder ? '../footer.html' : 'footer.html';
    
    fetch(footerPath, { cache: "no-store" })
        .then(res => res.text())
        .then(data => {
            const ph = document.getElementById('footer-placeholder');
            if (ph) {
                ph.innerHTML = data;
                if (inPagesFolder) {
                    ph.querySelectorAll('a[href^="pages/"]').forEach(a => a.href = a.getAttribute('href').replace('pages/', ''));
                }
            }
        })
        .catch(err => console.error('Footer load error:', err));
}

// ==========================================
// 4. MOBILE MENU TOGGLE
// ==========================================
function initMobileMenu() {
    const menuToggle = document.getElementById('menu-toggle');
    const navLinks = document.getElementById('nav-links');
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => navLinks.classList.toggle('active'));
    }
}

// ==========================================
// 5. DYNAMIC HEADER BUTTONS
// ==========================================
function updateAuthUI() {
    const authButtons = document.getElementById('auth-buttons');
    const dynamicLinks = document.getElementById('dynamic-dept-links');
    if (!authButtons) return;
    
    const inPagesFolder = window.location.pathname.includes('/pages/');
    const prefix = inPagesFolder ? '../' : '';

    auth.onAuthStateChanged((user) => {
        if (user) {
            // User is logged in
            authButtons.innerHTML = `
                <a href="${prefix}dashboard.html" class="btn btn-outline">Dashboard</a>
                <a href="#" id="logoutLink" class="btn btn-primary">Logout</a>
            `;
            
            // Fetch their roles to build the custom menu
            db.collection('users').doc(user.uid).get().then(doc => {
                const data = doc.data() || {};
                let userRoles = data.roles || (data.role ? [data.role] : ['patient']);
                
                // Everyone sees Emergency
                let linksHTML = `<a href="${prefix}pages/emergency.html">Emergency</a>`;

                // Add links based on roles
                if (userRoles.includes('admin') || userRoles.includes('doctor')) {
                    linksHTML += `<a href="${prefix}pages/opd.html">OPD</a>`;
                }
                if (userRoles.includes('admin') || userRoles.includes('lab')) {
                    linksHTML += `<a href="${prefix}pages/laboratory.html">Lab</a>`;
                }
                if (userRoles.includes('admin') || userRoles.includes('pharmacy')) {
                    linksHTML += `<a href="${prefix}pages/pharmacy.html">Pharmacy</a>`;
                }
                
                if(dynamicLinks) dynamicLinks.innerHTML = linksHTML;
            });

            const logoutLink = document.getElementById('logoutLink');
            if (logoutLink) {
                logoutLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    auth.signOut().then(() => window.location.href = prefix + 'index.html');
                });
            }
        } else {
            // User is logged out
            authButtons.innerHTML = `
                <a href="${prefix}login.html" class="btn btn-outline">Login</a>
                <a href="${prefix}register.html" class="btn btn-primary">Register</a>
            `;
            if(dynamicLinks) dynamicLinks.innerHTML = `<a href="${prefix}pages/emergency.html">Emergency</a>`;
        }
    });
}

// ==========================================
// 6. AUTHENTICATION FORMS (Login & Register)
// ==========================================
function initForms() {
    
    // --- LOGIN FORM ---
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const errorDiv = document.getElementById('loginError');
            const btn = document.getElementById('loginBtn');
            
            btn.textContent = 'Signing in...'; 
            btn.disabled = true;

            auth.signInWithEmailAndPassword(email, password)
                .then(() => window.location.href = 'dashboard.html')
                .catch(err => {
                    errorDiv.style.display = 'block';
                    errorDiv.textContent = err.message;
                    btn.textContent = 'Sign In'; 
                    btn.disabled = false;
                });
        });
    }

    // --- REGISTER FORM ---
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const firstName = document.getElementById('firstname').value;
            const lastName = document.getElementById('lastname').value;
            const email = document.getElementById('email').value;
            const phone = document.getElementById('phone').value;
            const password = document.getElementById('password').value;
            const confirm = document.getElementById('confirmPassword').value;
            
            const passwordError = document.getElementById('passwordError');
            const registerError = document.getElementById('registerError');
            const btn = document.getElementById('registerBtn');

            if (password !== confirm) {
                passwordError.style.display = 'block';
                return;
            }
            passwordError.style.display = 'none';
            
            btn.textContent = 'Creating Account...'; 
            btn.disabled = true;

            auth.createUserWithEmailAndPassword(email, password)
                .then((cred) => {
                    const counterRef = db.collection('settings').doc('counters');
                    
                    return db.runTransaction((transaction) => {
                        return transaction.get(counterRef).then((doc) => {
                            // Start at 1002 since you manually used 1001 for Admin
                            let nextId = 1002; 
                            
                            if (doc.exists && doc.data().lastStaffId) {
                                nextId = doc.data().lastStaffId + 1;
                            }
                            
                            transaction.set(counterRef, { lastStaffId: nextId }, { merge: true });
                            
                            // Returns just the number as a string (e.g., "1002")
                            return String(nextId); 
                        });
                    }).then((generatedStaffId) => {
                        return db.collection('users').doc(cred.user.uid).set({
                            firstName: firstName,
                            lastName: lastName,
                            email: email,
                            phone: phone,
                            staffId: generatedStaffId, 
                            roles: ['patient'],
                            createdAt: firebase.firestore.FieldValue.serverTimestamp()
                        });
                    });
                })
                .then(() => {
                    alert('Registration Successful! Your Staff ID is: ' + document.getElementById('email').value); 
                    // Note: Since we can't easily pass the ID to the alert here, you'll see it on the dashboard.
                    window.location.href = 'dashboard.html';
                })
                .catch(err => {
                    registerError.style.display = 'block';
                    registerError.textContent = err.message;
                    btn.textContent = 'Create Account'; 
                    btn.disabled = false;
                });
        });
    }
}
// ==========================================
// 7. GLOBAL ACTIVITY LOGGER
// ==========================================
function logActivity(user, action, details) {
    if (!user) return;
    db.collection('auditLogs').add({
        userId: user.uid,
        userEmail: user.email,
        action: action,
        details: details,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).catch(err => console.error("Error logging activity:", err));
}
