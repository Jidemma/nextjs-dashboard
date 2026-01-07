'use client';

/**
 * Header Component
 * ===============
 * Top header with page title and actions
 */

import { useState, useEffect } from 'react';
import { RefreshCw, Download, Calendar } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  onExport?: () => void;
  isLoading?: boolean;
}

export function Header({ 
  title, 
  subtitle, 
  onRefresh, 
  onExport,
  isLoading = false 
}: HeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-white border-b border-gray-200 px-8 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {/* Current Time */}
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="mr-2 h-4 w-4" />
            {formatDate(currentTime, 'full')}
          </div>

          {/* Refresh Button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <RefreshCw 
                className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} 
              />
              Refresh
            </button>
          )}

          {/* Export Button */}
          {onExport && (
            <button
              onClick={onExport}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

