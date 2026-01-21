let performanceChart;
let apiData = {};
let currentTimeframe = 'daily'; // Default timeframe

/**
 * AUTHENTICATION & ONBOARDING LOGIC
 */

// DOM Elements
const userIn = document.getElementById('username');
const passIn = document.getElementById('password');
const loginBtn = document.getElementById('btn-login');

// Init: Check inputs on load & Setup Immersive Effects
document.addEventListener('DOMContentLoaded', () => {
    if (userIn && passIn) {
        userIn.addEventListener('input', validateLoginInputs);
        passIn.addEventListener('input', validateLoginInputs);
        validateLoginInputs(); // Initial check
    }

    // Immersive Effects
    initParallax();
    initMagneticButton();
});

function initParallax() {
    const overlay = document.querySelector('.auth-overlay');
    if (!overlay) return;

    document.addEventListener('mousemove', (e) => {
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;

        // Move background slightly opposite to mouse
        const moveX = (0.5 - x) * 20; // 20px max movement
        const moveY = (0.5 - y) * 20;

        // Update background position (preserving the grid size/repeat)
        // We only want to shift the radial gradients, but CSS multiple backgrounds are hard to target individually via JS standard style.
        // Easiest way: shift the whole container's background position.
        overlay.style.backgroundPosition = `calc(50% + ${moveX}px) calc(50% + ${moveY}px)`;
    });
}

function initMagneticButton() {
    const btn = document.getElementById('btn-login');
    if (!btn) return;

    btn.addEventListener('mousemove', (e) => {
        if (btn.classList.contains('btn-disabled')) return; // No magnetic if disabled

        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const deltaX = (x - centerX) / centerX;
        const deltaY = (y - centerY) / centerY;

        // Tilt Effect: Rotate X (up/down) and Y (left/right)
        // Max tilt: 15deg
        btn.style.transform = `perspective(1000px) rotateX(${-deltaY * 10}deg) rotateY(${deltaX * 10}deg) scale(1.05)`;
    });

    btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
    });
}

function validateLoginInputs() {
    if (!userIn || !passIn || !loginBtn) return;

    // Logic: Both > 3 chars
    const isValid = userIn.value.length > 3 && passIn.value.length > 3;

    if (isValid) {
        loginBtn.classList.remove('btn-disabled');
        loginBtn.disabled = false;
    } else {
        loginBtn.classList.add('btn-disabled');
        loginBtn.disabled = true;
    }
}

function handleLogin() {
    const user = userIn.value;
    const pass = passIn.value;

    if (user.length > 3 && pass.length > 3) {
        // Start Loading Animation
        loginBtn.innerHTML = '<div class="btn-loader"></div>';
        loginBtn.disabled = true; // Prevent double click

        // Simulate API delay (1.5s)
        setTimeout(() => {
            document.getElementById('step-login').style.display = 'none';
            document.getElementById('step-onboarding').style.display = 'block';
        }, 1500);
    }
}

/**
 * REDIRECT LOGIC: Redirects user to the secondary Discovery UI
 * This triggers when the user clicks 'Skip'
 */
function skipToDiscovery() {
    const usernameInput = document.getElementById('username');
    const username = (usernameInput && usernameInput.value) ? usernameInput.value : "Guest";

    // Redirects browser to the /discovery route handled by Flask
    window.location.href = `/discovery?user=${encodeURIComponent(username)}`;
}

function toggleDomain(element) {
    element.classList.toggle('selected');
}

function finishAuth() {
    const overlay = document.getElementById('auth-overlay');

    // Smooth transition to main analytical dashboard
    overlay.style.opacity = '0';
    setTimeout(() => {
        overlay.style.display = 'none';
        initDashboard();
    }, 500);
}

/**
 * TAB SWITCHING
 */
function switchTab(tabName) {
    document.querySelectorAll('.nav-links li').forEach(li => li.classList.remove('active'));
    document.getElementById('nav-' + tabName).classList.add('active');

    document.querySelectorAll('.tab-content').forEach(view => view.classList.remove('active'));
    document.getElementById('view-' + tabName).classList.add('active');

    const mainTitle = document.getElementById('main-title');
    const mainDesc = document.getElementById('main-desc');

    // Keep titles strictly analytical as requested
    if (tabName === 'overview') {
        mainTitle.innerText = "Analytics Dashboard";
        mainDesc.innerText = "Track your social media performance over time";
        if (performanceChart) performanceChart.resize();
    } else if (tabName === 'reports') {
        mainTitle.innerText = "Reports";
        mainDesc.innerText = "Deep dive into content metrics and audience behavior";
    } else if (tabName === 'audience') {
        mainTitle.innerText = "Audience Insights";
        mainDesc.innerText = "Global reach and geographic distribution";
        // Render map when tab becomes visible to ensure correct size
        setTimeout(() => {
            renderAudienceMap();
        }, 100);
    }
}

/**
 * DASHBOARD INITIALIZATION
 */
async function initDashboard() {
    console.log("Initializing dashboard...");
    try {
        const response = await fetch('/api/data');
        apiData = await response.json();
        console.log("API Data received:", apiData);

        renderStats();
        renderPerformanceChart();
        renderContentChart();
        renderHeatmap();
        renderTopPosts();
        renderLocationTable();
        renderCollaborations();

        // New Dashboard Functions
        renderAudienceMap();
        renderLanguages();

        console.log("Rendering Gauge Section...");
        renderGaugeSection();

        // Check for viral/trending posts
        checkViralStatus();

    } catch (error) {
        console.error("Error loading dashboard data:", error);
    }
}

/**
 * SOCIALPULSE VIRAL ALERT SYSTEM
 */
async function checkViralStatus() {
    try {
        const response = await fetch('/api/viral-status');
        const data = await response.json();

        console.log("Viral status check:", data);

        if (data.severity === 'viral' || data.severity === 'trending') {
            showViralAlert(data);
        }
    } catch (error) {
        console.error("Error checking viral status:", error);
    }
}

function showViralAlert(data) {
    // Remove existing toast if any
    const existingToast = document.querySelector('.viral-toast');
    if (existingToast) existingToast.remove();

    // Determine severity-specific content
    const isViral = data.severity === 'viral';
    const icon = isViral ? '🔥' : '📈';
    const title = isViral ? 'Viral Alert!' : 'Trending Now';
    const severityClass = data.severity;

    // Create toast element with SaaS-Elite structure
    const toast = document.createElement('div');
    toast.className = `viral-toast ${severityClass}`;
    toast.innerHTML = `
        <button class="toast-close" onclick="dismissViralAlert()">×</button>
        <div class="toast-header">
            <span class="toast-icon">${icon}</span>
            <span class="pulse-indicator"></span>
            <span class="toast-title">${title}</span>
        </div>
        <p class="toast-message">
            Post <strong>${data.post_id}</strong> is outperforming by <strong>${data.excess_percent}%</strong>. 
            Engagement peaking at <strong>${data.current_rate}%</strong> vs ${data.avg_rate}% avg.
        </p>
        <div class="toast-actions">
            <button class="toast-btn-primary" onclick="handleViralAction()">Interact</button>
            <button class="toast-btn-ghost" onclick="dismissViralAlert()">Dismiss</button>
        </div>
        <div class="toast-progress"></div>
    `;

    document.body.appendChild(toast);

    // Trigger spring bounce animation after DOM insertion
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            toast.classList.add('visible');
        });
    });

    // Auto-dismiss after 10 seconds (synced with progress bar)
    setTimeout(() => {
        dismissViralAlert();
    }, 10000);
}

function dismissViralAlert() {
    const toast = document.querySelector('.viral-toast');
    if (toast) {
        toast.classList.remove('visible');
        setTimeout(() => toast.remove(), 700);
    }
}

function handleViralAction() {
    console.log('Navigation triggered: Opening comments section');
    dismissViralAlert();
    // Future: Navigate to comments or engagement dashboard
    alert('Opening engagement dashboard... (Demo)');
}


function renderPerformanceChart() {
    const canvas = document.getElementById('performanceChart');
    if (!canvas) return;

    const perfCtx = canvas.getContext('2d');
    const orangeGradient = perfCtx.createLinearGradient(0, 0, 0, 400);
    orangeGradient.addColorStop(0, 'rgba(255, 159, 0, 0.3)');
    orangeGradient.addColorStop(1, 'rgba(255, 159, 0, 0)');

    const initialData = (apiData.trends && apiData.trends['Static']) ?
        (apiData.trends['Static']['daily'] || apiData.trends['Static']) : [];

    performanceChart = new Chart(perfCtx, {
        type: 'line',
        data: {
            labels: getLabelsForTimeframe('daily'),
            datasets: [{
                label: 'Trend',
                data: initialData,
                borderColor: '#ff9f00',
                backgroundColor: orangeGradient,
                fill: true,
                tension: 0.4,
                borderWidth: 4,
                pointRadius: 4,
                pointBackgroundColor: '#ff9f00'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { grid: { color: '#21262d' }, ticks: { color: '#8a8f98' } },
                x: { grid: { display: false }, ticks: { color: '#8a8f98' } }
            }
        }
    });
}

function renderContentChart() {
    const canvas = document.getElementById('contentChart');
    if (!canvas) return;

    const contentCtx = canvas.getContext('2d');
    new Chart(contentCtx, {
        type: 'bar',
        data: {
            labels: ['Reels', 'Carousels', 'Static', 'Stories'],
            datasets: [{
                data: [
                    apiData.content_performance?.['Reels'] || 0,
                    apiData.content_performance?.['Carousels'] || 0,
                    apiData.content_performance?.['Static'] || 0,
                    apiData.content_performance?.['Stories'] || 0
                ],
                backgroundColor: ['#00f2ea', '#a855f7', '#ff9f00', '#f43f5e'],
                borderRadius: 10,
                barThickness: 35
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { display: false },
                y: { ticks: { color: '#ffffff', font: { weight: '600' } }, grid: { display: false } }
            },
            onClick: (event, elements) => {
                if (elements.length > 0) {
                    updatePerformanceGraph(['Reels', 'Carousels', 'Static', 'Stories'][elements[0].index]);
                }
            }
        }
    });
}

/**
 * UPDATES & HELPERS
 */
function updateTimeframe(timeframe) {
    currentTimeframe = timeframe;
    document.querySelectorAll('.tgl-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.innerText.toLowerCase() === timeframe) btn.classList.add('active');
    });

    const activeTypeElem = document.getElementById('active-type');
    const activeType = activeTypeElem ? activeTypeElem.innerText : 'Static';

    if (apiData.trends?.[activeType]?.[timeframe]) {
        performanceChart.data.labels = getLabelsForTimeframe(timeframe);
        performanceChart.data.datasets[0].data = apiData.trends[activeType][timeframe];
        performanceChart.update();
    }
}

function updatePerformanceGraph(type) {
    const colorMap = {
        'Reels': '#00f2ea', 'Carousels': '#a855f7', 'Static': '#ff9f00', 'Stories': '#f43f5e',
        'Engagement': '#00f2ea', 'Reach': '#ff9f00', 'Followers': '#a855f7', 'Interactions': '#f43f5e'
    };
    const activeTypeElem = document.getElementById('active-type');
    if (activeTypeElem) activeTypeElem.innerText = type;

    const newData = (apiData.trends?.[type]?.[currentTimeframe]) || apiData.trends?.[type] || [];
    performanceChart.data.datasets[0].data = newData;

    const newColor = colorMap[type];
    performanceChart.data.datasets[0].borderColor = newColor;
    performanceChart.data.datasets[0].pointBackgroundColor = newColor;

    const ctx = document.getElementById('performanceChart').getContext('2d');
    const newGradient = ctx.createLinearGradient(0, 0, 0, 400);
    newGradient.addColorStop(0, newColor + '4D');
    newGradient.addColorStop(1, newColor + '00');
    performanceChart.data.datasets[0].backgroundColor = newGradient;

    performanceChart.update();
}

function getLabelsForTimeframe(timeframe) {
    if (timeframe === 'daily') return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    if (timeframe === 'weekly') return ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    if (timeframe === 'monthly') return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return [];
}

function renderLocationTable() {
    const tableBody = document.getElementById('location-details-body');
    if (!tableBody || !apiData.locations) return;

    tableBody.innerHTML = apiData.locations.map(loc => `
        <tr>
            <td>${loc.name}</td>
            <td>${loc.views?.toLocaleString() || 0}</td>
            <td>${loc.engagement || 0}%</td>
            <td><span class="trend-pill up">↑ ${loc.growth || 0}%</span></td>
        </tr>
    `).join('');
}

async function renderHeatmap() {
    const heatmap = document.getElementById('heatmap');
    const timeLabels = document.getElementById('time-labels');
    if (!heatmap || !timeLabels) return;

    // Render time labels (0-23)
    timeLabels.innerHTML = '';
    for (let i = 0; i < 24; i++) {
        const span = document.createElement('span');
        span.innerText = i;
        timeLabels.appendChild(span);
    }

    // Fetch heatmap data from API
    let heatmapData = [];
    try {
        const response = await fetch('/api/heatmap-data');
        heatmapData = await response.json();
    } catch (error) {
        console.error('Error fetching heatmap data:', error);
        // Fallback to empty grid
        for (let day = 0; day < 7; day++) {
            for (let hour = 0; hour < 24; hour++) {
                heatmapData.push({ day_index: day, day_name: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][day], hour: hour, active_users: 0 });
            }
        }
    }

    // Find max value for normalization
    const maxUsers = Math.max(...heatmapData.map(d => d.active_users), 1);

    // Clear and build grid with rows
    heatmap.innerHTML = '';

    // Create tooltip element
    let tooltip = document.getElementById('heatmap-tooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'heatmap-tooltip';
        tooltip.className = 'heatmap-tooltip';
        document.body.appendChild(tooltip);
    }

    // Group data by day for row creation
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    days.forEach((dayName, dayIndex) => {
        const row = document.createElement('div');
        row.className = 'heatmap-row';
        row.dataset.day = dayIndex;

        // Get data for this day
        const dayData = heatmapData.filter(d => d.day_index === dayIndex);

        for (let hour = 0; hour < 24; hour++) {
            const cellData = dayData.find(d => d.hour === hour) || { active_users: 0 };
            const square = document.createElement('div');
            square.className = 'heatmap-square';

            // Calculate level (0-4) based on active_users
            const ratio = cellData.active_users / maxUsers;
            let level = 0;
            if (ratio > 0.8) level = 4;
            else if (ratio > 0.6) level = 3;
            else if (ratio > 0.4) level = 2;
            else if (ratio > 0.15) level = 1;

            square.classList.add(`level-${level}`);
            square.dataset.day = dayName;
            square.dataset.hour = hour;
            square.dataset.users = cellData.active_users;

            // Hover events for tooltip and row highlighting
            square.addEventListener('mouseenter', (e) => {
                // Row highlighting
                heatmap.classList.add('row-hover');
                row.classList.add('active-row');

                // Show tooltip
                tooltip.innerHTML = `<strong>${cellData.active_users}</strong> active followers<br>${dayName}, ${hour}:00`;
                tooltip.classList.add('visible');
            });

            square.addEventListener('mousemove', (e) => {
                tooltip.style.left = `${e.clientX + 12}px`;
                tooltip.style.top = `${e.clientY - 10}px`;
            });

            square.addEventListener('mouseleave', () => {
                heatmap.classList.remove('row-hover');
                row.classList.remove('active-row');
                tooltip.classList.remove('visible');
            });

            row.appendChild(square);
        }

        heatmap.appendChild(row);
    });
}

function renderTopPosts() {
    const container = document.getElementById('top-posts-container');
    if (!container || !apiData.top_posts) return;
    container.innerHTML = apiData.top_posts.map(post => `
        <li>
            <div class="post-img ${post.type.toLowerCase()}">${post.type === 'Reel' ? '🎬' : '📸'}</div>
            <div class="post-info">
                <strong>${post.title}</strong>
                <small>${post.date}</small>
            </div>
            <div class="post-stats">${post.likes} ❤️</div>
        </li>
    `).join('');
}

function renderStats() {
    if (!apiData.stats) return;

    const fields = ['engagement', 'reach', 'followers', 'interactions'];

    fields.forEach(field => {
        const data = apiData.stats[field];
        if (data) {
            const statEl = document.getElementById(`stat-${field}`);
            const trendEl = document.getElementById(`trend-${field}`);

            if (statEl) statEl.innerText = data.value;
            if (trendEl) {
                trendEl.innerText = data.trend;
                // Update color/arrow based on trend content
                if (data.trend.includes('+') || data.trend.includes('↗')) {
                    trendEl.className = 'trend-pill up';
                } else {
                    trendEl.className = 'trend-pill down';
                }
            }
        }
    });
}

function renderAudienceMap() {
    const mapContainer = document.getElementById('world-map');
    if (!mapContainer) return;
    mapContainer.innerHTML = '';

    new jsVectorMap({
        selector: "#world-map",
        map: "world",
        backgroundColor: "transparent",
        zoomButtons: false,
        regionStyle: {
            initial: { fill: "#2C2D33", stroke: "#15161B", strokeWidth: 1, fillOpacity: 1 },
            hover: { fill: "#00E096", cursor: 'pointer' },
            selected: { fill: "#00E096" }
        },
        selectedRegions: apiData.audience_map ? apiData.audience_map.regions.map(r => r.code) : []
    });
}

function renderLanguages() {
    const container = document.getElementById('language-list');
    if (!container || !apiData.languages) return;

    container.innerHTML = apiData.languages.map(lang => `
        <div style="margin-bottom: 12px;">
            <div style="display:flex; justify-content:space-between; margin-bottom:5px; font-size:14px; color: #fff;">
                <span>${lang.lang}</span>
                <span>${lang.percent}%</span>
            </div>
            <div style="background: #2C2D33; height: 6px; border-radius: 3px; overflow: hidden;">
                <div style="width: ${lang.percent}%; background: ${lang.color}; height: 100%;"></div>
            </div>
        </div>
    `).join('');
}

function renderCollaborations() {
    const container = document.getElementById('collab-container');
    if (!container || !apiData.collaborators) return;

    container.innerHTML = apiData.collaborators.map(collab => `
        <div class="collab-card" style="background: #1e2533; padding: 20px; border-radius: 12px; border: 1px solid #2e3644; text-align: center; transition: transform 0.2s; cursor: pointer;">
            <img src="${collab.img}" alt="${collab.name}" style="width: 80px; height: 80px; border-radius: 50%; margin-bottom: 15px; border: 2px solid #00f2ea;">
            <h4 style="margin: 0 0 5px; font-size: 1.1rem; color: #fff;">${collab.name}</h4>
            <p style="color: #8a8f98; font-size: 0.9rem; margin: 0 0 15px;">${collab.niche} • ${collab.followers}</p>
            <div style="background: rgba(16, 185, 129, 0.1); color: #10b981; display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; margin-bottom: 15px;">
                ${collab.match}% Match
            </div>
            <button style="width: 100%; padding: 10px; background: linear-gradient(135deg, #00f2ea, #a855f7); border: none; border-radius: 8px; color: white; font-weight: 600; cursor: pointer; transition: opacity 0.2s;" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">Connect</button>
        </div>
    `).join('');
}

/**
 * ENGAGEMENT WIDGET LOGIC
 */
let widgetHelper = {
    gaugeCtx: null,
    currentKey: 'last_7d',
    currentValue: 0,
    targetValue: 0,
    animationFrame: null
};

function renderGaugeSection() {
    // 1. Init Canvases
    const gCanvas = document.getElementById('engagementGauge');

    if (gCanvas) widgetHelper.gaugeCtx = gCanvas.getContext('2d');

    // 2. Load Data for default key
    switchWidgetPeriod('last_7d');
}

function switchWidgetPeriod(key) {
    if (!apiData.engagement_widget || !apiData.engagement_widget[key]) return;

    widgetHelper.currentKey = key;
    const data = apiData.engagement_widget[key];

    // Update UI Tabs
    document.querySelectorAll('.w-tab').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById(`wt-${key}`);
    if (btn) btn.classList.add('active');

    // Update Text Details
    updateWidgetText(data);

    // Animate Gauge
    animateGauge(data.value);
}

function updateWidgetText(data) {
    const valEl = document.getElementById('w-value');
    const statusTextEl = document.getElementById('w-status-text');
    const benchmarkEl = document.getElementById('w-benchmark');
    const trendEl = document.getElementById('w-trend');
    const dateEl = document.getElementById('w-date');
    const insightEl = document.getElementById('w-insight');
    const actionEl = document.getElementById('w-action');

    if (valEl) valEl.innerText = data.value + '%';

    // Status Logic
    let statusColor = '#facc15';
    if (data.status === 'excellent') statusColor = '#10b981';
    else if (data.status === 'average') statusColor = '#facc15';
    else if (data.status === 'poor') statusColor = '#f43f5e';

    if (statusTextEl) {
        statusTextEl.innerText = data.status_label;
        statusTextEl.style.color = statusColor;
    }

    if (benchmarkEl) benchmarkEl.innerText = data.benchmark_text;

    // Trend
    if (trendEl) {
        const arrow = data.trend_dir === 'up' ? '↑' : '↓';
        // "↑ 0.8% · Reels drove growth"
        trendEl.innerText = `${arrow} ${data.trend_value}% · ${data.trend_reason}`;
        trendEl.className = `trend-pill ${data.trend_dir}`;
    }

    if (dateEl) dateEl.innerText = data.date_range;
    if (insightEl) insightEl.innerText = data.insight;

    if (actionEl && data.action_hint) {
        actionEl.innerText = data.action_hint;
    }
}

function animateGauge(target) {
    widgetHelper.targetValue = target;
    const startTime = performance.now();
    const startVal = widgetHelper.currentValue;
    const duration = 1200; // Slower, smoother

    function loop(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3); // Cubic ease out

        const current = startVal + (target - startVal) * ease;
        widgetHelper.currentValue = current;

        // 1. Draw Gauge Arc (Background + Value)
        drawGauge(current);

        // 2. Rotate DOM Needle (CSS)
        const maxVal = 10;
        const clamped = Math.min(current, maxVal);
        const ratio = clamped / maxVal;
        const angle = -90 + (ratio * 180); // -90deg to +90deg

        const needle = document.getElementById('gauge-needle');
        if (needle) {
            // Anchor at bottom (-100% Y translate), Pivot at Top:85px
            needle.style.transform = `translate(-50%, -100%) rotate(${angle}deg)`;
        }

        if (progress < 1) {
            widgetHelper.animationFrame = requestAnimationFrame(loop);
        }
    }

    if (widgetHelper.animationFrame) cancelAnimationFrame(widgetHelper.animationFrame);
    widgetHelper.animationFrame = requestAnimationFrame(loop);
}

function drawGauge(value) {
    const ctx = widgetHelper.gaugeCtx;
    const canvas = document.getElementById('engagementGauge');
    if (!ctx || !canvas) return;

    const width = canvas.width;
    const height = canvas.height;

    // Adjusted Architecture for "Pivot A towards B"
    const cx = width / 2;
    const cy = 85;  // Moved UP (approx center)
    const radius = 75; // Slightly reduced to fit top gap

    ctx.clearRect(0, 0, width, height);

    // 1. Background Track (Deep Glass)
    ctx.beginPath();
    ctx.arc(cx, cy, radius, Math.PI, 2 * Math.PI);
    ctx.lineWidth = 16;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.stroke();

    // 2. Dynamic "Cool to Hot" Gradient
    const maxVal = 10;
    const clampedVal = Math.min(value, maxVal);
    const ratio = clampedVal / maxVal;
    const endAngle = Math.PI + (Math.PI * ratio);

    const grad = ctx.createLinearGradient(0, 0, width, 0);

    // Cool -> Hot Logic
    if (value < 4) {
        // Ice Cool (Cyan -> Blue)
        grad.addColorStop(0, '#22d3ee');
        grad.addColorStop(1, '#3b82f6');
        setGlowColor('rgba(34, 211, 238, 0.3)'); // Cyan Glow
    } else if (value < 7) {
        // Electric (Blue -> Purple)
        grad.addColorStop(0, '#3b82f6');
        grad.addColorStop(1, '#a855f7');
        setGlowColor('rgba(168, 85, 247, 0.3)'); // Purple Glow
    } else {
        // Hot (Purple -> Neon Pink)
        grad.addColorStop(0, '#a855f7');
        grad.addColorStop(1, '#ec4899');
        setGlowColor('rgba(236, 72, 153, 0.4)'); // Pink Glow
    }

    // 3. Value Arc
    ctx.beginPath();
    ctx.arc(cx, cy, radius, Math.PI, endAngle);
    ctx.lineWidth = 16;
    ctx.lineCap = 'round';
    ctx.strokeStyle = grad;

    // Extra Neon Glow on the Arc itself
    ctx.shadowBlur = 15;
    ctx.shadowColor = grad;
    ctx.stroke();

    // Reset Shadow
    ctx.shadowBlur = 0;
}

function setGlowColor(color) {
    const section = document.querySelector('.gauge-section');
    if (section) {
        // Dynamic drop-shadow on the container
        section.style.filter = `drop-shadow(0 0 20px ${color})`;
    }
}
document.addEventListener('DOMContentLoaded', () => {
    const trigger = document.getElementById('chatbot-trigger');
    const windowAi = document.getElementById('chat-window');
    const sendBtn = document.getElementById('send-msg');
    const userInput = document.getElementById('user-input');
    const chatMessages = document.getElementById('chat-messages');

    // --- VISIBILITY LOGIC ---
    const domainItems = document.querySelectorAll('.domain-item');
    domainItems.forEach(item => {
        item.addEventListener('click', () => {
            setTimeout(() => {
                if (trigger) {
                    trigger.style.display = 'flex';
                    setTimeout(() => { trigger.style.opacity = '1'; }, 10);
                }
            }, 1000);
        });
    });

    // --- HEATMAP LOGIC ---
    const heatMapLogic = {
        getBestTime: (dayInput) => {
            const day = dayInput.toLowerCase();
            if (day.includes("monday") || day === "m")
                return "On <b class='highlight'>Mondays</b>, your peak activity is early at <b class='highlight'>7:00 AM</b>. There's another small window at <b class='highlight'>10:00 PM</b>.";
            if (day.includes("sunday") || day === "s")
                return "Your <b class='highlight'>Sunday</b> is incredible! Audience activity is high almost all day, specifically from <b class='highlight'>1:00 PM straight through to 11:00 PM</b>.";
            if (day.includes("friday") || day === "f")
                return "On <b class='highlight'>Fridays</b>, aim for the mid-afternoon surge around <b class='highlight'>3:00 PM</b>.";
            return "Looking at your overall heatmap, <b class='highlight'>Sunday</b> is your strongest day. Your most consistent daily window across the week is late night, specifically <b class='highlight'>11:00 PM</b>.";
        },
        getWorstTime: () => {
            return "Your <b class='highlight'>worst times</b> (the black zones) are <b class='highlight'>Tuesday and Wednesday mornings between 4:00 AM and 8:00 AM</b>, and <b class='highlight'>Saturday late night</b>. Avoid posting during these gaps as engagement is nearly zero.";
        }
    };

    // --- DOMAIN KNOWLEDGE (Content & Target Audience) ---
    const domainKnowledge = {
        "Finance": {
            content: "Upload <b class='highlight'>Market Wrap-up Reels</b>. Your audience saves content 40% more when it includes actionable tips.",
            audience: "Your target audience consists of <b class='highlight'>Young Professionals (24-35)</b> and <b class='highlight'>First-time Investors</b> looking for wealth-building strategies. They value transparency and data over hype."
        },
        "Fashion": {
            content: "Your reach is peaking on <b class='highlight'>Get Ready With Me videos</b>. Try a Weekly Outfit Rotation reel.",
            audience: "Your target audience is <b class='highlight'>Gen Z and Millennial Trend-seekers</b> interested in sustainable fashion and capsule wardrobes. They engage most with high-aesthetic, fast-paced editing."
        },
        "Tech & Gadgets": {
            content: "High engagement on <b class='highlight'>spec-comparison shorts</b>. Upload a Top 3 hidden features video.",
            audience: "Your target audience is <b class='highlight'>Tech Enthusiasts</b> and <b class='highlight'>Early Adopters</b>. They look for unbiased reviews and 'Easter Eggs' in new software or hardware."
        },
        "Lifestyle": {
            content: "Followers love <b class='highlight'>vlog-style content</b>. Upload a Day in the life reel.",
            audience: "Your target audience is primarily <b class='highlight'>Women aged 18-30</b> looking for aesthetic inspiration, productivity hacks, and relatable daily struggles."
        },
        "General": {
            content: "Upload <b class='highlight'>short-form vertical video</b> as your analytics show 25% higher reach on video.",
            audience: "Your current target audience is <b class='highlight'>General Content Consumers</b>. To grow faster, try narrowing your focus to a specific sub-niche based on your top-performing post."
        }
    };

    function getSelectedDomain() {
        const selectedEl = document.querySelector('.domain-item.selected');
        return selectedEl ? selectedEl.textContent.trim() : "General";
    }

    if (trigger && windowAi) {
        trigger.onclick = () => windowAi.classList.toggle('active');
    }

    function sendMessage() {
        const text = userInput.value.trim().toLowerCase();
        if (text === "") return;

        const userDiv = document.createElement('div');
        userDiv.className = 'message user';
        userDiv.textContent = userInput.value.trim();
        chatMessages.appendChild(userDiv);

        userInput.value = "";
        chatMessages.scrollTop = chatMessages.scrollHeight;

        setTimeout(() => {
            const aiDiv = document.createElement('div');
            aiDiv.className = 'message ai';
            const domain = getSelectedDomain();
            const data = domainKnowledge[domain] || domainKnowledge["General"];
            let response = "";

            // 1. Target Audience Logic
            if (text.includes("audience") || text.includes("target")) {
                response = `Based on your <b class='highlight'>${domain}</b> metrics, here is your profile:<br><br>${data.audience}`;
            }
            // 2. Heatmap Logic
            else if (text.includes("time") || text.includes("when") || text.includes("post") || text.includes("day")) {
                if (text.includes("worst") || text.includes("bad")) {
                    response = heatMapLogic.getWorstTime();
                } else {
                    response = heatMapLogic.getBestTime(text);
                }
            }
            // 3. Content Suggestion Logic
            else if (text.includes("content") || text.includes("upload") || text.includes("suggest")) {
                response = `Based on your <b class='highlight'>${domain}</b> niche and current stats: <br><br>${data.content}`;
            }
            else {
                response = `I'm your <b class='highlight'>${domain}</b> assistant. You can ask me about your <b class='highlight'>Target Audience</b>, <b class='highlight'>Best Posting Times</b>, or <b class='highlight'>Content Ideas</b>.`;
            }

            aiDiv.innerHTML = response;
            chatMessages.appendChild(aiDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 800);
    }

    if (sendBtn) sendBtn.onclick = sendMessage;
    if (userInput) {
        userInput.onkeypress = (e) => { if (e.key === 'Enter') sendMessage(); };
    }
});