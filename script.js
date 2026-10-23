// Firebase Configuration Object
const firebaseConfig = {
  apiKey: "AIzaSyAeoi7_GAJ1bJkHdnKGaLPRrnH3RirI1H4", // API Key
  authDomain: "deen-hospital.firebaseapp.com", // Auth Domain
  projectId: "deen-hospital", // Project ID
  storageBucket: "deen-hospital.firebasestorage.app", // Storage Bucket
  messagingSenderId: "96445469484", // Sender ID
  appId: "1:96445469484:web:2efb94ababdc39c79a1289" // App ID
};

// Initialize Firebase Engine
firebase.initializeApp(firebaseConfig); // Starts Firebase
const auth = firebase.auth(); // Gets Auth instance
const db = firebase.firestore(); // Gets Database instance

// Runs when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    loadHeader(); // Loads the header dynamically
    loadFooter(); // Loads the footer dynamically
    initForms(); // Initializes all form logic
});

// Function to load header
function loadHeader() {
    const inPagesFolder = window.location.pathname.includes('/pages/'); // Checks if we are inside the pages folder
    const headerPath = inPagesFolder ? '../header.html' : 'header.html'; // Sets the correct path
    
    fetch(headerPath, { cache: "no-store" }) // Fetches the header HTML without caching
        .then(res => res.text()) // Converts response to text
        .then(data => { // When data arrives
            const ph = document.getElementById('header-placeholder'); // Finds the header placeholder
            if (ph) { // If placeholder exists
                ph.innerHTML = data; // Injects the header HTML
                if (inPagesFolder) { // If inside pages folder, fix paths
                    ph.querySelectorAll('a[href^="index"]').forEach(a => a.href = '../index.html'); // Fixes index links
                    ph.querySelectorAll('a[href^="pages/"]').forEach(a => a.href = a.getAttribute('href').replace('pages/', '')); // Fixes page links
                    ph.querySelectorAll('a[href^="login"], a[href^="register"], a[href^="dashboard"], a[href^="patient-register"]').forEach(a => a.href = '../' + a.getAttribute('href')); // Fixes auth links
                }
                initMobileMenu(); // Sets up mobile menu toggle
                updateAuthUI(); // Updates login/logout buttons
            }
        })
        .catch(err => console.error('Header load error:', err)); // Catches errors
}

// Function to load footer
function loadFooter() {
    const inPagesFolder = window.location.pathname.includes('/pages/'); // Checks folder
    const footerPath = inPagesFolder ? '../footer.html' : 'footer.html'; // Sets path
    
    fetch(footerPath, { cache: "no-store" }) // Fetches footer
        .then(res => res.text()) // Converts to text
        .then(data => { // When data arrives
            const ph = document.getElementById('footer-placeholder'); // Finds placeholder
            if (ph) { // If exists
                ph.innerHTML = data; // Injects HTML
                if (inPagesFolder) { // Fixes links if inside pages folder
                    ph.querySelectorAll('a[href^="pages/"]').forEach(a => a.href = a.getAttribute('href').replace('pages/', '')); // Fixes page links
                }
            }
        })
        .catch(err => console.error('Footer load error:', err)); // Catches errors
}

// Function for mobile menu
function initMobileMenu() {
    const menuToggle = document.getElementById('menu-toggle'); // Gets the hamburger button
    const navLinks = document.getElementById('nav-links'); // Gets the nav menu
    if (menuToggle && navLinks) { // If both exist
        menuToggle.addEventListener('click', () => navLinks.classList.toggle('active')); // Toggles visibility on click
    }
}

// Function to update header buttons based on login state
function updateAuthUI() {
    const authButtons = document.getElementById('auth-buttons'); // Gets button container
    const dynamicLinks = document.getElementById('dynamic-dept-links'); // Gets dynamic links container
    if (!authButtons) return; // If container missing, stop
    
    const inPagesFolder = window.location.pathname.includes('/pages/'); // Checks folder
    const prefix = inPagesFolder ? '../' : ''; // Sets prefix for paths
    const rootUrl = window.location.origin + window.location.pathname.split('/pages/')[0]; // Calculates absolute root URL

    auth.onAuthStateChanged((user) => { // Listens for login state changes
        if (user) { // If user is logged in
            authButtons.innerHTML = ` <!-- Injects Dashboard and Logout buttons -->
                <a href="${prefix}dashboard.html" class="btn btn-outline">Dashboard</a> <!-- Dashboard link -->
                <a href="#" id="logoutLink" class="btn btn-primary">Logout</a> <!-- Logout link -->
            `;
            
            db.collection('users').doc(user.uid).get().then(doc => { // Fetches user profile
                const data = doc.data() || {}; // Gets data
                let userRoles = data.roles || (data.role ? [data.role] : ['patient']); // Gets roles
                
                let linksHTML = `<a href="${prefix}pages/emergency.html" class="nav-link">Emergency</a>`; // Everyone gets emergency

                if (userRoles.includes('admin') || userRoles.includes('doctor')) { // If admin or doctor
                    linksHTML += `<a href="${prefix}pages/opd.html" class="nav-link">OPD</a>`; // Adds OPD link
                }
                if (userRoles.includes('admin') || userRoles.includes('lab')) { // If admin or lab
                    linksHTML += `<a href="${prefix}pages/laboratory.html" class="nav-link">Lab</a>`; // Adds Lab link
                }
                if (userRoles.includes('admin') || userRoles.includes('pharmacy')) { // If admin or pharmacy
                    linksHTML += `<a href="${prefix}pages/pharmacy.html" class="nav-link">Pharmacy</a>`; // Adds Pharmacy link
                }
                
                if(dynamicLinks) dynamicLinks.innerHTML = linksHTML; // Injects dynamic links
            });

            const logoutLink = document.getElementById('logoutLink'); // Gets logout button
            if (logoutLink) { // If exists
                logoutLink.addEventListener('click', (e) => { // On click
                    e.preventDefault(); // Prevent default link behavior
                    auth.signOut().then(() => { // Sign out
                        window.location.href = rootUrl + '/index.html'; // Redirect to home
                    }).catch(() => { // If sign out fails
                        window.location.href = rootUrl + '/index.html'; // Still redirect to home
                    });
                });
            }
        } else { // If user is logged out
            authButtons.innerHTML = ` <!-- Injects Login/Register buttons -->
                <a href="${prefix}login.html" class="btn btn-outline">Login</a> <!-- Login link -->
                <a href="${prefix}register.html" class="btn btn-outline">Staff Register</a> <!-- Staff Register link -->
                <a href="${prefix}patient-register.html" class="btn btn-primary">Patient Register</a> <!-- Patient Register link -->
            `;
            if(dynamicLinks) dynamicLinks.innerHTML = `<a href="${prefix}pages/emergency.html" class="nav-link">Emergency</a>`; // Adds emergency link
        }
    });
}

// --- HELPER FUNCTION TO CALCULATE AGE ---
function calculateAge(dobString) { // Takes date string as input
    if (!dobString) return ""; // If empty, return empty string
    const birthDate = new Date(dobString); // Creates date object from input
    const today = new Date(); // Gets today's date
    let age = today.getFullYear() - birthDate.getFullYear(); // Calculates year difference
    const m = today.getMonth() - birthDate.getMonth(); // Calculates month difference
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) { // Adjusts if birthday hasn't passed yet
        age--; // Subtract one year
    }
    return age; // Returns final age
}

// Function to handle forms
function initForms() {
    
    // --- LIVE AGE CALCULATION FOR ALL DOB INPUTS ---
    const dobInputs = document.querySelectorAll('input[type="date"]'); // Finds all date inputs
    dobInputs.forEach(input => { // Loops through them
        input.addEventListener('change', function() { // When date changes
            const age = calculateAge(this.value); // Calculates age
            const displayDiv = this.nextElementSibling; // Gets the div right below it
            if (displayDiv && displayDiv.id.includes('ageDisplay')) { // Checks if it's the age display div
                displayDiv.textContent = age !== "" ? `Calculated Age: ${age} years old` : ""; // Shows the age
            }
        });
    });

    // --- LOGIN FORM ---
    const loginForm = document.getElementById('loginForm'); // Gets login form
    if (loginForm) { // If exists
        loginForm.addEventListener('submit', (e) => { // On submit
            e.preventDefault(); // Prevents reload
            const email = document.getElementById('email').value; // Gets email
            const password = document.getElementById('password').value; // Gets password
            const errorDiv = document.getElementById('loginError'); // Gets error div
            const btn = document.getElementById('loginBtn'); // Gets submit button
            
            btn.textContent = 'Signing in...'; btn.disabled = true; // Disables button

            auth.signInWithEmailAndPassword(email, password) // Signs in
                .then(() => window.location.href = 'dashboard.html') // Redirects to dashboard
                .catch(err => { // If error
                    errorDiv.style.display = 'block'; // Shows error
                    errorDiv.textContent = err.message; // Displays message
                    btn.textContent = 'Sign In'; btn.disabled = false; // Re-enables button
                });
        });
    }

    // --- STAFF REGISTER FORM ---
    const registerForm = document.getElementById('registerForm'); // Gets register form
    if (registerForm) { // If exists
        registerForm.addEventListener('submit', (e) => { // On submit
            e.preventDefault(); // Prevents reload
            
            const firstName = document.getElementById('firstname').value; // Gets first name
            const lastName = document.getElementById('lastname').value; // Gets last name
            const gender = document.getElementById('gender').value; // Gets gender
            const dob = document.getElementById('dob').value; // Gets DOB
            const email = document.getElementById('email').value; // Gets email
            const phone = document.getElementById('phone').value; // Gets phone
            const password = document.getElementById('password').value; // Gets password
            const confirm = document.getElementById('confirmPassword').value; // Gets confirm password
            
            const passwordError = document.getElementById('passwordError'); // Gets password error div
            const registerError = document.getElementById('registerError'); // Gets general error div
            const btn = document.getElementById('registerBtn'); // Gets button

            if (password !== confirm) { // If passwords don't match
                passwordError.style.display = 'block'; // Show error
                return; // Stop execution
            }
            passwordError.style.display = 'none'; // Hide error if they match
            
            const calculatedAge = calculateAge(dob); // Calculates age for saving

            btn.textContent = 'Creating Account...'; btn.disabled = true; // Disables button

            auth.createUserWithEmailAndPassword(email, password) // Creates auth account
                .then((cred) => { // On success
                    const counterRef = db.collection('settings').doc('counters'); // Gets counter ref
                    
                    return db.runTransaction((transaction) => { // Starts transaction
                        return transaction.get(counterRef).then((doc) => { // Gets current count
                            let nextId = 1002; // Default start
                            if (doc.exists && doc.data().lastStaffId) { // If count exists
                                nextId = doc.data().lastStaffId + 1; // Increment
                            }
                            transaction.set(counterRef, { lastStaffId: nextId }, { merge: true }); // Save new count
                            return String(nextId); // Return ID as string
                        });
                    }).then((generatedStaffId) => { // On transaction success
                        return db.collection('users').doc(cred.user.uid).set({ // Save user profile
                            firstName: firstName, // Save first name
                            lastName: lastName, // Save last name
                            gender: gender, // Save gender
                            dob: dob, // Save DOB
                            age: calculatedAge, // Save calculated age
                            email: email, // Save email
                            phone: phone, // Save phone
                            staffId: generatedStaffId, // Save generated ID
                            roles: [], // Empty roles array
                            createdAt: firebase.firestore.FieldValue.serverTimestamp() // Save timestamp
                        });
                    });
                })
                .then(() => { // On everything success
                    alert('Registration Successful! Your Staff ID has been generated.'); // Show success
                    window.location.href = 'dashboard.html'; // Redirect
                })
                .catch(err => { // On error
                    registerError.style.display = 'block'; // Show error
                    registerError.textContent = err.message; // Display message
                    btn.textContent = 'Create Account'; // Reset button
                    btn.disabled = false; // Enable button
                });
        });
    }
}

// Function to log activities
function logActivity(user, action, details) {
    if (!user) return; // If no user, stop
    db.collection('users').doc(user.uid).get().then(doc => { // Get user data
        const data = doc.data() || {}; // Get data
        const staffName = data.firstName ? `${data.firstName} ${data.lastName}` : 'Staff Member'; // Get name
        const staffId = data.staffId || 'N/A'; // Get ID
        db.collection('auditLogs').add({ // Add log
            userId: user.uid, // User ID
            staffName: staffName, // Name
            staffId: staffId, // Staff ID
            action: action, // Action type
            details: details, // Details
            timestamp: firebase.firestore.FieldValue.serverTimestamp() // Timestamp
        }).catch(err => console.error("Error logging activity:", err)); // Catch errors
    }).catch(err => { // If user fetch fails
        db.collection('auditLogs').add({ // Log with fallback
            userId: user.uid, // User ID
            staffName: 'Staff Member', // Fallback name
            staffId: 'N/A', // Fallback ID
            action: action, // Action type
            details: details, // Details
            timestamp: firebase.firestore.FieldValue.serverTimestamp() // Timestamp
        });
    });
}

// Function to enforce route security
function enforceAuth(allowedRoles) {
    auth.onAuthStateChanged((user) => { // Listen for login state
        if (!user) { // If not logged in
            window.location.href = '../login.html'; // Kick to login
            return; // Stop
        }
        db.collection('users').doc(user.uid).get().then(doc => { // Get user profile
            if (!doc.exists) { window.location.href = '../login.html'; return; } // If no profile, kick
            const data = doc.data(); // Get data
            let userRoles = data.roles || (data.role ? [data.role] : ['patient']); // Get roles
            
            if (userRoles.includes('admin')) return; // Admins bypass all checks
            
            const hasAccess = allowedRoles.some(role => userRoles.includes(role)); // Check if user has allowed role
            if (!hasAccess) { // If not
                alert("Access Denied: You do not have permission to view this page."); // Show alert
                window.location.href = '../dashboard.html'; // Kick to dashboard
            }
        }).catch(() => window.location.href = '../login.html'); // Catch errors
    });
}
