'use client';

/**
 * Metric Tooltip Component
 * ========================
 * Shows metric calculation information on hover
 */

import { Info } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface MetricTooltipProps {
  title: string;
  description: string;
  calculation: string;
  filtered?: boolean;
  note?: string;
}

export function MetricTooltip({
  title,
  description,
  calculation,
  filtered = true,
  note,
}: MetricTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<'top' | 'bottom' | 'left' | 'right'>('top');
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Determine best position
      let newPosition: 'top' | 'bottom' | 'left' | 'right' = 'top';

      // Check if there's space on top
      if (triggerRect.top - tooltipRect.height - 10 > 0) {
        newPosition = 'top';
      }
      // Check if there's space on bottom
      else if (triggerRect.bottom + tooltipRect.height + 10 < viewportHeight) {
        newPosition = 'bottom';
      }
      // Check if there's space on right
      else if (triggerRect.right + tooltipRect.width + 10 < viewportWidth) {
        newPosition = 'right';
      }
      // Check if there's space on left
      else if (triggerRect.left - tooltipRect.width - 10 > 0) {
        newPosition = 'left';
      }

      setPosition(newPosition);
    }
  }, [isVisible]);

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
      case 'bottom':
        return 'top-full left-1/2 -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 -translate-y-1/2 ml-2';
      default:
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
    }
  };

  const getArrowClasses = () => {
    switch (position) {
      case 'top':
        return 'top-full left-1/2 -translate-x-1/2 border-t-gray-800 border-l-transparent border-r-transparent border-b-transparent';
      case 'bottom':
        return 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-800 border-l-transparent border-r-transparent border-t-transparent';
      case 'left':
        return 'left-full top-1/2 -translate-y-1/2 border-l-gray-800 border-t-transparent border-b-transparent border-r-transparent';
      case 'right':
        return 'right-full top-1/2 -translate-y-1/2 border-r-gray-800 border-t-transparent border-b-transparent border-l-transparent';
      default:
        return 'top-full left-1/2 -translate-x-1/2 border-t-gray-800 border-l-transparent border-r-transparent border-b-transparent';
    }
  };

  return (
    <div
      ref={triggerRef}
      className="relative inline-flex items-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
      onClick={() => setIsVisible(!isVisible)}
    >
      <button
        type="button"
        className="ml-1 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:text-gray-600"
        aria-label={`Info about ${title}`}
      >
        <Info className="h-3.5 w-3.5" />
      </button>

      {isVisible && (
        <div
          ref={tooltipRef}
          className={`absolute z-50 w-64 ${getPositionClasses()}`}
          role="tooltip"
        >
          <div className="bg-gray-800 text-white rounded-lg shadow-xl p-3 text-sm">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold text-white">{title}</h4>
              <span
                className={`text-xs px-1.5 py-0.5 rounded ${
                  filtered
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-600 text-gray-200'
                }`}
              >
                {filtered ? 'Filtered' : 'All Time'}
              </span>
            </div>
            <p className="text-gray-200 text-sm leading-relaxed mb-2">{description}</p>
            {note && (
              <p className="text-xs text-gray-300 italic mb-2">💡 {note}</p>
            )}
            <div className="bg-gray-900 rounded p-2 mt-2 border-l-2 border-blue-500">
              <p className="text-xs text-gray-300">{calculation}</p>
            </div>
          </div>
          {/* Arrow */}
          <div
            className={`absolute w-0 h-0 border-4 ${getArrowClasses()}`}
          />
        </div>
      )}
    </div>
  );
}

