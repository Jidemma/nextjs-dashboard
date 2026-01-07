'use client';

/**
 * Date Range Picker Component
 * ===========================
 * Select date ranges for filtering analytics
 */

import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';

interface DateRangePickerProps {
  onDateChange: (startDate: string, endDate: string) => void;
  initialStartDate?: string;
  initialEndDate?: string;
}

type PeriodOption = 'day' | 'week' | 'month' | 'year' | 'all' | 'custom';

export function DateRangePicker({ onDateChange, initialStartDate = '', initialEndDate = '' }: DateRangePickerProps) {
  const [period, setPeriod] = useState<PeriodOption>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Initialize with "All Time" on mount
  useEffect(() => {
    if (!initialStartDate && !initialEndDate) {
      onDateChange('', '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  const handlePeriodChange = (newPeriod: PeriodOption) => {
    setPeriod(newPeriod);
    
    if (newPeriod === 'custom') {
      // Clear dates when custom is selected - user will manually select dates
      setStartDate('');
      setEndDate('');
      // Don't call onDateChange yet, wait for user to select dates
      return;
    }
    
    // Calculate dates immediately
    const end = new Date();
    end.setHours(23, 59, 59, 999); // End of day
    const start = new Date();
    
    switch (newPeriod) {
      case 'day':
        // Today: start of today to end of today
        start.setHours(0, 0, 0, 0); // Start of today
        break;
      case 'week':
        // Last 7 days: 7 days ago to today
        start.setDate(end.getDate() - 6); // Include today, so go back 6 days
        start.setHours(0, 0, 0, 0);
        break;
      case 'month':
        // Last 30 days: 30 days ago to today
        start.setDate(end.getDate() - 29); // Include today, so go back 29 days
        start.setHours(0, 0, 0, 0);
        break;
      case 'year':
        // Last 365 days: 365 days ago to today
        start.setDate(end.getDate() - 364); // Include today, so go back 364 days
        start.setHours(0, 0, 0, 0);
        break;
      case 'all':
        // Immediately call onDateChange for 'all' to clear filters
        onDateChange('', '');
        return;
    }
    
    // Immediately call onDateChange with calculated dates
    onDateChange(start.toISOString(), end.toISOString());
  };

  const handleCustomDateChange = (field: 'start' | 'end', value: string) => {
    // Update state only - don't auto-apply
    if (field === 'start') {
      setStartDate(value);
    } else {
      setEndDate(value);
    }
    // Dates will only be applied when user clicks "Apply Custom Range" button
  };

  const handleCustomDateSubmit = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    if (!startDate || !endDate) {
      alert('Please select both start and end dates');
      return;
    }
    
    // Parse dates - date input gives us YYYY-MM-DD format
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T23:59:59');
    
    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      alert('Please enter valid dates');
      return;
    }
      
      if (start > end) {
      alert('Start date must be before or equal to end date');
        return;
      }
      
    // Apply the dates
      onDateChange(start.toISOString(), end.toISOString());
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center mb-4">
        <Calendar className="h-5 w-5 text-gray-500 mr-2" />
        <h3 className="text-sm font-medium text-gray-900">Time Period</h3>
      </div>

      {/* Quick Period Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(['day', 'week', 'month', 'year', 'all'] as PeriodOption[]).map((p) => (
          <button
            key={p}
            onClick={() => handlePeriodChange(p)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              period === p
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {p === 'all' ? 'All Time' : p === 'day' ? 'Today' : p === 'week' ? 'Last Week' : p === 'month' ? 'Last Month' : 'Last Year'}
          </button>
        ))}
        <button
          onClick={() => handlePeriodChange('custom')}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            period === 'custom'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Custom
        </button>
      </div>

      {/* Custom Date Inputs */}
      {period === 'custom' && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                const value = e.target.value;
                handleCustomDateChange('start', value);
              }}
              onBlur={(e) => {
                // Ensure date is set when user finishes selecting
                if (e.target.value && !startDate) {
                  handleCustomDateChange('start', e.target.value);
                }
              }}
              max={endDate || new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                const value = e.target.value;
                handleCustomDateChange('end', value);
              }}
              onBlur={(e) => {
                // Ensure date is set when user finishes selecting
                if (e.target.value && !endDate) {
                  handleCustomDateChange('end', e.target.value);
                }
              }}
              min={startDate || undefined}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
          <button
              type="button"
            onClick={handleCustomDateSubmit}
            disabled={!startDate || !endDate}
              className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Apply Custom Range
          </button>
            <button
              type="button"
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setPeriod('all');
                onDateChange('', '');
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors"
            >
              Clear
            </button>
          </div>
          {startDate && endDate && (
            <p className="text-xs text-gray-500 text-center mt-1">
              Selected: {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

