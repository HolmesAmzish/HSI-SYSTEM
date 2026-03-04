import React from 'react';

const HomePage: React.FC = () => {
  const features = [
    {
      title: 'HSI Viewer',
      description: 'Visualize hyperspectral images with configurable RGB band selection',
      path: '/viewer',
    },
    {
      title: 'Ground Truth',
      description: 'Load and manage ground truth masks for segmentation',
      path: '/ground-truth',
    },
    {
      title: 'Inference',
      description: 'Run segmentation inference on hyperspectral images',
      path: '/inference',
    },
    {
      title: 'Datasets',
      description: 'Manage and browse available HSI datasets',
      path: '/datasets',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          Welcome to HSI System
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Advanced tools for hyperspectral image visualization, segmentation, and analysis
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feature) => (
          <a
            key={feature.path}
            href={feature.path}
            className="block p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all"
          >
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
              {feature.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {feature.description}
            </p>
          </a>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">System Capabilities</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">68+</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Spectral Bands</div>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">RGB</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Band Selection</div>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">BIN</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">File Format</div>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">API</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Ready</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;