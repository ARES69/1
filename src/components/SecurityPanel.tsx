/**
 * Security Panel Component — manage security settings and view audit log.
 */

import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, Trash2, Settings } from 'lucide-react';
import {
  loadSecurityEvents,
  loadSecurityPolicy,
  saveSecurityPolicy,
  resolveSecurityEvent,
  clearSecurityEvents,
  generateSecurityReport,
  type SecurityEvent,
  type SecurityPolicy,
} from '../lib/security';

export default function SecurityPanel() {
  const [events, setEvents] = useState<SecurityEvent[]>(loadSecurityEvents());
  const [policy, setPolicy] = useState<SecurityPolicy>(loadSecurityPolicy());
  const [activeTab, setActiveTab] = useState<'events' | 'policy' | 'report'>('events');
  const [report, setReport] = useState(generateSecurityReport());

  useEffect(() => {
    setEvents(loadSecurityEvents());
    setReport(generateSecurityReport());
  }, []);

  const handleResolveEvent = (id: string) => {
    resolveSecurityEvent(id);
    setEvents(loadSecurityEvents());
    setReport(generateSecurityReport());
  };

  const handleClearEvents = () => {
    if (confirm('Are you sure you want to clear all security events?')) {
      clearSecurityEvents();
      setEvents([]);
      setReport(generateSecurityReport());
    }
  };

  const handleUpdatePolicy = (updates: Partial<SecurityPolicy>) => {
    const updated = { ...policy, ...updates };
    setPolicy(updated);
    saveSecurityPolicy(updated);
  };

  const getEventIcon = (type: SecurityEvent['type']) => {
    switch (type) {
      case 'error':
        return <XCircle size={16} className="text-red-500" />;
      case 'warning':
        return <AlertTriangle size={16} className="text-yellow-500" />;
      case 'info':
        return <CheckCircle size={16} className="text-blue-500" />;
    }
  };

  const getEventColor = (type: SecurityEvent['type']) => {
    switch (type) {
      case 'error':
        return 'border-red-500/30 bg-red-500/5';
      case 'warning':
        return 'border-yellow-500/30 bg-yellow-500/5';
      case 'info':
        return 'border-blue-500/30 bg-blue-500/5';
    }
  };

  return (
    <div className="h-full flex flex-col bg-[var(--bg)] p-6 overflow-y-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
          <Shield className="text-brand-500" />
          Security Center
        </h2>
        <p className="text-[var(--text-muted)]">
          Monitor security events and manage security policies
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('events')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'events'
              ? 'bg-brand-600 text-white'
              : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-brand-500/10'
          }`}
        >
          Security Events ({report.unresolvedEvents})
        </button>
        <button
          onClick={() => setActiveTab('policy')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'policy'
              ? 'bg-brand-600 text-white'
              : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-brand-500/10'
          }`}
        >
          Security Policy
        </button>
        <button
          onClick={() => setActiveTab('report')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'report'
              ? 'bg-brand-600 text-white'
              : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-brand-500/10'
          }`}
        >
          Audit Report
        </button>
      </div>

      {/* Events Tab */}
      {activeTab === 'events' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Recent Security Events</h3>
            <button
              onClick={handleClearEvents}
              className="px-4 py-2 rounded-lg border border-red-500/30 text-red-500 text-sm hover:bg-red-500/10 transition-colors flex items-center gap-2"
            >
              <Trash2 size={14} />
              Clear All
            </button>
          </div>

          {events.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-muted)]">
              <Shield size={48} className="mx-auto mb-3 opacity-30" />
              <p>No security events recorded</p>
            </div>
          ) : (
            <div className="space-y-2">
              {events.map((event) => (
                <div
                  key={event.id}
                  className={`p-4 rounded-lg border ${getEventColor(event.type)} ${
                    event.resolved ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getEventIcon(event.type)}
                      <span className="text-sm font-medium capitalize">{event.type}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
                        {event.category}
                      </span>
                    </div>
                    <span className="text-xs text-[var(--text-muted)]">
                      {new Date(event.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm mb-2">{event.message}</p>
                  {event.details && (
                    <pre className="text-xs bg-[var(--bg)] p-2 rounded overflow-x-auto mb-2">
                      {JSON.stringify(event.details, null, 2)}
                    </pre>
                  )}
                  {!event.resolved && (
                    <button
                      onClick={() => handleResolveEvent(event.id)}
                      className="text-xs text-brand-500 hover:text-brand-400"
                    >
                      Mark as resolved
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Policy Tab */}
      {activeTab === 'policy' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Input/Output Limits</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-2">
                  Max Input Length (characters)
                </label>
                <input
                  type="number"
                  value={policy.maxInputLength}
                  onChange={(e) => handleUpdatePolicy({ maxInputLength: parseInt(e.target.value) || 10000 })}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-sm outline-none focus:ring-2 focus:ring-brand-500/50"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">
                  Max Output Length (characters)
                </label>
                <input
                  type="number"
                  value={policy.maxOutputLength}
                  onChange={(e) => handleUpdatePolicy({ maxOutputLength: parseInt(e.target.value) || 100000 })}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-sm outline-none focus:ring-2 focus:ring-brand-500/50"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Allowed File Types</h3>
            <textarea
              value={policy.allowedFileTypes.join(', ')}
              onChange={(e) => {
                const types = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
                handleUpdatePolicy({ allowedFileTypes: types });
              }}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-sm font-mono outline-none focus:ring-2 focus:ring-brand-500/50 resize-none"
              rows={3}
              placeholder=".js, .ts, .html, .css"
            />
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Comma-separated list of allowed file extensions
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Blocked Patterns</h3>
            <textarea
              value={policy.blockedPatterns.join('\n')}
              onChange={(e) => {
                const patterns = e.target.value.split('\n').map(p => p.trim()).filter(Boolean);
                handleUpdatePolicy({ blockedPatterns: patterns });
              }}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-sm font-mono outline-none focus:ring-2 focus:ring-brand-500/50 resize-none"
              rows={5}
              placeholder="eval(&#10;Function(&#10;innerHTML"
            />
            <p className="text-xs text-[var(--text-muted)] mt-1">
              One pattern per line. These patterns will trigger security warnings.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Audit Log</h3>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Enable Audit Log</label>
              <button
                onClick={() => handleUpdatePolicy({ enableAuditLog: !policy.enableAuditLog })}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  policy.enableAuditLog ? 'bg-brand-600' : 'bg-[var(--border)]'
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    policy.enableAuditLog ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">
                Max Audit Log Size (events)
              </label>
              <input
                type="number"
                value={policy.maxAuditLogSize}
                onChange={(e) => handleUpdatePolicy({ maxAuditLogSize: parseInt(e.target.value) || 1000 })}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-sm outline-none focus:ring-2 focus:ring-brand-500/50"
              />
            </div>
          </div>
        </div>
      )}

      {/* Report Tab */}
      {activeTab === 'report' && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]">
              <p className="text-sm text-[var(--text-muted)] mb-1">Total Events</p>
              <p className="text-2xl font-bold">{report.totalEvents}</p>
            </div>
            <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]">
              <p className="text-sm text-[var(--text-muted)] mb-1">Unresolved</p>
              <p className="text-2xl font-bold text-yellow-500">{report.unresolvedEvents}</p>
            </div>
            <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]">
              <p className="text-sm text-[var(--text-muted)] mb-1">Resolved</p>
              <p className="text-2xl font-bold text-emerald-500">
                {report.totalEvents - report.unresolvedEvents}
              </p>
            </div>
          </div>

          {/* Events by Type */}
          <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]">
            <h3 className="text-lg font-semibold mb-4">Events by Type</h3>
            <div className="space-y-2">
              {Object.entries(report.eventsByType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{type}</span>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Events by Category */}
          <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]">
            <h3 className="text-lg font-semibold mb-4">Events by Category</h3>
            <div className="space-y-2">
              {Object.entries(report.eventsByCategory).map(([category, count]) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{category}</span>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
