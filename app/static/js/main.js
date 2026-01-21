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
        alert("Please enter a username and password to continue.");
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

        // Update Profile Name
        const usernameInput = document.getElementById('username');
        const username = (usernameInput && usernameInput.value) ? usernameInput.value : "Guest";
        const navName = document.getElementById('nav-username-display');
        const ddName = document.getElementById('dd-username-display');

        if (navName) navName.innerText = username;
        if (ddName) ddName.innerText = username;
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