import pandas as pd
import numpy as np
from datetime import timedelta

# Configuration
dhams = ['yamunotri', 'gangotri', 'kedarnath', 'badrinath']
years = range(2010, 2024) # Adjust years to get to ~10,000+ rows
season_start_month = 5    
season_start_day = 1
season_end_month = 11     
season_end_day = 5

data = []

# Helper to determine integer weather (1 = Clear, 2 = Cloudy, 0 = Bad/Rain)
def get_weather_code(month):
    if month in [7, 8]: # Monsoon
        return np.random.choice([0, 2, 1], p=[0.6, 0.3, 0.1])
    elif month in [5, 6]: # Peak Summer
        return np.random.choice([1, 2, 0], p=[0.7, 0.2, 0.1])
    else: # Autumn
        return np.random.choice([1, 2, 0], p=[0.6, 0.3, 0.1])

for year in years:
    start_date = pd.Timestamp(year=year, month=season_start_month, day=season_start_day)
    end_date = pd.Timestamp(year=year, month=season_end_month, day=season_end_day)
    
    current_date = start_date
    day_of_season = 1
    
    while current_date <= end_date:
        # Date attributes matching your format
        date_str = current_date.strftime('%Y-%m-%d')
        month = current_date.month
        
        # Day of week as integer (0 = Monday, 1 = Tuesday ... 6 = Sunday)
        day_of_week = current_date.weekday() 
        
        # Booleans as 0 or 1
        is_weekend = 1 if day_of_week >= 5 else 0
        is_festival = 1 if (day_of_season <= 4) or (np.random.rand() < 0.05) else 0
        
        # Weather is generally a daily event covering the region, though micro-climates exist
        daily_weather_trend = get_weather_code(month)
        
        for dham in dhams:
            # Slight local variation in weather
            weather_code = daily_weather_trend if np.random.rand() > 0.1 else get_weather_code(month)
            
            # Base quota percentage between 0.0 and 1.0
            if month in [5, 6]: base_pct = np.random.uniform(0.60, 0.95)
            elif month in [7, 8]: base_pct = np.random.uniform(0.20, 0.50)
            else: base_pct = np.random.uniform(0.40, 0.75)
            
            # Adjustments
            if is_weekend == 1: base_pct += 0.08
            if is_festival == 1: base_pct += 0.12
            
            if weather_code == 0: base_pct -= 0.25      # Bad weather drop
            elif weather_code == 1: base_pct += 0.05    # Clear weather bump
            
            # Clamp percentage between 0.01 and 1.00
            pass_quota_pct = max(0.01, min(1.00, base_pct))
            
            # Round to exactly 4 decimal places like your example (e.g., 0.6563)
            pass_quota_pct = round(pass_quota_pct, 4)
            
            # Determine crowd level (using 'Medium' instead of Moderate)
            if pass_quota_pct >= 0.85:
                crowd_level = 'Extreme'
            elif pass_quota_pct >= 0.65:
                crowd_level = 'High'
            elif pass_quota_pct >= 0.40:
                crowd_level = 'Medium'
            else:
                crowd_level = 'Low'
                
            data.append([
                dham, date_str, month, day_of_week, day_of_season, 
                is_weekend, is_festival, weather_code, pass_quota_pct, crowd_level
            ])
            
        current_date += timedelta(days=1)
        day_of_season += 1

# Create DataFrame
df = pd.DataFrame(data, columns=[
    'dham', 'date', 'month', 'day_of_week', 'day_of_season', 
    'is_weekend', 'is_festival', 'weather_code', 'pass_quota_pct', 'crowd_level'
])

# Save to CSV without the index
filename = 'chardham_yatra_data.csv'
df.to_csv(filename, index=False)
print(f"Generated {len(df)} rows. Saved to {filename}")