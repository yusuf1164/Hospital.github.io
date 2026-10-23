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
// 2. INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    loadHeader();
    loadFooter();
    initForms();
});

// ==========================================
// 3. DYNAMIC HEADER & FOOTER
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
                    ph.querySelectorAll('a[href^="login"], a[href^="register"], a[href^="dashboard"], a[href^="patient-register"]').forEach(a => a.href = '../' + a.getAttribute('href'));
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
// 5. AUTHENTICATION UI & LOGOUT
// ==========================================
function updateAuthUI() {
    const authButtons = document.getElementById('auth-buttons');
    const dynamicLinks = document.getElementById('dynamic-dept-links');
    if (!authButtons) return;
    
    const inPagesFolder = window.location.pathname.includes('/pages/');
    const prefix = inPagesFolder ? '../' : '';
    const rootUrl = window.location.origin + window.location.pathname.split('/pages/')[0];

    auth.onAuthStateChanged((user) => {
        if (user) {
            authButtons.innerHTML = `
                <a href="${prefix}dashboard.html" class="btn btn-outline">Dashboard</a>
                <a href="#" id="logoutLink" class="btn btn-primary">Logout</a>
            `;
            
            db.collection('users').doc(user.uid).get().then(doc => {
                const data = doc.data() || {};
                let userRoles = data.roles || (data.role ? [data.role] : ['patient']);
                
                let linksHTML = `<a href="${prefix}pages/emergency.html" class="nav-link">Emergency</a>`;

                if (userRoles.includes('admin') || userRoles.includes('doctor')) {
                    linksHTML += `<a href="${prefix}pages/opd.html" class="nav-link">OPD</a>`;
                }
                if (userRoles.includes('admin') || userRoles.includes('lab')) {
                    linksHTML += `<a href="${prefix}pages/laboratory.html" class="nav-link">Lab</a>`;
                }
                if (userRoles.includes('admin') || userRoles.includes('pharmacy')) {
                    linksHTML += `<a href="${prefix}pages/pharmacy.html" class="nav-link">Pharmacy</a>`;
                }
                
                if(dynamicLinks) dynamicLinks.innerHTML = linksHTML;
            });

            const logoutLink = document.getElementById('logoutLink');
            if (logoutLink) {
                logoutLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    auth.signOut().then(() => {
                        window.location.href = rootUrl + '/index.html';
                    }).catch(() => {
                        window.location.href = rootUrl + '/index.html';
                    });
                });
            }
        } else {
            authButtons.innerHTML = `
                <a href="${prefix}login.html" class="btn btn-outline">Login</a>
                <a href="${prefix}register.html" class="btn btn-outline">Staff Register</a>
                <a href="${prefix}patient-register.html" class="btn btn-primary">Patient Register</a>
            `;
            if(dynamicLinks) dynamicLinks.innerHTML = `<a href="${prefix}pages/emergency.html" class="nav-link">Emergency</a>`;
        }
    });
}

// ==========================================
// 6. HELPER: CALCULATE AGE FROM DOB
// ==========================================
function calculateAge(dobString) {
    if (!dobString) return "";
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

// ==========================================
// 7. FORMS (LOGIN & STAFF REGISTER)
// ==========================================
function initForms() {
    
    // --- LIVE AGE CALCULATION FOR ALL DOB INPUTS ---
    const dobInputs = document.querySelectorAll('input[type="date"]');
    dobInputs.forEach(input => {
        input.addEventListener('change', function() {
            const age = calculateAge(this.value);
            const displayDiv = this.nextElementSibling;
            if (displayDiv && displayDiv.id.includes('ageDisplay')) {
                displayDiv.textContent = age !== "" ? `Calculated Age: ${age} years old` : "";
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

    // --- STAFF REGISTER FORM ---
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const firstName = document.getElementById('firstname').value;
            const lastName = document.getElementById('lastname').value;
            const gender = document.getElementById('gender').value;
            const religion = document.getElementById('religion').value;
            const dob = document.getElementById('dob').value;
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
            
            const calculatedAge = calculateAge(dob);

            btn.textContent = 'Creating Account...'; btn.disabled = true;

            auth.createUserWithEmailAndPassword(email, password)
                .then((cred) => {
                    const counterRef = db.collection('settings').doc('counters');
                    
                    return db.runTransaction((transaction) => {
                        return transaction.get(counterRef).then((doc) => {
                            let nextId = 1002; 
                            if (doc.exists && doc.data().lastStaffId) {
                                nextId = doc.data().lastStaffId + 1;
                            }
                            transaction.set(counterRef, { lastStaffId: nextId }, { merge: true });
                            return String(nextId); 
                        });
                    }).then((generatedStaffId) => {
                        return db.collection('users').doc(cred.user.uid).set({
                            firstName: firstName,
                            lastName: lastName,
                            gender: gender,
                            religion: religion,
                            dob: dob,
                            age: calculatedAge,
                            email: email,
                            phone: phone,
                            staffId: generatedStaffId, 
                            roles: [],
                            createdAt: firebase.firestore.FieldValue.serverTimestamp()
                        });
                    });
                })
                .then(() => {
                    showAlert("Success", "Registration Successful! Your Staff ID has been generated.", "✅");
                    setTimeout(() => window.location.href = 'dashboard.html', 1500);
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
// 8. GLOBAL ACTIVITY LOGGER
// ==========================================
function logActivity(user, action, details) {
    if (!user) return;
    db.collection('users').doc(user.uid).get().then(doc => {
        const data = doc.data() || {};
        const staffName = data.firstName ? `${data.firstName} ${data.lastName}` : 'Staff Member';
        const staffId = data.staffId || 'N/A';
        db.collection('auditLogs').add({
            userId: user.uid, staffName: staffName, staffId: staffId, action: action, details: details,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }).catch(err => console.error("Error logging activity:", err));
    }).catch(err => {
        db.collection('auditLogs').add({
            userId: user.uid, staffName: 'Staff Member', staffId: 'N/A', action: action, details: details,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    });
}

// ==========================================
// 9. FRONT DOOR ROUTE GUARD (Security)
// ==========================================
function enforceAuth(allowedRoles) {
    auth.onAuthStateChanged((user) => {
        if (!user) {
            window.location.href = '../login.html';
            return;
        }
        db.collection('users').doc(user.uid).get().then(doc => {
            if (!doc.exists) { window.location.href = '../login.html'; return; }
            const data = doc.data();
            let userRoles = data.roles || (data.role ? [data.role] : ['patient']);
            
            if (userRoles.includes('admin')) return; 
            
            const hasAccess = allowedRoles.some(role => userRoles.includes(role));
            if (!hasAccess) {
                showAlert("Access Denied", "You do not have permission to view this page.", "🚫");
                setTimeout(() => window.location.href = '../dashboard.html', 2000);
            }
        }).catch(() => window.location.href = '../login.html');
    });
}

// ==========================================
// 10. GLOBAL CUSTOM MODAL ENGINE
// ==========================================
// Inject modal HTML into the page on load
document.addEventListener('DOMContentLoaded', () => {
    const modalHTML = `
        <div id="globalModalOverlay" class="custom-modal-overlay">
            <div class="custom-modal-box">
                <div id="globalModalIcon" class="custom-modal-icon">ℹ️</div>
                <div id="globalModalTitle" class="custom-modal-title">Message</div>
                <div id="globalModalMessage" class="custom-modal-message">Details...</div>
                
                <!-- Text input for prompts (hidden by default) -->
                <input type="text" id="globalModalInput" style="display: none; width: 100%; padding: 12px; border: 1px solid #ccc; border-radius: 5px; margin-bottom: 20px; font-size: 14px;">
                
                <div class="custom-modal-buttons" id="globalModalButtons"></div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
});

window.closeGlobalModal = function() {
    document.getElementById('globalModalOverlay').classList.remove('active');
};

// Function to show a custom alert
window.showAlert = function(title, message, icon = 'ℹ️') {
    const overlay = document.getElementById('globalModalOverlay');
    const input = document.getElementById('globalModalInput');
    input.style.display = 'none'; 
    
    document.getElementById('globalModalIcon').textContent = icon;
    document.getElementById('globalModalTitle').textContent = title;
    document.getElementById('globalModalMessage').innerHTML = message;
    
    const btnContainer = document.getElementById('globalModalButtons');
    btnContainer.innerHTML = `<button class="btn btn-primary" style="flex:1;" onclick="closeGlobalModal()">OK</button>`;
    
    overlay.classList.add('active');
};

// Function to show a custom confirmation (Yes/No)
window.showConfirm = function(title, message, onConfirm) {
    const overlay = document.getElementById('globalModalOverlay');
    const input = document.getElementById('globalModalInput');
    input.style.display = 'none'; 
    
    document.getElementById('globalModalIcon').textContent = '⚠️';
    document.getElementById('globalModalTitle').textContent = title;
    document.getElementById('globalModalMessage').innerHTML = message;
    
    const btnContainer = document.getElementById('globalModalButtons');
    btnContainer.innerHTML = `
        <button class="btn btn-outline" style="flex:1; border-color: #ccc; color: #333;" onclick="closeGlobalModal()">Cancel</button>
        <button class="btn btn-primary" style="flex:1;" id="globalModalConfirmBtn">Confirm</button>
    `;
    
    document.getElementById('globalModalConfirmBtn').onclick = () => {
        closeGlobalModal();
        onConfirm();
    };
    
    overlay.classList.add('active');
};

// Function to show a custom prompt (Text Input)
window.showPrompt = function(title, message, defaultValue, onConfirm) {
    const overlay = document.getElementById('globalModalOverlay');
    const input = document.getElementById('globalModalInput');
    input.style.display = 'block'; 
    input.value = defaultValue || ''; 
    
    document.getElementById('globalModalIcon').textContent = '✏️';
    document.getElementById('globalModalTitle').textContent = title;
    document.getElementById('globalModalMessage').innerHTML = message;
    
    const btnContainer = document.getElementById('globalModalButtons');
    btnContainer.innerHTML = `
        <button class="btn btn-outline" style="flex:1; border-color: #ccc; color: #333;" onclick="closeGlobalModal()">Cancel</button>
        <button class="btn btn-primary" style="flex:1;" id="globalModalConfirmBtn">Submit</button>
    `;
    
    document.getElementById('globalModalConfirmBtn').onclick = () => {
        const val = input.value;
        closeGlobalModal();
        onConfirm(val);
    };
    
    overlay.classList.add('active');
    setTimeout(() => input.focus(), 300);
};
