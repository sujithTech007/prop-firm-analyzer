import os
import json
import pickle
import numpy as np
import pandas as pd
from typing import List, Tuple, Dict, Any
from app.models.schemas import PerformanceStats, RuleCheckResponse, FeatureContribution

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "ml", "readiness_model.pkl")
REPORT_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "ml", "model_report.json")

def compute_trading_stats(df: pd.DataFrame, account_size: float) -> PerformanceStats:
    """
    Computes key performance indicators and 15+ features from the trade data.
    """
    total_trades = len(df)
    if total_trades == 0:
        return PerformanceStats(
            win_rate=0.0, reward_to_risk=0.0, avg_win=0.0, avg_loss=0.0,
            max_drawdown_pct=0.0, max_drawdown_amt=0.0, total_trades=0,
            trading_days=0, overtrading_days=0, revenge_trades=0,
            profit_factor=0.0, expectancy=0.0, avg_drawdown_pct=0.0,
            drawdown_duration_days=0.0, daily_loss_volatility=0.0, worst_day_pct=0.0,
            overtrading_ratio=0.0, revenge_ratio=0.0, consistency_score=0.0,
            trade_frequency_trend=0.0, symbol_diversification=0,
            longest_losing_streak=0, longest_winning_streak=0
        )

    # Core Stats
    wins = df[df["profit"] > 0]
    losses = df[df["profit"] < 0]
    win_rate = (len(wins) / total_trades) * 100.0 if total_trades > 0 else 0.0

    avg_win = wins["profit"].mean() if len(wins) > 0 else 0.0
    avg_loss = abs(losses["profit"].mean()) if len(losses) > 0 else 0.0
    reward_to_risk = (avg_win / avg_loss) if avg_loss > 0 else (avg_win if avg_win > 0 else 1.0)
    profit_factor = wins["profit"].sum() / abs(losses["profit"].sum()) if len(losses) > 0 and abs(losses["profit"].sum()) > 0 else (wins["profit"].sum() if wins["profit"].sum() > 0 else 1.0)
    expectancy = (win_rate / 100.0) * reward_to_risk - ((100.0 - win_rate) / 100.0)

    # Drawdown and Risk
    running_peak = account_size
    drawdowns = []
    current_equity = account_size
    
    for profit in df["profit"]:
        current_equity += profit
        if current_equity > running_peak:
            running_peak = current_equity
        dd = running_peak - current_equity
        dd_pct = (dd / account_size) * 100.0 if account_size > 0 else 0.0
        drawdowns.append(dd_pct)
        
    max_drawdown_pct = max(drawdowns) if drawdowns else 0.0
    avg_drawdown_pct = np.mean(drawdowns) if drawdowns else 0.0
    max_drawdown_amt = (max_drawdown_pct / 100.0) * account_size

    # Daily Stats
    df["close_date"] = df["close_time"].dt.date
    trading_days = df["close_date"].nunique()
    
    daily_pnl = df.groupby("close_date")["profit"].sum()
    worst_day_loss = daily_pnl.min() if not daily_pnl.empty else 0.0
    worst_day_pct = (abs(worst_day_loss) / account_size) * 100.0 if worst_day_loss < 0 else 0.0
    daily_loss_volatility = daily_pnl.std() / account_size * 100.0 if len(daily_pnl) > 1 else 0.0

    # Consistency Score (inverse of PnL standard deviation relative to account size)
    consistency_score = max(0.1, 1.0 - (daily_loss_volatility / 10.0)) if daily_loss_volatility > 0 else 1.0

    # Overtrading
    trades_per_day = df.groupby("close_date").size()
    overtrading_days = int((trades_per_day > 8).sum())
    overtrading_ratio = overtrading_days / max(trading_days, 1)

    # Revenge Trading Heuristic
    revenge_trades_count = 0
    median_lot = df["lot_size"].median()

    for i in range(1, len(df)):
        prev_trade = df.iloc[i - 1]
        curr_trade = df.iloc[i]

        same_day = prev_trade["close_time"].date() == curr_trade["close_time"].date()
        was_loss = prev_trade["profit"] < 0
        is_oversized_prev = curr_trade["lot_size"] >= 1.5 * prev_trade["lot_size"]
        is_oversized_median = curr_trade["lot_size"] >= 1.2 * median_lot

        if same_day and was_loss and is_oversized_prev and is_oversized_median:
            revenge_trades_count += 1
            
    revenge_ratio = revenge_trades_count / max(total_trades, 1)

    # Contextual features
    # Trade frequency trend (comparing first half vs second half of days)
    if len(trades_per_day) > 2:
        half = len(trades_per_day) // 2
        first_half = trades_per_day.iloc[:half].mean()
        second_half = trades_per_day.iloc[half:].mean()
        trade_frequency_trend = (second_half - first_half) / first_half if first_half > 0 else 0.0
    else:
        trade_frequency_trend = 0.0
        
    symbol_diversification = df["symbol"].nunique()
    
    # Streaks
    longest_losing_streak = 0
    longest_winning_streak = 0
    current_lose = 0
    current_win = 0
    
    for p in df["profit"]:
        if p > 0:
            current_win += 1
            current_lose = 0
            longest_winning_streak = max(longest_winning_streak, current_win)
        elif p < 0:
            current_lose += 1
            current_win = 0
            longest_losing_streak = max(longest_losing_streak, current_lose)

    return PerformanceStats(
        win_rate=round(win_rate, 2),
        reward_to_risk=round(reward_to_risk, 2),
        avg_win=round(avg_win, 2),
        avg_loss=round(avg_loss, 2),
        max_drawdown_pct=round(max_drawdown_pct, 2),
        max_drawdown_amt=round(max_drawdown_amt, 2),
        total_trades=total_trades,
        trading_days=trading_days,
        overtrading_days=overtrading_days,
        revenge_trades=revenge_trades_count,
        profit_factor=round(profit_factor, 2),
        expectancy=round(expectancy, 2),
        avg_drawdown_pct=round(avg_drawdown_pct, 2),
        drawdown_duration_days=5.0, # Approximate for simplicity in live eval
        daily_loss_volatility=round(daily_loss_volatility, 2),
        worst_day_pct=round(worst_day_pct, 2),
        overtrading_ratio=round(overtrading_ratio, 2),
        revenge_ratio=round(revenge_ratio, 2),
        consistency_score=round(consistency_score, 2),
        trade_frequency_trend=round(trade_frequency_trend, 2),
        symbol_diversification=symbol_diversification,
        longest_losing_streak=longest_losing_streak,
        longest_winning_streak=longest_winning_streak
    )

def generate_recommendations(
    stats: PerformanceStats,
    checklist: List[RuleCheckResponse],
    account_size: float,
    max_daily_loss_pct: float,
    max_total_drawdown_pct: float
) -> List[str]:
    recs = []
    
    daily_breach = any(r.rule_name == "Max Daily Loss" and r.status == "breach" for r in checklist)
    drawdown_breach = any(r.rule_name == "Max Drawdown" and r.status == "breach" for r in checklist)
    
    if daily_breach or drawdown_breach:
        recs.append("⚠️ IMMEDIATE ACTION REQUIRED: You have breached core risk rules. The challenge would be failed immediately under these settings.")

    if stats.win_rate < 45.0:
        recs.append(f"🎯 Low Win Rate ({stats.win_rate}%): Focus on refining entry triggers and filtering out low-probability setups.")
    
    if stats.reward_to_risk < 1.3:
        recs.append(f"⚖️ Weak Reward-to-Risk Ratio ({stats.reward_to_risk:.2f}): Ensure your average winner is at least 1.5x larger than your average loser.")

    if stats.overtrading_days > 0:
        recs.append(f"⏱️ Overtrading Detected: You executed >8 trades on {stats.overtrading_days} day(s). Establish a daily maximum trade count limit.")

    if stats.revenge_trades > 0:
        recs.append(f"🔥 Revenge Trading Warning: We detected {stats.revenge_trades} instance(s) of oversized positions opened immediately after a loss.")

    if stats.max_drawdown_pct > 0.6 * max_total_drawdown_pct:
        recs.append(f"📉 High Drawdown Exposure ({stats.max_drawdown_pct:.1f}%): You are trading too close to your total drawdown limit.")

    if stats.consistency_score < 0.5:
        recs.append(f"🎢 Inconsistent Daily PnL: Your daily results vary wildly. Focus on hitting singles rather than home runs to improve your consistency score.")

    has_breach = any(r.status == "breach" for r in checklist)
    has_warning = any(r.status == "warning" for r in checklist)

    if not has_breach and not has_warning and stats.win_rate >= 50.0 and stats.reward_to_risk >= 1.5:
        recs.append("🏆 Solid Performance: Your risk management is highly disciplined and statistics are strong. Maintain your consistency.")
    elif not has_breach and stats.revenge_trades == 0 and stats.overtrading_days == 0:
        recs.append("🛡️ Excellent Discipline: No emotional trading patterns were detected. Emotional discipline is half the battle.")

    return recs

from app.models.schemas import PsychologicalProfile

def generate_psychological_profile(stats: PerformanceStats) -> PsychologicalProfile:
    # Basic Heuristics for Profiling
    discipline = 100 - (stats.overtrading_days * 10) - (stats.revenge_trades * 15) - (max(0, 50 - stats.consistency_score * 100))
    discipline_score = int(max(0, min(100, discipline)))

    # Determine Profile
    if stats.revenge_trades > 3 and stats.overtrading_days > 2:
        profile_name = "The Tilt-Prone Trader"
        description = "You struggle with emotional control after losses, leading to oversized positions and revenge trading."
        risk_appetite = "Aggressive & Uncalculated"
        emotional_control = "Low"
        coaching = [
            "Step away from the screen immediately after 2 consecutive losses.",
            "Enforce a hard daily loss limit at the broker level.",
            "Focus on executing the plan, not making back the money."
        ]
    elif stats.overtrading_days > 5:
        profile_name = "The Action Junkie"
        description = "You trade out of boredom or a need to be in the market constantly, degrading your edge."
        risk_appetite = "High Frequency"
        emotional_control = "Moderate"
        coaching = [
            "Limit yourself to 3 high-quality setups per day.",
            "Identify your 'A+' setup and only trade when it appears.",
            "Switch to a higher timeframe to reduce market noise."
        ]
    elif stats.longest_losing_streak > 5 and stats.consistency_score < 0.4:
        profile_name = "The Inconsistent Gambler"
        description = "Your equity curve is erratic, indicating a lack of a proven, systematic edge."
        risk_appetite = "Erratic"
        emotional_control = "Low"
        coaching = [
            "Stop live trading and return to backtesting to define your edge.",
            "Reduce risk per trade to 0.5% until consistency improves.",
            "Review your trading journal to find what setups actually work."
        ]
    elif discipline_score >= 80 and stats.win_rate >= 45 and stats.reward_to_risk >= 1.5:
        profile_name = "The Disciplined Sniper"
        description = "You are highly disciplined, patient, and only take setups that offer excellent asymmetric risk."
        risk_appetite = "Calculated"
        emotional_control = "High"
        coaching = [
            "Keep doing what you are doing. Do not change the system.",
            "Consider scaling up your account size slowly.",
            "Focus on deep psychological maintenance to avoid complacency."
        ]
    else:
        profile_name = "The Developing Trader"
        description = "You show signs of discipline but still have leaks in your execution or risk management."
        risk_appetite = "Moderate"
        emotional_control = "Developing"
        coaching = [
            "Identify your biggest weakness (e.g. cutting winners short) and fix it this week.",
            "Start recording your screen during trades to review execution.",
            "Focus on the process of taking good setups, regardless of the outcome."
        ]

    return PsychologicalProfile(
        profile_name=profile_name,
        description=description,
        discipline_score=discipline_score,
        risk_appetite=risk_appetite,
        emotional_control=emotional_control,
        coaching_advice=coaching
    )

def generate_feature_contributions(
    stats: PerformanceStats,
    importances: List[Dict[str, Any]],
    max_total_drawdown_pct: float,
    max_daily_loss_pct: float
) -> List[FeatureContribution]:
    """
    Generates plain-language explainability contributions for key metrics.
    """
    contributions = []
    feature_dict = stats.model_dump()
    
    if not importances:
        importances = [
            {"feature": "win_rate", "importance": 0.25},
            {"feature": "reward_risk", "importance": 0.20},
            {"feature": "max_drawdown_pct", "importance": 0.15},
            {"feature": "consistency_score", "importance": 0.12},
            {"feature": "overtrading_ratio", "importance": 0.10},
            {"feature": "revenge_ratio", "importance": 0.10},
            {"feature": "profit_factor", "importance": 0.08}
        ]
        
    for item in importances:
        col = item["feature"]
        imp = item["importance"]
        
        val = feature_dict.get(col, 0.0)
        # Handle naming discrepancies between model features and schema fields
        if col == "reward_risk":
            val = stats.reward_to_risk
            
        # Calculate baseline deviations and scale impact magnitude
        if col == "win_rate":
            baseline = 50.0
            dev = (val - baseline) / 10.0
        elif col == "reward_risk":
            baseline = 1.5
            dev = (val - baseline) / 0.5
        elif col == "profit_factor":
            baseline = 1.3
            dev = (val - baseline) / 0.4
        elif col == "expectancy":
            baseline = 0.15
            dev = (val - baseline) / 0.2
        elif col == "max_drawdown_pct":
            ref_dd = max_total_drawdown_pct if max_total_drawdown_pct > 0 else 5.0
            baseline = 0.5 * ref_dd
            dev = -(val - baseline) / (0.2 * ref_dd)
        elif col == "worst_day_pct":
            ref_loss = max_daily_loss_pct if max_daily_loss_pct > 0 else 2.5
            baseline = 0.5 * ref_loss
            dev = -(val - baseline) / (0.2 * ref_loss)
        elif col in ["overtrading_ratio", "overtrading_days"]:
            baseline = 0.1
            actual_val = stats.overtrading_ratio
            dev = -(actual_val - baseline) / 0.1
        elif col in ["revenge_ratio", "revenge_trades"]:
            baseline = 0.0
            actual_val = stats.revenge_ratio
            dev = -(actual_val - baseline) / 0.1
        elif col == "consistency_score":
            baseline = 0.6
            dev = (val - baseline) / 0.2
        else:
            dev = 0.0
            
        magnitude = imp * dev
        # Cap range for UX layout
        magnitude = max(-0.35, min(0.35, magnitude))
        
        impact = "positive" if magnitude > 0.01 else ("negative" if magnitude < -0.01 else "neutral")
        
        desc = ""
        if col == "win_rate":
            desc = f"Win Rate ({val:.1f}%): " + ("Strong win rate supports high probability of passing." if val >= 50 else "Low win rate reduces overall performance expectancy.")
        elif col == "reward_risk":
            desc = f"Reward:Risk ({val:.2f}): " + ("Excellent risk-reward structure boosts trade profitability." if val >= 1.5 else "Low average win size makes it harder to hit profit target.")
        elif col == "profit_factor":
            desc = f"Profit Factor ({val:.2f}): " + ("Shows solid positive drift on trades." if val >= 1.3 else "High losses relative to wins drag performance.")
        elif col == "max_drawdown_pct":
            desc = f"Max Drawdown ({val:.1f}%): " + ("Controlled drawdown preserves account safety." if val < (0.5 * max_total_drawdown_pct if max_total_drawdown_pct > 0 else 5.0) else "Deep drawdowns threaten immediate disqualification.")
        elif col == "consistency_score":
            desc = f"Consistency Score ({val:.2f}): " + ("Highly consistent daily results reflect professional sizing." if val >= 0.7 else "Highly erratic returns increase chances of target breach.")
        elif col in ["overtrading_ratio", "overtrading_days"]:
            ot_days = stats.overtrading_days
            desc = f"Overtrading ({ot_days} days): " + ("Clean trading frequency ensures quality focus." if ot_days == 0 else f"Too many trades on {ot_days} day(s) degrades setup quality.")
        elif col in ["revenge_ratio", "revenge_trades"]:
            rt_count = stats.revenge_trades
            desc = f"Revenge Trading ({rt_count} events): " + ("Disciplined execution: no emotional sizing detected." if rt_count == 0 else f"Revenge trading detected after loss, drastically increasing risk.")

        if desc:
            contributions.append(FeatureContribution(
                feature=col,
                importance=float(magnitude),
                impact=impact,
                description=desc
            ))
            
    contributions.sort(key=lambda x: abs(x.importance), reverse=True)
    return contributions

def calculate_readiness(
    stats: PerformanceStats,
    checklist: List[RuleCheckResponse],
    account_size: float,
    max_daily_loss_pct: float,
    max_total_drawdown_pct: float,
    profit_target_pct: float,
    min_trading_days: int
) -> Tuple[int, float, str, List[FeatureContribution]]:
    """
    Computes overall readiness score, pass probability, verdict, and feature contributions.
    """
    hard_breach = any(r.status == "breach" and r.rule_name in ["Max Daily Loss", "Max Drawdown", "Profit Consistency Rule"] for r in checklist)
    contributions = []
    
    # Load feature importances if report exists
    global_importances = []
    if os.path.exists(REPORT_PATH):
        try:
            with open(REPORT_PATH, "r") as f:
                report = json.load(f)
                global_importances = report.get("feature_importances", [])
        except Exception as e:
            print(f"Failed to load global importances: {e}")

    if os.path.exists(MODEL_PATH):
        try:
            with open(MODEL_PATH, "rb") as f:
                model_data = pickle.load(f)
                
            model = model_data["model"]
            feature_cols = model_data["features"]

            # Build feature array in the exact order model expects
            feature_dict = stats.model_dump()
            # map schema names to model expected features
            if "reward_risk" in feature_cols and "reward_to_risk" in feature_dict:
                feature_dict["reward_risk"] = feature_dict["reward_to_risk"]
                
            features = np.array([[feature_dict.get(col, 0.0) for col in feature_cols]])
            
            pass_probability = float(model.predict_proba(features)[0][1])
            readiness_score = int(pass_probability * 100)
            
            # Generate feature explanations
            contributions = generate_feature_contributions(
                stats, global_importances, max_total_drawdown_pct, max_daily_loss_pct
            )
            
            if hard_breach:
                readiness_score = min(readiness_score, 15)
                pass_probability = min(pass_probability, 0.15)
                
        except Exception as e:
            print(f"Error using ML model: {e}")
            readiness_score, pass_probability = _calculate_heuristic(stats, checklist, hard_breach)
            contributions = generate_feature_contributions(
                stats, global_importances, max_total_drawdown_pct, max_daily_loss_pct
            )
    else:
        readiness_score, pass_probability = _calculate_heuristic(stats, checklist, hard_breach)
        contributions = generate_feature_contributions(
            stats, global_importances, max_total_drawdown_pct, max_daily_loss_pct
        )

    if readiness_score >= 70:
        verdict = "Likely ready"
    elif readiness_score >= 40:
        verdict = "Needs work"
    else:
        verdict = "High risk of failure"

    return readiness_score, pass_probability, verdict, contributions

def _calculate_heuristic(
    stats: PerformanceStats,
    checklist: List[RuleCheckResponse],
    hard_breach: bool
) -> Tuple[int, float]:
    score = 100

    if stats.win_rate >= 55.0: pass
    elif stats.win_rate >= 45.0: score -= 10
    elif stats.win_rate >= 35.0: score -= 25
    else: score -= 40

    if stats.reward_to_risk >= 2.0: pass
    elif stats.reward_to_risk >= 1.5: score -= 5
    elif stats.reward_to_risk >= 1.0: score -= 15
    else: score -= 30

    score -= min(stats.overtrading_days * 10, 30)
    score -= min(stats.revenge_trades * 15, 45)

    for rule in checklist:
        if rule.status == "breach":
            if rule.rule_name in ["Max Daily Loss", "Max Drawdown", "Profit Consistency Rule"]:
                score -= 50
            else:
                score -= 15
        elif rule.status == "warning":
            score -= 10

    readiness_score = max(0, min(100, score))
    
    if hard_breach:
        readiness_score = min(readiness_score, 15)

    pass_probability = readiness_score / 100.0

    return readiness_score, pass_probability
