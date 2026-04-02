"""
Agilitas Business Engine - Scoring Engine

This module provides deterministic scoring logic for customer extraction data.
"""

def calculate_kpis(extraction_data: dict, customer_metadata: dict) -> dict:
    """
    Calculate KPIs based on extraction and customer metadata.
    
    Args:
        extraction_data: dict containing:
            - sentiment: str (Positive, Neutral, Negative)
            - pain_points: list of str
            - emotion: str (Frustrated, Angry, Disappointed, Concerned, Confused, Happy, Satisfied, None)
            - effort: str (High, Medium, Low)
        customer_metadata: dict containing:
            - ltv: float (Customer Lifetime Value)
            
    Returns:
        dict: Calculated KPIs (churn_probability, revenue_loss_potential, effort_score)
    """
    # 1. Sentiment Score
    sentiment = extraction_data.get('sentiment', 'Neutral').capitalize()
    sentiment_score = 0.0
    if sentiment == 'Negative':
        sentiment_score = 1.0
    elif sentiment == 'Neutral':
        sentiment_score = 0.5
    
    # 2. Pain Points Score
    pain_points = extraction_data.get('pain_points', [])
    pain_point_count = len(pain_points)
    pain_point_weight = 0.0
    if pain_point_count >= 2:
        pain_point_weight = 1.0
    elif pain_point_count == 1:
        pain_point_weight = 0.5
        
    # 3. Emotion Weight
    emotion = extraction_data.get('emotion', 'None').capitalize()
    emotion_weight = 0.0
    if emotion in ['Frustrated', 'Angry', 'Disappointed']:
        emotion_weight = 1.0
    elif emotion in ['Concerned', 'Confused']:
        emotion_weight = 0.5
        
    # Churn Probability Calculation
    churn_probability = (sentiment_score + pain_point_weight + emotion_weight) / 3.0
    
    # 4. Revenue Loss Potential
    ltv = customer_metadata.get('ltv', 0.0)
    revenue_loss_potential = churn_probability * ltv
    
    # 5. Effort Score
    effort = extraction_data.get('effort', 'Low').capitalize()
    effort_score = 0.0
    if effort == 'High':
        effort_score = 1.0
    elif effort == 'Medium':
        effort_score = 0.5
        
    return {
        "churn_probability": round(churn_probability, 4),
        "revenue_loss_potential": round(revenue_loss_potential, 2),
        "effort_score": effort_score
    }
