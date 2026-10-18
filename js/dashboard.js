auth.onAuthStateChanged((user) => {
    if (!user) { window.location.href = 'login.html'; return; }

    db.collection('users').doc(user.uid).get().then(doc => {
        if (!doc.exists) {
            document.getElementById('userName').textContent = "No Database Record Found";
            return;
        }

        const data = doc.data();
        
        // 1. Get the roles
        let userRoles = data.roles || (data.role ? [data.role] : ['patient']);
        
        // 2. Display the info on the screen
        document.getElementById('userName').textContent = data.firstName ? `${data.firstName} ${data.lastName}` : user.email;
        
        // THIS IS THE DEBUG LINE: It will show the email AND the exact roles found in the database
        document.getElementById('userRole').textContent = user.email + " | Roles: " + JSON.stringify(userRoles);

        renderModules(userRoles);
    }).catch(error => {
        document.getElementById('userRole').textContent = "Error: " + error.message;
    });
});

function renderModules(userRoles) {
    const container = document.getElementById('moduleCards');
    
    const allModules = {
        patient: [ { title: '📅 Book Appointment', desc: 'Schedule a visit', link: 'pages/appointments.html' } ],
        doctor: [ { title: '🩺 OPD (Consultations)', desc: 'See patients & prescribe', link: 'pages/opd.html' }, { title: '👥 My Patients', desc: 'Patient queue', link: 'pages/records.html' } ],
        nurse: [ { title: '🌡️ Vitals Entry', desc: 'Record vitals', link: 'pages/nursing.html' } ],
        reception: [ { title: '🧑‍💼 Register Patient', desc: 'New patient intake', link: 'pages/reception.html' } ],
        pharmacy: [ { title: '💊 Prescriptions Queue', desc: 'Dispense drugs', link: 'pages/pharmacy.html' } ],
        lab: [ { title: '🧪 Lab Requests', desc: 'Pending tests', link: 'pages/laboratory.html' } ],
        billing: [ { title: '💳 Invoices', desc: 'Manage bills', link: 'pages/billing.html' } ],
        records: [ { title: '🗂️ Patient Files', desc: 'Access records', link: 'pages/records.html' } ],
        admin: [ { title: '👔 Admin / HR', desc: 'Manage staff roles & access', link: 'pages/admin.html' }, { title: '🧑‍💼 Reception', desc: 'Patient registration', link: 'pages/reception.html' }, { title: '🌡️ Nursing', desc: 'Vitals & care', link: 'pages/nursing.html' }, { title: '🩺 OPD (Doctors)', desc: 'Consultations', link: 'pages/opd.html' }, { title: '💊 Pharmacy', desc: 'Drug dispensing', link: 'pages/pharmacy.html' } ]
    };

    let finalModules = [];
    userRoles.forEach(role => {
        if (allModules[role]) {
            finalModules = finalModules.concat(allModules[role]);
        }
    });

    if (finalModules.length === 0) finalModules = allModules.patient;

    const uniqueModules = Array.from(new Set(finalModules.map(m => m.title)))
        .map(title => finalModules.find(m => m.title === title));

    container.innerHTML = uniqueModules.map(m => `
        <a href="${m.link}" class="dash-card" style="text-decoration:none; color:inherit; display:block;">
            <h3>${m.title}</h3>
            <p>${m.desc}</p>
        </a>
    `).join('');
}
