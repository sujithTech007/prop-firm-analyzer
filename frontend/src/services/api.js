const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function getSessionId() {
  return localStorage.getItem('analyzer_session_id') || '';
}

function getHeaders() {
  return {
    'x-session-id': getSessionId()
  };
}

export async function getFirmPresets() {
  const response = await fetch(`${API_BASE_URL}/api/firm-presets`, {
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Failed to load challenge presets.');
  return response.json();
}

export async function analyzeReadiness(file, rules) {
  const formData = new FormData();
  formData.append('file', file);

  const params = new URLSearchParams({
    account_size: rules.account_size,
    max_daily_loss_pct: rules.max_daily_loss_pct,
    max_total_drawdown_pct: rules.max_total_drawdown_pct,
    profit_target_pct: rules.profit_target_pct,
    min_trading_days: rules.min_trading_days,
    consistency_rule_pct: rules.consistency_rule_pct || 0.0
  });

  const response = await fetch(`${API_BASE_URL}/api/analyze?${params.toString()}`, {
    method: 'POST',
    headers: getHeaders(), // Don't set content-type for formData
    body: formData,
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const message = errData.detail || 'An error occurred during trade log analysis.';
    throw new Error(message);
  }

  return response.json();
}

export async function getHistory() {
  const response = await fetch(`${API_BASE_URL}/api/history`, {
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Failed to load history.');
  return response.json();
}

export async function getAnalysis(id) {
  const response = await fetch(`${API_BASE_URL}/api/analysis/${id}`, {
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Failed to load analysis.');
  return response.json();
}

export async function getInsights() {
  const response = await fetch(`${API_BASE_URL}/api/insights`, {
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Failed to load insights.');
  return response.json();
}

export async function getDemoTrades() {
  const response = await fetch(`${API_BASE_URL}/api/demo-trades`);
  if (!response.ok) throw new Error('Failed to load demo trades.');
  return response.text();
}

export async function simulateScore(stats, rules) {
  const payload = {
    stats: {
      win_rate: parseFloat(stats.win_rate),
      reward_to_risk: parseFloat(stats.reward_to_risk),
      overtrading_days: parseInt(stats.overtrading_days),
      revenge_trades: parseInt(stats.revenge_trades),
      max_drawdown_pct: parseFloat(stats.max_drawdown_pct),
      consistency_score: parseFloat(stats.consistency_score)
    },
    account_size: parseFloat(rules.account_size),
    max_daily_loss_pct: parseFloat(rules.max_daily_loss_pct),
    max_total_drawdown_pct: parseFloat(rules.max_total_drawdown_pct),
    profit_target_pct: parseFloat(rules.profit_target_pct),
    min_trading_days: parseInt(rules.min_trading_days),
    consistency_rule_pct: parseFloat(rules.consistency_rule_pct || 0.0)
  };

  const response = await fetch(`${API_BASE_URL}/api/simulate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getHeaders()
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error('Simulation failed.');
  return response.json();
}
