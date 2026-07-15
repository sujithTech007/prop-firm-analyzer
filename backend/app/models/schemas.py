from pydantic import BaseModel
from typing import List, Optional, Any, Dict

class RuleCheckResponse(BaseModel):
    rule_name: str
    status: str  # "pass", "warning", "breach"
    detail: str
    limit_value: str
    actual_value: str

class PerformanceStats(BaseModel):
    win_rate: float
    reward_to_risk: float
    avg_win: float
    avg_loss: float
    max_drawdown_pct: float
    max_drawdown_amt: float
    total_trades: int
    trading_days: int
    overtrading_days: int
    revenge_trades: int
    profit_factor: float
    expectancy: float
    avg_drawdown_pct: float
    drawdown_duration_days: float
    daily_loss_volatility: float
    worst_day_pct: float
    overtrading_ratio: float
    revenge_ratio: float
    consistency_score: float
    trade_frequency_trend: float
    symbol_diversification: int
    longest_losing_streak: int
    longest_winning_streak: int

class TradeDetail(BaseModel):
    close_time: str
    symbol: str
    direction: str
    lot_size: float
    profit: float
    cumulative_pnl: float

class FeatureContribution(BaseModel):
    feature: str
    importance: float
    impact: str  # "positive", "negative", "neutral"
    description: str

class ModelBadge(BaseModel):
    model_used: str
    accuracy: float
    f1: float
    roc_auc: float

class PsychologicalProfile(BaseModel):
    profile_name: str
    description: str
    discipline_score: int
    risk_appetite: str
    emotional_control: str
    coaching_advice: List[str]

class AnalysisResponse(BaseModel):
    id: Optional[str] = None
    session_id: Optional[str] = None
    readiness_score: int
    pass_probability: float
    verdict: str
    stats: PerformanceStats
    rule_checklist: List[RuleCheckResponse]
    trades: List[TradeDetail]
    recommendations: List[str]
    feature_contributions: List[FeatureContribution] = []
    psychology: Optional[PsychologicalProfile] = None
    model_badge: Optional[ModelBadge] = None
    ai_coaching: Optional[str] = None
    created_at: Optional[str] = None

class FirmPreset(BaseModel):
    name: str
    account_size: float
    max_daily_loss_pct: float
    max_total_drawdown_pct: float
    profit_target_pct: float
    min_trading_days: int
    consistency_rule_pct: float = 0.0
    url: str = ""

class SimulatedPerformanceStats(BaseModel):
    win_rate: float
    reward_to_risk: float
    overtrading_days: int
    revenge_trades: int
    max_drawdown_pct: float
    consistency_score: float

class SimulationRequest(BaseModel):
    stats: SimulatedPerformanceStats
    account_size: float
    max_daily_loss_pct: float
    max_total_drawdown_pct: float
    profit_target_pct: float
    min_trading_days: int
    consistency_rule_pct: float = 0.0

class SimulationResponse(BaseModel):
    readiness_score: int
    pass_probability: float
    verdict: str
    feature_contributions: List[FeatureContribution] = []

class HistorySummary(BaseModel):
    id: str
    session_id: str
    created_at: str
    readiness_score: int
    verdict: str
    account_size: float
    
class InsightsResponse(BaseModel):
    score_trend: List[Dict[str, Any]]
    common_breaches: List[Dict[str, Any]]
    feature_trends: List[Dict[str, Any]]
