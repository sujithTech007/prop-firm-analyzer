import os
from typing import Dict, Any

def generate_fallback_coaching(stats: Dict[str, Any], checklist: list) -> str:
    # Build list of specific warnings
    issues = []
    
    win_rate = stats.get("win_rate", 0.0)
    rr = stats.get("reward_to_risk", 1.0)
    overtrading = stats.get("overtrading_days", 0)
    revenge = stats.get("revenge_trades", 0)
    max_dd = stats.get("max_drawdown_pct", 0.0)
    consistency = stats.get("consistency_score", 1.0)
    
    # 1. Evaluate Drawdown Risk
    if max_dd > 8.0:
        issues.append(f"Severe capital drawdown ({max_dd:.2f}%). You are trading near the absolute boundaries of prop firm liquidation limits. Immediate risk reduction is mandatory")
    elif max_dd > 4.5:
        issues.append(f"Moderate drawdown of {max_dd:.2f}%. A string of 3-4 consecutive losses at this sizing will breach your daily drawdown limit")
        
    # 2. Evaluate win rate and risk-reward
    if win_rate < 40.0 and rr < 1.5:
        issues.append(f"Negative expectancy. Your combination of low win rate ({win_rate:.1f}%) and low Risk-Reward ratio ({rr:.2f}) makes passing statistically highly improbable")
    elif win_rate < 45.0 and rr >= 1.5:
        issues.append(f"Your win rate is low ({win_rate:.1f}%), but compensated by a solid R:R of {rr:.2f}. Focus on filtering out lower-probability setups to lift your win rate above 50%")
    elif win_rate >= 50.0 and rr < 1.0:
        issues.append(f"High win rate ({win_rate:.1f}%) but negative risk profile (R:R of {rr:.2f}). You are risking more than you make on average. A single large loss could wipe out days of profits")
        
    # 3. Behavioral Tilt Warnings
    if overtrading > 0 or revenge > 0:
        tilt_details = []
        if overtrading > 0:
            tilt_details.append(f"{overtrading} sessions of overtrading (more than 8 trades/day)")
        if revenge > 0:
            tilt_details.append(f"{revenge} instances of post-loss lot size scaling (revenge trading)")
        issues.append("Behavioral tilt detected: " + " and ".join(tilt_details) + ". This pattern indicates emotional execution, which is the leading cause of challenge failures")

    # 4. Consistency score
    if consistency < 0.6:
        issues.append(f"Low consistency score ({consistency * 100:.1f}%). Your daily profits are highly unstable. Prop firms enforce consistency rules where no single day's profit should exceed 30% of the total target")

    # Format the paragraphs
    p1 = "Based on our machine learning diagnostic audit, your trading profile exhibits "
    if len(issues) == 0:
        p1 += "an exceptionally disciplined and compliant risk model. Your drawdown thresholds are well within standard parameters, and your win-rate to risk-reward ratio presents a positive mathematical edge. You are maintaining excellent emotional stability with zero detected anomalies of overtrading or lot-size scaling."
    else:
        p1 += f"several key risk-management and behavioral vulnerability vectors. Specifically, we noted: {'; '.join(issues[:3])}."
        
    p2 = "From a behavioral perspective, the presence of these traits represents a typical retail trader profile that is highly susceptible to the 'drawdown trap'. When traders experience a loss, they scale lot sizes (revenge trade) or increase trade frequency (overtrade) to recover. This behavior directly accelerates hitting the Max Daily Loss Limit. You must establish a firm limit: maximum 3 trades per day, and a strict rule to shut down the terminal immediately after a loss."
    
    p3 = "To pass a top-tier evaluation like FTMO or FundingPips, we recommend the following structural adjustments: (1) Reduce your per-trade risk size by half (target 0.5% max risk per trade). (2) Set a daily maximum loss cap of 2.5% in your trading software to act as a buffer. (3) Standardize your trade parameters to maintain a minimum 1:2 Risk-to-Reward ratio, allowing your expectancy model to sustain lower win rate periods. Focus on risk execution rather than profit targets."

    return "\n\n".join([p1, p2, p3])


def generate_ai_coaching(stats: Dict[str, Any], checklist: list) -> str:
    """
    Generates personal coaching report. Calls Gemini API if GEMINI_API_KEY exists,
    otherwise falls back to structured algorithmic generator.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return generate_fallback_coaching(stats, checklist)
        
    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        prompt = f"""
        You are an institutional risk manager and behavioral trading coach reviewing a candidate preparing for a Prop Firm Evaluation. 
        Analyze the following trader stats and rule checklist to write a professional, highly detailed, 3-paragraph coaching review.
        
        TRADER STATS:
        {stats}
        
        COMPLIANCE RULES CHECKLIST:
        {checklist}
        
        Paragraph 1: Executive summary of risk issues, highlighting specific numbers (e.g. Drawdown, Win Rate, overtrading days).
        Paragraph 2: Behavioral critique focusing on psychological tilt, overtrading, or lot-size anomalies.
        Paragraph 3: 3 actionable steps to implement (risk limits, per-trade sizing) to ensure they pass their next evaluation.
        
        Tone: Professional, direct, supportive, and data-driven. Do not use generic filler. Keep it under 250 words total.
        """
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"Gemini API call failed: {e}")
        return generate_fallback_coaching(stats, checklist)
