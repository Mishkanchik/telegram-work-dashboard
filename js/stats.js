// =============================================
// STATS.JS - USER STATISTICS PAGE
// =============================================

let currentUser = null;
let hoursChart = null;
let shiftChart = null;

document.addEventListener('DOMContentLoaded', function () {
    initStatsPage();
});

async function initStatsPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('user_id');

    if (!userId) {
        showToast('Потрібен ID користувача', 'error');
        return;
    }

    populateMonthSelect('monthSelect');

    try {
        await loadUserData(userId);
        await loadStats(userId);

        document.getElementById('monthSelect').addEventListener('change', function () {
            loadStats(userId, this.value);
        });
    } catch (error) {
        console.error('Init error:', error);
        showToast('Помилка завантаження даних', 'error');
    }
}

// =============================================
// API REQUEST HELPER
// =============================================

async function apiRequest(endpoint) {
    const url = API_CONFIG.BASE_URL + endpoint;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('API Request Error:', error);
        showToast('Помилка з\'єднання з сервером', 'error');
        throw error;
    }
}

// =============================================
// LOAD DATA
// =============================================

async function loadUserData(userId) {
    const data = await apiRequest('/api/user.php?user_id=' + userId);
    currentUser = data.user;

    document.getElementById('userName').textContent = currentUser.full_name || 'Користувач';
    document.getElementById('userRole').textContent = currentUser.role === 'admin' ? 'Адмін' : 'Працівник';
    document.getElementById('userAvatar').textContent = currentUser.full_name ? currentUser.full_name.charAt(0).toUpperCase() : '?';

    // ✅ ПОКАЗУЄМО КНОПКУ ADMIN PANEL ТІЛЬКИ ДЛЯ АДМІНІВ
    const adminBtn = document.getElementById('adminPanelBtn');
    if (adminBtn) {
        if (currentUser.role === 'admin') {
            adminBtn.style.display = 'inline-flex';
        } else {
            adminBtn.style.display = 'none';
        }
    }

    const refLink = 'https://t.me/' + API_CONFIG.BOT_USERNAME + '?start=' + currentUser.referral_code;
    document.getElementById('refLink').value = refLink;
}

async function loadStats(userId, month) {
    month = month || new Date().toISOString().slice(0, 7);

    try {
        const data = await apiRequest('/api/stats.php?user_id=' + userId + '&month=' + month);

        document.getElementById('totalShifts').textContent = data.stats.total_shifts || 0;
        document.getElementById('totalHours').textContent = Math.round((data.stats.total_hours || 0) * 10) / 10;
        document.getElementById('avgHours').textContent = Math.round((data.stats.avg_hours || 0) * 10) / 10;
        document.getElementById('morningShifts').textContent = data.stats.morning_shifts || 0;

        renderHoursChart(data.daily_hours || []);
        renderShiftChart(data.stats.morning_shifts || 0, data.stats.evening_shifts || 0);
        renderAchievements(data.achievements || []);
        renderShiftsTable(data.shifts || []);
        
    } catch (error) {
        console.error('Load stats error:', error);
        document.getElementById('shiftsTable').innerHTML = '<tr><td colspan="5" class="text-center text-muted">❌ Помилка завантаження даних</td></tr>';
    }
}

// =============================================
// RENDER CHARTS
// =============================================

function renderHoursChart(dailyHours) {
    const ctx = document.getElementById('hoursChart');
    if (!ctx) return;

    if (hoursChart) hoursChart.destroy();

    const labels = dailyHours.map(function (d) {
        return formatDate(d.date).slice(0, 5);
    });
    const values = dailyHours.map(function (d) {
        return Math.round(d.hours * 10) / 10;
    });

    hoursChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels.length ? labels : ['Немає даних'],
            datasets: [{
                label: 'Години',
                data: values.length ? values : [0],
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
                x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
            }
        }
    });
}

function renderShiftChart(morningShifts, eveningShifts) {
    const ctx = document.getElementById('shiftChart');
    if (!ctx) return;

    if (shiftChart) shiftChart.destroy();

    const total = morningShifts + eveningShifts;
    if (total === 0) {
        morningShifts = 1;
        eveningShifts = 0;
    }

    shiftChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Ранкова', 'Вечірня'],
            datasets: [{
                data: [morningShifts, eveningShifts],
                backgroundColor: ['#ffd93d', '#7c3aed'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: '#94a3b8' } }
            }
        }
    });
}

// =============================================
// RENDER ACHIEVEMENTS & SHIFTS
// =============================================

function renderAchievements(achievements) {
    const container = document.getElementById('achievementsGrid');
    if (!container) return;

    container.innerHTML = '';

    if (achievements.length === 0) {
        container.innerHTML = '<p class="text-muted">Поки що немає досягнень</p>';
        return;
    }

    achievements.forEach(function (a) {
        const card = document.createElement('div');
        card.className = 'achievement-card ' + (a.earned ? 'earned' : 'locked');
        card.innerHTML =
            '<div class="achievement-icon">' + a.icon + '</div>' +
            '<div class="achievement-title">' + a.title + '</div>' +
            '<div class="achievement-desc">' + a.desc + '</div>';
        container.appendChild(card);
    });
}

function renderShiftsTable(shifts) {
    const tbody = document.getElementById('shiftsTable');
    if (!tbody) return;

    if (shifts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Змін поки немає</td></tr>';
        return;
    }

    tbody.innerHTML = '';

    shifts.slice(0, 20).forEach(function (s) {
        const tr = document.createElement('tr');
        tr.innerHTML =
            '<td>' + formatDate(s.date) + '</td>' +
            '<td><span class="badge ' + (s.shift_type === 'morning' ? 'badge-morning' : 'badge-evening') + '">' +
            (s.shift_type === 'morning' ? '🌅 Ранкова' : '🌇 Вечірня') + '</span></td>' +
            '<td>' + formatTime(s.start_time) + '</td>' +
            '<td>' + formatTime(s.end_time) + '</td>' +
            '<td><strong>' + Math.round(s.total_hours * 10) / 10 + '</strong> год</td>';
        tbody.appendChild(tr);
    });
}

// =============================================
// HELPERS
// =============================================

function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('uk-UA');
}

function formatTime(datetime) {
    const d = new Date(datetime + 'Z');
    return d.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
}

function populateMonthSelect(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;

    const now = new Date();
    for (let i = 0; i < 12; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const value = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
        const label = d.toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' });
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        if (i === 0) option.selected = true;
        select.appendChild(option);
    }
}

function showToast(message, type) {
    const container = document.querySelector('.toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast toast-' + (type || 'info');
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(function () {
        toast.classList.add('toast-hide');
        setTimeout(function () {
            toast.remove();
        }, 300);
    }, 3000);
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(function () {
        showToast('Скопійовано!', 'success');
    }).catch(function () {
        // Fallback
        const input = document.createElement('input');
        input.value = text;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        showToast('Скопійовано!', 'success');
    });
}
