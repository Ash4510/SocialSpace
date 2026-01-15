from flask import Flask, render_template, jsonify, request

app = Flask(__name__)

# --- MAIN DASHBOARD ROUTES ---

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/data')
def get_data():
    # Your existing dashboard data
    data = {
        "stats": {
            "engagement": {"value": "284.8K", "trend": "+12.5%"},
            "reach": {"value": "1.3M", "trend": "+8.3%"},
            "followers": {"value": "15.4K", "trend": "+23.1%"},
            "interactions": {"value": "89.3K", "trend": "-2.4%"}
        },
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
        "locations": [
            {"name": "United States", "views": 542000, "engagement": 4.2, "growth": 12},
            {"name": "India", "views": 215000, "engagement": 6.8, "growth": 18},
            {"name": "Brazil", "views": 98000, "engagement": 5.1, "growth": 8},
            {"name": "United Kingdom", "views": 85000, "engagement": 3.9, "growth": 5},
            {"name": "Germany", "views": 72000, "engagement": 4.5, "growth": 10}
        ],
        "engagement_speedometer": {
            "months": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
            "rates": [2.5, 3.8, 4.2, 3.5, 5.1, 6.2, 5.8, 6.5, 7.8, 8.2, 7.5, 8.5],
            "dates": ["Jan 15, 2023", "Feb 22, 2023", "Mar 10, 2023", "Apr 05, 2023", "May 18, 2023", "Jun 20, 2023", "Jul 12, 2023", "Aug 30, 2023", "Sep 14, 2023", "Oct 09, 2023", "Nov 21, 2023", "Dec 25, 2023"]
        }
    }
    return jsonify(data)

# --- NEW DISCOVERY ROUTES ---

@app.route('/discovery')
def discovery():
    # Pass the username from the URL to the template
    username = request.args.get('user', 'Creator')
    return render_template('discovery.html', username=username)

@app.route('/api/creators/<domain>')
def get_discovery_data(domain):
    """
    Returns a list of famous creators and their top videos based on domain.
    In a real app, this would query a database.
    """
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
    
    # Return data for the specific domain (case-insensitive)
    result = creators_db.get(domain.lower(), [])
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True)