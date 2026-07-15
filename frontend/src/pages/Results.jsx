import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Award, Zap, AlertTriangle, Download, Info, Check, X, ShieldAlert,
  HelpCircle, ArrowUpRight, ArrowDownRight, RefreshCw, BarChart4
} from 'lucide-react';
import { getAnalysis, simulateScore } from '../services/api';
import ReadinessGauge from '../components/ReadinessGauge';
import EquityCurve from '../components/EquityCurve';
import RuleChecklist from '../components/RuleChecklist';
import StatCard from '../components/StatCard';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { toast } from 'react-toastify';

export default function Results() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const reportRef = useRef(null);

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

      } catch (err) {
        console.error(err);
        toast.error("Failed to load analysis results.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  // Handle simulation triggers
  const triggerSimulation = async () => {
    if (!data) return;
    setIsSimulating(true);
    try {
      // Find original rules from data
      const rulesObj = {
        account_size: data.stats.max_drawdown_amt * 10 || 100000,
        max_daily_loss_pct: 5.0,
        max_total_drawdown_pct: 10.0,
        profit_target_pct: 10.0,
        min_trading_days: 4,
        consistency_rule_pct: 0.0
      };

      // Search for rules in rule_checklist limit values to match accurately
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

  // Position Sizing calculator math
  const getPipValue = (asset) => {
    if (asset.includes('JPY')) return 9.0;
    if (asset.includes('CHF')) return 11.0;
    if (asset.includes('XAU')) return 10.0;
    if (asset.includes('BTC')) return 1.0;
    return 10.0; // standard EURUSD, GBPUSD, etc.
  };

  const calcRiskAmount = (calcBudget * (calcRiskPct / 100.0)).toFixed(2);
  const calcLotSize = (calcRiskAmount / (calcStopLoss * getPipValue(calcAsset))).toFixed(2);

  return (
    <div className="fade-in" style={{ padding: '20px 0' }} ref={reportRef}>
      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '32px', borderBottom: '1px solid var(--panel-border)', paddingBottom: '20px', flexWrap: 'wrap', gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigate('/history')}
            className="btn btn-secondary"
            style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
          >
            <ChevronLeft size={16} />
            <span>Back</span>
          </button>
          <div>
            <h1 style={{ fontSize: '22px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Evaluation Report
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
              Evaluation generated from <span className="mono" style={{ color: 'var(--text-primary)' }}>{stats.total_trades}</span> trades
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {model_badge && (
            <div style={{ padding: '6px 12px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.05)', fontSize: '11px', display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: 'var(--text-secondary)' }}>AI Model: {model_badge.model_used}</span>
              <span style={{ color: 'var(--accent-teal)' }}>CV F1: {model_badge.f1.toFixed(3)}</span>
            </div>
          )}

          <button
            onClick={handleExportCSV}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--panel-border)', padding: '8px 16px', borderRadius: '6px', color: 'var(--text-primary)', cursor: 'pointer'
            }}
          >
            Export CSV
          </button>
          
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--panel-border)',
              border: 'none', padding: '8px 16px', borderRadius: '6px', color: 'var(--text-primary)', cursor: 'pointer'
            }}
          >
            <Download size={16} />
            {isExporting ? 'Exporting...' : 'Export PDF'}
          </button>
          
          <div className="panel panel-alt" style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <div style={{ 
              width: '8px', height: '8px', borderRadius: '50%', 
              backgroundColor: (simulatedScore !== null ? simulatedScore : readiness_score) >= 70 ? 'var(--pass-color)' : 
                            (simulatedScore !== null ? simulatedScore : readiness_score) >= 40 ? 'var(--warning-yellow)' : 'var(--breach-color)' 
            }} />
            <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>Verdict:</span>
            <span style={{ fontWeight: '700', fontSize: '13px', color: '#FFFFFF' }}>
              {simulatedScore !== null ? simulatedVerdict : verdict}
            </span>
          </div>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }} className="results-grid">
        <style dangerouslySetInnerHTML={{__html: `@media (min-width: 992px) { .results-grid { grid-template-columns: 380px 1fr !important; } }`}} />

        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Readiness gauge */}
          <div style={{ position: 'relative' }}>
             <ReadinessGauge 
                score={simulatedScore !== null ? simulatedScore : readiness_score} 
                passProbability={simulatedScore !== null ? simulatedProb : pass_probability} 
                verdict={simulatedScore !== null ? simulatedVerdict : verdict} 
             />
             {simulatedScore !== null && (
                <div style={{ position: 'absolute', top: '12px', right: '12px', backgroundColor: 'var(--accent-teal)', color: '#000', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                  SIMULATED VIEW
                </div>
             )}
          </div>

          {/* Performance Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="tooltip-container" title="Win Rate: Target is above 45-50% for standard setups.">
              <StatCard label="Win Rate" value={`${stats.win_rate}%`} subtext="Ideal: >50%" status={stats.win_rate >= 50 ? 'pass' : stats.win_rate >= 40 ? 'warning' : 'breach'} />
            </div>
            <div className="tooltip-container" title="Average win amount divided by average loss amount. Recommended to keep above 1.5.">
              <StatCard label="Reward:Risk" value={`${stats.reward_to_risk}`} subtext="Ideal: >1.5" status={stats.reward_to_risk >= 1.5 ? 'pass' : stats.reward_to_risk >= 1.0 ? 'warning' : 'breach'} />
            </div>
            <div className="tooltip-container" title="Maximum capital pullback from peak equity. Rules range from 4% to 10%.">
              <StatCard label="Max Drawdown" value={`-$${stats.max_drawdown_amt.toLocaleString('en-US', { maximumFractionDigits: 0 })}`} subtext={`${stats.max_drawdown_pct}% of balance`} status={getRuleStatus('Max Drawdown')} />
            </div>
            <div className="tooltip-container" title="Consistency Share: Percentage of total profits made on the highest-profit day.">
              <StatCard label="Consistency Share" value={`${consistencySharePct.toFixed(1)}%`} subtext="Ideal: <40%" status={consistencySharePct <= 40 ? 'pass' : 'warning'} />
            </div>
          </div>

          {/* What-If Multi-Slider Simulator */}
          <div className="panel" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <RefreshCw size={16} color="var(--accent-teal)" /> ML Score Simulator
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Simulate metric improvements to see the AI model recompute pass likelihood in real-time.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span>Win Rate: {simWinRate}%</span>
                  <span style={{ color: 'var(--text-muted)' }}>Actual: {stats.win_rate}%</span>
                </div>
                <input type="range" min="20" max="85" value={simWinRate} onChange={e => setSimWinRate(parseInt(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent-teal)' }} />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span>Reward:Risk: {simRR}x</span>
                  <span style={{ color: 'var(--text-muted)' }}>Actual: {stats.reward_to_risk}x</span>
                </div>
                <input type="range" min="0.5" max="3.5" step="0.1" value={simRR} onChange={e => setSimRR(parseFloat(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent-teal)' }} />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span>Overtrading Days: {simOvertrading}</span>
                  <span style={{ color: 'var(--text-muted)' }}>Actual: {stats.overtrading_days}</span>
                </div>
                <input type="range" min="0" max="15" value={simOvertrading} onChange={e => setSimOvertrading(parseInt(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent-teal)' }} />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span>Revenge Trading Events: {simRevenge}</span>
                  <span style={{ color: 'var(--text-muted)' }}>Actual: {stats.revenge_trades}</span>
                </div>
                <input type="range" min="0" max="10" value={simRevenge} onChange={e => setSimRevenge(parseInt(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent-teal)' }} />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span>Max Drawdown: {simDrawdown}%</span>
                  <span style={{ color: 'var(--text-muted)' }}>Actual: {stats.max_drawdown_pct}%</span>
                </div>
                <input type="range" min="0.5" max="15" step="0.5" value={simDrawdown} onChange={e => setSimDrawdown(parseFloat(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent-teal)' }} />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button 
                  onClick={triggerSimulation} 
                  disabled={isSimulating}
                  style={{
                    flex: 1, padding: '8px', borderRadius: '6px', border: 'none',
                    backgroundColor: 'var(--accent-teal)', color: '#000', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer'
                  }}
                >
                  {isSimulating ? "Recalculating..." : "Simulate Score"}
                </button>
                <button 
                  onClick={resetSimulation} 
                  style={{
                    padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--panel-border)',
                    backgroundColor: 'transparent', color: 'var(--text-primary)', fontSize: '12px', cursor: 'pointer'
                  }}
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Position Sizing / Risk Calculator */}
          <div className="panel" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ScaleIcon size={16} /> Risk & Position Sizing Calculator
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Calculate the maximum safe lot size for your next trade based on your remaining daily loss budget.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="input-group" style={{ margin: 0 }}>
                  <label className="input-label" style={{ fontSize: '11px' }}>Daily Budget ($)</label>
                  <input type="number" className="input-field" style={{ padding: '6px', fontSize: '12px' }} value={calcBudget} onChange={e => setCalcBudget(parseFloat(e.target.value) || 0)} />
                </div>
                <div className="input-group" style={{ margin: 0 }}>
                  <label className="input-label" style={{ fontSize: '11px' }}>Stop Loss (Pips)</label>
                  <input type="number" className="input-field" style={{ padding: '6px', fontSize: '12px' }} value={calcStopLoss} onChange={e => setCalcStopLoss(parseFloat(e.target.value) || 0)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="input-group" style={{ margin: 0 }}>
                  <label className="input-label" style={{ fontSize: '11px' }}>Pair/Asset</label>
                  <select className="input-field select-field" style={{ padding: '6px', fontSize: '12px', height: 'auto' }} value={calcAsset} onChange={e => setCalcAsset(e.target.value)}>
                    <option value="EURUSD">EURUSD (Majors)</option>
                    <option value="GBPUSD">GBPUSD (Majors)</option>
                    <option value="USDJPY">USDJPY (JPY Pairs)</option>
                    <option value="XAUUSD">XAUUSD (Gold)</option>
                    <option value="BTCUSD">BTCUSD (Crypto)</option>
                  </select>
                </div>
                <div className="input-group" style={{ margin: 0 }}>
                  <label className="input-label" style={{ fontSize: '11px' }}>Risk % of Budget</label>
                  <select className="input-field select-field" style={{ padding: '6px', fontSize: '12px', height: 'auto' }} value={calcRiskPct} onChange={e => setCalcRiskPct(parseFloat(e.target.value))}>
                    <option value="5">5% Risk</option>
                    <option value="10">10% Risk</option>
                    <option value="25">25% Risk</option>
                    <option value="50">50% Risk</option>
                    <option value="100">100% Risk</option>
                  </select>
                </div>
              </div>

              <div style={{ 
                marginTop: '8px', padding: '12px', borderRadius: '6px',
                backgroundColor: 'rgba(74, 219, 186, 0.04)', border: '1px solid rgba(74, 219, 186, 0.15)',
                display: 'flex', flexDirection: 'column', gap: '4px' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Risk Capital ($):</span>
                  <span style={{ fontWeight: '600' }}>${calcRiskAmount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Max Lot Size:</span>
                  <span style={{ color: 'var(--accent-teal)', fontWeight: '700', fontSize: '15px' }}>{calcLotSize} Lots</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Side-by-Side Prop Firm Comparison View */}
          <div className="panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={18} color="var(--accent-teal)" /> Side-by-Side Prop Firm Comparison
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Compare your current trading results directly against the official rules of major prop firms.
            </p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--panel-border)', color: 'var(--text-secondary)', height: '40px' }}>
                    <th style={{ padding: '10px 8px', fontWeight: 600 }}>Challenge Profile</th>
                    <th style={{ padding: '10px 8px', fontWeight: 600, textAlign: 'center' }}>Daily Loss</th>
                    <th style={{ padding: '10px 8px', fontWeight: 600, textAlign: 'center' }}>Max Drawdown</th>
                    <th style={{ padding: '10px 8px', fontWeight: 600, textAlign: 'center' }}>Profit Target</th>
                    <th style={{ padding: '10px 8px', fontWeight: 600, textAlign: 'center' }}>Min Days</th>
                    <th style={{ padding: '10px 8px', fontWeight: 600, textAlign: 'center' }}>Consistency</th>
                  </tr>
                </thead>
                <tbody>
                  {firmComparisons.map((fc, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid var(--panel-border)', height: '50px' }}>
                      <td style={{ padding: '10px 8px', fontWeight: 600 }}>
                        <a href={fc.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-primary)', textDecoration: 'none', borderBottom: '1px dotted var(--accent-teal)' }}>
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
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '16px', fontStyle: 'italic', margin: 0 }}>
              * Comparison values are approximations. Presets are mapped relative to your account size. Check official links for official rules.
            </p>
          </div>

          {/* Explainability & Feature Contribution Breakdown */}
          <div className="panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart4 size={18} color="var(--accent-teal)" /> AI Feature Contributions & Explainability
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Understand why the model assigned this readiness score. Check how specific behaviors help or hurt your probability.
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }} className="explain-grid">
              <style dangerouslySetInnerHTML={{__html: `@media (min-width: 768px) { .explain-grid { grid-template-columns: 1fr 1.2fr !important; } }`}} />
              
              {/* Feature contributions bar chart */}
              <div style={{ height: '220px' }}>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--panel-border)" />
                      <XAxis type="number" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} width={80} />
                      <Tooltip contentStyle={{ backgroundColor: 'var(--panel-bg)', borderColor: 'var(--panel-border)', borderRadius: '8px' }} />
                      <Bar dataKey="importance" barSize={12} radius={[0, 4, 4, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.importance > 0 ? 'var(--accent-teal)' : 'var(--breach-color)'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    No contribution details available.
                  </div>
                )}
              </div>

              {/* Heuristic Bullet explanations */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {activeContributions && activeContributions.length > 0 ? (
                  activeContributions.slice(0, 5).map((fc, idx) => {
                    const isPositive = fc.impact === 'positive';
                    const isNegative = fc.impact === 'negative';
                    
                    return (
                      <div key={idx} style={{ 
                        display: 'flex', alignItems: 'flex-start', gap: '8px', 
                        padding: '10px 12px', borderRadius: '6px',
                        backgroundColor: isPositive ? 'rgba(74, 219, 186, 0.03)' : (isNegative ? 'rgba(229, 89, 94, 0.03)' : 'rgba(255,255,255,0.01)'),
                        borderLeft: `3px solid ${isPositive ? 'var(--accent-teal)' : (isNegative ? 'var(--breach-color)' : 'var(--panel-border)')}`
                      }}>
                        <div style={{ marginTop: '2px' }}>
                          {isPositive ? <ArrowUpRight size={14} color="var(--accent-teal)" /> : 
                           (isNegative ? <ArrowDownRight size={14} color="var(--breach-color)" /> : 
                           <Info size={14} color="var(--text-muted)" />)}
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                          {fc.description}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Explanations generation is loading.</p>
                )}
              </div>
            </div>
          </div>

          <EquityCurve trades={trades} />

          <RuleChecklist rules={rule_checklist} />

          {/* AI Coaching Panel */}
          <div className="panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={18} color="var(--brand-color)" />
              <span>AI recommendations & coaching</span>
            </h3>

            {recommendations && recommendations.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {recommendations.map((rec, idx) => {
                  let icon = <Zap size={16} color="var(--brand-color)" />;
                  let itemBg = 'rgba(232, 163, 61, 0.04)';
                  let itemBorder = 'rgba(232, 163, 61, 0.15)';

                  if (rec.includes('IMMEDIATE ACTION') || rec.includes('Warning') || rec.includes('breached') || rec.includes('Drawdown') || rec.includes('Low Win Rate') || rec.includes('Inconsistent')) {
                    icon = <AlertTriangle size={16} color="var(--breach-color)" />;
                    itemBg = 'rgba(229, 89, 94, 0.04)';
                    itemBorder = 'rgba(229, 89, 94, 0.15)';
                  } else if (rec.includes('Solid Performance') || rec.includes('Discipline') || rec.includes('Excellent')) {
                    icon = <Award size={16} color="var(--pass-color)" />;
                    itemBg = 'rgba(63, 193, 160, 0.04)';
                    itemBorder = 'rgba(63, 193, 160, 0.15)';
                  }

                  return (
                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 16px', backgroundColor: itemBg, border: `1px solid ${itemBorder}`, borderRadius: '8px', fontSize: '13.5px', lineHeight: '1.5' }}>
                      <div style={{ marginTop: '2px', flexShrink: 0 }}>{icon}</div>
                      <span style={{ color: 'var(--text-primary)' }}>{rec}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No recommendations generated.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ScaleIcon({ size }) {
  return (
    <div style={{ display: 'inline-flex' }}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-teal)' }}>
        <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-1"/>
        <path d="M18 8h4a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-4V8Z"/>
        <path d="M2 8h12v3H2V8Z"/>
        <path d="M6 3v5"/>
        <path d="M10 3v5"/>
      </svg>
    </div>
  );
}

function ComparisonBadge({ status, limit }) {
  const isPass = status === 'pass';
  const isWarning = status === 'warning';
  
  const bg = isPass ? 'rgba(74, 219, 186, 0.08)' : (isWarning ? 'rgba(255, 179, 71, 0.08)' : 'rgba(229, 89, 94, 0.08)');
  const color = isPass ? 'var(--accent-teal)' : (isWarning ? 'var(--warning-yellow)' : 'var(--breach-color)');
  
  return (
    <div style={{ 
      display: 'inline-flex', flexDirection: 'column', alignItems: 'center', 
      padding: '4px 10px', borderRadius: '4px', backgroundColor: bg, color: color,
      minWidth: '70px'
    }}>
      <span style={{ fontSize: '11px', fontWeight: 'bold' }}>{isPass ? 'PASS' : (isWarning ? 'WARN' : 'FAIL')}</span>
      <span style={{ fontSize: '9px', opacity: 0.8, marginTop: '1px' }}>{limit}</span>
    </div>
  );
}
