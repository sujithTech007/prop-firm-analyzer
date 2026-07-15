import pandas as pd
from typing import List, Dict, Any
from app.models.schemas import RuleCheckResponse

def check_rules(
    df: pd.DataFrame,
    account_size: float,
    max_daily_loss_pct: float,
    max_total_drawdown_pct: float,
    profit_target_pct: float,
    min_trading_days: int,
    consistency_rule_pct: float = 0.0
) -> List[RuleCheckResponse]:
    """
    Evaluates historical trade data against prop firm challenge rules.
    Returns a list of RuleCheckResponse objects detailing status and values.
    """
    checklist = []

    # 1. Daily Loss Check
    # Group by closing date (calendar day)
    daily_pnl = df.groupby(df["close_time"].dt.date)["profit"].sum()
    worst_daily_loss = daily_pnl.min() if not daily_pnl.empty else 0.0
    # Only treat negative daily PnL as loss
    worst_daily_loss_val = abs(min(worst_daily_loss, 0.0))
    daily_loss_limit = (max_daily_loss_pct / 100.0) * account_size

    if worst_daily_loss_val >= daily_loss_limit:
        daily_status = "breach"
        daily_detail = f"Daily loss limit breached! Worst daily loss was -${worst_daily_loss_val:,.2f} (Limit: -${daily_loss_limit:,.2f})"
    elif worst_daily_loss_val >= 0.8 * daily_loss_limit:
        daily_status = "warning"
        daily_detail = f"Danger: Daily loss close to limit. Worst daily loss was -${worst_daily_loss_val:,.2f} (Limit: -${daily_loss_limit:,.2f})"
    else:
        daily_status = "pass"
        daily_detail = f"Pass: Daily loss kept within limits. Worst daily loss was -${worst_daily_loss_val:,.2f} (Limit: -${daily_loss_limit:,.2f})"

    checklist.append(RuleCheckResponse(
        rule_name="Max Daily Loss",
        status=daily_status,
        detail=daily_detail,
        limit_value=f"-${daily_loss_limit:,.2f} ({max_daily_loss_pct}%)",
        actual_value=f"-${worst_daily_loss_val:,.2f} ({ (worst_daily_loss_val / account_size * 100.0) if account_size else 0:.2f}%)"
    ))

    # 2. Max Drawdown Check
    # Calculate drawdown using running equity peak
    running_peak = account_size
    max_drawdown_amt = 0.0
    
    # We step through each trade's profit to calculate running equity
    current_equity = account_size
    for profit in df["profit"]:
        current_equity += profit
        if current_equity > running_peak:
            running_peak = current_equity
        drawdown = running_peak - current_equity
        if drawdown > max_drawdown_amt:
            max_drawdown_amt = drawdown

    drawdown_limit = (max_total_drawdown_pct / 100.0) * account_size
    max_drawdown_pct_actual = (max_drawdown_amt / account_size * 100.0) if account_size else 0.0

    if max_drawdown_amt >= drawdown_limit:
        drawdown_status = "breach"
        drawdown_detail = f"Drawdown limit breached! Max drawdown was -${max_drawdown_amt:,.2f} (Limit: -${drawdown_limit:,.2f})"
    elif max_drawdown_amt >= 0.8 * drawdown_limit:
        drawdown_status = "warning"
        drawdown_detail = f"Danger: Drawdown close to limit. Max drawdown was -${max_drawdown_amt:,.2f} (Limit: -${drawdown_limit:,.2f})"
    else:
        drawdown_status = "pass"
        drawdown_detail = f"Pass: Drawdown kept within limits. Max drawdown was -${max_drawdown_amt:,.2f} (Limit: -${drawdown_limit:,.2f})"

    checklist.append(RuleCheckResponse(
        rule_name="Max Drawdown",
        status=drawdown_status,
        detail=drawdown_detail,
        limit_value=f"-${drawdown_limit:,.2f} ({max_total_drawdown_pct}%)",
        actual_value=f"-${max_drawdown_amt:,.2f} ({max_drawdown_pct_actual:.2f}%)"
    ))

    # 3. Profit Target Check
    net_profit = df["cumulative_pnl"].iloc[-1] if not df.empty else 0.0
    profit_limit = (profit_target_pct / 100.0) * account_size

    if net_profit >= profit_limit:
        profit_status = "pass"
        profit_detail = f"Pass: Profit target met! Net profit is ${net_profit:,.2f} (Target: ${profit_limit:,.2f})"
    elif net_profit > 0.0:
        profit_status = "warning"
        profit_detail = f"Warning: Positive profit, but below target. Net profit is ${net_profit:,.2f} (Target: ${profit_limit:,.2f})"
    else:
        profit_status = "breach"
        profit_detail = f"Breach: Negative net return. Net profit is -${abs(net_profit):,.2f} (Target: ${profit_limit:,.2f})"

    checklist.append(RuleCheckResponse(
        rule_name="Profit Target",
        status=profit_status,
        detail=profit_detail,
        limit_value=f"${profit_limit:,.2f} ({profit_target_pct}%)",
        actual_value=f"${net_profit:,.2f} ({ (net_profit / account_size * 100.0) if account_size else 0:.2f}%)"
    ))

    # 4. Minimum Trading Days Check
    trading_days = df["close_time"].dt.date.nunique() if not df.empty else 0

    if min_trading_days == 0 or trading_days >= min_trading_days:
        days_status = "pass"
        days_detail = f"Pass: Traded for {trading_days} distinct days (Required: {min_trading_days})"
    elif trading_days > 0:
        days_status = "warning"
        days_detail = f"Warning: More trading days needed. Traded for {trading_days} days (Required: {min_trading_days})"
    else:
        days_status = "breach"
        days_detail = f"Breach: No trading days recorded (Required: {min_trading_days})"

    checklist.append(RuleCheckResponse(
        rule_name="Minimum Trading Days",
        status=days_status,
        detail=days_detail,
        limit_value=f"{min_trading_days} days",
        actual_value=f"{trading_days} days"
    ))

    # 5. Profit Consistency Rule Check
    if consistency_rule_pct > 0.0:
        total_pnl = df["profit"].sum() if not df.empty else 0.0
        max_daily_pnl = daily_pnl.max() if not daily_pnl.empty else 0.0
        
        if total_pnl > 0.0 and max_daily_pnl > 0.0:
            highest_share_pct = (max_daily_pnl / total_pnl) * 100.0
            if highest_share_pct >= consistency_rule_pct:
                cons_status = "breach"
                cons_detail = f"Breach: Best single day (${max_daily_pnl:,.2f}) contributed {highest_share_pct:.1f}% of total net profit (${total_pnl:,.2f}), exceeding consistency limit of {consistency_rule_pct}%."
            elif highest_share_pct >= 0.8 * consistency_rule_pct:
                cons_status = "warning"
                cons_detail = f"Warning: Best single day (${max_daily_pnl:,.2f}) contributed {highest_share_pct:.1f}% of total net profit (${total_pnl:,.2f}), close to limit of {consistency_rule_pct}%."
            else:
                cons_status = "pass"
                cons_detail = f"Pass: Best single day (${max_daily_pnl:,.2f}) contributed {highest_share_pct:.1f}% of total net profit, keeping within the {consistency_rule_pct}% limit."
            
            actual_val_str = f"{highest_share_pct:.1f}%"
        else:
            cons_status = "pass"
            cons_detail = "Pass: Consistency rule only applies to profitable sessions."
            actual_val_str = "0.0%"
            
        checklist.append(RuleCheckResponse(
            rule_name="Profit Consistency Rule",
            status=cons_status,
            detail=cons_detail,
            limit_value=f"<{consistency_rule_pct}% of total profit",
            actual_value=actual_val_str
        ))
    else:
        checklist.append(RuleCheckResponse(
            rule_name="Profit Consistency Rule",
            status="pass",
            detail="Pass: No consistency rules are enforced under this profile.",
            limit_value="No limit",
            actual_value="N/A"
        ))

    return checklist
