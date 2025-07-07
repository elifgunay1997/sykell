import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface LinksChartProps {
  internalLinks: number;
  externalLinks: number;
  brokenLinks: number;
}

const LinksChart: React.FC<LinksChartProps> = ({ internalLinks, externalLinks, brokenLinks }) => {
  const barData = {
    labels: ['Link Analysis'],
    datasets: [
      {
        label: 'Internal Links',
        data: [internalLinks],
        backgroundColor: 'rgba(34, 197, 94, 0.8)', // Green for internal
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1,
      },
      {
        label: 'External Links',
        data: [externalLinks],
        backgroundColor: 'rgba(59, 130, 246, 0.8)', // Blue for external
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
      {
        label: 'Broken Links',
        data: [brokenLinks],
        backgroundColor: 'rgba(239, 68, 68, 0.8)', // Red for broken
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 1,
      },
    ],
  };

  const doughnutData = {
    labels: ['Internal Links', 'External Links'],
    datasets: [
      {
        data: [internalLinks, externalLinks],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(59, 130, 246, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Link Analysis Overview',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: 'Internal vs External Links',
      },
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <Bar data={barData} options={barOptions} />
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <Doughnut data={doughnutData} options={doughnutOptions} />
      </div>
    </div>
  );
};

export default LinksChart; 