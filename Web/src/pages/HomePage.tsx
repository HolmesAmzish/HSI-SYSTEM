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
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Welcome to HSI System
        </h2>
        <p className="text-gray-600">
          Advanced tools for hyperspectral image visualization, segmentation, and analysis
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feature) => (
          <a
            key={feature.path}
            href={feature.path}
            className="block p-6 bg-white border border-gray-200 rounded-lg hover:shadow-md hover:border-blue-300 transition-all"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {feature.title}
            </h3>
            <p className="text-gray-600 text-sm">
              {feature.description}
            </p>
          </a>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">System Capabilities</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">68+</div>
            <div className="text-sm text-gray-500">Spectral Bands</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">RGB</div>
            <div className="text-sm text-gray-500">Band Selection</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">BIN</div>
            <div className="text-sm text-gray-500">File Format</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">API</div>
            <div className="text-sm text-gray-500">Ready</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
