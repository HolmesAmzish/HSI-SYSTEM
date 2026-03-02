import React from 'react';

const InferencePage: React.FC = () => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Inference Module
      </h2>
      <p className="text-gray-600">
        This module will enable running segmentation models on hyperspectral images.
      </p>
    </div>
  );
};

export default InferencePage;
