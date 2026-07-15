import React, { useState, useEffect } from 'react';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { getFirmPresets } from '../services/api';

export default function UploadTrades({ onAnalyze, isLoading }) {
  const [file, setFile] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [presets, setPresets] = useState([]);
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const [error, setError] = useState(null);

  // Form states
  const [rules, setRules] = useState({
    account_size: 100000,
    max_daily_loss_pct: 5.0,
    max_total_drawdown_pct: 10.0,
    profit_target_pct: 10.0,
    min_trading_days: 4
  });

  // Fetch presets on mount
  useEffect(() => {
    async function loadPresets() {
      try {
        const fetched = await getFirmPresets();
        setPresets(fetched);
        if (fetched.length > 0) {
          // Set initial rules based on first preset
          setRules({
            account_size: fetched[0].account_size,
            max_daily_loss_pct: fetched[0].max_daily_loss_pct,
            max_total_drawdown_pct: fetched[0].max_total_drawdown_pct,
            profit_target_pct: fetched[0].profit_target_pct,
            min_trading_days: fetched[0].min_trading_days
          });
        }
      } catch (err) {
        console.error('Error fetching presets, using client fallbacks:', err);
        // Fallbacks
        const clientPresets = [
          {
            name: "Standard 2-Step (FTMO-Style)",
            account_size: 100000.0,
            max_daily_loss_pct: 5.0,
            max_total_drawdown_pct: 10.0,
            profit_target_pct: 10.0,
            min_trading_days: 4
          },
          {
            name: "Aggressive 1-Step (Topstep-Style)",
            account_size: 50000.0,
            max_daily_loss_pct: 4.0,
            max_total_drawdown_pct: 6.0,
            profit_target_pct: 6.0,
            min_trading_days: 0
          }
        ];
        setPresets(clientPresets);
      }
    }
    loadPresets();
  }, []);

  const handlePresetChange = (e) => {
    const idx = parseInt(e.target.value, 10);
    setSelectedPresetIndex(idx);
    const preset = presets[idx];
    if (preset) {
      setRules({
        account_size: preset.account_size,
        max_daily_loss_pct: preset.max_daily_loss_pct,
        max_total_drawdown_pct: preset.max_total_drawdown_pct,
        profit_target_pct: preset.profit_target_pct,
        min_trading_days: preset.min_trading_days
      });
    }
  };

  const handleInputChange = (field, value) => {
    setRules(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  // Drag and Drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    setError(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
      } else {
        setError('Only CSV files are supported.');
      }
    }
  };

  const handleFileChange = (e) => {
    setError(null);
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    if (!file) {
      setError('Please upload a trade CSV log first.');
      return;
    }
    if (rules.account_size <= 0) {
      setError('Account size must be greater than 0.');
      return;
    }
    onAnalyze(file, rules);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* CSV Drag & Drop Upload Zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        style={{
          border: isDragActive ? '2px dashed var(--brand-color)' : '1px dashed var(--panel-border)',
          borderRadius: '8px',
          backgroundColor: isDragActive ? 'rgba(232, 163, 61, 0.04)' : 'rgba(22, 28, 34, 0.4)',
          padding: '40px 24px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          position: 'relative'
        }}
      >
        <input
          type="file"
          id="csv-file-upload"
          accept=".csv"
          onChange={handleFileChange}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            top: 0,
            left: 0,
            opacity: 0,
            cursor: 'pointer'
          }}
        />
        
        {file ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <FileSpreadsheet size={48} color="var(--pass-color)" />
            <div>
              <p style={{ fontWeight: '600', fontSize: '15px', color: 'var(--text-primary)' }}>{file.name}</p>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {(file.size / 1024).toFixed(2)} KB • Ready to analyze
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setFile(null);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--breach-color)',
                fontSize: '12px',
                textTransform: 'uppercase',
                fontWeight: '600',
                cursor: 'pointer',
                marginTop: '4px'
              }}
            >
              Remove File
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <Upload size={48} color="var(--text-secondary)" style={{ opacity: 0.7 }} />
            <div>
              <p style={{ fontWeight: '500', fontSize: '15px' }}>
                Drag and drop your trading log CSV here, or <span style={{ color: 'var(--brand-color)', fontWeight: '600' }}>browse</span>
              </p>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                Supports MT4/MT5/cTrader formats (columns: Close Time, Profit, Lot Size, direction, symbol)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Rules Configurations Panel */}
      <div className="panel panel-alt" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Challenge Rules Configuration
          </h3>
          
          {/* Preset selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Preset:</span>
            <select
              value={selectedPresetIndex}
              onChange={handlePresetChange}
              className="input-field select-field"
              style={{ padding: '6px 36px 6px 12px', fontSize: '12px', width: 'auto' }}
            >
              {presets.map((preset, idx) => (
                <option key={idx} value={idx}>{preset.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Input Fields Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          <div className="input-group">
            <label className="input-label">Account Balance ($)</label>
            <input
              type="number"
              className="input-field"
              value={rules.account_size}
              onChange={(e) => handleInputChange('account_size', e.target.value)}
              min="0"
              step="5000"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Max Daily Loss (%)</label>
            <input
              type="number"
              className="input-field"
              value={rules.max_daily_loss_pct}
              onChange={(e) => handleInputChange('max_daily_loss_pct', e.target.value)}
              min="0.1"
              max="50"
              step="0.1"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Max Drawdown (%)</label>
            <input
              type="number"
              className="input-field"
              value={rules.max_total_drawdown_pct}
              onChange={(e) => handleInputChange('max_total_drawdown_pct', e.target.value)}
              min="0.1"
              max="50"
              step="0.1"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Profit Target (%)</label>
            <input
              type="number"
              className="input-field"
              value={rules.profit_target_pct}
              onChange={(e) => handleInputChange('profit_target_pct', e.target.value)}
              min="0.1"
              max="100"
              step="0.1"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Min Trading Days</label>
            <input
              type="number"
              className="input-field"
              value={rules.min_trading_days}
              onChange={(e) => handleInputChange('min_trading_days', e.target.value)}
              min="0"
              max="30"
              step="1"
            />
          </div>
        </div>
      </div>

      {/* Errors */}
      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'rgba(229, 89, 94, 0.1)',
          border: '1px solid rgba(229, 89, 94, 0.3)',
          padding: '12px 16px',
          borderRadius: '6px',
          color: 'var(--breach-color)',
          fontSize: '13px'
        }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        className="btn btn-primary"
        disabled={isLoading}
        style={{ padding: '14px 28px', fontSize: '15px' }}
      >
        {isLoading ? 'Processing Analytics...' : 'Analyze Challenge Readiness'}
      </button>
    </form>
  );
}
