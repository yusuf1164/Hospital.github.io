auth.onAuthStateChanged((user) => {
    if (!user) { window.location.href = 'login.html'; return; }

    db.collection('users').doc(user.uid).get().then(doc => {
        if (!doc.exists) return;

        const data = doc.data();
        let userRoles = data.roles || (data.role ? [data.role] : ['patient']);
        
        const nameEl = document.getElementById('userName');
        const roleEl = document.getElementById('userRole');
        if (nameEl) nameEl.textContent = data.firstName ? `${data.firstName} ${data.lastName}` : user.email;
        if (roleEl) roleEl.textContent = userRoles.join(', ');

        const statsContainer = document.getElementById('adminStatsContainer');
        if (statsContainer && userRoles.includes('admin')) {
            statsContainer.style.display = 'block';
            
            // 1. Total Patients
            db.collection('patients').get().then(snap => {
                const el = document.getElementById('statPatients');
                if (el) el.innerText = snap.size;
            }).catch(e => console.log(e));

            // 2. Ongoing Treatment (patients where treatmentStatus == 'Ongoing' OR missing)
            db.collection('patients').get().then(snap => {
                let ongoingCount = 0;
                snap.forEach(doc => {
                    const d = doc.data();
                    if (d.treatmentStatus !== 'Treated') ongoingCount++;
                });
                const el = document.getElementById('statOngoing');
                if (el) el.innerText = ongoingCount;
            });

            // 3. Treated Patients
            db.collection('patients').get().then(snap => {
                let treatedCount = 0;
                snap.forEach(doc => {
                    if (doc.data().treatmentStatus === 'Treated') treatedCount++;
                });
                const el = document.getElementById('statTreated');
                if (el) el.innerText = treatedCount;
            });

            // 4. Active Emergencies
            db.collection('emergencies').where('status', '==', 'Active').get().then(snap => {
                const el = document.getElementById('statEmergency');
                if (el) el.innerText = snap.size;
            }).catch(e => console.log(e));

            // 5. Total Rooms
            db.collection('rooms').get().then(snap => {
                const el = document.getElementById('statRooms');
                if (el) el.innerText = snap.size;
            }).catch(e => console.log(e));
            
            // 6. Total Staff
            db.collection('users').get().then(snap => {
                let staffCount = 0;
                snap.forEach(u => { if(u.data().staffId) staffCount++; });
                const el = document.getElementById('statStaff');
                if (el) el.innerText = staffCount;
            }).catch(e => console.log(e));

            // 7. Total Revenue
            db.collection('bills').get().then(snap => {
                let revenue = 0;
                snap.forEach(doc => {
                    const d = doc.data();
                    if (d.status === 'Paid') {
                        revenue += Number(d.amount);
                    }
                });
                const el = document.getElementById('statRevenue');
                if (el) el.innerText = '₦' + revenue.toLocaleString();
            }).catch(e => console.log(e));
        }

        renderModules(userRoles);
    });
});

function renderModules(userRoles) {
    const container = document.getElementById('moduleCards');
    if (!container) return; 
    
    const allModules = {
        patient: [ 
            { title: '📅 My Appointments', desc: 'Book and view visits', link: 'pages/appointments.html' },
            { title: '📋 My Health Records', desc: 'View linked profiles', link: 'pages/patient-records.html' },
            { title: '💳 My Bills', desc: 'View invoices and payments', link: 'pages/my-bills.html' },
            { title: '🔗 Link Hospital Record', desc: 'Connect a new Patient ID', link: 'pages/link-record.html' }
        ],
        appointments: [ { title: '📅 Manage Appointments', desc: 'Confirm or cancel patient bookings', link: 'pages/appointments.html' } ],
        doctor: [ 
            { title: '🩺 OPD (Consultations)', desc: 'See patients & prescribe', link: 'pages/opd.html' },
            { title: '📅 Appointments', desc: 'View schedule', link: 'pages/appointments.html' },
            { title: '👥 Patient List', desc: 'Search all patients', link: 'pages/patients.html' },
            { title: '🚨 Emergency', desc: 'Manage critical cases', link: 'pages/emergency.html' }
        ],
        nurse: [ 
            { title: '🌡️ Vitals Entry', desc: 'Record vitals', link: 'pages/nursing.html' },
            { title: '👥 Patient List', desc: 'Search all patients', link: 'pages/patients.html' },
            { title: '🚨 Emergency', desc: 'Manage critical cases', link: 'pages/emergency.html' }
        ],
        reception: [ 
            { title: '🧑‍💼 Register Patient', desc: 'New patient intake', link: 'pages/reception.html' },
            { title: '📅 Appointments', desc: 'Manage bookings', link: 'pages/appointments.html' },
            { title: '👥 Patient List', desc: 'Search all patients', link: 'pages/patients.html' },
            { title: '🚨 Emergency', desc: 'Fast-track intake', link: 'pages/emergency.html' }
        ],
        pharmacy: [ { title: '💊 Pharmacy', desc: 'Dispense drugs', link: 'pages/pharmacy.html' } ],
        lab: [ { title: '🧪 Laboratory', desc: 'Tests & results', link: 'pages/laboratory.html' } ],
        radiology: [ { title: '🩻 Radiology', desc: 'X-rays & scans', link: 'pages/radiology.html' } ],
        billing: [ { title: '💳 Billing', desc: 'Manage bills', link: 'pages/billing.html' } ],
        records: [ { title: '🗂️ Records', desc: 'Access records', link: 'pages/records.html' } ],
        admin: [ 
            { title: '📜 Activity Logs', desc: 'View all staff actions', link: 'pages/activity-log.html' },
            { title: '👔 Admin / HR', desc: 'Manage staff roles & access', link: 'pages/admin.html' },
            { title: '📅 Appointments', desc: 'Manage patient bookings', link: 'pages/appointments.html' },
            { title: '👥 Patient List', desc: 'Search all patients', link: 'pages/patients.html' },
            { title: '🧑‍💼 Reception', desc: 'Patient registration', link: 'pages/reception.html' },
            { title: '🌡️ Nursing', desc: 'Vitals & care', link: 'pages/nursing.html' },
            { title: '🩺 OPD (Doctors)', desc: 'Consultations', link: 'pages/opd.html' },
            { title: '🧪 Laboratory', desc: 'Tests & results', link: 'pages/laboratory.html' },
            { title: '🩻 Radiology', desc: 'X-rays & scans', link: 'pages/radiology.html' },
            { title: '💊 Pharmacy', desc: 'Drug dispensing', link: 'pages/pharmacy.html' },
            { title: '💳 Billing', desc: 'Payments & Invoices', link: 'pages/billing.html' },
            { title: '🗂️ Records', desc: 'Patient files', link: 'pages/records.html' },
            { title: '🚨 Emergency', desc: 'Critical care management', link: 'pages/emergency.html' }
        ]
    };

    let finalModules = [];
    userRoles.forEach(role => {
        if (allModules[role]) finalModules = finalModules.concat(allModules[role]);
    });

    if (finalModules.length === 0) finalModules = allModules.patient;

    const uniqueModules = Array.from(new Set(finalModules.map(m => m.link)))
        .map(link => finalModules.find(m => m.link === link));

    container.innerHTML = uniqueModules.map(m => {
        const parts = m.title.split(' ');
        const emoji = parts[0];
        const text = parts.slice(1).join(' ');

        return `
            <a href="${m.link}" class="dash-card" style="text-decoration:none; color:inherit;">
                <div class="dash-card-content">
                    <div class="dash-icon">${emoji}</div>
                    <div class="dash-text"><h3>${text}</h3><p>${m.desc}</p></div>
                </div>
                <div class="dash-arrow">➔</div>
            </a>
        `;
    }).join('');
}
