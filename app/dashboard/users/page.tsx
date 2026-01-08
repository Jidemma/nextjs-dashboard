'use client';

/**
 * User Analytics Page
 * ==================
 * User demographics and activity analytics
 */

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { MetricCard } from '@/components/MetricCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { DateRangePicker } from '@/components/DateRangePicker';
import { PieChart } from '@/components/charts/PieChart';
import { BarChart } from '@/components/charts/BarChart';
import { LineChart } from '@/components/charts/LineChart';
import { Users, UserPlus, UserCheck, UserMinus, TrendingUp, Activity, MessageCircle, Heart, Map } from 'lucide-react';
import { downloadJSON, formatNumber } from '@/lib/utils';
import { getApiUrl, fetchWithTimeout } from '@/lib/api';
import { getMetricDefinition } from '@/lib/metricDefinitions';
import type { UserAnalytics, ApiResponse } from '@/types/analytics';

export default function UsersPage() {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery<ApiResponse<UserAnalytics>>({
    queryKey: ['users', startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const res = await fetchWithTimeout(getApiUrl(`api/analytics/users?${params}`));
      if (!res.ok) throw new Error('Failed to fetch user analytics');
      return res.json();
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
    enabled: true, // Always enable the query
  });

  const handleDateChange = (start: string, end: string) => {
    // Update state first
    setStartDate(start);
    setEndDate(end);
    // Invalidate queries to force refetch with new dates
    // Use setTimeout to ensure state has updated
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }, 0);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleExport = () => {
    if (data?.data) {
      downloadJSON(data.data, `user-analytics-${new Date().toISOString()}.json`);
    }
  };

  if (isLoading) {
    return (
      <div>
        <Header title="User Analytics" subtitle="User demographics and activity" />
        <div className="p-8">
          <LoadingSpinner text="Loading user analytics..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Header title="User Analytics" subtitle="User demographics and activity" />
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
  
  // Prepare gender distribution data for pie chart
  const genderData = analytics?.user_demographics?.gender_distribution
    ? Object.entries(analytics.user_demographics.gender_distribution).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      }))
    : [];

  // Prepare most active users data for bar chart
  const activeUsersData = analytics?.user_activity?.most_active_users?.slice(0, 10).map(user => ({
    name: user.username || `User ${user.user_id?.slice(-6) || 'Unknown'}`,
    score: user.activity_score,
  })) || [];

  // Registration trends over time
  const registrationTrendsData = analytics?.registration_trends?.map(trend => ({
    month: trend.month,
    users: trend.count,
  })) || [];

  // Activity distribution
  const activityDistributionData = analytics?.activity_distribution
    ?.filter(d => d.count > 0)
    .map(d => ({
      name: d.range,
      count: d.count,
    })) || [];

  return (
    <div>
      <Header
        title="User Analytics"
        subtitle="User demographics and activity"
        onRefresh={handleRefresh}
        onExport={handleExport}
        isLoading={isLoading}
      />

      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <DateRangePicker onDateChange={handleDateChange} />
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Users"
            value={formatNumber(analytics?.user_demographics?.total_users || 0)}
            icon={Users}
            color="blue"
            metricInfo={getMetricDefinition('Total Users', 'users')}
          />
          <MetricCard
            title="Active Users"
            value={formatNumber(analytics?.user_demographics?.active_users || 0)}
            icon={UserCheck}
            color="green"
            metricInfo={getMetricDefinition('Active Users', 'users')}
          />
          <MetricCard
            title="New Users"
            value={formatNumber(analytics?.user_demographics?.new_users || 0)}
            icon={UserPlus}
            color="purple"
            metricInfo={getMetricDefinition('New Users', 'users')}
          />
          <MetricCard
            title="Engagement Rate"
            value={`${Math.min(100, ((analytics?.user_demographics?.active_users || 0) / Math.max(analytics?.user_demographics?.total_users || 1, 1) * 100)).toFixed(1)}%`}
            icon={Activity}
            color="blue"
            metricInfo={getMetricDefinition('Engagement Rate', 'users')}
          />
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="New User Rate"
            value={`${((analytics?.user_demographics?.new_users || 0) / Math.max(analytics?.user_demographics?.total_users || 1, 1) * 100).toFixed(1)}%`}
            icon={TrendingUp}
            color="green"
            metricInfo={getMetricDefinition('New User Rate', 'users')}
          />
          <MetricCard
            title="Avg Journeys/User"
            value={analytics?.user_activity?.avg_journeys_per_user?.toFixed(1) || '0.0'}
            icon={Map}
            color="blue"
            metricInfo={getMetricDefinition('Avg Journeys/User', 'users')}
          />
          <MetricCard
            title="Avg Comments/User"
            value={analytics?.user_activity?.avg_comments_per_user?.toFixed(1) || '0.0'}
            icon={MessageCircle}
            color="green"
            metricInfo={getMetricDefinition('Avg Comments/User', 'users')}
          />
          <MetricCard
            title="Avg Friends/User"
            value={analytics?.user_activity?.avg_friends_per_user?.toFixed(1) || '0.0'}
            icon={Users}
            color="purple"
            metricInfo={getMetricDefinition('Avg Friends/User', 'users')}
          />
        </div>


        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {genderData.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <PieChart
                data={genderData}
                title="👥 Gender Distribution"
                height={300}
              />
            </div>
          )}

          {activeUsersData.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <BarChart
                data={activeUsersData}
                xKey="name"
                yKeys={[{ key: 'score', color: '#3b82f6', name: 'Activity Score' }]}
                title="🏆 Most Active Users"
                height={300}
                horizontal={true}
              />
            </div>
          )}
        </div>

        {/* User Growth and Activity Trends */}
        {(registrationTrendsData.length > 0 || activityDistributionData.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* User Registration Trends */}
            {registrationTrendsData.length > 0 ? (
              <div className="bg-white rounded-lg shadow p-6">
                <LineChart
                  data={registrationTrendsData}
                  xKey="month"
                  yKeys={[{ key: 'users', color: '#8b5cf6', name: 'New Users' }]}
                  title="📈 User Registration Trends"
                  height={300}
                />
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 User Registration Trends</h3>
                <div className="flex items-center justify-center h-64 text-gray-500">
                  <p>No registration trend data available</p>
                </div>
              </div>
            )}

          {/* Activity Distribution */}
          {activityDistributionData.length > 0 ? (
            <div className="bg-white rounded-lg shadow p-6">
              <BarChart
                data={activityDistributionData}
                xKey="name"
                yKeys={[{ key: 'count', color: '#10b981', name: 'Users' }]}
                title="📊 User Activity Distribution"
                height={Math.max(300, activityDistributionData.length * 40)}
                horizontal={true}
              />
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-semibold text-gray-700 mb-2">📊 Activity Classification (per week):</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• <strong>Highly Active:</strong> ≥3 activities per week (journeys + comments)</li>
                  <li>• <strong>Medium:</strong> 1-3 activities per week (journeys + comments)</li>
                  <li>• <strong>Inactive:</strong> &lt;1 activity per week (journeys + comments)</li>
                </ul>
                <p className="text-xs text-gray-500 mt-2 italic">
                  <strong>Note:</strong> "Active Users" metric counts users with ≥1 journey or comment in the period (DAU/MAU standard). 
                  This distribution shows engagement depth by weekly activity rate.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 User Activity Distribution</h3>
              <div className="flex items-center justify-center h-64 text-gray-500">
                <p>No activity distribution data available</p>
              </div>
            </div>
          )}
          </div>
        )}

        {/* Most Active Users Table */}
        {activeUsersData.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🏆 Top Active Users</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Username
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Activity Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Performance
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analytics?.user_activity?.most_active_users?.slice(0, 15).map((user: any, idx: number) => {
                    const maxScore = activeUsersData[0]?.score || 1;
                    const percentage = ((user.activity_score || 0) / maxScore) * 100;
                    return (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          #{idx + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {user.username || user.name || `User ${user.user_id?.slice(-6) || idx}`}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-blue-600">
                            {user.activity_score?.toFixed(1) || 0}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${Math.min(percentage, 100)}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-700">
                              {percentage.toFixed(0)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Retention Metrics */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">📈 User Retention Analysis</h3>
            <p className="text-xs text-gray-500">
              Compares user activity between the selected period and the previous period of equal duration
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Retention Rate</p>
              <p className="text-3xl font-bold text-green-600">
                {analytics?.user_retention?.retention_rate?.toFixed(1) || 0}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                % of previous period active users who returned
              </p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Returning Users</p>
              <p className="text-3xl font-bold text-blue-600">
                {formatNumber(analytics?.user_retention?.returning_users || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Users active in both periods
              </p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Churn Rate</p>
              <p className="text-3xl font-bold text-red-600">
                {analytics?.user_retention?.churn_rate?.toFixed(1) || 0}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                % of previous period active users who left
              </p>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-gray-700">
              <strong>Note:</strong> "Engagement Rate" (shown above) measures what % of <em>all users</em> are active in the current period. 
              "Retention Rate" measures what % of <em>previously active users</em> came back. These are different metrics with different purposes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

