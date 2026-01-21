import pandas as pd
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, 'data', 'data.csv')

def get_metrics():
    # Load data
    try:
        df = pd.read_csv(DATA_PATH)
    except FileNotFoundError:
        return {"error": "data.csv not found"}

    # Calculate Totals
    total_likes = df['likes'].sum()
    total_comments = df['comments'].sum()
    total_shares = df['shares'].sum()
    total_reach = df['reach'].sum()
    
    # Calculate Engagement (Likes + Comments + Shares)
    total_engagement = total_likes + total_comments + total_shares

    # Format numbers (Mocking the format from original codeathon)
    return {
        "engagement": {"value": f"{total_engagement/1000:.1f}K", "trend": "+12.5%"},
        "reach": {"value": f"{total_reach/1000:.1f}K", "trend": "+8.3%"},
        "followers": {"value": "15.4K", "trend": "+23.1%"}, # Hardcoded if unavailable
        "interactions": {"value": f"{(total_comments + total_shares)/1000:.1f}K", "trend": "-2.4%"}
    }

def get_chart_data():
    try:
        df = pd.read_csv(DATA_PATH)
    except FileNotFoundError:
        return {}
        
    # Group by Date for Line Chart
    trends = df.groupby('date')['reach'].sum().reset_index()
    return {
        "labels": trends['date'].tolist(),
        "data": trends['reach'].tolist()
    }


def check_viral_status():
    """
    Check if the latest post is trending or viral based on engagement thresholds.
    Returns severity level: 'none', 'trending' (1.2x), or 'viral' (1.5x)
    """
    try:
        df = pd.read_csv(DATA_PATH)
    except FileNotFoundError:
        return {"severity": "none", "error": "data.csv not found"}
    
    if len(df) < 2:
        return {"severity": "none", "message": "Not enough data"}
    
    # Calculate engagement_rate for each row: (likes + comments + shares) / reach * 100
    df['engagement_rate'] = ((df['likes'] + df['comments'] + df['shares']) / df['reach']) * 100
    
    # Get latest post engagement rate
    latest = df.iloc[-1]
    latest_engagement = latest['engagement_rate']
    latest_post_id = f"{latest['type']}_{latest['date']}"
    
    # Calculate 7-day average (or all available if less than 7)
    lookback = min(7, len(df) - 1)
    avg_engagement = df.iloc[-(lookback+1):-1]['engagement_rate'].mean()
    
    # Determine threshold tier
    ratio = latest_engagement / avg_engagement if avg_engagement > 0 else 0
    excess_percent = round((ratio - 1) * 100, 1)
    
    if ratio >= 1.5:
        severity = "viral"
    elif ratio >= 1.2:
        severity = "trending"
    else:
        severity = "none"
    
    return {
        "severity": severity,
        "post_id": latest_post_id,
        "current_rate": round(latest_engagement, 2),
        "avg_rate": round(avg_engagement, 2),
        "excess_percent": excess_percent,
        "ratio": round(ratio, 2)
    }


def get_heatmap_data():
    """
    Generate 7x24 grid of simulated active_users data for the heatmap.
    Returns array of {day_index, hour, active_users, day_name} for each cell.
    """
    import random
    
    days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    
    # Base activity patterns (higher on evenings and weekends)
    base_patterns = {
        'weekday_morning': (6, 11, 50, 150),    # 6am-11am
        'weekday_afternoon': (12, 17, 100, 250), # 12pm-5pm
        'weekday_evening': (18, 22, 200, 400),   # 6pm-10pm (peak)
        'weekday_night': (23, 5, 20, 80),        # 11pm-5am
        'weekend_peak': (10, 20, 250, 500),      # Weekend 10am-8pm
    }
    
    heatmap_data = []
    
    for day_idx, day_name in enumerate(days):
        is_weekend = day_idx >= 5  # Saturday, Sunday
        
        for hour in range(24):
            # Determine base activity based on time and day
            if is_weekend:
                if 10 <= hour <= 20:
                    min_users, max_users = 250, 500
                elif 21 <= hour <= 23 or 8 <= hour <= 9:
                    min_users, max_users = 150, 300
                else:
                    min_users, max_users = 30, 100
            else:  # Weekday
                if 6 <= hour <= 11:
                    min_users, max_users = 50, 150
                elif 12 <= hour <= 17:
                    min_users, max_users = 100, 250
                elif 18 <= hour <= 22:
                    min_users, max_users = 200, 400
                else:
                    min_users, max_users = 20, 80
            
            active_users = random.randint(min_users, max_users)
            
            heatmap_data.append({
                "day_index": day_idx,
                "day_name": day_name,
                "hour": hour,
                "active_users": active_users
            })
    
    return heatmap_data
