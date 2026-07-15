import pytest
import pandas as pd
from fastapi.testclient import TestClient
from app.main import app
from app.services.trade_parser import parse_trades_csv
from app.services.risk_engine import check_rules
from app.services.readiness_scorer import compute_trading_stats, calculate_readiness

client = TestClient(app)

# 1. Trade Parser Unit Tests
def test_trade_parser_valid_csv():
    csv_data = (
        "close_time,symbol,direction,lot_size,profit\n"
        "2026-07-01 12:00:00,EURUSD,buy,1.0,250.0\n"
        "2026-07-02 15:30:00,GBPUSD,sell,0.5,-100.0\n"
    )
    df = parse_trades_csv(csv_data)
    assert len(df) == 2
    assert df["symbol"].iloc[0] == "EURUSD"
    assert df["profit"].iloc[0] == 250.0
    assert df["cumulative_pnl"].iloc[1] == 150.0

def test_trade_parser_aliases_and_semicolon():
    # Semicolon separator and typical MT4/MT5 lowercase headers
    csv_data = (
        "Time;Pair;Type;Lots;PnL\n"
        "2026-07-01 12:00:00;EURUSD;buy;1.0;200.0\n"
        "2026-07-02 15:30:00;GBPUSD;sell;2.0;-300.0\n"
    )
    df = parse_trades_csv(csv_data)
    assert len(df) == 2
    assert df["symbol"].iloc[0] == "EURUSD"
    assert df["profit"].iloc[1] == -300.0

def test_trade_parser_filter_balance():
    # Balance rows shouldn't be parsed as trades
    csv_data = (
        "close_time,symbol,direction,lot_size,profit\n"
        "2026-07-01 12:00:00,Balance,deposit,0.0,5000.0\n"
        "2026-07-02 15:30:00,EURUSD,buy,1.0,150.0\n"
    )
    df = parse_trades_csv(csv_data)
    assert len(df) == 1
    assert df["symbol"].iloc[0] == "EURUSD"

# 2. Risk Engine Unit Tests
def test_risk_engine_daily_loss_breach():
    trades_df = pd.DataFrame({
        "close_time": pd.to_datetime(["2026-07-01 10:00:00", "2026-07-01 15:00:00", "2026-07-02 10:00:00"]),
        "symbol": ["EURUSD", "EURUSD", "GBPUSD"],
        "direction": ["buy", "buy", "sell"],
        "lot_size": [1.0, 1.0, 1.0],
        "profit": [-3000.0, -2500.0, 500.0],
        "cumulative_pnl": [-3000.0, -5500.0, -5000.0]
    })
    
    # 5% of 100,000 is 5,000 limit. Total daily loss on 2026-07-01 is -5,500.
    checklist = check_rules(
        df=trades_df,
        account_size=100000.0,
        max_daily_loss_pct=5.0,
        max_total_drawdown_pct=10.0,
        profit_target_pct=10.0,
        min_trading_days=2
    )
    
    daily_rule = next(r for r in checklist if r.rule_name == "Max Daily Loss")
    assert daily_rule.status == "breach"

def test_risk_engine_drawdown_breach():
    trades_df = pd.DataFrame({
        "close_time": pd.to_datetime(["2026-07-01 10:00:00", "2026-07-02 10:00:00"]),
        "symbol": ["EURUSD", "GBPUSD"],
        "direction": ["buy", "sell"],
        "lot_size": [1.0, 1.0],
        "profit": [-7000.0, -5000.0],
        "cumulative_pnl": [-7000.0, -12000.0]
    })
    
    # Max Drawdown limit is 10% (10,000). Total drawdown reaches 12,000.
    checklist = check_rules(
        df=trades_df,
        account_size=100000.0,
        max_daily_loss_pct=10.0,
        max_total_drawdown_pct=10.0,
        profit_target_pct=10.0,
        min_trading_days=2
    )
    
    dd_rule = next(r for r in checklist if r.rule_name == "Max Drawdown")
    assert dd_rule.status == "breach"

def test_risk_engine_consistency_rule():
    trades_df = pd.DataFrame({
        "close_time": pd.to_datetime(["2026-07-01 10:00:00", "2026-07-02 10:00:00"]),
        "symbol": ["EURUSD", "GBPUSD"],
        "direction": ["buy", "sell"],
        "lot_size": [1.0, 1.0],
        "profit": [8000.0, 2000.0],
        "cumulative_pnl": [8000.0, 10000.0]
    })
    
    # Total profit is 10,000. Single day profit is 8,000 (80%). Consistency limit is 40%.
    checklist = check_rules(
        df=trades_df,
        account_size=100000.0,
        max_daily_loss_pct=5.0,
        max_total_drawdown_pct=10.0,
        profit_target_pct=10.0,
        min_trading_days=2,
        consistency_rule_pct=40.0
    )
    
    cons_rule = next(r for r in checklist if r.rule_name == "Profit Consistency Rule")
    assert cons_rule.status == "breach"

# 3. Readiness Scorer Unit Tests
def test_readiness_scorer_heuristics():
    trades_df = pd.DataFrame({
        "close_time": pd.to_datetime(["2026-07-01 10:00:00", "2026-07-02 10:00:00"]),
        "symbol": ["EURUSD", "GBPUSD"],
        "direction": ["buy", "sell"],
        "lot_size": [1.0, 1.0],
        "profit": [200.0, 300.0],
        "cumulative_pnl": [200.0, 500.0]
    })
    
    stats = compute_trading_stats(trades_df, 100000.0)
    assert stats.win_rate == 100.0
    assert stats.total_trades == 2
    assert stats.overtrading_days == 0
    assert stats.revenge_trades == 0

    checklist = check_rules(trades_df, 100000.0, 5.0, 10.0, 10.0, 2)
    score, prob, verdict, contributions = calculate_readiness(
        stats=stats,
        checklist=checklist,
        account_size=100000.0,
        max_daily_loss_pct=5.0,
        max_total_drawdown_pct=10.0,
        profit_target_pct=10.0,
        min_trading_days=2
    )
    
    # With perfect metrics, score should be high (>= 70) and verdict "Likely ready"
    assert score >= 70
    assert verdict == "Likely ready"

# 4. API Endpoint Integration Tests
def test_api_firm_presets():
    response = client.get("/api/firm-presets")
    assert response.status_code == 200
    presets = response.json()
    assert len(presets) >= 2
    assert any(p["name"].startswith("FTMO-Style") for p in presets)

def test_api_simulate_endpoint():
    payload = {
        "stats": {
            "win_rate": 65.0,
            "reward_to_risk": 2.0,
            "overtrading_days": 0,
            "revenge_trades": 0,
            "max_drawdown_pct": 2.0,
            "consistency_score": 0.95
        },
        "account_size": 100000.0,
        "max_daily_loss_pct": 5.0,
        "max_total_drawdown_pct": 10.0,
        "profit_target_pct": 10.0,
        "min_trading_days": 4,
        "consistency_rule_pct": 40.0
      }
    response = client.post("/api/simulate", json=payload)
    assert response.status_code == 200
    res = response.json()
    assert "readiness_score" in res
    assert "pass_probability" in res
    assert res["readiness_score"] >= 70
