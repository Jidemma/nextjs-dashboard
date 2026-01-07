'use client';

/**
 * System Health Page
 * ==================
 * Monitor database and system health
 */

import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { Activity, Database, HardDrive, Clock, CheckCircle, XCircle } from 'lucide-react';
import { formatCompactNumber } from '@/lib/utils';
import { getApiUrl, fetchWithTimeout } from '@/lib/api';

interface HealthResponse {
  success: boolean;
  status: string;
  database?: {
    connected: boolean;
    name: string;
    collections: number;
    dataSize: number;
    storageSize: number;
  };
  responseTime: string;
  timestamp: string;
  error?: string;
}

export default function HealthPage() {
  const { data, isLoading, error, refetch } = useQuery<HealthResponse>({
    queryKey: ['health'],
    queryFn: async () => {
      const res = await fetchWithTimeout(getApiUrl('api/health'));
      if (!res.ok) throw new Error('Failed to fetch health status');
      return res.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div>
        <Header title="System Health" subtitle="Monitor system and database status" />
        <div className="p-8">
          <LoadingSpinner text="Checking system health..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Header title="System Health" subtitle="Monitor system and database status" />
        <div className="p-8">
          <ErrorMessage
            message={error instanceof Error ? error.message : 'An error occurred'}
            onRetry={() => refetch()}
          />
        </div>
      </div>
    );
  }

  const isHealthy = data?.status === 'healthy';

  return (
    <div>
      <Header
        title="System Health"
        subtitle="Monitor system and database status"
        onRefresh={() => refetch()}
        isLoading={isLoading}
      />

      <div className="p-8">
        {/* Overall Status */}
        <div className={`rounded-lg shadow p-8 mb-8 ${isHealthy ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {isHealthy ? (
                <CheckCircle className="h-12 w-12 text-green-600 mr-4" />
              ) : (
                <XCircle className="h-12 w-12 text-red-600 mr-4" />
              )}
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  System Status: {isHealthy ? 'Healthy' : 'Unhealthy'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Last checked: {data?.timestamp ? new Date(data.timestamp).toLocaleString() : 'N/A'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Response Time</p>
              <p className="text-2xl font-bold text-gray-900">{data?.responseTime || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Database Info */}
        {data?.database && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <Database className="h-8 w-8 text-blue-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Database</p>
                  <p className="text-lg font-bold text-gray-900">
                    {data.database.name}
                  </p>
                </div>
              </div>
              <p className={`text-sm ${data.database.connected ? 'text-green-600' : 'text-red-600'}`}>
                {data.database.connected ? '● Connected' : '● Disconnected'}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <Activity className="h-8 w-8 text-green-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Collections</p>
                  <p className="text-lg font-bold text-gray-900">
                    {data.database.collections}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-500">Total collections in database</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <HardDrive className="h-8 w-8 text-purple-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Data Size</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCompactNumber(data.database.dataSize)}B
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-500">Total data size</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <HardDrive className="h-8 w-8 text-yellow-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Storage Size</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCompactNumber(data.database.storageSize)}B
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-500">Total storage used</p>
            </div>
          </div>
        )}

        {/* Error Details */}
        {data?.error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-900 mb-2">Error Details</h3>
            <p className="text-sm text-red-700">{data.error}</p>
          </div>
        )}

        {/* Health Check Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Health Check Information</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Auto-refresh</span>
              <span className="text-sm font-medium text-green-600">Enabled (every 30s)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Check Type</span>
              <span className="text-sm font-medium text-gray-900">Database Connection & Stats</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Response Time Threshold</span>
              <span className="text-sm font-medium text-gray-900">{'< 5000ms'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

