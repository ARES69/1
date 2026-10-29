/**
 * Analytics Dashboard — comprehensive usage analytics and insights.
 * Tracks costs, performance, user activity, and project metrics.
 */

export interface AnalyticsData {
  period: 'day' | 'week' | 'month' | 'all';
  totalCost: number;
  totalTokens: {
    prompt: number;
    completion: number;
    total: number;
  };
  requests: number;
  averageCostPerRequest: number;
  topModels: Array<{ model: string; requests: number; cost: number }>;
  dailyUsage: Array<{ date: string; requests: number; cost: number }>;
  projectStats: Array<{
    projectId: string;
    projectName: string;
    requests: number;
    cost: number;
    tokens: number;
  }>;
}

const ANALYTICS_KEY = 'rsb-analytics';

/* ─── Analytics Storage ─── */
export function loadAnalytics(): AnalyticsData {
  try {
    const raw = localStorage.getItem(ANALYTICS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to load analytics:', e);
  }
  
  return {
    period: 'all',
    totalCost: 0,
    totalTokens: { prompt: 0, completion: 0, total: 0 },
    requests: 0,
    averageCostPerRequest: 0,
    topModels: [],
    dailyUsage: [],
    projectStats: [],
  };
}

export function saveAnalytics(data: AnalyticsData): void {
  try {
    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save analytics:', e);
  }
}

export function recordRequest(
  model: string,
  promptTokens: number,
  completionTokens: number,
  cost: number,
  projectId?: string,
  projectName?: string
): void {
  const analytics = loadAnalytics();
  
  analytics.totalCost += cost;
  analytics.totalTokens.prompt += promptTokens;
  analytics.totalTokens.completion += completionTokens;
  analytics.totalTokens.total += promptTokens + completionTokens;
  analytics.requests += 1;
  analytics.averageCostPerRequest = analytics.totalCost / analytics.requests;
  
  // Update top models
  const existingModel = analytics.topModels.find(m => m.model === model);
  if (existingModel) {
    existingModel.requests += 1;
    existingModel.cost += cost;
  } else {
    analytics.topModels.push({ model, requests: 1, cost });
  }
  analytics.topModels.sort((a, b) => b.requests - a.requests);
  
  // Update daily usage
  const today = new Date().toISOString().split('T')[0];
  const existingDay = analytics.dailyUsage.find(d => d.date === today);
  if (existingDay) {
    existingDay.requests += 1;
    existingDay.cost += cost;
  } else {
    analytics.dailyUsage.push({ date: today, requests: 1, cost });
  }
  
  // Update project stats
  if (projectId && projectName) {
    const existingProject = analytics.projectStats.find(p => p.projectId === projectId);
    if (existingProject) {
      existingProject.requests += 1;
      existingProject.cost += cost;
      existingProject.tokens += promptTokens + completionTokens;
    } else {
      analytics.projectStats.push({
        projectId,
        projectName,
        requests: 1,
        cost,
        tokens: promptTokens + completionTokens,
      });
    }
  }
  
  saveAnalytics(analytics);
}

export function getAnalyticsByPeriod(period: 'day' | 'week' | 'month' | 'all'): AnalyticsData {
  const analytics = loadAnalytics();
  
  if (period === 'all') {
    return analytics;
  }
  
  const now = new Date();
  let startDate: Date;
  
  switch (period) {
    case 'day':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      break;
    default:
      return analytics;
  }
  
  const filteredDailyUsage = analytics.dailyUsage.filter(d => new Date(d.date) >= startDate);
  const totalRequests = filteredDailyUsage.reduce((sum, d) => sum + d.requests, 0);
  const totalCost = filteredDailyUsage.reduce((sum, d) => sum + d.cost, 0);
  
  return {
    ...analytics,
    period,
    requests: totalRequests,
    totalCost,
    averageCostPerRequest: totalRequests > 0 ? totalCost / totalRequests : 0,
    dailyUsage: filteredDailyUsage,
  };
}

export function clearAnalytics(): void {
  localStorage.removeItem(ANALYTICS_KEY);
}

export function formatCost(cost: number): string {
  if (cost === 0) return '$0.00';
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  return `$${cost.toFixed(2)}`;
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}
