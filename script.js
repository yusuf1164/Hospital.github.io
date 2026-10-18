// 1. FIREBASE CONFIGURATION
const firebaseConfig = {
  apiKey: "AIzaSyAeoi7_GAJ1bJkHdnKGaLPRrnH3RirI1H4",
  authDomain: "deen-hospital.firebaseapp.com",
  projectId: "deen-hospital",
  storageBucket: "deen-hospital.firebasestorage.app",
  messagingSenderId: "96445469484",
  appId: "1:96445469484:web:2efb94ababdc39c79a1289"
};

// 2. INITIALIZE FIREBASE (Global variables)
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// 3. PAGE INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
    loadHeader();
    loadFooter();
    initForms();
});

// 4. LOAD HEADER & FOOTER
function loadHeader() {
    const inPagesFolder = window.location.pathname.includes('/pages/');
    const headerPath = inPagesFolder ? '../header.html' : 'header.html';
    
    fetch(headerPath, { cache: "no-store" }) // Forces fresh load
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
                updateAuthUI(); // THIS WILL NOW WORK PERFECTLY
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

// 5. MOBILE MENU
function initMobileMenu() {
    const menuToggle = document.getElementById('menu-toggle');
    const navLinks = document.getElementById('nav-links');
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => navLinks.classList.toggle('active'));
    }
}

// 6. UPDATE AUTH UI (Injects Login/Register Buttons)
function updateAuthUI() {
    const authButtons = document.getElementById('auth-buttons');
    if (!authButtons) return;
    
    const inPagesFolder = window.location.pathname.includes('/pages/');
    const prefix = inPagesFolder ? '../' : '';

    auth.onAuthStateChanged((user) => {
        if (user) {
            // Logged in
            authButtons.innerHTML = `
                <a href="${prefix}dashboard.html" class="btn btn-outline">Dashboard</a>
                <a href="#" id="logoutLink" class="btn btn-primary">Logout</a>
            `;
            const logoutLink = document.getElementById('logoutLink');
            if (logoutLink) {
                logoutLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    auth.signOut().then(() => window.location.href = prefix + 'index.html');
                });
            }
        } else {
            // Logged out
            authButtons.innerHTML = `
                <a href="${prefix}login.html" class="btn btn-outline">Login</a>
                <a href="${prefix}register.html" class="btn btn-primary">Register</a>
            `;
        }
    });
}

// 7. FORMS (Login & Register)
function initForms() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const errorDiv = document.getElementById('loginError');
            const btn = document.getElementById('loginBtn');
            btn.textContent = 'Signing in...'; btn.disabled = true;

            auth.signInWithEmailAndPassword(email, password)
                .then(() => window.location.href = 'dashboard.html')
                .catch(err => {
                    errorDiv.style.display = 'block';
                    errorDiv.textContent = err.message;
                    btn.textContent = 'Sign In'; btn.disabled = false;
                });
        });
    }

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
            btn.textContent = 'Creating Account...'; btn.disabled = true;

            auth.createUserWithEmailAndPassword(email, password)
                .then((cred) => {
                    return db.collection('users').doc(cred.user.uid).set({
                        firstName, lastName, email, phone,
                        role: 'patient', 
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                })
                .then(() => {
                    alert('Registration Successful!');
                    window.location.href = 'dashboard.html';
                })
                .catch(err => {
                    registerError.style.display = 'block';
                    registerError.textContent = err.message;
                    btn.textContent = 'Create Account'; btn.disabled = false;
                });
        });
    }
}
