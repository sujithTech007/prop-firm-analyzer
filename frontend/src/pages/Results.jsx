import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Award, Zap, AlertTriangle, Download, Info, Check, X, ShieldAlert,
  ArrowUpRight, ArrowDownRight, RefreshCw, BarChart4, Scale
} from 'lucide-react';
import { getAnalysis, simulateScore } from '../services/api';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, LineChart, Line } from 'recharts';
import { toast } from 'react-toastify';

export default function Results() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const reportRef = useRef(null);

  // Live count-up ticker states
  const [displayScore, setDisplayScore] = useState(0);
  const [displayProb, setDisplayProb] = useState(0);

  // Simulated metrics
  const [simulatedScore, setSimulatedScore] = useState(null);
  const [simulatedProb, setSimulatedProb] = useState(null);
  const [simulatedVerdict, setSimulatedVerdict] = useState(null);
  const [simulatedContributions, setSimulatedContributions] = useState([]);
  
  // Slider states
  const [simWinRate, setSimWinRate] = useState(50);
  const [simRR, setSimRR] = useState(1.5);
  const [simOvertrading, setSimOvertrading] = useState(0);
  const [simRevenge, setSimRevenge] = useState(0);
  const [simDrawdown, setSimDrawdown] = useState(5.0);
  const [simConsistency, setSimConsistency] = useState(0.8);

  // Position Sizing Calculator states
  const [calcBalance, setCalcBalance] = useState(100000);
  const [calcBudget, setCalcBudget] = useState(5000);
  const [calcStopLoss, setCalcStopLoss] = useState(20);
  const [calcAsset, setCalcAsset] = useState('EURUSD');
  const [calcRiskPct, setCalcRiskPct] = useState(10); // 10% of remaining budget

  useEffect(() => {
    async function loadData() {
      try {
        const res = await getAnalysis(id);
        setData(res);
        
        // Initialize sliders from actual stats
        setSimWinRate(res.stats.win_rate);
        setSimRR(res.stats.reward_to_risk);
        setSimOvertrading(res.stats.overtrading_days);
        setSimRevenge(res.stats.revenge_trades);
        setSimDrawdown(res.stats.max_drawdown_pct);
        setSimConsistency(res.stats.consistency_score);
        
        // Initialize position calculator
        setCalcBalance(res.stats.max_drawdown_amt * 10 || 100000);
        
        // Calculate remaining daily loss budget
        const dailyRule = res.rule_checklist.find(r => r.rule_name === 'Max Daily Loss');
        let dailyLimitVal = 5000;
        if (dailyRule) {
          const match = dailyRule.limit_value.match(/\d+/g);
          if (match) dailyLimitVal = parseInt(match[0]);
        }
        setCalcBudget(dailyLimitVal);

        // Animate counting up tickers
        animateTicker(res.readiness_score, setDisplayScore);
        animateTicker(res.pass_probability, setDisplayProb);

      } catch (err) {
        console.error(err);
        toast.error("Failed to load analysis results.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const animateTicker = (target, setter) => {
    let current = 0;
    const duration = 1200; // ms
    const stepTime = Math.max(10, Math.floor(duration / Math.max(1, target)));
    const timer = setInterval(() => {
      current += 1;
      if (current >= target) {
        setter(target);
        clearInterval(timer);
      } else {
        setter(current);
      }
    }, stepTime);
  };

  // Handle simulation triggers
  const triggerSimulation = async () => {
    if (!data) return;
    setIsSimulating(true);
    try {
      const rulesObj = {
        account_size: data.stats.max_drawdown_amt * 10 || 100000,
        max_daily_loss_pct: 5.0,
        max_total_drawdown_pct: 10.0,
        profit_target_pct: 10.0,
        min_trading_days: 4,
        consistency_rule_pct: 0.0
      };

      data.rule_checklist.forEach(r => {
        const nums = r.limit_value.match(/[\d\.]+/g);
        if (nums && nums.length > 0) {
          const val = parseFloat(nums[0]);
          if (r.rule_name === 'Max Daily Loss') rulesObj.max_daily_loss_pct = val;
          if (r.rule_name === 'Max Drawdown') rulesObj.max_total_drawdown_pct = val;
          if (r.rule_name === 'Profit Target') rulesObj.profit_target_pct = val;
          if (r.rule_name === 'Minimum Trading Days') rulesObj.min_trading_days = parseInt(val);
          if (r.rule_name === 'Profit Consistency Rule') rulesObj.consistency_rule_pct = val;
        }
      });

      const simRes = await simulateScore({
        win_rate: simWinRate,
        reward_to_risk: simRR,
        overtrading_days: simOvertrading,
        revenge_trades: simRevenge,
        max_drawdown_pct: simDrawdown,
        consistency_score: simConsistency
      }, rulesObj);

      setSimulatedScore(simRes.readiness_score);
      setSimulatedProb(simRes.pass_probability);
      setSimulatedVerdict(simRes.verdict);
      setSimulatedContributions(simRes.feature_contributions);

      // Animate simulated outcomes
      animateTicker(simRes.readiness_score, setDisplayScore);
      animateTicker(simRes.pass_probability, setDisplayProb);
    } catch (e) {
      console.error(e);
      toast.error("Simulation failed.");
    } finally {
      setIsSimulating(false);
    }
  };

  const resetSimulation = () => {
    if (!data) return;
    setSimWinRate(data.stats.win_rate);
    setSimRR(data.stats.reward_to_risk);
    setSimOvertrading(data.stats.overtrading_days);
    setSimRevenge(data.stats.revenge_trades);
    setSimDrawdown(data.stats.max_drawdown_pct);
    setSimConsistency(data.stats.consistency_score);
    setSimulatedScore(null);
    setSimulatedProb(null);
    setSimulatedVerdict(null);
    setSimulatedContributions([]);
    animateTicker(data.readiness_score, setDisplayScore);
    animateTicker(data.pass_probability, setDisplayProb);
  };

  if (loading) return <div className="fade-in" style={{ padding: '40px' }}><div className="skeleton" style={{ height: '500px', borderRadius: '12px' }} /></div>;
  if (!data) return <div style={{ padding: '40px', textAlign: 'center' }}>Analysis not found.</div>;

  const {
    readiness_score,
    pass_probability,
    verdict,
    stats,
    rule_checklist,
    trades,
    recommendations,
    feature_contributions,
    model_badge
  } = data;

  const getRuleStatus = (ruleName) => {
    const rule = rule_checklist.find(r => r.rule_name === ruleName);
    return rule ? rule.status : 'normal';
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 1.5, backgroundColor: '#0b0f13', useCORS: true });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`PropFirm_Readiness_Report_${id.substring(0, 8)}.pdf`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = () => {
    try {
      const csvHeaders = "close_time,symbol,direction,lot_size,profit,cumulative_pnl\n";
      const csvRows = trades.map(t => 
        `"${t.close_time}","${t.symbol}","${t.direction}",${t.lot_size},${t.profit},${t.cumulative_pnl}`
      ).join("\n");
      
      const blob = new Blob([csvHeaders + csvRows], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `Parsed_Trades_${id.substring(0, 8)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("CSV exported successfully!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to export CSV.");
    }
  };

  // Prepare chart data
  const activeContributions = simulatedScore !== null ? simulatedContributions : feature_contributions;
  const chartData = (activeContributions || []).map(fc => ({
    name: fc.feature.replace(/_/g, ' '),
    importance: parseFloat(fc.importance.toFixed(2))
  })).sort((a, b) => Math.abs(b.importance) - Math.abs(a.importance)).slice(0, 6);

  // Prepare equity curve coordinates
  const equityData = trades.map((t, idx) => ({
    index: idx + 1,
    pnl: t.cumulative_pnl
  }));

  // Consistency share calculation
  const dailyPnL = {};
  trades.forEach(t => {
    const date = t.close_time.split(' ')[0];
    dailyPnL[date] = (dailyPnL[date] || 0) + t.profit;
  });
  const maxDailyProfit = Math.max(0, ...Object.values(dailyPnL));
  const totalProfit = trades.reduce((acc, t) => acc + t.profit, 0);
  const consistencySharePct = totalProfit > 0 && maxDailyProfit > 0 ? (maxDailyProfit / totalProfit) * 100 : 0;

  // Prop Firm presets data comparison
  const firmComparisons = [
    {
      name: "FTMO (Standard 2-Step)",
      dailyLimit: "5.0%",
      drawdownLimit: "10.0%",
      target: "10.0%",
      minDays: "4 days",
      consistency: "None",
      dailyStatus: stats.worst_day_pct <= 5.0 ? 'pass' : 'breach',
      drawdownStatus: stats.max_drawdown_pct <= 10.0 ? 'pass' : 'breach',
      targetStatus: (totalProfit / (stats.max_drawdown_amt * 10 || 100000)) * 100 >= 10.0 ? 'pass' : 'warning',
      daysStatus: stats.trading_days >= 4 ? 'pass' : 'warning',
      consistencyStatus: 'pass',
      url: "https://ftmo.com/"
    },
    {
      name: "Topstep (1-Step Combine)",
      dailyLimit: "2.0%",
      drawdownLimit: "4.0%",
      target: "6.0%",
      minDays: "5 days",
      consistency: "40.0% share",
      dailyStatus: stats.worst_day_pct <= 2.0 ? 'pass' : 'breach',
      drawdownStatus: stats.max_drawdown_pct <= 4.0 ? 'pass' : 'breach',
      targetStatus: (totalProfit / (stats.max_drawdown_amt * 10 || 100000)) * 100 >= 6.0 ? 'pass' : 'warning',
      daysStatus: stats.trading_days >= 5 ? 'pass' : 'warning',
      consistencyStatus: consistencySharePct <= 40.0 ? 'pass' : 'breach',
      url: "https://www.topstep.com/"
    },
    {
      name: "MyFundedFX (Standard)",
      dailyLimit: "5.0%",
      drawdownLimit: "8.0%",
      target: "8.0%",
      minDays: "1 day",
      consistency: "None",
      dailyStatus: stats.worst_day_pct <= 5.0 ? 'pass' : 'breach',
      drawdownStatus: stats.max_drawdown_pct <= 8.0 ? 'pass' : 'breach',
      targetStatus: (totalProfit / (stats.max_drawdown_amt * 10 || 100000)) * 100 >= 8.0 ? 'pass' : 'warning',
      daysStatus: stats.trading_days >= 1 ? 'pass' : 'warning',
      consistencyStatus: 'pass',
      url: "https://myfundedfx.com/"
    },
    {
      name: "The5ers (Hyper Growth)",
      dailyLimit: "4.0%",
      drawdownLimit: "6.0%",
      target: "6.0%",
      minDays: "None",
      consistency: "None",
      dailyStatus: stats.worst_day_pct <= 4.0 ? 'pass' : 'breach',
      drawdownStatus: stats.max_drawdown_pct <= 6.0 ? 'pass' : 'breach',
      targetStatus: (totalProfit / (stats.max_drawdown_amt * 10 || 100000)) * 100 >= 6.0 ? 'pass' : 'warning',
      daysStatus: 'pass',
      consistencyStatus: 'pass',
      url: "https://the5ers.com/"
    }
  ];

  const getPipValue = (asset) => {
    if (asset.includes('JPY')) return 9.0;
    if (asset.includes('CHF')) return 11.0;
    if (asset.includes('XAU')) return 10.0;
    if (asset.includes('BTC')) return 1.0;
    return 10.0;
  };

  const calcRiskAmount = (calcBudget * (calcRiskPct / 100.0)).toFixed(2);
  const calcLotSize = (calcRiskAmount / (calcStopLoss * getPipValue(calcAsset))).toFixed(2);

  // Active status color helper
  const activeScore = simulatedScore !== null ? simulatedScore : readiness_score;
  let activeColor = "var(--warning-color)";
  if (activeScore >= 70) activeColor = "var(--pass-color)";
  else if (activeScore < 45) activeColor = "var(--breach-color)";

  const strokeDashoffset = (2 * Math.PI * 50) - (displayScore / 100) * (2 * Math.PI * 50);

  return (
    <div className="fade-in" style={{ paddingBottom: '40px' }} ref={reportRef}>
      
      {/* Visual motif: Header curve line */}
      <div style={{
        height: '4px', width: '100%',
        backgroundImage: 'linear-gradient(90deg, var(--brand-color) 0%, transparent 100%)',
        marginBottom: '20px'
      }} />

      {/* Header controls row */}
      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '32px', borderBottom: '1px solid var(--panel-border)', paddingBottom: '20px', flexWrap: 'wrap', gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => navigate('/dashboard/history')}
            className="btn btn-secondary"
            style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
          >
            <ChevronLeft size={14} />
            <span>BACK</span>
          </button>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", margin: 0 }}>
              COMPLIANCE REPORT
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: '2px 0 0 0' }}>
              ID: <span className="mono">{id.substring(0, 8)}</span> • Log: <span className="mono">{stats.total_trades}</span> closed trades
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {model_badge && (
            <div className="mono" style={{ 
              padding: '6px 12px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.02)', 
              border: '1px solid var(--panel-border)', fontSize: '11px', color: 'var(--text-secondary)'
            }}>
              AI MODEL: <span style={{ color: '#fff' }}>{model_badge.model_used.toUpperCase()}</span> (F1: {model_badge.f1.toFixed(2)})
            </div>
          )}

          <button onClick={handleExportCSV} className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '12px' }}>
            EXPORT CSV
          </button>
          
          <button onClick={handleExportPDF} disabled={isExporting} className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Download size={14} />
            {isExporting ? 'EXPORTING...' : 'PDF'}
          </button>
        </div>
      </header>

      {/* Main Grid: Asymmetrical Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }} className="asym-grid">
        <style dangerouslySetInnerHTML={{__html: `@media (min-width: 992px) { .asym-grid { grid-template-columns: 1fr 400px !important; } }`}} />

        {/* Left Main Dashboard Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Radial Score Gauge Card */}
          <div className="panel" style={{ 
            display: 'flex', alignItems: 'center', gap: '40px', padding: '30px', 
            position: 'relative', overflow: 'hidden'
          }}>
            {simulatedScore !== null && (
              <span className="mono" style={{ 
                position: 'absolute', top: '12px', right: '12px', 
                backgroundColor: 'var(--accent-teal)', color: '#000', 
                padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' 
              }}>
                SIMULATED PREVIEW
              </span>
            )}

            {/* Canvas Dial */}
            <div style={{ position: 'relative', width: '130px', height: '130px', flexShrink: 0 }}>
              <svg width="100%" height="100%" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="60" cy="60" r="50" fill="transparent" stroke="var(--panel-border)" strokeWidth="8" />
                <circle 
                  cx="60" cy="60" r="50" fill="transparent" 
                  stroke={activeColor} strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 50}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.4s ease, stroke 0.4s ease' }}
                />
              </svg>
              <div style={{ 
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
              }}>
                <span className="mono" style={{ fontSize: '32px', fontWeight: 700, color: '#fff' }}>{displayScore}</span>
                <span style={{ fontSize: '10px', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>READINESS</span>
              </div>
            </div>

            {/* Verdict text */}
            <div>
              <span className="mono" style={{ fontSize: '11px', color: activeColor, fontWeight: 700, letterSpacing: '1px' }}>
                VERDICT: {(simulatedScore !== null ? simulatedVerdict : verdict).toUpperCase()}
              </span>
              <h2 style={{ fontSize: '24px', fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", margin: '6px 0 4px 0', color: '#fff' }}>
                {displayProb}% ML Pass Likelihood
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.5', margin: 0, maxWidth: '440px' }}>
                This calibrated probability maps your trading frequency, consistency, and risk factors directly to the selected challenge parameters.
              </p>
            </div>
          </div>

          {/* Side-by-Side Prop Firm Comparison Table */}
          <div className="panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '18px' }}>
              PROP FIRM COMPLIANCE MATRIX
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--panel-border)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '10px 8px', fontWeight: 600 }}>CHALLENGE PRESET</th>
                    <th style={{ padding: '10px 8px', fontWeight: 600, textAlign: 'center' }}>DAILY LOSS</th>
                    <th style={{ padding: '10px 8px', fontWeight: 600, textAlign: 'center' }}>MAX DRAWDOWN</th>
                    <th style={{ padding: '10px 8px', fontWeight: 600, textAlign: 'center' }}>PROFIT TARGET</th>
                    <th style={{ padding: '10px 8px', fontWeight: 600, textAlign: 'center' }}>MIN TRADING DAYS</th>
                    <th style={{ padding: '10px 8px', fontWeight: 600, textAlign: 'center' }}>CONSISTENCY RULE</th>
                  </tr>
                </thead>
                <tbody>
                  {firmComparisons.map((fc, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid var(--panel-border)', height: '48px' }}>
                      <td style={{ padding: '10px 8px', fontWeight: 600 }}>
                        <a href={fc.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-primary)', textDecoration: 'none', borderBottom: '1px dotted var(--brand-color)' }}>
                          {fc.name}
                        </a>
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                        <ComparisonBadge status={fc.dailyStatus} limit={fc.dailyLimit} />
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                        <ComparisonBadge status={fc.drawdownStatus} limit={fc.drawdownLimit} />
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                        <ComparisonBadge status={fc.targetStatus} limit={fc.target} />
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                        <ComparisonBadge status={fc.daysStatus} limit={fc.minDays} />
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                        <ComparisonBadge status={fc.consistencyStatus} limit={fc.consistency} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Equity Curve Chart Panel */}
          <div className="panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '18px' }}>
              PORTFOLIO EQUITY CURVE (NET P&L)
            </h3>
            <div style={{ height: '240px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={equityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--panel-border)" horizontal={true} vertical={false} />
                  <XAxis dataKey="index" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} domain={['auto', 'auto']} tickFormatter={val => `$${val}`} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--panel-bg)', borderColor: 'var(--panel-border)', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="pnl" stroke="var(--brand-color)" strokeWidth={2.5} dot={false} animationDuration={1000} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Feature Importance & Contribution Diagnostics */}
          <div className="panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '18px' }}>
              BEHAVIORAL CONTRIBUTION ANALYSIS (SHAP ATTRIBUTIONS)
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }} className="explain-grid">
              <style dangerouslySetInnerHTML={{__html: `@media (min-width: 768px) { .explain-grid { grid-template-columns: 1fr 1.2fr !important; } }`}} />
              
              {/* Contributions Chart */}
              <div style={{ height: '220px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--panel-border)" />
                    <XAxis type="number" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} width={80} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--panel-bg)', borderColor: 'var(--panel-border)', borderRadius: '8px' }} />
                    <Bar dataKey="importance" barSize={12} radius={[0, 4, 4, 0]} animationDuration={1000}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.importance > 0 ? 'var(--pass-color)' : 'var(--breach-color)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Explanations bullets list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {activeContributions && activeContributions.length > 0 ? (
                  activeContributions.slice(0, 5).map((fc, idx) => {
                    const isPositive = fc.impact === 'positive';
                    const isNegative = fc.impact === 'negative';
                    
                    return (
                      <div key={idx} style={{ 
                        display: 'flex', alignItems: 'flex-start', gap: '8px', 
                        padding: '10px 12px', borderRadius: '6px',
                        backgroundColor: isPositive ? 'rgba(74, 219, 186, 0.02)' : (isNegative ? 'rgba(229, 89, 94, 0.02)' : 'rgba(255,255,255,0.01)'),
                        borderLeft: `3px solid ${isPositive ? 'var(--pass-color)' : (isNegative ? 'var(--breach-color)' : 'var(--panel-border)')}`
                      }}>
                        <div style={{ marginTop: '2px' }}>
                          {isPositive ? <ArrowUpRight size={14} color="var(--pass-color)" /> : 
                           (isNegative ? <ArrowDownRight size={14} color="var(--breach-color)" /> : 
                           <Info size={14} color="var(--text-secondary)" />)}
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                          {fc.description}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Explanations loading...</p>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Right Sidebar Details Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Key Stat Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="panel" style={{ padding: '16px' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '2px' }}>WIN RATE</div>
              <div className="mono" style={{ fontSize: '20px', fontWeight: 700, color: '#fff' }}>{stats.win_rate}%</div>
              <span style={{ fontSize: '10px', color: stats.win_rate >= 50 ? 'var(--pass-color)' : 'var(--warning-color)' }}>Ideal: &gt;50%</span>
            </div>
            
            <div className="panel" style={{ padding: '16px' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '2px' }}>REWARD:RISK</div>
              <div className="mono" style={{ fontSize: '20px', fontWeight: 700, color: '#fff' }}>{stats.reward_to_risk}x</div>
              <span style={{ fontSize: '10px', color: stats.reward_to_risk >= 1.5 ? 'var(--pass-color)' : 'var(--warning-color)' }}>Ideal: &gt;1.5</span>
            </div>

            <div className="panel" style={{ padding: '16px' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '2px' }}>MAX DRAWDOWN</div>
              <div className="mono" style={{ fontSize: '20px', fontWeight: 700, color: '#fff' }}>-{stats.max_drawdown_pct}%</div>
              <span style={{ fontSize: '10px', color: getRuleStatus('Max Drawdown') === 'pass' ? 'var(--pass-color)' : 'var(--breach-color)' }}>
                ${stats.max_drawdown_amt.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>

            <div className="panel" style={{ padding: '16px' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '2px' }}>CONSISTENCY</div>
              <div className="mono" style={{ fontSize: '20px', fontWeight: 700, color: '#fff' }}>{consistencySharePct.toFixed(1)}%</div>
              <span style={{ fontSize: '10px', color: consistencySharePct <= 40 ? 'var(--pass-color)' : 'var(--warning-color)' }}>Limit: &lt;40%</span>
            </div>
          </div>

          {/* Rule Checklist Details */}
          <div className="panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              RULES AUDIT RUN
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {rule_checklist.map((rule, idx) => {
                const isPass = rule.status === 'pass';
                const isWarning = rule.status === 'warning';
                
                return (
                  <div key={idx} style={{ 
                    borderBottom: idx !== rule_checklist.length - 1 ? '1px solid var(--panel-border)' : 'none',
                    paddingBottom: idx !== rule_checklist.length - 1 ? '12px' : '0'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{rule.rule_name}</span>
                      <span className="mono" style={{ 
                        fontSize: '11px', fontWeight: 700, 
                        color: isPass ? 'var(--pass-color)' : (isWarning ? 'var(--warning-color)' : 'var(--breach-color)')
                      }}>
                        {rule.status.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
                      <span>Limit: {rule.limit_value}</span>
                      <span>Actual: <strong className="mono" style={{ color: '#fff' }}>{rule.actual_value}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* What-If Multi-Slider Simulator */}
          <div className="panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <RefreshCw size={14} color="var(--brand-color)" /> ML OUTCOME SIMULATOR
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                  <span>WIN RATE:</span>
                  <span className="mono" style={{ color: '#fff', fontWeight: 600 }}>{simWinRate}%</span>
                </div>
                <input type="range" min="20" max="85" value={simWinRate} onChange={e => setSimWinRate(parseInt(e.target.value))} style={{ width: '100%', accentColor: 'var(--brand-color)' }} />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                  <span>REWARD:RISK:</span>
                  <span className="mono" style={{ color: '#fff', fontWeight: 600 }}>{simRR}x</span>
                </div>
                <input type="range" min="0.5" max="3.5" step="0.1" value={simRR} onChange={e => setSimRR(parseFloat(e.target.value))} style={{ width: '100%', accentColor: 'var(--brand-color)' }} />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                  <span>OVERTRADING DAYS:</span>
                  <span className="mono" style={{ color: '#fff', fontWeight: 600 }}>{simOvertrading}</span>
                </div>
                <input type="range" min="0" max="15" value={simOvertrading} onChange={e => setSimOvertrading(parseInt(e.target.value))} style={{ width: '100%', accentColor: 'var(--brand-color)' }} />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                  <span>REVENGE EVENTS:</span>
                  <span className="mono" style={{ color: '#fff', fontWeight: 600 }}>{simRevenge}</span>
                </div>
                <input type="range" min="0" max="10" value={simRevenge} onChange={e => setSimRevenge(parseInt(e.target.value))} style={{ width: '100%', accentColor: 'var(--brand-color)' }} />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                  <span>MAX DRAWDOWN:</span>
                  <span className="mono" style={{ color: '#fff', fontWeight: 600 }}>{simDrawdown}%</span>
                </div>
                <input type="range" min="0.5" max="15" step="0.5" value={simDrawdown} onChange={e => setSimDrawdown(parseFloat(e.target.value))} style={{ width: '100%', accentColor: 'var(--brand-color)' }} />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button onClick={triggerSimulation} disabled={isSimulating} className="btn btn-primary" style={{ flex: 1, padding: '10px', fontSize: '11px' }}>
                  {isSimulating ? "COMPUTING..." : "RUN SIMULATION"}
                </button>
                <button onClick={resetSimulation} className="btn btn-secondary" style={{ padding: '10px 14px', fontSize: '11px' }}>
                  RESET
                </button>
              </div>
            </div>
          </div>

          {/* Position Sizing / Risk Calculator */}
          <div className="panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Scale size={14} color="var(--brand-color)" /> RISK & LOT CALCULATOR
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="input-group">
                  <label className="input-label" style={{ fontSize: '10px' }}>BUDGET ($)</label>
                  <input type="number" className="input-field" style={{ padding: '8px', fontSize: '12px' }} value={calcBudget} onChange={e => setCalcBudget(parseFloat(e.target.value) || 0)} />
                </div>
                <div className="input-group">
                  <label className="input-label" style={{ fontSize: '10px' }}>STOP LOSS (PIPS)</label>
                  <input type="number" className="input-field" style={{ padding: '8px', fontSize: '12px' }} value={calcStopLoss} onChange={e => setCalcStopLoss(parseFloat(e.target.value) || 0)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="input-group">
                  <label className="input-label" style={{ fontSize: '10px' }}>ASSET</label>
                  <select className="input-field select-field" style={{ padding: '8px', fontSize: '12px', height: '34px' }} value={calcAsset} onChange={e => setCalcAsset(e.target.value)}>
                    <option value="EURUSD">EURUSD</option>
                    <option value="GBPUSD">GBPUSD</option>
                    <option value="USDJPY">USDJPY</option>
                    <option value="XAUUSD">XAUUSD</option>
                    <option value="BTCUSD">BTCUSD</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label" style={{ fontSize: '10px' }}>RISK ALLOCATION</label>
                  <select className="input-field select-field" style={{ padding: '8px', fontSize: '12px', height: '34px' }} value={calcRiskPct} onChange={e => setCalcRiskPct(parseFloat(e.target.value))}>
                    <option value="5">5% RISK</option>
                    <option value="10">10% RISK</option>
                    <option value="25">25% RISK</option>
                    <option value="50">50% RISK</option>
                    <option value="100">100% RISK</option>
                  </select>
                </div>
              </div>

              <div style={{ 
                marginTop: '6px', padding: '12px', borderRadius: '4px',
                backgroundColor: 'rgba(232, 163, 61, 0.02)', border: '1px solid var(--panel-border)',
                display: 'flex', flexDirection: 'column', gap: '4px' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>RISK CAPITAL:</span>
                  <span className="mono" style={{ fontWeight: '600' }}>${calcRiskAmount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>MAX CONTRACT SIZING:</span>
                  <span className="mono" style={{ color: 'var(--brand-color)', fontWeight: '700' }}>{calcLotSize} LOTS</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Recommendations Alert Cards */}
          <div className="panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Award size={14} color="var(--brand-color)" /> COOPERATIVE COACHING
            </h3>
            {recommendations && recommendations.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {recommendations.slice(0, 3).map((rec, idx) => {
                  let alertColor = "var(--brand-color)";
                  let bg = "rgba(232, 163, 61, 0.01)";
                  if (rec.includes('IMMEDIATE') || rec.includes('Warning') || rec.includes('breached')) {
                    alertColor = "var(--breach-color)";
                    bg = "rgba(229, 89, 94, 0.01)";
                  } else if (rec.includes('Solid') || rec.includes('Excellent')) {
                    alertColor = "var(--pass-color)";
                    bg = "rgba(74, 219, 186, 0.01)";
                  }
                  
                  return (
                    <div key={idx} style={{ 
                      padding: '10px 14px', borderRadius: '4px', borderLeft: `3px solid ${alertColor}`,
                      backgroundColor: bg, fontSize: '12px', lineHeight: '1.4', color: 'var(--text-primary)'
                    }}>
                      {rec}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: 0 }}>No recommendations generated.</p>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}

function ComparisonBadge({ status, limit }) {
  const isPass = status === 'pass';
  const isWarning = status === 'warning';
  
  const bg = isPass ? 'rgba(74, 219, 186, 0.05)' : (isWarning ? 'rgba(236, 201, 75, 0.05)' : 'rgba(229, 89, 94, 0.05)');
  const color = isPass ? 'var(--pass-color)' : (isWarning ? 'var(--warning-color)' : 'var(--breach-color)');
  
  return (
    <div style={{ 
      display: 'inline-flex', flexDirection: 'column', alignItems: 'center', 
      padding: '4px 8px', borderRadius: '4px', backgroundColor: bg, color: color,
      minWidth: '64px', border: `1px solid ${bg}`
    }}>
      <span className="mono" style={{ fontSize: '10px', fontWeight: 'bold' }}>{isPass ? 'PASS' : (isWarning ? 'WARN' : 'FAIL')}</span>
      <span className="mono" style={{ fontSize: '9px', opacity: 0.8, marginTop: '2px' }}>{limit}</span>
    </div>
  );
}
