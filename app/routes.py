from flask import Blueprint, render_template, jsonify, request
from app import data_service
import random

bp = Blueprint('main', __name__)

# --- CODEATHON ROUTES (Preserved) ---

@bp.route('/')
def index():
    return render_template('index.html')

@bp.route('/discovery')
def discovery():
    username = request.args.get('user', 'Creator')
    return render_template('discovery.html', username=username)

@bp.route('/api/creators/<domain>')
def get_discovery_data(domain):
    creators_db = {
        "tech": [
            {"name": "Marques Brownlee", "video": "The Truth About AI", "views": "4.2M", "likes": "210K", "platform": "YouTube"},
            {"name": "Arun Maini", "video": "S24 Ultra vs iPhone 15", "views": "2.8M", "likes": "150K", "platform": "YouTube"},
            {"name": "iJustine", "video": "Apple Vision Pro Setup", "views": "1.1M", "likes": "85K", "platform": "Instagram"}
        ],
        "fitness": [
            {"name": "Chris Heria", "video": "No Equipment Workout", "views": "15M", "likes": "900K", "platform": "YouTube"},
            {"name": "Lean Beef Patty", "video": "Full Body Routine", "views": "1.4M", "likes": "300K", "platform": "TikTok"},
            {"name": "Jeff Nippard", "video": "Science of Hypertrophy", "views": "3.2M", "likes": "240K", "platform": "YouTube"}
        ],
        "cooking": [
            {"name": "Joshua Weissman", "video": "Making the Best Burger", "views": "6.7M", "likes": "420K", "platform": "YouTube"},
            {"name": "Gordon Ramsay", "video": "Perfect Scrambled Eggs", "views": "22M", "likes": "1.1M", "platform": "YouTube"}
        ]
    }
    result = creators_db.get(domain.lower(), [])
    return jsonify(result)

# --- MERGED / UPDATED DASHBOARD DATA API ---

@bp.route('/api/data')
def get_data():
    # 1. Fetch Metrics from CSV (Dashboard Logic)
    metrics = data_service.get_metrics()
    
    # If CSV fails or is empty, use default mock data
    if "error" in metrics:
         metrics = {
            "engagement": {"value": "284.8K", "trend": "+12.5%"},
            "reach": {"value": "1.3M", "trend": "+8.3%"},
            "followers": {"value": "15.4K", "trend": "+23.1%"},
            "interactions": {"value": "89.3K", "trend": "-2.4%"}
        }

    # 2. Existing Mock Data (Codeathon)
    data = {
        "stats": metrics, # Injected from CSV analysis
        "trends": {
            "Reels": {
                "daily": [65, 72, 68, 85, 92, 110, 105],
                "weekly": [450, 520, 480, 600],
                "monthly": [1800, 2100, 1950, 2400, 2800, 3100]
            },
            "Carousels": {
                "daily": [40, 45, 38, 55, 60, 58, 62],
                "weekly": [280, 310, 290, 350],
                "monthly": [1100, 1250, 1180, 1400, 1550, 1600]
            },
            "Static": {
                "daily": [25, 30, 28, 45, 52, 48, 60],
                "weekly": [180, 220, 210, 250],
                "monthly": [750, 820, 780, 950, 1100, 1200]
            },
            "Stories": {
                "daily": [80, 95, 85, 110, 120, 130, 125],
                "weekly": [600, 680, 650, 750],
                "monthly": [2500, 2800, 2700, 3100, 3400, 3800]
            },
            # NEW: Trends for Stats Cards
            "Engagement": {
                "daily": [1200, 1350, 1250, 1400, 1500, 1600, 1550],
                "weekly": [8500, 9200, 8800, 9500],
                "monthly": [35000, 38000, 36000, 40000, 42000, 45000]
            },
            "Reach": {
                "daily": [5000, 5500, 5200, 6000, 6500, 7000, 6800],
                "weekly": [35000, 38000, 36000, 40000],
                "monthly": [150000, 160000, 155000, 170000, 180000, 190000]
            },
            "Followers": {
                "daily": [15, 20, 18, 25, 30, 35, 32],
                "weekly": [100, 120, 110, 130],
                "monthly": [400, 450, 420, 500, 550, 600]
            },
            "Interactions": {
                "daily": [300, 350, 320, 400, 450, 500, 480],
                "weekly": [2000, 2200, 2100, 2500],
                "monthly": [8000, 8500, 8200, 9000, 9500, 10000]
            }
        },
        "content_performance": {
            "Reels": 45000,
            "Carousels": 30000,
            "Static": 18000,
            "Stories": 25000
        },
        "top_posts": [
            {"title": "Product Launch Reel", "type": "Reel", "date": "Mar 15", "likes": "38.5K", "views": "320K"},
            {"title": "Growth Strategy Guide", "type": "Carousel", "date": "Mar 12", "likes": "25.8K", "views": "185K"},
            {"title": "Spring Collection", "type": "Static", "date": "Mar 10", "likes": "12.1K", "views": "95K"}
        ],
        "locations": [ # To be replaced by Map data if needed, but keeping for Table view
            {"name": "United States", "views": 542000, "engagement": 4.2, "growth": 12},
            {"name": "India", "views": 215000, "engagement": 6.8, "growth": 18},
            {"name": "Brazil", "views": 98000, "engagement": 5.1, "growth": 8},
            {"name": "United Kingdom", "views": 85000, "engagement": 3.9, "growth": 5},
            {"name": "Germany", "views": 72000, "engagement": 4.5, "growth": 10}
        ],
        # NEW: Audience & Language Data (From Dashboard Project)
        "audience_map": {
            "regions": [
                {"country": "United States", "code": "US", "percent": 21.2},
                {"country": "India", "code": "IN", "percent": 9.95},
                {"country": "United Kingdom", "code": "GB", "percent": 32.47},
                {"country": "Australia", "code": "AU", "percent": 67.09}
            ]
        },
        "languages": [
            {"lang": "English", "percent": 30.1, "color": "#0095FF"},
            {"lang": "Portuguese", "percent": 20.9, "color": "#00E096"},
            {"lang": "Spanish", "percent": 13.1, "color": "#FF8F50"},
            {"lang": "Vietnamese", "percent": 4.0, "color": "#FF3B30"},
        ],
        "collaborators": [
            {"name": "TechSavvy", "niche": "Technology", "match": 95, "followers": "250K", "img": "https://api.dicebear.com/7.x/avataaars/svg?seed=TechSavvy"},
            {"name": "GameMasterX", "niche": "Gaming", "match": 88, "followers": "180K", "img": "https://api.dicebear.com/7.x/avataaars/svg?seed=GameMasterX"},
            {"name": "DailyGadgets", "niche": "Tech Review", "match": 82, "followers": "320K", "img": "https://api.dicebear.com/7.x/avataaars/svg?seed=DailyGadgets"},
            {"name": "CodeLife", "niche": "Development", "match": 78, "followers": "95K", "img": "https://api.dicebear.com/7.x/avataaars/svg?seed=CodeLife"}
        ]
    }
    return jsonify(data)

# --- DASHBOARD PROJECT ROUTES (Integrated) ---

@bp.route('/analytics')
def analytics():
    # Redirecting to audience tab in codeathon concept
    return render_template('index.html') 

@bp.route('/api/chat', methods=['POST'])
def chat():
    # Helper from dashboard-project
    user_input = request.json.get('message')
    responses = [
        "Based on your data, Reels are outperforming Static posts by 40%.",
        "Your engagement spikes on weekends. Consider posting on Saturday at 6 PM.",
        "Your reach has grown by 12% compared to last week!",
        "Try using trending audio to boost your Reach further."
    ]
    return jsonify({"response": random.choice(responses)})
