from fastapi import APIRouter, UploadFile, File, Query, HTTPException, Header, Depends
from fastapi.responses import PlainTextResponse
from typing import List, Optional
import json
import uuid
import os
from sqlalchemy.orm import Session
from app.models.schemas import (
    AnalysisResponse, FirmPreset, TradeDetail, HistorySummary, InsightsResponse,
    SimulationRequest, SimulationResponse, PerformanceStats, RuleCheckResponse
)
from app.models.database import get_db, AnalysisRecord
from app.services.trade_parser import parse_trades_csv
from app.services.risk_engine import check_rules
from app.services.readiness_scorer import (
    compute_trading_stats,
    calculate_readiness,
    generate_recommendations
)

router = APIRouter()

@router.get("/firm-presets", response_model=List[FirmPreset])
def get_firm_presets():
    return [
        FirmPreset(
            name="FTMO-Style (Standard 2-Step)",
            account_size=100000.0,
            max_daily_loss_pct=5.0,
            max_total_drawdown_pct=10.0,
            profit_target_pct=10.0,
            min_trading_days=4,
            consistency_rule_pct=0.0,
            url="https://ftmo.com/"
        ),
        FirmPreset(
            name="Topstep-Style (1-Step Combine)",
            account_size=50000.0,
            max_daily_loss_pct=2.0,
            max_total_drawdown_pct=4.0,
            profit_target_pct=6.0,
            min_trading_days=5,
            consistency_rule_pct=40.0,
            url="https://www.topstep.com/"
        ),
        FirmPreset(
            name="MyFundedFX-Style (Standard 2-Step)",
            account_size=100000.0,
            max_daily_loss_pct=5.0,
            max_total_drawdown_pct=8.0,
            profit_target_pct=8.0,
            min_trading_days=1,
            consistency_rule_pct=0.0,
            url="https://myfundedfx.com/"
        ),
        FirmPreset(
            name="The5ers-Style (Hyper Growth)",
            account_size=100000.0,
            max_daily_loss_pct=4.0,
            max_total_drawdown_pct=6.0,
            profit_target_pct=6.0,
            min_trading_days=0,
            consistency_rule_pct=0.0,
            url="https://the5ers.com/"
        )
    ]

@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_trades(
    file: UploadFile = File(...),
    account_size: float = Query(...),
    max_daily_loss_pct: float = Query(...),
    max_total_drawdown_pct: float = Query(...),
    profit_target_pct: float = Query(...),
    min_trading_days: int = Query(...),
    consistency_rule_pct: float = Query(0.0),
    x_session_id: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Uploaded file must be a CSV file.")

    try:
        content = await file.read()
        csv_content = content.decode("utf-8", errors="ignore")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read CSV content: {str(e)}")

    try:
        df = parse_trades_csv(csv_content)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Parser error: {str(e)}")

    checklist = check_rules(
        df=df,
        account_size=account_size,
        max_daily_loss_pct=max_daily_loss_pct,
        max_total_drawdown_pct=max_total_drawdown_pct,
        profit_target_pct=profit_target_pct,
        min_trading_days=min_trading_days,
        consistency_rule_pct=consistency_rule_pct
    )

    stats = compute_trading_stats(df, account_size)

    readiness_score, pass_probability, verdict, contributions = calculate_readiness(
        stats=stats,
        checklist=checklist,
        account_size=account_size,
        max_daily_loss_pct=max_daily_loss_pct,
        max_total_drawdown_pct=max_total_drawdown_pct,
        profit_target_pct=profit_target_pct,
        min_trading_days=min_trading_days
    )

    recs = generate_recommendations(
        stats=stats,
        checklist=checklist,
        account_size=account_size,
        max_daily_loss_pct=max_daily_loss_pct,
        max_total_drawdown_pct=max_total_drawdown_pct
    )

    trades_list = []
    for _, row in df.iterrows():
        trades_list.append(TradeDetail(
            close_time=row["close_time"].strftime("%Y-%m-%d %H:%M:%S"),
            symbol=row["symbol"],
            direction=row["direction"],
            lot_size=row["lot_size"],
            profit=row["profit"],
            cumulative_pnl=row["cumulative_pnl"]
        ))
        
    analysis_id = str(uuid.uuid4())
    session_id = x_session_id or "anonymous"
    
    # Try to load model badge info
    model_badge = None
    try:
        report_path = os.path.join(os.path.dirname(__file__), "..", "..", "ml", "model_report.json")
        if os.path.exists(report_path):
            with open(report_path, "r") as f:
                report = json.load(f)
                model_badge = {
                    "model_used": report.get("model_used", "Unknown"),
                    "accuracy": report.get("test_metrics", {}).get("accuracy", 0.0),
                    "f1": report.get("test_metrics", {}).get("f1", 0.0),
                    "roc_auc": report.get("test_metrics", {}).get("roc_auc", 0.0)
                }
    except Exception as e:
        print(f"Failed to load model badge: {e}")

    from app.services.readiness_scorer import generate_psychological_profile
    psychology_profile = generate_psychological_profile(stats)

    response = AnalysisResponse(
        id=analysis_id,
        session_id=session_id,
        readiness_score=readiness_score,
        pass_probability=pass_probability,
        verdict=verdict,
        stats=stats,
        rule_checklist=checklist,
        trades=trades_list,
        recommendations=recs,
        feature_contributions=contributions,
        psychology=psychology_profile,
        model_badge=model_badge
    )
    
    # Save to database
    db_record = AnalysisRecord(
        id=analysis_id,
        session_id=session_id,
        readiness_score=readiness_score,
        pass_probability=pass_probability,
        verdict=verdict,
        account_size=account_size,
        full_report_json=response.model_dump_json()
    )
    db.add(db_record)
    db.commit()
    
    # Assign created at from DB
    response.created_at = db_record.created_at.isoformat()

    return response

@router.post("/simulate", response_model=SimulationResponse)
def simulate_readiness(req: SimulationRequest):
    worst_daily_loss_val = (req.stats.worst_day_pct / 100.0) * req.account_size if hasattr(req.stats, "worst_day_pct") else 0.0
    daily_loss_limit = (req.max_daily_loss_pct / 100.0) * req.account_size
    
    if worst_daily_loss_val >= daily_loss_limit:
        daily_status = "breach"
        daily_detail = f"Daily loss limit breached! Worst daily loss was -${worst_daily_loss_val:,.2f} (Limit: -${daily_loss_limit:,.2f})"
    elif worst_daily_loss_val >= 0.8 * daily_loss_limit:
        daily_status = "warning"
        daily_detail = f"Danger: Daily loss close to limit. Worst daily loss was -${worst_daily_loss_val:,.2f} (Limit: -${daily_loss_limit:,.2f})"
    else:
        daily_status = "pass"
        daily_detail = f"Pass: Daily loss kept within limits. Worst daily loss was -${worst_daily_loss_val:,.2f} (Limit: -${daily_loss_limit:,.2f})"
        
    daily_rule = RuleCheckResponse(
        rule_name="Max Daily Loss",
        status=daily_status,
        detail=daily_detail,
        limit_value=f"-${daily_loss_limit:,.2f} ({req.max_daily_loss_pct}%)",
        actual_value=f"-${worst_daily_loss_val:,.2f}"
    )
    
    drawdown_amt = (req.stats.max_drawdown_pct / 100.0) * req.account_size
    drawdown_limit = (req.max_total_drawdown_pct / 100.0) * req.account_size
    if drawdown_amt >= drawdown_limit:
        dd_status = "breach"
        dd_detail = f"Drawdown limit breached! Max drawdown was -${drawdown_amt:,.2f} (Limit: -${drawdown_limit:,.2f})"
    elif drawdown_amt >= 0.8 * drawdown_limit:
        dd_status = "warning"
        dd_detail = f"Danger: Drawdown close to limit. Max drawdown was -${drawdown_amt:,.2f} (Limit: -${drawdown_limit:,.2f})"
    else:
        dd_status = "pass"
        dd_detail = f"Pass: Drawdown kept within limits. Max drawdown was -${drawdown_amt:,.2f} (Limit: -${drawdown_limit:,.2f})"
        
    dd_rule = RuleCheckResponse(
        rule_name="Max Drawdown",
        status=dd_status,
        detail=dd_detail,
        limit_value=f"-${drawdown_limit:,.2f} ({req.max_total_drawdown_pct}%)",
        actual_value=f"-${drawdown_amt:,.2f}"
    )
    
    cons_status = "pass"
    cons_detail = "Pass: Consistency check is simulated as within bounds."
    if req.consistency_rule_pct > 0.0 and req.stats.consistency_score < 0.4:
        cons_status = "breach"
        cons_detail = f"Breach: Simulated consistency rule breach (Consistency Score is {req.stats.consistency_score})."
        
    cons_rule = RuleCheckResponse(
        rule_name="Profit Consistency Rule",
        status=cons_status,
        detail=cons_detail,
        limit_value=f"<{req.consistency_rule_pct}% share",
        actual_value="Simulated"
    )
    
    checklist = [
        daily_rule,
        dd_rule,
        RuleCheckResponse(rule_name="Profit Target", status="pass", detail="Simulated Target Pass", limit_value="Target", actual_value="Target Met"),
        RuleCheckResponse(rule_name="Minimum Trading Days", status="pass", detail="Simulated Days Pass", limit_value=f"{req.min_trading_days} days", actual_value="Passed"),
        cons_rule
    ]
    
    expectancy = (req.stats.win_rate / 100.0) * req.stats.reward_to_risk - ((100.0 - req.stats.win_rate) / 100.0)
    profit_factor = (req.stats.win_rate / 100.0) * req.stats.reward_to_risk / max(1 - (req.stats.win_rate / 100.0), 0.01)
    
    stats_obj = PerformanceStats(
        win_rate=req.stats.win_rate,
        reward_to_risk=req.stats.reward_to_risk,
        avg_win=req.stats.reward_to_risk * 100,
        avg_loss=100.0,
        max_drawdown_pct=req.stats.max_drawdown_pct,
        max_drawdown_amt=drawdown_amt,
        total_trades=50,
        trading_days=10,
        overtrading_days=req.stats.overtrading_days,
        revenge_trades=req.stats.revenge_trades,
        profit_factor=round(profit_factor, 2),
        expectancy=round(expectancy, 2),
        avg_drawdown_pct=req.stats.max_drawdown_pct * 0.5,
        drawdown_duration_days=5.0,
        daily_loss_volatility=5.0,
        worst_day_pct=req.stats.max_drawdown_pct * 0.6,
        overtrading_ratio=req.stats.overtrading_days / 10.0,
        revenge_ratio=req.stats.revenge_trades / 50.0,
        consistency_score=req.stats.consistency_score,
        trade_frequency_trend=0.0,
        symbol_diversification=3,
        longest_losing_streak=3,
        longest_winning_streak=4
    )
    
    score, prob, verdict, contributions = calculate_readiness(
        stats=stats_obj,
        checklist=checklist,
        account_size=req.account_size,
        max_daily_loss_pct=req.max_daily_loss_pct,
        max_total_drawdown_pct=req.max_total_drawdown_pct,
        profit_target_pct=req.profit_target_pct,
        min_trading_days=req.min_trading_days
    )
    
    return SimulationResponse(
        readiness_score=score,
        pass_probability=prob,
        verdict=verdict,
        feature_contributions=contributions
    )

@router.get("/demo-trades", response_class=PlainTextResponse)
def get_demo_trades():
    csv_path = os.path.join(os.path.dirname(__file__), "..", "..", "data", "sample_trades.csv")
    if not os.path.exists(csv_path):
        # Create a basic sample CSV content as fallback if it doesn't exist
        fallback_csv = (
            "close_time,symbol,direction,lot_size,profit\n"
            "2026-07-01 10:00:00,EURUSD,buy,1.0,250.0\n"
            "2026-07-02 11:30:00,GBPUSD,sell,1.0,-150.0\n"
            "2026-07-03 14:00:00,EURUSD,buy,1.0,300.0\n"
            "2026-07-04 15:45:00,USDJPY,buy,1.5,450.0\n"
            "2026-07-05 09:15:00,GBPUSD,buy,1.0,-200.0\n"
            "2026-07-06 16:30:00,EURUSD,buy,1.0,350.0\n"
            "2026-07-07 10:20:00,USDJPY,sell,1.0,-100.0\n"
            "2026-07-08 12:00:00,XAUUSD,buy,2.0,800.0\n"
            "2026-07-09 13:40:00,EURUSD,sell,1.0,-120.0\n"
            "2026-07-10 15:00:00,GBPUSD,buy,1.5,500.0\n"
        )
        return fallback_csv
    
    try:
        with open(csv_path, "r") as f:
            return f.read()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read sample trades: {str(e)}")

@router.get("/history", response_model=List[HistorySummary])
def get_history(x_session_id: str = Header(...), db: Session = Depends(get_db)):
    records = db.query(AnalysisRecord).filter(AnalysisRecord.session_id == x_session_id).order_by(AnalysisRecord.created_at.desc()).all()
    
    return [
        HistorySummary(
            id=r.id,
            session_id=r.session_id,
            created_at=r.created_at.isoformat(),
            readiness_score=r.readiness_score,
            verdict=r.verdict,
            account_size=r.account_size
        )
        for r in records
    ]

@router.get("/analysis/{id}", response_model=AnalysisResponse)
def get_analysis(id: str, x_session_id: str = Header(...), db: Session = Depends(get_db)):
    record = db.query(AnalysisRecord).filter(AnalysisRecord.id == id, AnalysisRecord.session_id == x_session_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Analysis not found")
        
    data = json.loads(record.full_report_json)
    data["created_at"] = record.created_at.isoformat()
    return data

@router.get("/insights", response_model=InsightsResponse)
def get_insights(x_session_id: str = Header(...), db: Session = Depends(get_db)):
    records = db.query(AnalysisRecord).filter(AnalysisRecord.session_id == x_session_id).order_by(AnalysisRecord.created_at.asc()).all()
    
    score_trend = []
    breach_counts = {}
    feature_trends = []
    
    for r in records:
        data = json.loads(r.full_report_json)
        date_str = r.created_at.isoformat()
        
        score_trend.append({
            "date": date_str,
            "score": r.readiness_score
        })
        
        for chk in data.get("rule_checklist", []):
            if chk["status"] == "breach":
                name = chk["rule_name"]
                breach_counts[name] = breach_counts.get(name, 0) + 1
                
        feat_obj = {"date": date_str}
        for fc in data.get("feature_contributions", []):
            if abs(fc["importance"]) > 0.1: # Only track significant ones
                feat_obj[fc["feature"]] = fc["importance"]
        feature_trends.append(feat_obj)
        
    common_breaches = [{"name": k, "count": v} for k, v in breach_counts.items()]
    common_breaches.sort(key=lambda x: x["count"], reverse=True)
        
    return InsightsResponse(
        score_trend=score_trend,
        common_breaches=common_breaches,
        feature_trends=feature_trends
    )

@router.post("/history/clear")
def clear_history(x_session_id: str = Header(...), db: Session = Depends(get_db)):
    try:
        db.query(AnalysisRecord).filter(AnalysisRecord.session_id == x_session_id).delete()
        db.commit()
        return {"message": "Session history cleared successfully."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to clear history: {str(e)}")
