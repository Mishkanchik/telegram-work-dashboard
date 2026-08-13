// =============================================
// MAIN.JS - GENERAL SCRIPTS
// =============================================

document.addEventListener('DOMContentLoaded', function () {
    initEventListeners();
    initParticles();
});

// =============================================
// INIT FUNCTIONS
// =============================================

function initEventListeners() {
    const menuToggle = document.querySelector('.menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', function () {
            document.body.classList.toggle('mobile-menu-open');
        });
    }

    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(function (link) {
        link.addEventListener('click', function () {
            document.body.classList.remove('mobile-menu-open');
        });
    });

    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

function initParticles() {
    if (typeof particlesJS !== 'undefined') {
        particlesJS('particles-js', {
            particles: {
                number: { value: 80, density: { enable: true, value_area: 800 } },
                color: ['#00d4ff', '#7c3aed', '#f59e0b'],
                opacity: { value: 0.5, random: true },
                size: { value: 3, random: true },
                line_linked: { enable: true, distance: 150, color: '#00d4ff', opacity: 0.2, width: 1 },
                move: { enable: true, speed: 2, direction: 'bottom', random: false, straight: false, out_mode: 'out' }
            },
            interactivity: {
                detect_on: 'canvas',
                events: { onhover: { enable: true, mode: 'repulse' }, onclick: { enable: true, mode: 'push' } }
            },
            retina_detect: true
        });
    }
}

// =============================================
// API FUNCTIONS
// =============================================

async function apiRequest(endpoint, options) {
    options = options || {};
    const url = API_CONFIG.BASE_URL + endpoint;

    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const mergedOptions = Object.assign({}, defaultOptions, options);

    try {
        const response = await fetch(url, mergedOptions);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'API Error');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        showToast(error.message, 'error');
        throw error;
    }
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

function formatHours(hours) {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return h + ' год ' + m + ' хв';
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatTime(timeStr) {
    if (!timeStr) return '-';
    const d = new Date(timeStr);
    return d.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
}

function showToast(message, type) {
    type = type || 'info';
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast ' + type;

    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    else if (type === 'error') icon = 'exclamation-circle';
    else if (type === 'warning') icon = 'exclamation-triangle';

    toast.innerHTML = '<i class="fas fa-' + icon + '"></i><span>' + message + '</span>';
    container.appendChild(toast);

    setTimeout(function () {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(function () { toast.remove(); }, 300);
    }, 5000);
}

function getMonthsList() {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const value = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
        const label = d.toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' });
        months.push({ value: value, label: label.charAt(0).toUpperCase() + label.slice(1) });
    }
    return months;
}

function populateMonthSelect(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;

    const months = getMonthsList();
    select.innerHTML = '';

    months.forEach(function (m) {
        const option = document.createElement('option');
        option.value = m.value;
        option.textContent = m.label;
        select.appendChild(option);
    });
}

function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(function () {
            showToast('Скопійовано!', 'success');
        });
    } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('Скопійовано!', 'success');
    }
}

// Export
window.formatHours = formatHours;
window.formatDate = formatDate;
window.formatTime = formatTime;
window.showToast = showToast;
window.getMonthsList = getMonthsList;
window.populateMonthSelect = populateMonthSelect;
window.copyToClipboard = copyToClipboard;
window.apiRequest = apiRequest;