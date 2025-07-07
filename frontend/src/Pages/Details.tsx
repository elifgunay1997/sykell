import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService, AnalysisDetailResponse } from '../API/api';
import LinksChart from '../Components/LinksChart';

const Details: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<AnalysisDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDetails = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const response = await apiService.getURLDetails(parseInt(id));
        setData(response);
        setError('');
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to fetch details');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">No data found</div>
      </div>
    );
  }

  const { analysis_result, broken_links } = data;

  // Check if analysis was successful
  const hasAnalysisData = analysis_result && analysis_result.title !== "";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="mb-4 text-blue-600 hover:text-blue-800 flex items-center"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Analysis Details</h1>
          <p className="mt-2 text-gray-600">
            Detailed analysis results for the crawled URL
          </p>
        </div>

        {/* Error State - No Analysis Data */}
        {!hasAnalysisData && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Analysis Failed or Incomplete
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    The URL analysis could not be completed. This might be due to:
                  </p>
                  <ul className="list-disc list-inside mt-1">
                    <li>Network connectivity issues</li>
                    <li>Invalid or inaccessible URL</li>
                    <li>Server timeout or error</li>
                    <li>URL requires authentication</li>
                  </ul>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => {
                      apiService.reanalyzeURL(analysis_result.url_id).then(() => {
                        navigate('/');
                      });
                    }}
                    className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  >
                    Retry Analysis
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Basic Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">URL</label>
              <p className="mt-1 text-sm text-gray-900 break-all">{analysis_result.url?.url || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <p className="mt-1 text-sm text-gray-900">{analysis_result.url?.status || 'N/A'}</p>
            </div>
            {hasAnalysisData && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <p className="mt-1 text-sm text-gray-900">{analysis_result.title || 'No title found'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">HTML Version</label>
                  <p className="mt-1 text-sm text-gray-900">{analysis_result.html_version}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Login Form Detected</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {analysis_result.has_login_form ? 'Yes' : 'No'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Analysis Date</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(analysis_result.created_at).toLocaleString()}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Charts - Only show if we have analysis data */}
        {hasAnalysisData && (
          <div className="mb-6">
            <LinksChart
              internalLinks={analysis_result.internal_links}
              externalLinks={analysis_result.external_links}
              brokenLinks={analysis_result.broken_links}
            />
          </div>
        )}

        {/* Heading Counts - Only show if we have analysis data */}
        {hasAnalysisData && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Heading Structure</h2>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              {[
                { level: 'H1', count: analysis_result.h1_count },
                { level: 'H2', count: analysis_result.h2_count },
                { level: 'H3', count: analysis_result.h3_count },
                { level: 'H4', count: analysis_result.h4_count },
                { level: 'H5', count: analysis_result.h5_count },
                { level: 'H6', count: analysis_result.h6_count },
              ].map(({ level, count }) => (
                <div key={level} className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{count}</div>
                  <div className="text-sm text-gray-600">{level}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Broken Links - Only show if we have analysis data and broken links */}
        {hasAnalysisData && broken_links.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Broken Links ({broken_links.length})</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      URL
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Error Message
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {broken_links.map((link) => (
                    <tr key={link.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 truncate block max-w-xs"
                        >
                          {link.url}
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          link.status_code >= 500 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {link.status_code || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {link.error_message || 'Unknown error'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Details; 