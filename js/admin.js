// =============================================
// ADMIN.JS - ADMIN PANEL PAGE
// =============================================

let activityChart = null;
let currentFilters = { month: '', search: '', shift_type: '' };

document.addEventListener('DOMContentLoaded', function () {
    initAdminPage();
});

function initAdminPage() {
    const savedAuth = localStorage.getItem('admin_auth');

    if (savedAuth === 'true') {
        showAdminPanel();
    } else {
        showAuthScreen();
    }

    setupEventListeners();
}

function setupEventListeners() {
    const authForm = document.getElementById('authForm');
    if (authForm) {
        authForm.addEventListener('submit', handleAuth);
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    const filtersBtn = document.getElementById('applyFiltersBtn');
    if (filtersBtn) {
        filtersBtn.addEventListener('click', applyFilters);
    }

    const resetBtn = document.getElementById('resetFiltersBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetFilters);
    }

    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportCSV);
    }
}

function handleAuth(e) {
    e.preventDefault();

    const password = e.target.password.value;

    apiRequest('/api/admin/auth.php', {
        method: 'POST',
        body: JSON.stringify({ password: password })
    }).then(function (data) {
        if (data.success) {
            localStorage.setItem('admin_auth', 'true');
            showAdminPanel();
        }
    }).catch(function (error) {
        document.getElementById('authError').textContent = 'Невірний пароль';
        document.getElementById('authError').classList.remove('hidden');
    });
}

function handleLogout() {
    localStorage.removeItem('admin_auth');
    showAuthScreen();
}

function showAuthScreen() {
    document.getElementById('authScreen').classList.remove('hidden');
    document.getElementById('adminPanel').classList.add('hidden');
}

function showAdminPanel() {
    document.getElementById('authScreen').classList.add('hidden');
    document.getElementById('adminPanel').classList.remove('hidden');

    populateMonthSelect('monthSelect');
    loadAdminData();

    setInterval(updateLiveTimers, 60000);
}

async function loadAdminData() {
    try {
        const stats = await apiRequest('/api/admin/stats.php?month=' + currentFilters.month);
        renderStats(stats.globalStats);
        renderLeaderboard(stats.topWorkers);
        renderWorkersTable(stats.allWorkers);
        renderActiveSessions(stats.activeSessions);
        renderActivityChart(stats.hourlyActivity);
    } catch (error) {
        showToast('Помилка завантаження даних', 'error');
    }
}

function applyFilters() {
    currentFilters.month = document.getElementById('monthSelect').value;
    currentFilters.search = document.getElementById('searchInput').value;
    currentFilters.shift_type = document.getElementById('shiftFilter').value;

    loadAdminData();
}

function resetFilters() {
    currentFilters = { month: '', search: '', shift_type: '' };
    document.getElementById('searchInput').value = '';
    document.getElementById('shiftFilter').value = '';
    document.getElementById('monthSelect').value = document.querySelector('#monthSelect option').value;

    loadAdminData();
}

function exportCSV() {
    window.open(API_CONFIG.BASE_URL + '/api/admin/export.php?month=' + currentFilters.month, '_blank');
}

function renderStats(stats) {
    document.getElementById('activeWorkers').textContent = stats.active_workers;
    document.getElementById('totalShifts').textContent = stats.total_shifts;
    document.getElementById('totalHours').textContent = Math.round(stats.total_hours);
    document.getElementById('avgHours').textContent = Math.round(stats.avg_hours * 10) / 10;
}

function renderLeaderboard(workers) {
    const container = document.getElementById('leaderboard');
    if (!container) return;

    if (workers.length === 0) {
        container.innerHTML = '<p class="text-muted">Немає даних</p>';
        return;
    }

    const maxHours = Math.max.apply(null, workers.map(function (w) { return w.total_hours; }));

    container.innerHTML = '';

    workers.forEach(function (w, i) {
        const place = i + 1;
        const medal = place === 1 ? '🥇' : (place === 2 ? '🥈' : (place === 3 ? '🥉' : ''));
        const className = place === 1 ? 'first' : (place === 2 ? 'second' : (place === 3 ? 'third' : ''));
        const progress = maxHours > 0 ? Math.round(w.total_hours / maxHours * 100) : 0;

        const item = document.createElement('div');
        item.className = 'leaderboard-item ' + className;
        item.innerHTML =
            '<span class="medal">' + medal + '</span>' +
            '<div class="leaderboard-info">' +
            '<div class="leaderboard-name">' + w.full_name + '</div>' +
            '<div class="leaderboard-meta">' + w.total_shifts + ' змін | ' + w.morning_shifts + ' ранкових | ' + w.evening_shifts + ' вечірніх</div>' +
            '</div>' +
            '<div class="leaderboard-hours">' + Math.round(w.total_hours * 10) / 10 + ' год</div>' +
            '<div class="leaderboard-progress">' +
            '<div class="progress-bar"><div class="progress-fill" style="width: ' + progress + '%"></div></div>' +
            '</div>';
        container.appendChild(item);
    });
}

function renderWorkersTable(workers) {
    const tbody = document.getElementById('workersTable');
    if (!tbody) return;

    if (workers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">Немає даних</td></tr>';
        return;
    }

    tbody.innerHTML = '';

    workers.forEach(function (w, i) {
        const tr = document.createElement('tr');
        tr.innerHTML =
            '<td>' + (i + 1) + '</td>' +
            '<td><strong>' + w.full_name + '</strong>' + (w.username ? '<br><small class="text-muted">@' + w.username + '</small>' : '') + '</td>' +
            '<td>' + w.total_shifts + '</td>' +
            '<td>' + w.morning_shifts + '</td>' +
            '<td>' + w.evening_shifts + '</td>' +
            '<td><strong>' + Math.round(w.total_hours * 10) / 10 + '</strong></td>' +
            '<td>' + Math.round(w.avg_hours * 10) / 10 + '</td>' +
            '<td><span class="badge ' + (w.role === 'admin' ? 'badge-admin' : 'badge-worker') + '">' +
            (w.role === 'admin' ? '🔐 Адмін' : '👤 Працівник') + '</span></td>';
        tbody.appendChild(tr);
    });
}

function renderActiveSessions(sessions) {
    const card = document.getElementById('activeSessionsCard');
    const list = document.getElementById('activeSessionsList');

    if (!sessions || sessions.length === 0) {
        card.classList.add('hidden');
        return;
    }

    card.classList.remove('hidden');
    list.innerHTML = '';

    sessions.forEach(function (s) {
        const item = document.createElement('div');
        item.className = 'session-card';
        item.innerHTML =
            '<div class="online-dot"></div>' +
            '<div class="session-info">' +
            '<div class="session-name">' + s.full_name + '</div>' +
            '<div class="session-shift">' + (s.shift_type === 'morning' ? '🌅 Ранкова' : '🌇 Вечірня') + '</div>' +
            '</div>' +
            '<div class="session-timer" data-start="' + s.start_timestamp + '">--:--</div>';
        list.appendChild(item);
    });
}

function renderActivityChart(hourlyData) {
    const ctx = document.getElementById('activityChart');
    if (!ctx) return;

    if (activityChart) activityChart.destroy();

    activityChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Array.from({ length: 24 }, function (_, i) { return i + ':00'; }),
            datasets: [{
                label: 'Початок змін',
                data: hourlyData,
                backgroundColor: 'rgba(0, 212, 255, 0.4)',
                borderColor: 'rgba(0, 212, 255, 1)',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
                x: { grid: { display: false }, ticks: { color: '#94a3b8', maxRotation: 45 } }
            }
        }
    });
}

function updateLiveTimers() {
    document.querySelectorAll('.session-timer').forEach(function (el) {
        const start = new Date(el.dataset.start);
        const now = new Date();
        const diff = Math.floor((now - start) / 1000);
        const hours = Math.floor(diff / 3600);
        const mins = Math.floor((diff % 3600) / 60);
        el.textContent = hours + ' год ' + mins + ' хв';
    });
}