import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Trash2, ShieldAlert, Check } from 'lucide-react';
import { toast } from 'react-toastify';

export default function Settings() {
  useEffect(() => {
    document.title = "Settings | Prop Firm Analyzer";
  }, []);
  const [defaultRisk, setDefaultRisk] = useState(
    localStorage.getItem('default_risk_pct') || '1.0'
  );
  const [defaultSpread, setDefaultSpread] = useState(
    localStorage.getItem('default_spread_pips') || '1.5'
  );
  const [showConfirm, setShowConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    localStorage.setItem('default_risk_pct', defaultRisk);
    localStorage.setItem('default_spread_pips', defaultSpread);
    toast.success("Settings saved successfully!");
  };

  const handleClearHistory = async () => {
    setIsClearing(true);
    try {
      const sessionId = localStorage.getItem('analyzer_session_id') || '';
      const response = await fetch(`http://localhost:8000/api/history/clear`, {
        method: 'POST',
        headers: {
          'x-session-id': sessionId
        }
      });
      if (!response.ok) throw new Error("Failed to clear database.");
      toast.success("History database cleared successfully!");
      setShowConfirm(false);
      // reload overview to see empty states
    } catch (e) {
      toast.error(e.message || "Failed to clear history.");
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '40px' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <SettingsIcon size={24} color="var(--accent-teal)" />
          Application Settings
        </h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
          Manage your defaults and local database options.
        </p>
      </header>

      <div className="panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 20px 0', borderBottom: '1px solid var(--panel-border)', paddingBottom: '10px' }}>
          Preferences Defaults
        </h3>
        <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="input-group">
            <label className="input-label">Default Risk per Trade (%)</label>
            <input 
              type="number" 
              step="0.1" 
              className="input-field" 
              value={defaultRisk} 
              onChange={e => setDefaultRisk(e.target.value)} 
            />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Used pre-filled inside the position size calculations.
            </span>
          </div>

          <div className="input-group">
            <label className="input-label">Broker Spread Assumption (Pips)</label>
            <input 
              type="number" 
              step="0.1" 
              className="input-field" 
              value={defaultSpread} 
              onChange={e => setDefaultSpread(e.target.value)} 
            />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Simulated average execution slippage and spread commissions.
            </span>
          </div>

          <button 
            type="submit" 
            style={{ 
              alignSelf: 'flex-start', padding: '10px 20px', borderRadius: '6px', border: 'none',
              backgroundColor: 'var(--accent-teal)', color: '#000', fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px'
            }}
          >
            <Check size={16} />
            Save Preferences
          </button>
        </form>
      </div>

      <div className="panel" style={{ padding: '24px', border: '1px solid rgba(229, 89, 94, 0.2)', backgroundColor: 'rgba(229, 89, 94, 0.01)' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 12px 0', color: 'var(--breach-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldAlert size={18} />
          Danger Zone
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 20px 0', lineHeight: '1.5' }}>
          Once you clear your history, all past evaluations matching your session ID will be permanently removed from the SQLite database. This action is irreversible.
        </p>

        {showConfirm ? (
          <div style={{ padding: '16px', backgroundColor: 'rgba(229, 89, 94, 0.05)', borderRadius: '6px', border: '1px solid rgba(229, 89, 94, 0.15)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <span style={{ fontSize: '13px', color: '#fff', fontWeight: 600 }}>Are you absolutely sure you want to delete all session records?</span>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={handleClearHistory} 
                disabled={isClearing}
                style={{ 
                  padding: '8px 16px', borderRadius: '4px', border: 'none', 
                  backgroundColor: 'var(--breach-color)', color: '#fff', fontSize: '12px', fontWeight: '600', cursor: 'pointer' 
                }}
              >
                {isClearing ? 'Deleting...' : 'Yes, Delete Everything'}
              </button>
              <button 
                onClick={() => setShowConfirm(false)} 
                style={{ 
                  padding: '8px 16px', borderRadius: '4px', border: '1px solid var(--panel-border)', 
                  backgroundColor: 'transparent', color: 'var(--text-primary)', fontSize: '12px', cursor: 'pointer' 
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => setShowConfirm(true)}
            style={{ 
              padding: '10px 18px', borderRadius: '6px', border: '1px solid var(--breach-color)', 
              backgroundColor: 'transparent', color: 'var(--breach-color)', fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s'
            }}
            onMouseOver={(e) => { e.target.style.backgroundColor = 'rgba(229, 89, 94, 0.05)'; }}
            onMouseOut={(e) => { e.target.style.backgroundColor = 'transparent'; }}
          >
            <Trash2 size={16} />
            Reset History Database
          </button>
        )}
      </div>
    </div>
  );
}
