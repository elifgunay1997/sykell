import React from 'react';

interface StatusBadgeProps {
  status: 'queued' | 'running' | 'done' | 'error';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'queued':
        return {
          text: 'Queued',
          className: 'bg-gray-100 text-gray-800 border-gray-300'
        };
      case 'running':
        return {
          text: 'Running',
          className: 'bg-blue-100 text-blue-800 border-blue-300'
        };
      case 'done':
        return {
          text: 'Done',
          className: 'bg-green-100 text-green-800 border-green-300'
        };
      case 'error':
        return {
          text: 'Error',
          className: 'bg-red-100 text-red-800 border-red-300'
        };
      default:
        return {
          text: 'Unknown',
          className: 'bg-gray-100 text-gray-800 border-gray-300'
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}>
      {config.text}
    </span>
  );
};

export default StatusBadge; 