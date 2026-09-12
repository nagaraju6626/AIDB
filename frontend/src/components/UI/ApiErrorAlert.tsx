import { AlertTriangle } from 'lucide-react';

interface ApiErrorAlertProps {
  message: string;
  onRetry?: () => void;
}

export const ApiErrorAlert = ({ message, onRetry }: ApiErrorAlertProps) => {
  return (
    <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl border border-red-100 dark:border-red-900/30 flex flex-col items-start gap-3 w-full max-w-md">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="font-semibold">Backend unavailable</h4>
          <p className="text-sm mt-1">{message}</p>
        </div>
      </div>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="ml-8 px-4 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 dark:text-red-300 text-sm font-medium rounded-md transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
};
