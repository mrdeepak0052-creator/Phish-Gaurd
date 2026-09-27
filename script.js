// ===== Element references =====
const form = document.getElementById('predictionForm');
const urlInput = document.getElementById('urlInput');
const loadingPanel = document.getElementById('loadingPanel');
const resultPanel = document.getElementById('resultPanel');
const errorPanel = document.getElementById('errorPanel');
const welcomePanel = document.getElementById('welcomePanel');
const resultContent = document.getElementById('resultContent');
const errorMessage = document.getElementById('errorMessage');
const urlValidation = document.getElementById('urlValidation');
const themeToggle = document.getElementById('themeToggle');
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
const hbBars = hamburger.querySelectorAll('.hb-bar');

const API_BASE_URL = 'http://localhost:5000/api';

// ===== Theme Toggle (Tailwind's class-based dark mode lives on <html>) =====
themeToggle.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateThemeIcon();
});

function updateThemeIcon() {
    const isDark = document.documentElement.classList.contains('dark');
    themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

// Load saved theme preference on first paint
(function loadSavedTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
    }
    updateThemeIcon();
})();

// ===== Mobile Menu =====
function openMobileMenu() {
    navLinks.classList.remove('hidden');
    navLinks.classList.add('flex');
    hbBars[0].classList.add('rotate-45', 'translate-y-[7px]');
    hbBars[1].classList.add('opacity-0');
    hbBars[2].classList.add('-rotate-45', '-translate-y-[7px]');
}

function closeMobileMenu() {
    navLinks.classList.add('hidden');
    navLinks.classList.remove('flex');
    hbBars[0].classList.remove('rotate-45', 'translate-y-[7px]');
    hbBars[1].classList.remove('opacity-0');
    hbBars[2].classList.remove('-rotate-45', '-translate-y-[7px]');
}

hamburger.addEventListener('click', () => {
    const isOpen = navLinks.classList.contains('flex');
    isOpen ? closeMobileMenu() : openMobileMenu();
});

// Close the mobile menu if the user taps outside the navbar
document.addEventListener('click', (e) => {
    if (!e.target.closest('nav')) {
        closeMobileMenu();
    }
});

// Close the mobile menu once a nav link is used
navLinks.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', closeMobileMenu);
});

// ===== URL Input Validation =====
urlInput.addEventListener('input', () => {
    const url = urlInput.value.trim();

    if (!url) {
        urlValidation.innerHTML = '';
        urlValidation.className = 'h-5 mt-1 text-xs flex items-center gap-1';
        return;
    }

    if (isValidURL(url)) {
        urlValidation.innerHTML = '<i class="fas fa-check-circle"></i> Valid URL';
        urlValidation.className = 'h-5 mt-1 text-xs flex items-center gap-1 text-emerald-200';
    } else {
        urlValidation.innerHTML = '<i class="fas fa-exclamation-circle"></i> Invalid URL';
        urlValidation.className = 'h-5 mt-1 text-xs flex items-center gap-1 text-red-200';
    }
});

// ===== Form submission =====
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = urlInput.value.trim();

    if (!url) {
        showError('Please enter a URL');
        return;
    }

    const urlWithProtocol = url.startsWith('http') ? url : 'https://' + url;

    if (!isValidURL(urlWithProtocol)) {
        showError('Please enter a valid URL');
        return;
    }

    await analyzeURL(urlWithProtocol);
});

// Fill example URLs
function fillExample(url) {
    urlInput.value = url;
    urlInput.dispatchEvent(new Event('input'));
}

// ===== API Call =====
async function analyzeURL(url) {
    hideAll();
    showLoading();

    try {
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url })
        });

        if (!response.ok) {
            const errorData = await response.json();
            showError(errorData.message || 'Failed to analyze URL');
            return;
        }

        const data = await response.json();
        displayResult(data);

    } catch (err) {
        console.error('Error:', err);
        showError('Failed to connect to server. Make sure backend is running on http://localhost:5000');
    }
}

// ===== Display Result =====
function displayResult(data) {
    hideAll();

    const isPhishing = data.prediction === 'Phishing';
    const confidence = data.confidence;

    const badgeClasses = isPhishing
        ? 'bg-gradient-to-br from-danger to-[#ff4444] text-white'
        : 'bg-gradient-to-br from-success to-[#37b24d] text-white';
    const icon = isPhishing ? '⚠️ Warning' : '✅ Safe';

    let html = `
        <div class="flex items-center justify-center gap-4 p-8 rounded-xl mb-8 text-2xl font-bold text-center ${badgeClasses}">
            ${icon}
        </div>

        <div class="mb-8 divide-y divide-slate-200 dark:divide-slate-700">
            <div class="flex justify-between py-4 first:pt-0">
                <span class="font-semibold text-slate-500 dark:text-slate-400">Status:</span>
                <span class="font-medium">${data.prediction}</span>
            </div>
            <div class="flex justify-between py-4 last:pb-0">
                <span class="font-semibold text-slate-500 dark:text-slate-400">URL:</span>
                <span class="font-medium break-all text-right ml-4">${data.url}</span>
            </div>
        </div>

        <div class="my-8 p-5 bg-slate-50 dark:bg-darkbg2 rounded-lg">
            <div class="flex justify-between mb-2 font-semibold">
                <span>Confidence Score</span>
                <span>${confidence}%</span>
            </div>
            <div class="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div class="confidence-fill h-full rounded-full bg-gradient-to-r from-primary to-secondary" style="width: 0%"></div>
            </div>
        </div>
    `;

    if (data.features) {
        html += `
            <div class="mt-8 pt-8 border-t-2 border-slate-200 dark:border-slate-700">
                <h4 class="flex items-center gap-2 mb-5 font-semibold"><i class="fas fa-chart-bar"></i> URL Analysis</h4>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        `;

        for (const [key, value] of Object.entries(data.features)) {
            const displayKey = key.replace(/_/g, ' ').toUpperCase();
            html += `
                <div class="bg-slate-50 dark:bg-darkbg2 border-l-4 border-primary rounded-md px-4 py-3 text-sm">
                    <div class="font-semibold mb-1">${displayKey}</div>
                    <div class="text-slate-500 dark:text-slate-400">${value}</div>
                </div>
            `;
        }

        html += `
                </div>
            </div>
        `;
    }

    html += `
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
            <button class="border-2 border-primary text-primary rounded-lg px-5 py-3 font-semibold hover:bg-primary hover:text-white transition-colors duration-300" onclick="resetForm()">
                <i class="fas fa-search"></i> Check Another
            </button>
            <button class="bg-primary text-white rounded-lg px-5 py-3 font-semibold hover:bg-secondary transition-colors duration-300" onclick="copyToClipboard('${data.url}')">
                <i class="fas fa-copy"></i> Copy URL
            </button>
        </div>
    `;

    resultContent.innerHTML = html;
    resultPanel.classList.remove('hidden');

    // Animate confidence bar in on the next tick
    setTimeout(() => {
        const fill = resultPanel.querySelector('.confidence-fill');
        fill.style.width = confidence + '%';
    }, 100);
}

// ===== Panel helpers =====
function showError(message) {
    hideAll();
    errorMessage.textContent = message;
    errorPanel.classList.remove('hidden');
}

function showLoading() {
    loadingPanel.classList.remove('hidden');
    loadingPanel.classList.add('flex');
}

function hideAll() {
    loadingPanel.classList.add('hidden');
    loadingPanel.classList.remove('flex');
    resultPanel.classList.add('hidden');
    errorPanel.classList.add('hidden');
    welcomePanel.classList.add('hidden');
}

function resetForm() {
    urlInput.value = '';
    urlValidation.innerHTML = '';
    urlValidation.className = 'h-5 mt-1 text-xs flex items-center gap-1';
    hideAll();
    welcomePanel.classList.remove('hidden');
    urlInput.focus();
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        const btn = event.target.closest('button');
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        setTimeout(() => {
            btn.innerHTML = originalHTML;
        }, 2000);
    });
}

// ===== URL Validation =====
function isValidURL(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// ===== Smooth scroll for in-page nav links =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#' && href !== '#home') {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                closeMobileMenu();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
});
