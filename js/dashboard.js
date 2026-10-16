auth.onAuthStateChanged((user) => {
    if (!user) { window.location.href = '../login.html'; return; }

    db.collection('users').doc(user.uid).get().then(doc => {
        const data = doc.data() || {};
        const role = data.role || 'patient';
        document.getElementById('userName').textContent = 
            data.firstName ? `${data.firstName} ${data.lastName}` : user.email;
        document.getElementById('userRole').textContent = role;

        renderModules(role);
    });
});

function renderModules(role) {
    const container = document.getElementById('moduleCards');
    
    const modules = {
        patient: [
            { title: '📅 Book Appointment', desc: 'Schedule a visit', link: 'pages/appointments.html' },
            { title: '📋 My Records', desc: 'View medical history', link: '#' },
            { title: '💊 My Prescriptions', desc: 'Active medications', link: '#' }
        ],
        doctor: [
            { title: '👥 My Patients', desc: 'Patient queue', link: 'pages/records.html' },
            { title: '📅 Appointments', desc: 'Today\'s schedule', link: 'pages/appointments.html' },
            { title: '🧪 Lab Results', desc: 'View patient results', link: 'pages/laboratory.html' },
            { title: '💊 Prescribe', desc: 'Write prescriptions', link: 'pages/pharmacy.html' }
        ],
        nurse: [
            { title: '🌡️ Vitals Entry', desc: 'Record vitals', link: 'pages/nursing.html' },
            { title: '👥 Patient Queue', desc: 'Active patients', link: 'pages/records.html' }
        ],
        reception: [
            { title: '🧑‍💼 Register Patient', desc: 'New patient intake', link: 'pages/reception.html' },
            { title: '📅 Appointments', desc: 'Schedule & manage', link: 'pages/appointments.html' }
        ],
        lab: [
            { title: '🧪 Lab Requests', desc: 'Pending tests', link: 'pages/laboratory.html' }
        ],
        pharmacy: [
            { title: '💊 Prescriptions Queue', desc: 'Dispense drugs', link: 'pages/pharmacy.html' }
        ],
        billing: [
            { title: '💳 Invoices', desc: 'Manage bills', link: 'pages/billing.html' }
        ],
        records: [
            { title: '🗂️ Patient Files', desc: 'Access records', link: 'pages/records.html' }
        ],
        admin: [
            { title: '🧑‍💼 Reception', desc: 'Patient registration', link: 'pages/reception.html' },
            { title: '🌡️ Nursing', desc: 'Vitals & care', link: 'pages/nursing.html' },
            { title: '🧪 Laboratory', desc: 'Tests & results', link: 'pages/laboratory.html' },
            { title: '💊 Pharmacy', desc: 'Drug dispensing', link: 'pages/pharmacy.html' },
            { title: '💳 Billing', desc: 'Payments', link: 'pages/billing.html' },
            { title: '🗂️ Records', desc: 'Patient files', link: 'pages/records.html' },
            { title: '👔 Admin / HR', desc: 'Staff management', link: 'pages/admin.html' }
        ]
    };

    const list = modules[role] || modules.patient;
    container.innerHTML = list.map(m => `
        <a href="${m.link}" class="dash-card" style="text-decoration:none; color:inherit; display:block;">
            <h3>${m.title}</h3>
            <p>${m.desc}</p>
        </a>
    `).join('');
}
