/**
 * Analytics Dashboard Component — displays usage analytics and insights.
 */

import { useState, useEffect } from 'react';
import { BarChart3, DollarSign, Zap, TrendingUp, Calendar, Filter } from 'lucide-react';
import { 
  loadAnalytics, 
  getAnalyticsByPeriod, 
  clearAnalytics,
  formatCost,
  formatNumber,
  type AnalyticsData 
} from '../lib/analytics';

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData>(loadAnalytics());
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'all'>('all');

  useEffect(() => {
    setAnalytics(getAnalyticsByPeriod(period));
  }, [period]);

  const handleClearAnalytics = () => {
    if (confirm('Are you sure you want to clear all analytics data?')) {
      clearAnalytics();
      setAnalytics(loadAnalytics());
    }
  };

  return (
    <div className="h-full flex flex-col bg-[var(--bg)] p-6 overflow-y-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
            <BarChart3 className="text-brand-500" />
            Analytics Dashboard
          </h2>
          <p className="text-[var(--text-muted)]">
            Track your usage, costs, and performance
          </p>
        </div>
        <button
          onClick={handleClearAnalytics}
          className="px-4 py-2 rounded-lg border border-red-500/30 text-red-500 text-sm hover:bg-red-500/10 transition-colors"
        >
          Clear Data
        </button>
      </div>

      {/* Period Filter */}
      <div className="mb-6 flex items-center gap-2">
        <Filter size={16} className="text-[var(--text-muted)]" />
        <div className="flex gap-2">
          {(['day', 'week', 'month', 'all'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === p
                  ? 'bg-brand-600 text-white'
                  : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-brand-500/10'
              }`}
            >
              {p === 'day' ? 'Today' : p === 'week' ? 'Week' : p === 'month' ? 'Month' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Cost */}
        <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[var(--text-muted)]">Total Cost</span>
            <DollarSign size={16} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-500">
            {formatCost(analytics.totalCost)}
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Avg: {formatCost(analytics.averageCostPerRequest)}/request
          </p>
        </div>

        {/* Total Requests */}
        <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[var(--text-muted)]">Total Requests</span>
            <Zap size={16} className="text-brand-500" />
          </div>
          <p className="text-2xl font-bold text-brand-500">
            {formatNumber(analytics.requests)}
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            {analytics.requests > 0 ? `${Math.round(analytics.requests / Math.max(1, analytics.dailyUsage.length))}/day` : '0/day'}
          </p>
        </div>

        {/* Total Tokens */}
        <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[var(--text-muted)]">Total Tokens</span>
            <TrendingUp size={16} className="text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-purple-500">
            {formatNumber(analytics.totalTokens.total)}
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            {formatNumber(analytics.totalTokens.prompt)} in / {formatNumber(analytics.totalTokens.completion)} out
          </p>
        </div>

        {/* Active Projects */}
        <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[var(--text-muted)]">Active Projects</span>
            <Calendar size={16} className="text-orange-500" />
          </div>
          <p className="text-2xl font-bold text-orange-500">
            {analytics.projectStats.length}
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            {analytics.dailyUsage.length} days active
          </p>
        </div>
      </div>

      {/* Top Models */}
      {analytics.topModels.length > 0 && (
        <div className="mb-6 p-4 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap size={18} className="text-brand-500" />
            Top Models
          </h3>
          <div className="space-y-3">
            {analytics.topModels.slice(0, 5).map((model, idx) => (
              <div key={model.model} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-[var(--text-muted)]">#{idx + 1}</span>
                  <span className="text-sm font-mono">{model.model}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-[var(--text-secondary)]">
                    {formatNumber(model.requests)} requests
                  </span>
                  <span className="text-sm font-medium text-emerald-500">
                    {formatCost(model.cost)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Project Stats */}
      {analytics.projectStats.length > 0 && (
        <div className="mb-6 p-4 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar size={18} className="text-orange-500" />
            Project Usage
          </h3>
          <div className="space-y-3">
            {analytics.projectStats.map((project) => (
              <div key={project.projectId} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{project.projectName}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {formatNumber(project.requests)} requests · {formatNumber(project.tokens)} tokens
                  </p>
                </div>
                <span className="text-sm font-medium text-emerald-500">
                  {formatCost(project.cost)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Usage Chart */}
      {analytics.dailyUsage.length > 0 && (
        <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-purple-500" />
            Daily Usage (Last 7 Days)
          </h3>
          <div className="space-y-2">
            {analytics.dailyUsage.slice(-7).map((day) => {
              const maxRequests = Math.max(...analytics.dailyUsage.map(d => d.requests));
              const width = (day.requests / maxRequests) * 100;
              
              return (
                <div key={day.date} className="flex items-center gap-3">
                  <span className="text-xs font-mono text-[var(--text-muted)] w-20">
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <div className="flex-1 h-6 bg-[var(--bg-tertiary)] rounded overflow-hidden">
                    <div
                      className="h-full bg-brand-500 flex items-center px-2"
                      style={{ width: `${width}%` }}
                    >
                      <span className="text-xs text-white font-medium">
                        {day.requests}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-emerald-500 w-16 text-right">
                    {formatCost(day.cost)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {analytics.requests === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <BarChart3 size={64} className="mx-auto mb-4 text-[var(--text-muted)] opacity-30" />
            <p className="text-lg font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
              No analytics data yet
            </p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Start using RS-BUILDER to see your usage statistics
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
