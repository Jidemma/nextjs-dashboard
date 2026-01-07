'use client';

/**
 * Metric Card Component
 * ====================
 * Display individual metrics with icons and trend indicators
 */

import { LucideIcon } from 'lucide-react';
import { formatNumber, formatPercentage, getChangeColor } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: number | string;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  format?: 'number' | 'percentage' | 'currency';
  icon?: LucideIcon;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  isLoading?: boolean;
}

const colorClasses = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  red: 'bg-red-500',
  purple: 'bg-purple-500',
};

export function MetricCard({
  title,
  value,
  change,
  changeType,
  format = 'number',
  icon: Icon,
  color = 'blue',
  isLoading = false,
}: MetricCardProps) {
  const formatValue = () => {
    if (typeof value === 'string') return value;
    
    switch (format) {
      case 'percentage':
        return formatPercentage(value);
      case 'currency':
        return `$${formatNumber(value)}`;
      default:
        return formatNumber(value);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow hover-lift p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        {Icon && (
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        )}
      </div>
      
      <div className="flex items-baseline">
        <p className="text-3xl font-bold text-gray-900">
          {formatValue()}
        </p>
        
        {change !== undefined && (
          <span className={`ml-2 text-sm font-medium ${getChangeColor(change)}`}>
            {change > 0 ? '+' : ''}{formatPercentage(change, 1)}
          </span>
        )}
      </div>
      
      {changeType && (
        <p className="mt-2 text-xs text-gray-500">
          {changeType === 'increase' && 'Increased from last period'}
          {changeType === 'decrease' && 'Decreased from last period'}
          {changeType === 'neutral' && 'No change from last period'}
        </p>
      )}
    </div>
  );
}

