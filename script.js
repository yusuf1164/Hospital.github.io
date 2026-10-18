

// Add this to the very top to confirm the script runs
alert("script.js is running!");

const firebaseConfig = {
  apiKey: "AIzaSyAeoi7_GAJ1bJkHdnKGaLPRrnH3RirI1H4",
  authDomain: "deen-hospital.firebaseapp.com",
  projectId: "deen-hospital",
  storageBucket: "deen-hospital.firebasestorage.app",
  messagingSenderId: "96445469484",
  appId: "1:96445469484:web:2efb94ababdc39c79a1289"
};

// Try to connect to Firebase
try {
    // Check if the firebase SDK actually loaded
    if (typeof firebase === 'undefined') {
        throw new Error("Firebase SDK not loaded! Check your HTML script tags.");
    }

    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.firestore();
    
    // If you see this alert, Firebase connected successfully!
    alert("Firebase connected successfully!");

} catch (error) {
    // If you see this alert, we found the problem!
    alert("ERROR: " + error.message);
}



// ==========================================








document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Load the Header dynamically
    fetch('header.html')
        .then(response => {
            if (!response.ok) throw new Error('Failed to load header');
            return response.text();
        })
        .then(data => {
            document.getElementById('header-placeholder').innerHTML = data;
            initMobileMenu();
        })
        .catch(error => console.error('Error loading header:', error));

    // 2. Load the Footer dynamically
    fetch('footer.html')
        .then(response => {
            if (!response.ok) throw new Error('Failed to load footer');
            return response.text();
        })
        .then(data => {
            document.getElementById('footer-placeholder').innerHTML = data;
        })
        .catch(error => console.error('Error loading footer:', error));

    // 3. Initialize Form Handling
    initForms();
});

// --- Mobile Menu Logic ---
function initMobileMenu() {
    const menuToggle = document.getElementById('menu-toggle');
    const navLinks = document.getElementById('nav-links');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }
}

// --- Form Logic ---
function initForms() {
    
    // Login Form Handling
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault(); 
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            if (email && password) {
                alert(`Login Successful!\nWelcome back, ${email}`);
                // window.location.href = 'dashboard.html'; 
            } else {
                alert('Please fill in all fields.');
            }
        });
    }

    // Registration Form Handling
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault(); 
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const errorDiv = document.getElementById('passwordError');

            if (password !== confirmPassword) {
                errorDiv.style.display = 'block'; 
                return; 
            } else {
                errorDiv.style.display = 'none'; 
            }

            alert('Registration Successful! You can now log in.');
            window.location.href = 'login.html';
        });
    }
}
