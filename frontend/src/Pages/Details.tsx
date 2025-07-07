import React from 'react';
import { useParams } from 'react-router-dom';

const Details: React.FC = () => {
  const { id } = useParams();
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Details for URL ID: {id}</h1>
      <p>Details view and charts will be implemented here.</p>
    </div>
  );
};

export default Details; 