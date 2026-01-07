'use client';

/**
 * Dashboard Overview Page
 * =======================
 * Main dashboard showing overview analytics
 */

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { MetricCard } from '@/components/MetricCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { DateRangePicker } from '@/components/DateRangePicker';
import { LineChart } from '@/components/charts/LineChart';
import { BarChart } from '@/components/charts/BarChart';
import { Users, Map, MessageCircle, UserPlus, TrendingUp, Activity, Heart } from 'lucide-react';
import { downloadJSON, formatNumber } from '@/lib/utils';
import { getApiUrl, fetchWithTimeout } from '@/lib/api';
import type { OverviewAnalytics, ApiResponse } from '@/types/analytics';

export default function DashboardPage() {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery<ApiResponse<OverviewAnalytics>>({
    queryKey: ['overview', startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const res = await fetchWithTimeout(getApiUrl(`api/analytics/overview?${params}`));
      if (!res.ok) throw new Error('Failed to fetch overview analytics');
      return res.json();
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
    enabled: true,
  });

  const handleDateChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['overview'] });
    }, 0);
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleExport = () => {
    if (data?.data) {
      downloadJSON(data.data, `overview-analytics-${new Date().toISOString()}.json`);
    }
  };

  if (isLoading) {
    return (
      <div>
        <Header title="Overview Analytics" subtitle="Platform-wide metrics and insights" />
        <div className="p-8">
          <LoadingSpinner text="Loading overview analytics..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Header title="Overview Analytics" subtitle="Platform-wide metrics and insights" />
        <div className="p-8">
          <ErrorMessage
            message={error instanceof Error ? error.message : 'An error occurred'}
            onRetry={() => refetch()}
          />
        </div>
      </div>
    );
  }

  const analytics = data?.data;

  return (
    <div>
      <Header
        title="Overview Analytics"
        subtitle="Platform-wide metrics and insights"
        onRefresh={handleRefresh}
        onExport={handleExport}
        isLoading={isLoading}
      />

      <div className="p-8">
        {/* Top Row: Time Period Selector and Platform Health */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Time Period Selector */}
          <div className="lg:col-span-1">
            <DateRangePicker onDateChange={handleDateChange} />
          </div>

          {/* Platform Health */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow p-6 h-full">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Platform Health</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Status: <span className="font-medium text-green-600 capitalize">
                      {analytics?.platform_health?.status || 'healthy'}
                    </span>
                  </p>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Uptime</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {analytics?.platform_health?.uptime_percentage?.toFixed(1) || '99.9'}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Last Update</p>
                      <p className="text-sm font-medium text-gray-700">
                        {analytics?.platform_health?.last_update 
                          ? new Date(analytics.platform_health.last_update).toLocaleString('en-US', {
                              month: '2-digit',
                              day: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })
                          : 'N/A'
                        }
                      </p>
                    </div>
                  </div>
                </div>
                <div className="ml-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Activity className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Users"
            value={analytics?.total_metrics?.total_users || 0}
            icon={Users}
            color="blue"
          />
          <MetricCard
            title="Active Users"
            value={analytics?.total_metrics?.active_users || 0}
            icon={UserPlus}
            color="green"
          />
          <MetricCard
            title="Total Journeys"
            value={analytics?.total_metrics?.total_journeys || 0}
            icon={Map}
            color="purple"
          />
          <MetricCard
            title="Total Comments"
            value={analytics?.total_metrics?.total_comments || 0}
            icon={MessageCircle}
            color="yellow"
          />
        </div>

        {/* Growth & Engagement Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Growth Metrics */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Growth Metrics
            </h3>
            <div className="space-y-5">
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-700">User Growth Rate</span>
                <span className="text-xl font-bold text-green-600">
                  {analytics?.growth_metrics?.user_growth_rate !== undefined 
                    ? `${analytics.growth_metrics.user_growth_rate >= 0 ? '+' : ''}${analytics.growth_metrics.user_growth_rate.toFixed(1)}%`
                    : '+0%'
                  }
                </span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-700">Journey Growth Rate</span>
                <span className="text-xl font-bold text-blue-600">
                  {analytics?.growth_metrics?.journey_growth_rate !== undefined 
                    ? `${analytics.growth_metrics.journey_growth_rate >= 0 ? '+' : ''}${analytics.growth_metrics.journey_growth_rate.toFixed(1)}%`
                    : '+0%'
                  }
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Engagement Growth Rate</span>
                <span className="text-xl font-bold text-purple-600">
                  {analytics?.growth_metrics?.engagement_growth_rate !== undefined 
                    ? `${analytics.growth_metrics.engagement_growth_rate >= 0 ? '+' : ''}${analytics.growth_metrics.engagement_growth_rate.toFixed(1)}%`
                    : '+0%'
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Engagement Metrics */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Engagement Metrics
            </h3>
            <div className="space-y-5">
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-700">Avg Comments/Journey</span>
                <span className="text-xl font-bold text-gray-900">
                  {analytics?.engagement_metrics?.avg_comments_per_journey?.toFixed(1) || '0.0'}
                </span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-700">Avg Friends/User</span>
                <span className="text-xl font-bold text-gray-900">
                  {analytics?.engagement_metrics?.avg_friends_per_user?.toFixed(1) || '0.0'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Engagement Rate</span>
                <span className="text-xl font-bold text-gray-900">
                  {analytics?.engagement_metrics?.engagement_rate?.toFixed(1) || '0.0'}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Time Series Charts */}
        {analytics?.time_series && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {analytics.time_series.daily_users && analytics.time_series.daily_users.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <LineChart
                  data={analytics.time_series.daily_users}
                  xKey="date"
                  yKeys={[{ key: 'value', color: '#3b82f6', name: 'New Users' }]}
                  title="📈 Daily User Registrations"
                  height={300}
                />
              </div>
            )}

            {analytics.time_series.daily_journeys && analytics.time_series.daily_journeys.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <LineChart
                  data={analytics.time_series.daily_journeys}
                  xKey="date"
                  yKeys={[{ key: 'value', color: '#8b5cf6', name: 'New Journeys' }]}
                  title="✈️ Daily Journey Creation"
                  height={300}
                />
              </div>
            )}

            {analytics.time_series.daily_engagement && analytics.time_series.daily_engagement.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
                <LineChart
                  data={analytics.time_series.daily_engagement}
                  xKey="date"
                  yKeys={[{ key: 'value', color: '#10b981', name: 'Comments' }]}
                  title="💬 Daily Engagement (Comments)"
                  height={300}
                />
              </div>
            )}
          </div>
        )}
        
        {/* Empty State for Time Series */}
        {(!analytics?.time_series || 
          (!analytics.time_series.daily_users?.length && 
           !analytics.time_series.daily_journeys?.length &&
           !analytics.time_series.daily_engagement?.length)) && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Time Series Data Available</h3>
            <p className="text-sm text-gray-500">
              Time series charts will appear here when data is available for the selected time period.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

