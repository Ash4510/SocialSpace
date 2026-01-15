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
