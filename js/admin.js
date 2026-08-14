// =============================================
// ADMIN.JS - ADMIN PANEL
// =============================================

let workersData = [];

document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const password = urlParams.get('password');
    
    if (password) {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('adminContent').style.display = 'block';
        loadAdminData(password);
    }
});

async function login() {
    const password = document.getElementById('passwordInput').value;
    const errorDiv = document.getElementById('loginError');
    
    if (!password) {
        errorDiv.textContent = 'Введіть пароль';
        errorDiv.style.display = 'block';
        return;
    }
    
    try {
        const url = `${API_CONFIG.BASE_URL}/api/admin/stats.php?password=${encodeURIComponent(password)}`;
        const response = await fetch(url);
        
        if (response.status === 401) {
            errorDiv.textContent = '❌ Невірний пароль';
            errorDiv.style.display = 'block';
            return;
        }
        
        if (!response.ok) {
            throw new Error('Помилка підключення');
        }
        
        // Успішний вхід
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('adminContent').style.display = 'block';
        document.getElementById('loginError').style.display = 'none';
        
        // Оновлюємо URL з паролем
        const newUrl = window.location.pathname + '?password=' + encodeURIComponent(password);
        window.history.pushState({}, '', newUrl);
        
        const data = await response.json();
        renderAdminData(data);
        
    } catch (error) {
        errorDiv.textContent = '❌ ' + error.message;
        errorDiv.style.display = 'block';
    }
}

async function loadAdminData(password) {
    try {
        const url = `${API_CONFIG.BASE_URL}/api/admin/stats.php?password=${encodeURIComponent(password)}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Помилка завантаження даних');
        }
        
        const data = await response.json();
        renderAdminData(data);
        
    } catch (error) {
        console.error('Load error:', error);
        document.getElementById('workersTable').innerHTML = 
            '<tr><td colspan="7" class="text-center text-muted">❌ Помилка завантаження даних</td></tr>';
    }
}

function renderAdminData(data) {
    workersData = data.workers || [];
    
    // Статистика
    document.getElementById('totalWorkers').textContent = data.summary.total_workers || 0;
    document.getElementById('activeToday').textContent = data.summary.active_today || 0;
    document.getElementById('monthShifts').textContent = data.summary.month_shifts || 0;
    document.getElementById('totalHours').textContent = data.summary.total_hours || 0;
    
    // Топ працівників
    renderTopWorkers(data.top_workers || []);
    
    // Активні зміни
    renderActiveShifts(data.active_shifts || []);
    
    // Таблиця
    renderWorkersTable(workersData);
}

function renderTopWorkers(topWorkers) {
    const container = document.getElementById('topWorkers');
    if (!container) return;
    
    if (topWorkers.length === 0) {
        container.innerHTML = '<p class="text-muted">Немає даних</p>';
        return;
    }
    
    const medals = ['🥇', '🥈', '🥉'];
    container.innerHTML = '';
    
    topWorkers.forEach((worker, index) => {
        const card = document.createElement('div');
        card.className = 'top-worker-card';
        card.innerHTML = `
            <div class="top-worker-medal">${medals[index] || '🏅'}</div>
            <div class="top-worker-info">
                <div class="top-worker-name">${worker.full_name}</div>
                <div class="top-worker-stats">
                    <span>📋 ${worker.total_shifts} змін</span>
                    <span>⏱ ${worker.total_hours} год</span>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function renderActiveShifts(activeShifts) {
    const container = document.getElementById('activeShifts');
    if (!container) return;
    
    if (activeShifts.length === 0) {
        container.innerHTML = '<p class="text-muted">Немає активних змін</p>';
        return;
    }
    
    container.innerHTML = '';
    activeShifts.forEach(s => {
        const item = document.createElement('div');
        item.className = 'active-shift-item';
        item.innerHTML = `
            <span class="active-dot"></span>
            <span>${s.full_name}</span>
            <span class="active-shift-time">${s.current_hours} год</span>
        `;
        container.appendChild(item);
    });
}

function renderWorkersTable(workers) {
    const tbody = document.getElementById('workersTable');
    if (!tbody) return;
    
    if (workers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Немає працівників</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    workers.forEach(w => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${w.full_name}</strong></td>
            <td>${w.total_shifts}</td>
            <td>${w.morning_shifts}</td>
            <td>${w.evening_shifts}</td>
            <td><strong>${w.total_hours}</strong></td>
            <td>${w.avg_hours}</td>
            <td><span class="badge ${w.role === 'admin' ? 'badge-admin' : 'badge-worker'}">${w.role === 'admin' ? 'Адмін' : 'Працівник'}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

function filterWorkers() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const shiftFilter = document.getElementById('shiftFilter').value;
    
    let filtered = workersData;
    
    if (search) {
        filtered = filtered.filter(w => 
            w.full_name.toLowerCase().includes(search) || 
            w.username.toLowerCase().includes(search)
        );
    }
    
    if (shiftFilter === 'morning') {
        filtered = filtered.filter(w => w.morning_shifts > 0);
    } else if (shiftFilter === 'evening') {
        filtered = filtered.filter(w => w.evening_shifts > 0);
    }
    
    renderWorkersTable(filtered);
}

function exportCSV() {
    if (!workersData.length) {
        showToast('Немає даних для експорту', 'error');
        return;
    }
    
    const headers = ['Ім\'я', 'Змін', 'Ранкові', 'Вечірні', 'Години', 'Середнє'];
    const rows = workersData.map(w => [
        w.full_name,
        w.total_shifts,
        w.morning_shifts,
        w.evening_shifts,
        w.total_hours,
        w.avg_hours
    ]);
    
    let csv = '\uFEFF' + headers.join(',') + '\n';
    rows.forEach(row => {
        csv += row.join(',') + '\n';
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'workers_export_' + new Date().toISOString().slice(0, 10) + '.csv';
    link.click();
    
    showToast('Експорт виконано', 'success');
}

function showToast(message, type) {
    const container = document.querySelector('.toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = 'toast toast-' + (type || 'info');
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => toast.remove(), 3000);
}
