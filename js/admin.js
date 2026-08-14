// =============================================
// ADMIN.JS - ADMIN PANEL
// =============================================

let currentUser = null;
let workersData = [];

document.addEventListener('DOMContentLoaded', function() {
    initAdminPage();
});

async function initAdminPage() {
    // Перевіряємо, чи є пароль в URL
    const urlParams = new URLSearchParams(window.location.search);
    const password = urlParams.get('password');
    
    if (password) {
        // Якщо пароль є в URL — намагаємось завантажити дані
        await loadAdminData(password);
    } else {
        // Показуємо форму входу
        showLoginForm();
    }
}

function showLoginForm() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('adminContent').style.display = 'none';
}

async function login() {
    const password = document.getElementById('passwordInput').value;
    if (!password) {
        showToast('Введіть пароль', 'error');
        return;
    }
    
    // Перевіряємо пароль через API
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/admin/stats.php?password=${password}`);
        if (response.status === 401) {
            showToast('Невірний пароль', 'error');
            return;
        }
        
        if (!response.ok) {
            showToast('Помилка підключення', 'error');
            return;
        }
        
        // Пароль правильний — завантажуємо дані
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('adminContent').style.display = 'block';
        
        // Оновлюємо URL з паролем (щоб при перезавантаженні не питати знову)
        const newUrl = window.location.pathname + '?password=' + encodeURIComponent(password);
        window.history.pushState({}, '', newUrl);
        
        await loadAdminData(password);
        
    } catch (error) {
        console.error('Login error:', error);
        showToast('Помилка з\'єднання з сервером', 'error');
    }
}

async function loadAdminData(password) {
    try {
        const url = `${API_CONFIG.BASE_URL}/api/admin/stats.php?password=${encodeURIComponent(password)}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        workersData = data.workers || [];
        
        renderSummary(data.summary);
        renderTopWorkers(data.top_workers || []);
        renderWorkersTable(workersData);
        renderActiveShifts(data.active_shifts || []);
        
        showToast('Дані завантажено успішно', 'success');
        
    } catch (error) {
        console.error('Load admin data error:', error);
        showToast('Помилка завантаження даних', 'error');
    }
}

function renderSummary(summary) {
    if (!summary) return;
    
    document.getElementById('totalWorkers').textContent = summary.total_workers || 0;
    document.getElementById('activeToday').textContent = summary.active_today || 0;
    document.getElementById('monthShifts').textContent = summary.month_shifts || 0;
    document.getElementById('totalHours').textContent = summary.total_hours || 0;
    document.getElementById('avgHours').textContent = summary.avg_hours || 0;
}

function renderTopWorkers(topWorkers) {
    const container = document.getElementById('topWorkers');
    if (!container) return;
    
    if (!topWorkers || topWorkers.length === 0) {
        container.innerHTML = '<p class="text-muted">Немає даних про працівників</p>';
        return;
    }
    
    const medals = ['🥇', '🥈', '🥉'];
    container.innerHTML = '';
    
    topWorkers.forEach(function(worker, index) {
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

function renderWorkersTable(workers) {
    const tbody = document.getElementById('workersTable');
    if (!tbody) return;
    
    if (!workers || workers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">Немає працівників</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    
    workers.forEach(function(w) {
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

function renderActiveShifts(activeShifts) {
    const container = document.getElementById('activeShifts');
    if (!container) return;
    
    if (!activeShifts || activeShifts.length === 0) {
        container.innerHTML = '<p class="text-muted">Немає активних змін</p>';
        return;
    }
    
    container.innerHTML = '';
    
    activeShifts.forEach(function(s) {
        const div = document.createElement('div');
        div.className = 'active-shift-item';
        div.innerHTML = `
            <span class="active-dot"></span>
            <span class="active-shift-name">${s.full_name}</span>
            <span class="active-shift-time">${s.current_hours} год</span>
        `;
        container.appendChild(div);
    });
}

// Фільтрація працівників
function filterWorkers() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const shiftFilter = document.getElementById('shiftFilter').value;
    
    let filtered = workersData;
    
    // Фільтр по імені
    if (search) {
        filtered = filtered.filter(w => 
            w.full_name.toLowerCase().includes(search) || 
            w.username.toLowerCase().includes(search)
        );
    }
    
    // Фільтр по змінах
    if (shiftFilter === 'morning') {
        filtered = filtered.filter(w => w.morning_shifts > 0);
    } else if (shiftFilter === 'evening') {
        filtered = filtered.filter(w => w.evening_shifts > 0);
    }
    
    renderWorkersTable(filtered);
}

// Експорт CSV
function exportCSV() {
    if (!workersData || workersData.length === 0) {
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
    
    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
        csv += row.join(',') + '\n';
    });
    
    // Завантаження файлу
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'workers_export_' + new Date().toISOString().slice(0, 10) + '.csv';
    link.click();
    
    showToast('Експорт виконано успішно', 'success');
}
