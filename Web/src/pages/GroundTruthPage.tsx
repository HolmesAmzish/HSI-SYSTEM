import React from 'react';

const GroundTruthPage: React.FC = () => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Ground Truth Module
      </h2>
      <p className="text-gray-600">
        This module will allow loading and visualization of ground truth masks for segmentation.
      </p>
    </div>
  );
};

export default GroundTruthPage;
