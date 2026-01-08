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
      </div>
    </div>
  );
}

