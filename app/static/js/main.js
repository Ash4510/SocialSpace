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

    // AI Chatbot Selectors (Integrated)
    const sendBtn = document.getElementById('ai-send-msg');
    const userInput = document.getElementById('ai-user-input');

    if (sendBtn) sendBtn.onclick = sendMessage;
    if (userInput) {
        userInput.onkeypress = (e) => { if (e.key === 'Enter') sendMessage(); };
    }
});

function initParallax() {
    const overlay = document.querySelector('.auth-overlay');
    if (!overlay) return;

    document.addEventListener('mousemove', (e) => {
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;

        const moveX = (0.5 - x) * 20; 
        const moveY = (0.5 - y) * 20;

        overlay.style.backgroundPosition = `calc(50% + ${moveX}px) calc(50% + ${moveY}px)`;
    });
}

function initMagneticButton() {
    const btn = document.getElementById('btn-login');
    if (!btn) return;

    btn.addEventListener('mousemove', (e) => {
        if (btn.classList.contains('btn-disabled')) return; 

        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const deltaX = (x - centerX) / centerX;
        const deltaY = (y - centerY) / centerY;

        btn.style.transform = `perspective(1000px) rotateX(${-deltaY * 10}deg) rotateY(${deltaX * 10}deg) scale(1.05)`;
    });

    btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
    });
}

function validateLoginInputs() {
    if (!userIn || !passIn || !loginBtn) return;

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
        loginBtn.innerHTML = '<div class="btn-loader"></div>';
        loginBtn.disabled = true; 

        setTimeout(() => {
            document.getElementById('step-login').style.display = 'none';
            document.getElementById('step-onboarding').style.display = 'block';
        }, 1500);
    }
}

function skipToDiscovery() {
    const usernameInput = document.getElementById('username');
    const username = (usernameInput && usernameInput.value) ? usernameInput.value : "Guest";
    window.location.href = `/discovery?user=${encodeURIComponent(username)}`;
}

function toggleDomain(element) {
    element.classList.toggle('selected');
    
    // Automatically show chatbot trigger when a domain is picked
    const trigger = document.getElementById('chatbot-trigger');
    setTimeout(() => {
        if(trigger) {
            trigger.classList.add('visible');
        }
    }, 1000);
}

function finishAuth() {
    const overlay = document.getElementById('auth-overlay');
    overlay.style.opacity = '0';
    setTimeout(() => {
        overlay.style.display = 'none';
        initDashboard();
    }, 500);
}

/**
 * TAB SWITCHING (UPDATED WITH HEADER LOGIC)
 */
function switchTab(tabName) {
    document.querySelectorAll('.nav-links li').forEach(li => li.classList.remove('active'));
    document.getElementById('nav-' + tabName).classList.add('active');

    // Handle visibility and Flex for AI tab
    document.querySelectorAll('.tab-content').forEach(view => {
        view.classList.remove('active');
        view.style.display = 'none';
    });
    
    const targetView = document.getElementById('view-' + tabName);
    if (targetView) {
        targetView.classList.add('active');
        // AI needs Flex for its layout, others use block
        targetView.style.display = (tabName === 'ai') ? 'flex' : 'block';
    }

    const mainTitle = document.getElementById('main-title');
    const mainDesc = document.getElementById('main-desc');

    if (tabName === 'overview') {
        mainTitle.innerText = "Analytics Dashboard";
        mainDesc.innerText = "Track your social media performance over time";
        if (performanceChart) performanceChart.resize();
    } else if (tabName === 'reports') {
        mainTitle.innerText = "Performance Reports";
        mainDesc.innerText = "Deep dive into content metrics and audience behavior";
    } else if (tabName === 'audience') {
        mainTitle.innerText = "Audience Insights";
        mainDesc.innerText = "Global reach and geographic distribution";
        setTimeout(() => {
            renderAudienceMap();
        }, 100);
    } else if (tabName === 'ai') {
        mainTitle.innerText = "AI Strategy Insights";
        mainDesc.innerText = "AI-powered content optimization and growth strategy";
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
        renderAudienceMap();
        renderLanguages();
        renderGaugeSection();

    } catch (error) {
        console.error("Error loading dashboard data:", error);
    }
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

function renderHeatmap() {
    const heatmap = document.getElementById('heatmap');
    const timeLabels = document.getElementById('time-labels');
    if (!heatmap || !timeLabels) return;

    timeLabels.innerHTML = '';
    for (let i = 1; i <= 24; i++) {
        const span = document.createElement('span');
        span.innerText = i;
        timeLabels.appendChild(span);
    }

    heatmap.innerHTML = '';
    for (let i = 0; i < 168; i++) {
        const dot = document.createElement('div');
        dot.className = 'dot';
        if (Math.random() > 0.6) {
            dot.classList.add('active');
            dot.style.opacity = Math.random() * (1 - 0.4) + 0.4;
        }
        heatmap.appendChild(dot);
    }
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
        <div class="collab-card" style="background: #1e2533; padding: 20px; border-radius: 12px; border: 1px solid #2e3644; text-align: center;">
            <img src="${collab.img}" alt="${collab.name}" style="width: 80px; height: 80px; border-radius: 50%; margin-bottom: 15px; border: 2px solid #00f2ea;">
            <h4 style="margin: 0 0 5px; font-size: 1.1rem; color: #fff;">${collab.name}</h4>
            <p style="color: #8a8f98; font-size: 0.9rem; margin: 0 0 15px;">${collab.niche} • ${collab.followers}</p>
            <div style="background: rgba(16, 185, 129, 0.1); color: #10b981; display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; margin-bottom: 15px;">
                ${collab.match}% Match
            </div>
            <button style="width: 100%; padding: 10px; background: linear-gradient(135deg, #00f2ea, #a855f7); border: none; border-radius: 8px; color: white; font-weight: 600;">Connect</button>
        </div>
    `).join('');
}

/**
 * GAUGE LOGIC
 */
let widgetHelper = {
    gaugeCtx: null,
    currentKey: 'last_7d',
    currentValue: 0,
    targetValue: 0,
    animationFrame: null
};

function renderGaugeSection() {
    const gCanvas = document.getElementById('engagementGauge');
    if (gCanvas) widgetHelper.gaugeCtx = gCanvas.getContext('2d');
    switchWidgetPeriod('last_7d');
}

function switchWidgetPeriod(key) {
    if (!apiData.engagement_widget || !apiData.engagement_widget[key]) return;
    widgetHelper.currentKey = key;
    const data = apiData.engagement_widget[key];
    document.querySelectorAll('.w-tab').forEach(b => b.classList.remove('active'));
    if (document.getElementById(`wt-${key}`)) document.getElementById(`wt-${key}`).classList.add('active');
    updateWidgetText(data);
    animateGauge(data.value);
}

function updateWidgetText(data) {
    const valEl = document.getElementById('w-value');
    const statusTextEl = document.getElementById('w-status-text');
    if (valEl) valEl.innerText = data.value + '%';
    if (statusTextEl) statusTextEl.innerText = data.status_label;
    if (document.getElementById('w-benchmark')) document.getElementById('w-benchmark').innerText = data.benchmark_text;
    if (document.getElementById('w-date')) document.getElementById('w-date').innerText = data.date_range;
}

function animateGauge(target) {
    widgetHelper.targetValue = target;
    const startTime = performance.now();
    const startVal = widgetHelper.currentValue;
    function loop(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / 1200, 1);
        const current = startVal + (target - startVal) * progress;
        widgetHelper.currentValue = current;
        drawGauge(current);
        const angle = -90 + ((current / 10) * 180);
        const needle = document.getElementById('gauge-needle');
        if (needle) needle.style.transform = `translate(-50%, -100%) rotate(${angle}deg)`;
        if (progress < 1) widgetHelper.animationFrame = requestAnimationFrame(loop);
    }
    if (widgetHelper.animationFrame) cancelAnimationFrame(widgetHelper.animationFrame);
    widgetHelper.animationFrame = requestAnimationFrame(loop);
}

function drawGauge(value) {
    const ctx = widgetHelper.gaugeCtx;
    const canvas = document.getElementById('engagementGauge');
    if (!ctx || !canvas) return;
    const cx = canvas.width / 2;
    const cy = 85;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.arc(cx, cy, 75, Math.PI, 2 * Math.PI);
    ctx.lineWidth = 16;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, 75, Math.PI, Math.PI + (Math.PI * (value / 10)));
    ctx.strokeStyle = '#a855f7';
    ctx.stroke();
}

/**
 * AI CHATBOT KNOWLEDGE & MESSAGING
 */
const heatMapLogic = {
    getBestTime: (dayInput) => {
        const day = dayInput.toLowerCase();
        if (day.includes("monday") || day === "m") return "On <b class='highlight'>Mondays</b>, peak at <b class='highlight'>7:00 AM</b>.";
        if (day.includes("sunday") || day === "s") return "Your <b class='highlight'>Sunday</b> is incredible! <b class='highlight'>1:00 PM to 11:00 PM</b>.";
        return "<b class='highlight'>Sunday</b> is your strongest day.";
    },
    getWorstTime: () => "Your <b class='highlight'>worst times</b> are <b class='highlight'>Tue/Wed (4AM-8AM)</b>."
};

const domainKnowledge = {
    "Finance": { content: "Market Wrap-up Reels.", audience: "Young Professionals (24-35)." },
    "Fashion": { content: "Weekly Outfit Rotation reel.", audience: "Gen Z Trend-seekers." },
    "Tech & Gaming": { content: "Spec-comparison shorts.", audience: "Tech Enthusiasts." },
    "Lifestyle": { content: "Day in the life reel.", audience: "Women aged 18-30." },
    "General": { content: "Short-form vertical video.", audience: "General Content Consumers." }
};

function getSelectedDomain() {
    const selectedEl = document.querySelector('.domain-item.selected');
    return selectedEl ? selectedEl.textContent.trim() : "General";
}

function sendMessage() {
    const userInput = document.getElementById('ai-user-input');
    const chatMessages = document.getElementById('ai-chat-messages');
    const originalText = userInput.value.trim();
    if (originalText === "") return;

    const userDiv = document.createElement('div');
    userDiv.className = 'message user';
    userDiv.textContent = originalText;
    chatMessages.appendChild(userDiv);

    userInput.value = "";
    chatMessages.scrollTop = chatMessages.scrollHeight;

    setTimeout(() => {
        const aiDiv = document.createElement('div');
        aiDiv.className = 'message ai';
        const domain = getSelectedDomain();
        const data = domainKnowledge[domain] || domainKnowledge["General"];
        const text = originalText.toLowerCase();

        let response = "";
        if (text.includes("audience")) response = data.audience;
        else if (text.includes("time")) response = text.includes("worst") ? heatMapLogic.getWorstTime() : heatMapLogic.getBestTime(text);
        else if (text.includes("content")) response = data.content;
        else response = `I'm your assistant. Ask about Audience or Timing.`;

        aiDiv.innerHTML = response;
        chatMessages.appendChild(aiDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 800);
}

window.clearChat = () => {
    document.getElementById('ai-chat-messages').innerHTML = '<div class="message ai">New session started.</div>';
};