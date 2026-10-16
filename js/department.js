function loadDepartmentData(department) {
    auth.onAuthStateChanged((user) => {
        if (!user) { window.location.href = '../login.html'; return; }

        const collections = {
            opd: 'appointments', emergency: 'emergencyCases', pediatrics: 'appointments',
            obgyn: 'appointments', surgery: 'surgeries', 'internal-medicine': 'appointments',
            'ent-eye-dental': 'appointments', orthopedics: 'appointments', cardiology: 'appointments',
            dermatology: 'appointments', reception: 'patients', nursing: 'vitals',
            laboratory: 'labResults', radiology: 'radiology', pharmacy: 'prescriptions',
            billing: 'bills', records: 'patients', admin: 'staff', appointments: 'appointments'
        };

        const collectionName = collections[department] || 'patients';
        const tbody = document.querySelector('tbody');
        if (!tbody) return;

        db.collection(collectionName).limit(50).onSnapshot(
            (snapshot) => {
                if (snapshot.empty) {
                    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#888;">No records yet. Data will appear here as users interact.</td></tr>`;
                    return;
                }
                tbody.innerHTML = '';
                snapshot.forEach(doc => {
                    const d = doc.data();
                    tbody.innerHTML += renderRow(department, d, doc.id);
                });
            },
            (error) => {
                console.error('Firestore read error:', error);
                tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#dc2626;">Permission denied. Check your role.</td></tr>`;
            }
        );
    });
}

function renderRow(department, d, id) {
    const badge = (status) => {
        const cls = status === 'Complete' ? 'status-complete' : status === 'Pending' ? 'status-pending' : 'status-active';
        return `<span class="status-badge ${cls}">${status || 'Active'}</span>`;
    };

    switch (department) {
        case 'laboratory':
            return `<tr><td>${d.patientName || 'N/A'}</td><td>${d.testType || 'N/A'}</td><td>${d.doctor || 'N/A'}</td><td>${badge(d.status)}</td><td>${d.result || '—'}</td><td><button class="btn btn-primary" onclick="alert('View details for ${id}')">View</button></td></tr>`;
        case 'pharmacy':
            return `<tr><td>${d.patientName || 'N/A'}</td><td>${d.medication || 'N/A'}</td><td>${d.doctor || 'N/A'}</td><td>${badge(d.status)}</td><td>${d.quantity || '—'}</td><td><button class="btn btn-primary" onclick="alert('Dispense for ${id}')">Dispense</button></td></tr>`;
        case 'billing':
            return `<tr><td>${d.patientName || 'N/A'}</td><td>${d.service || 'N/A'}</td><td>₦${d.amount || 0}</td><td>${badge(d.status)}</td><td>${d.date || '—'}</td><td><button class="btn btn-primary" onclick="alert('Process payment ${id}')">Pay</button></td></tr>`;
        default:
            return `<tr><td>${d.patientId || id.slice(0,8)}</td><td>${d.firstName ? d.firstName + ' ' + (d.lastName||'') : (d.patientName || 'N/A')}</td><td>${d.age || '—'}</td><td>${d.doctor || '—'}</td><td>${badge(d.status)}</td><td><button class="btn btn-primary" onclick="alert('View record ${id}')">View</button></td></tr>`;
    }
}
