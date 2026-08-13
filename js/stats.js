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
        showToast('Помилка завантаження даних', 'error');
    }
}

async function loadUserData(userId) {
    const data = await apiRequest('/api/user.php?user_id=' + userId);
    currentUser = data.user;

    document.getElementById('userName').textContent = currentUser.full_name;
    document.getElementById('userRole').textContent = currentUser.role === 'admin' ? 'Адмін' : 'Працівник';
    document.getElementById('userAvatar').textContent = currentUser.full_name.charAt(0).toUpperCase();

    const refLink = 'https://t.me/' + API_CONFIG.BOT_USERNAME + '?start=' + currentUser.referral_code;
    document.getElementById('refLink').value = refLink;
}

async function loadStats(userId, month) {
    month = month || new Date().toISOString().slice(0, 7);

    const data = await apiRequest('/api/stats.php?user_id=' + userId + '&month=' + month);

    document.getElementById('totalShifts').textContent = data.stats.total_shifts;
    document.getElementById('totalHours').textContent = Math.round(data.stats.total_hours * 10) / 10;
    document.getElementById('avgHours').textContent = Math.round(data.stats.avg_hours * 10) / 10;
    document.getElementById('morningShifts').textContent = data.stats.morning_shifts;

    renderHoursChart(data.daily_hours);
    renderShiftChart(data.stats.morning_shifts, data.stats.evening_shifts);
    renderAchievements(data.achievements);
    renderShiftsTable(data.shifts);
}

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
            labels: labels,
            datasets: [{
                label: 'Години',
                data: values,
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

    shiftChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Ранкова', 'Вечірня'],
            datasets: [{
                data: [morningShifts || 0, eveningShifts || 0],
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

function renderAchievements(achievements) {
    const container = document.getElementById('achievementsGrid');
    if (!container) return;

    container.innerHTML = '';

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

    shifts.forEach(function (s) {
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