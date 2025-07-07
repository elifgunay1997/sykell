import React, { useState } from 'react';
import URLForm from '../Components/URLForm';
import URLTable from '../Components/URLTable';

const Dashboard: React.FC = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleURLAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">URL Analysis Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Add URLs to analyze and view detailed crawling results
          </p>
        </div>

        <URLForm onURLAdded={handleURLAdded} />
        <URLTable refreshTrigger={refreshTrigger} />
      </div>
    </div>
  );
};

export default Dashboard; 