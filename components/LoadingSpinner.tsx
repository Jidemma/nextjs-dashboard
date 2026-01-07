/**
 * Loading Spinner Component
 * =========================
 * Reusable loading spinner for async operations
 */

export function LoadingSpinner({ 
  size = 'md', 
  text = 'Loading...' 
}: { 
  size?: 'sm' | 'md' | 'lg'; 
  text?: string;
}) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div
        className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizeClasses[size]}`}
      />
      {text && (
        <p className="mt-4 text-sm text-gray-600">{text}</p>
      )}
    </div>
  );
}

