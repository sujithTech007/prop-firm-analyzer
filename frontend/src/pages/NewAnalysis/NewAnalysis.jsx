import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, ChevronRight, ChevronLeft, Trash2, Plus, Play } from 'lucide-react';
import { getFirmPresets, analyzeReadiness, getDemoTrades } from '../../services/api';
import { toast } from 'react-toastify';

export default function NewAnalysis() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Input Method: 'upload' or 'manual'
  const [inputMethod, setInputMethod] = useState('upload');

  // Form State
  const [file, setFile] = useState(null);
  const [presets, setPresets] = useState([]);
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const [rules, setRules] = useState({
    account_size: 100000,
    max_daily_loss_pct: 5.0,
    max_total_drawdown_pct: 10.0,
    profit_target_pct: 10.0,
    min_trading_days: 4,
    consistency_rule_pct: 0.0,
    url: ''
  });

  // Manual Trades State
  const [manualTrades, setManualTrades] = useState([
    { id: 1, close_time: '2026-07-01 16:30:00', symbol: 'EURUSD', direction: 'buy', lot_size: 1.0, profit: 250.0 },
    { id: 2, close_time: '2026-07-02 14:15:00', symbol: 'GBPUSD', direction: 'sell', lot_size: 0.5, profit: -120.0 },
    { id: 3, close_time: '2026-07-03 18:00:00', symbol: 'XAUUSD', direction: 'buy', lot_size: 2.0, profit: 800.0 },
    { id: 4, close_time: '2026-07-04 11:20:00', symbol: 'EURUSD', direction: 'buy', lot_size: 1.5, profit: -300.0 },
    { id: 5, close_time: '2026-07-05 15:45:00', symbol: 'USDJPY', direction: 'sell', lot_size: 1.0, profit: 180.0 }
  ]);

  useEffect(() => {
    document.title = "New Challenge Evaluation | Prop Firm Analyzer";
    async function loadPresets() {
      try {
        const fetched = await getFirmPresets();
        setPresets(fetched);
        if (fetched.length > 0) {
          setRules({
            account_size: fetched[0].account_size,
            max_daily_loss_pct: fetched[0].max_daily_loss_pct,
            max_total_drawdown_pct: fetched[0].max_total_drawdown_pct,
            profit_target_pct: fetched[0].profit_target_pct,
            min_trading_days: fetched[0].min_trading_days,
            consistency_rule_pct: fetched[0].consistency_rule_pct || 0.0,
            url: fetched[0].url || ''
          });
        }
      } catch (err) {
        setPresets([{
          name: "Standard",
          account_size: 100000.0,
          max_daily_loss_pct: 5.0,
          max_total_drawdown_pct: 10.0,
          profit_target_pct: 10.0,
          min_trading_days: 4,
          consistency_rule_pct: 0.0,
          url: "https://ftmo.com/"
        }]);
      }
    }
    loadPresets();
  }, []);

  const handleNext = () => {
    if (step === 1) {
      if (inputMethod === 'manual') {
        if (manualTrades.length === 0) {
          setError("Please add at least one trade in the manual spreadsheet.");
          return;
        }

        // Validate manual trades data
        const invalidTrade = manualTrades.find(t => {
          const invalidTime = !t.close_time || !/^\d{4}-\d{2}-\d{2}/.test(t.close_time.trim());
          const invalidSymbol = !t.symbol || t.symbol.trim() === "";
          const invalidLots = isNaN(t.lot_size) || t.lot_size <= 0;
          const invalidProfit = isNaN(t.profit);
          return invalidTime || invalidSymbol || invalidLots || invalidProfit;
        });

        if (invalidTrade) {
          setError("Spreadsheet contains invalid entries. Ensure all close dates match 'YYYY-MM-DD', symbols are filled, and lot sizes are positive.");
          return;
        }

        // Build CSV representation from manual entries
        const csvRows = [
          "close_time,symbol,direction,lot_size,profit",
          ...manualTrades.map(t => `"${t.close_time.trim()}","${t.symbol.trim().toUpperCase()}","${t.direction}",${t.lot_size},${t.profit}`)
        ];
        const csvContent = csvRows.join("\n");
        const manualFile = new File([csvContent], "manual_entered_trades.csv", { type: "text/csv" });
        setFile(manualFile);
      } else if (!file) {
        setError("Please upload a CSV file first, or click 'Try Demo' or enter trades manually.");
        return;
      }
    }
    setError(null);
    setStep(s => s + 1);
  };
  
  const handleBack = () => {
    setError(null);
    setStep(s => s - 1);
  };

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await analyzeReadiness(file, rules);
      toast.success("Analysis complete!");
      navigate(`/dashboard/results/${data.id}`);
    } catch (err) {
      setError(err.message || 'An error occurred during evaluation.');
      toast.error("Analysis failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTryDemo = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const csvText = await getDemoTrades();
      const demoFile = new File([csvText], "demo_trades_sample.csv", { type: "text/csv" });
      setFile(demoFile);
      toast.success("Loaded demo trades successfully!");
      
      // Auto-load presets if available
      if (presets.length > 0) {
        setRules({
          account_size: presets[0].account_size,
          max_daily_loss_pct: presets[0].max_daily_loss_pct,
          max_total_drawdown_pct: presets[0].max_total_drawdown_pct,
          profit_target_pct: presets[0].profit_target_pct,
          min_trading_days: presets[0].min_trading_days,
          consistency_rule_pct: presets[0].consistency_rule_pct || 0.0,
          url: presets[0].url || ''
        });
        setSelectedPresetIndex(0);
      }
      
      setInputMethod('upload');
      setStep(2);
    } catch (err) {
      setError("Failed to load demo trades: " + err.message);
      toast.error("Failed to fetch demo data.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, margin: 0 }}>New Challenge Evaluation</h1>
        {step === 1 && (
          <button 
            onClick={handleTryDemo}
            disabled={isLoading}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '6px',
              backgroundColor: 'rgba(74, 219, 186, 0.1)', color: 'var(--accent-teal)',
              border: '1px solid var(--accent-teal)', padding: '8px 16px', borderRadius: '6px',
              fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            <Play size={14} />
            Try a Demo (Mock Data)
          </button>
        )}
      </div>
      
      {/* Stepper Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
        {[
          { num: 1, label: 'Upload / Input' },
          { num: 2, label: 'Challenge Rules' },
          { num: 3, label: 'Review' }
        ].map((s, i) => (
          <React.Fragment key={s.num}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: step >= s.num ? 1 : 0.5 }}>
              <div style={{ 
                width: '24px', 
                height: '24px', 
                borderRadius: '50%', 
                backgroundColor: step >= s.num ? 'var(--pass-color)' : 'var(--panel-border)',
                color: step >= s.num ? '#0b0f13' : 'var(--text-secondary)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '12px', 
                fontWeight: 'bold',
                boxShadow: step === s.num ? '0 0 10px rgba(74, 219, 186, 0.4)' : 'none',
                transition: 'all var(--transition-normal)'
              }}>
                {step > s.num ? <CheckCircle2 size={14} /> : s.num}
              </div>
              <span style={{ 
                fontSize: '14px', 
                fontWeight: step >= s.num ? 600 : 400,
                color: step >= s.num ? '#fff' : 'var(--text-secondary)',
                transition: 'color var(--transition-normal)'
              }}>{s.label}</span>
            </div>
            {i < 2 && (
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--panel-border)', margin: '0 16px' }} />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="panel" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
        {/* Step 1: Upload */}
        {step === 1 && (
          <StepUpload 
            file={file} 
            setFile={setFile} 
            error={error} 
            setError={setError}
            inputMethod={inputMethod}
            setInputMethod={setInputMethod}
            manualTrades={manualTrades}
            setManualTrades={setManualTrades}
          />
        )}

        {/* Step 2: Configure */}
        {step === 2 && (
          <StepConfigure 
            rules={rules} 
            setRules={setRules} 
            presets={presets} 
            selectedPresetIndex={selectedPresetIndex} 
            setSelectedPresetIndex={setSelectedPresetIndex} 
          />
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <StepReview file={file} rules={rules} error={error} />
        )}

        {/* Footer Navigation */}
        <div style={{ paddingTop: '24px', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--panel-border)', marginTop: '30px' }}>
          <button 
            onClick={handleBack} 
            disabled={step === 1 || isLoading}
            style={{ 
              padding: '10px 16px', borderRadius: '6px', border: '1px solid var(--panel-border)', 
              background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer',
              opacity: step === 1 ? 0 : 1, display: 'flex', alignItems: 'center', gap: '4px'
            }}
          >
            <ChevronLeft size={16} />
            Back
          </button>

          {step < 3 ? (
            <button 
              onClick={handleNext}
              style={{ 
                padding: '10px 20px', borderRadius: '6px', border: 'none', 
                backgroundColor: 'var(--brand-color)', color: '#000', fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '4px'
              }}
            >
              Next Step
              <ChevronRight size={16} />
            </button>
          ) : (
            <button 
              onClick={handleAnalyze}
              disabled={isLoading}
              style={{ 
                padding: '10px 24px', borderRadius: '6px', border: 'none', 
                backgroundColor: 'var(--accent-teal)', color: '#000', fontWeight: 600, cursor: 'pointer'
              }}
            >
              {isLoading ? 'Analyzing Trades...' : 'Analyze Readiness'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StepUpload({ file, setFile, error, setError, inputMethod, setInputMethod, manualTrades, setManualTrades }) {
  const [isDragActive, setIsDragActive] = useState(false);

  const validateCSVHeaders = (selectedFile) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const firstLine = text.split('\n')[0].trim().toLowerCase();
      
      // Support comma and semicolon split structures
      const headers = firstLine.split(/[;,]/).map(h => h.trim().replace(/['"]/g, ''));
      const required = ['close_time', 'symbol', 'direction', 'lot_size', 'profit'];
      
      const missing = required.filter(col => !headers.includes(col));
      
      if (missing.length > 0) {
        setError(`Invalid CSV format. Missing required columns: ${missing.join(', ')}.`);
        setFile(null);
      } else {
        setFile(selectedFile);
        setError(null);
      }
    };
    reader.onerror = () => {
      setError('Failed to read CSV file.');
      setFile(null);
    };
    reader.readAsText(selectedFile);
  };

  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setIsDragActive(true);
    else if (e.type === 'dragleave') setIsDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragActive(false); setError(null);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.csv')) {
        validateCSVHeaders(droppedFile);
      } else {
        setError('Only CSV files are supported.');
      }
    }
  };

  const handleFileChange = (e) => {
    setError(null);
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.endsWith('.csv')) {
        validateCSVHeaders(selectedFile);
      } else {
        setError('Only CSV files are supported.');
      }
    }
  };

  const handleAddRow = () => {
    const nextId = manualTrades.length > 0 ? Math.max(...manualTrades.map(t => t.id)) + 1 : 1;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    setManualTrades(prev => [
      ...prev,
      { id: nextId, close_time: nowStr, symbol: 'EURUSD', direction: 'buy', lot_size: 0.1, profit: 0.0 }
    ]);
  };

  const handleDeleteRow = (id) => {
    setManualTrades(prev => prev.filter(t => t.id !== id));
  };

  const handleEditTrade = (id, field, value) => {
    setManualTrades(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', borderBottom: '1px solid var(--panel-border)', paddingBottom: '12px', gap: '24px' }}>
        <button 
          onClick={() => { setInputMethod('upload'); setError(null); }}
          style={{
            background: 'transparent', border: 'none', color: inputMethod === 'upload' ? 'var(--accent-teal)' : 'var(--text-secondary)',
            fontWeight: 600, fontSize: '15px', cursor: 'pointer', paddingBottom: '8px', 
            borderBottom: inputMethod === 'upload' ? '2px solid var(--accent-teal)' : 'none'
          }}
        >
          Upload CSV Log
        </button>
        <button 
          onClick={() => { setInputMethod('manual'); setError(null); }}
          style={{
            background: 'transparent', border: 'none', color: inputMethod === 'manual' ? 'var(--accent-teal)' : 'var(--text-secondary)',
            fontWeight: 600, fontSize: '15px', cursor: 'pointer', paddingBottom: '8px',
            borderBottom: inputMethod === 'manual' ? '2px solid var(--accent-teal)' : 'none'
          }}
        >
          Manual Spreadsheet Entry
        </button>
      </div>

      {inputMethod === 'upload' ? (
        <>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '14px' }}>
            Upload your trading statements. We automatically parse MT4/MT5/cTrader exports and delimiter formats (comma or semicolon).
          </p>
          <div
            onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop}
            style={{
              border: isDragActive ? '2px dashed var(--accent-teal)' : '2px dashed var(--panel-border)',
              borderRadius: '8px',
              backgroundColor: isDragActive ? 'rgba(74, 219, 186, 0.05)' : 'rgba(255,255,255,0.02)',
              padding: '60px 24px', textAlign: 'center', cursor: 'pointer', position: 'relative',
              transition: 'all 0.2s ease'
            }}
          >
            <input type="file" accept=".csv" onChange={handleFileChange} style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0, opacity: 0, cursor: 'pointer' }} />
            
            {file ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <FileSpreadsheet size={48} color="var(--accent-teal)" />
                <div>
                  <p style={{ fontWeight: '600', fontSize: '15px' }}>{file.name}</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{(file.size / 1024).toFixed(2)} KB</p>
                </div>
                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFile(null); }} style={{ background: 'transparent', border: 'none', color: 'var(--breach-color)', fontSize: '12px', textTransform: 'uppercase', fontWeight: '600', cursor: 'pointer', marginTop: '8px' }}>Remove</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <Upload size={48} color="var(--text-secondary)" style={{ opacity: 0.7 }} />
                <div>
                  <p style={{ fontWeight: '500', fontSize: '15px' }}>Drag and drop your CSV file here, or <span style={{ color: 'var(--accent-teal)' }}>browse</span></p>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '14px' }}>
            No platform export? Enter your trades manually below to diagnose your statistics.
          </p>
          <div style={{ overflowX: 'auto', maxHeight: '350px', border: '1px solid var(--panel-border)', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.01)', marginBottom: '12px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--panel-border)', color: 'var(--text-secondary)', textAlign: 'left', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                  <th style={{ padding: '10px' }}>Close Date/Time (YYYY-MM-DD HH:MM)</th>
                  <th style={{ padding: '10px' }}>Symbol</th>
                  <th style={{ padding: '10px' }}>Direction</th>
                  <th style={{ padding: '10px' }}>Lot Size</th>
                  <th style={{ padding: '10px' }}>Profit ($)</th>
                  <th style={{ padding: '10px', width: '50px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {manualTrades.map((t) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }} className="hover-row">
                    <td style={{ padding: '6px 10px' }}>
                      <input 
                        type="text" 
                        className="input-field" 
                        style={{ padding: '8px', fontSize: '13px', margin: 0, border: '1px solid var(--panel-border)' }} 
                        value={t.close_time} 
                        onChange={(e) => handleEditTrade(t.id, 'close_time', e.target.value)} 
                      />
                    </td>
                    <td style={{ padding: '6px 10px' }}>
                      <input 
                        type="text" 
                        className="input-field" 
                        style={{ padding: '8px', fontSize: '13px', margin: 0, textTransform: 'uppercase', border: '1px solid var(--panel-border)' }} 
                        value={t.symbol} 
                        onChange={(e) => handleEditTrade(t.id, 'symbol', e.target.value)} 
                      />
                    </td>
                    <td style={{ padding: '6px 10px' }}>
                      <select 
                        className="input-field select-field" 
                        style={{ padding: '8px', fontSize: '13px', margin: 0, height: 'auto', border: '1px solid var(--panel-border)' }} 
                        value={t.direction} 
                        onChange={(e) => handleEditTrade(t.id, 'direction', e.target.value)}
                      >
                        <option value="buy">BUY</option>
                        <option value="sell">SELL</option>
                      </select>
                    </td>
                    <td style={{ padding: '6px 10px' }}>
                      <input 
                        type="number" 
                        step="0.01"
                        className="input-field" 
                        style={{ padding: '8px', fontSize: '13px', margin: 0, border: '1px solid var(--panel-border)' }} 
                        value={t.lot_size} 
                        onChange={(e) => handleEditTrade(t.id, 'lot_size', parseFloat(e.target.value) || 0)} 
                      />
                    </td>
                    <td style={{ padding: '6px 10px' }}>
                      <input 
                        type="number" 
                        step="0.01"
                        className="input-field" 
                        style={{ padding: '8px', fontSize: '13px', margin: 0, border: '1px solid var(--panel-border)' }} 
                        value={t.profit} 
                        onChange={(e) => handleEditTrade(t.id, 'profit', parseFloat(e.target.value) || 0)} 
                      />
                    </td>
                    <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                      <button 
                        onClick={() => handleDeleteRow(t.id)} 
                        style={{ background: 'transparent', border: 'none', color: 'var(--breach-color)', cursor: 'pointer', padding: '4px' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <button 
              onClick={handleAddRow}
              style={{ 
                padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--panel-border)', 
                background: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)', cursor: 'pointer',
                fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' 
              }}
            >
              <Plus size={16} /> Add Trade Row
            </button>
          </div>
        </>
      )}

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(229, 89, 94, 0.1)', padding: '12px 16px', borderRadius: '6px', color: 'var(--breach-color)', fontSize: '13px' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

function StepConfigure({ rules, setRules, presets, selectedPresetIndex, setSelectedPresetIndex }) {
  const handleInputChange = (field, value) => {
    setRules(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Configure Challenge Rules</h2>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Prop Firm Rule Preset:</span>
        <select
          value={selectedPresetIndex}
          onChange={(e) => {
            const idx = parseInt(e.target.value, 10);
            setSelectedPresetIndex(idx);
            setRules({
              account_size: presets[idx].account_size,
              max_daily_loss_pct: presets[idx].max_daily_loss_pct,
              max_total_drawdown_pct: presets[idx].max_total_drawdown_pct,
              profit_target_pct: presets[idx].profit_target_pct,
              min_trading_days: presets[idx].min_trading_days,
              consistency_rule_pct: presets[idx].consistency_rule_pct || 0.0,
              url: presets[idx].url || ''
            });
          }}
          className="input-field select-field"
          style={{ width: '300px' }}
        >
          {presets.map((preset, idx) => (
            <option key={idx} value={idx}>{preset.name}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginTop: '16px' }}>
        <div className="input-group">
          <label className="input-label">Account Balance ($)</label>
          <input type="number" className="input-field" value={rules.account_size} onChange={(e) => handleInputChange('account_size', e.target.value)} />
          <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', lineHeight: '1.3' }}>Standard evaluation sizes are $5,000 to $200,000.</span>
        </div>
        <div className="input-group">
          <label className="input-label">Max Daily Loss (%)</label>
          <input type="number" step="0.1" className="input-field" value={rules.max_daily_loss_pct} onChange={(e) => handleInputChange('max_daily_loss_pct', e.target.value)} />
          <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', lineHeight: '1.3' }}>Firms set this daily drawdown limit between 4% and 5%.</span>
        </div>
        <div className="input-group">
          <label className="input-label">Max Total Drawdown (%)</label>
          <input type="number" step="0.1" className="input-field" value={rules.max_total_drawdown_pct} onChange={(e) => handleInputChange('max_total_drawdown_pct', e.target.value)} />
          <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', lineHeight: '1.3' }}>Liquidates accounts hitting 8% to 12% total loss.</span>
        </div>
        <div className="input-group">
          <label className="input-label">Profit Target (%)</label>
          <input type="number" step="0.1" className="input-field" value={rules.profit_target_pct} onChange={(e) => handleInputChange('profit_target_pct', e.target.value)} />
          <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', lineHeight: '1.3' }}>Phase-1 targets typically range from 8% to 10%.</span>
        </div>
        <div className="input-group">
          <label className="input-label">Min Trading Days</label>
          <input type="number" className="input-field" value={rules.min_trading_days} onChange={(e) => handleInputChange('min_trading_days', e.target.value)} />
          <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', lineHeight: '1.3' }}>Minimum active days required (usually 4 to 10).</span>
        </div>
        <div className="input-group">
          <label className="input-label">Consistency Rule limit (%)</label>
          <input type="number" step="0.1" className="input-field" value={rules.consistency_rule_pct} onChange={(e) => handleInputChange('consistency_rule_pct', e.target.value)} />
          <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', lineHeight: '1.3' }}>
            Max share of profit on any single day (e.g. 40% for Topstep). Set to 0 to disable.
          </span>
        </div>
      </div>
    </div>
  );
}

function StepReview({ file, rules, error }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Review Details</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '8px', border: '1px solid var(--panel-border)' }}>
          <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px', textTransform: 'uppercase' }}>File to Analyze</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FileSpreadsheet size={32} color="var(--accent-teal)" />
            <div>
              <div style={{ fontWeight: 600 }}>{file?.name || 'manual_entered_trades.csv'}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{file ? `${(file.size / 1024).toFixed(2)} KB` : 'Manual Spreadsheet Entries'}</div>
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '8px', border: '1px solid var(--panel-border)' }}>
          <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px', textTransform: 'uppercase' }}>Configured Rules</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
            <div><span style={{ color: 'var(--text-muted)' }}>Account Size:</span> ${rules.account_size.toLocaleString()}</div>
            <div><span style={{ color: 'var(--text-muted)' }}>Profit Target:</span> {rules.profit_target_pct}%</div>
            <div><span style={{ color: 'var(--text-muted)' }}>Daily Loss:</span> {rules.max_daily_loss_pct}%</div>
            <div><span style={{ color: 'var(--text-muted)' }}>Max Drawdown:</span> {rules.max_total_drawdown_pct}%</div>
            <div><span style={{ color: 'var(--text-muted)' }}>Min Days:</span> {rules.min_trading_days} days</div>
            <div><span style={{ color: 'var(--text-muted)' }}>Consistency:</span> {rules.consistency_rule_pct > 0 ? `${rules.consistency_rule_pct}%` : 'None'}</div>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(229, 89, 94, 0.1)', padding: '12px 16px', borderRadius: '6px', color: 'var(--breach-color)', fontSize: '13px', marginTop: '16px' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
