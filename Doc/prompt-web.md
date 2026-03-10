# HSI System Web Frontend Documentation

## Project Overview
This is the web frontend for a Hyperspectral Image Analysis System.

## Tech Stack
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Charts**: ECharts (for data visualization)
- **Icons**: Lucide React

## Project Structure

```
Web/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── HsiFileUpload.tsx
│   │   └── HsiViewer.tsx
│   ├── pages/              # Page components
│   │   ├── HomePage.tsx
│   │   ├── DatasetsPage.tsx       # Dataset + SegmentationLabel management
│   │   ├── HsiManagePage.tsx
│   │   ├── GroundTruthPage.tsx    # GT upload + preview with color legend
│   │   ├── ViewerPage.tsx
│   │   └── InferencePage.tsx
│   ├── services/           # API service layer
│   │   ├── datasetService.ts      # Dataset + Label CRUD
│   │   ├── groundTruthService.ts  # GT operations + matrix rendering
│   │   ├── hsiLoader.ts
│   │   └── inferenceService.ts
│   ├── types/              # TypeScript type definitions
│   │   ├── dataset.ts
│   │   ├── groundTruth.ts         # GroundTruth, GroundTruthMatrix, SegmentationLabel
│   │   ├── hsi.ts
│   │   └── inference.ts
│   ├── contexts/           # React contexts
│   │   └── ThemeContext.tsx
│   ├── layouts/            # Layout components
│   │   └── MainLayout.tsx
│   ├── lib/                # Utility functions
│   ├── hooks/              # Custom React hooks
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/                 # Static assets
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── components.json         # shadcn/ui configuration
```

## API Base URLs
- Dataset API: `/api/datasets`
- Ground Truth API: `/api/gt`
- HSI API: `/api/hsi`
- Upload API: `/api/upload`

## Key Features

### 1. Dataset Management (DatasetsPage.tsx)
- Create, edit, delete datasets
- Configure band range (min/max wavelength)
- Set default RGB bands for false-color visualization
- **Segmentation Label Management**: Add/edit/delete class labels with colors
  - Each label has: labelIndex, name, aliasName, colourCode
  - Color picker for selecting label colors
  - Labels are stored per dataset

### 2. Ground Truth Management (GroundTruthPage.tsx)
- Upload MAT files containing segmentation masks
- Preview ground truth with color-coded class labels
- **Matrix Rendering**: Frontend renders GroundTruthMatrix to colored PNG
  - API returns: matrix (base64), labelMap, height, width, numClasses
  - Frontend decodes base64, builds color map, renders to canvas
  - Missing labels get random colors (HSL with golden angle)
- **Color Legend**: Shows all classes with their colors

### 3. HSI Viewer (ViewerPage.tsx + HsiViewer.tsx)
- View hyperspectral images with false-color rendering
- Band selection for RGB channels
- Ground truth overlay support

### 4. Inference (InferencePage.tsx)
- Model selection and parameter configuration
- Training task management
- Result visualization

## Backend API Reference
See `Server/src/main/java/cn/arorms/hsi/server/controllers/` for API endpoints:
- `DatasetController.java` - Dataset and SegmentationLabel APIs
- `GroundTruthController.java` - Ground truth upload and mask retrieval
- `HyperspectralImageController.java` - HSI operations

## Development Notes
- All comments in code should be in English
- UI display text should be in Chinese
- Use shadcn/ui components for consistent styling
- Follow existing patterns for API error handling

## AI Development Authority
**This frontend project is fully managed by AI.** You are authorized to:
- Refactor and restructure any part of the codebase
- Improve code quality, consistency, and best practices
- Optimize performance and maintainability
- Standardize naming conventions and file organization
- Replace or upgrade dependencies as needed
- Ensure the code follows modern React/TypeScript patterns

**Goal**: Make this codebase the most clean, well-structured, and professional it can be. Do not hesitate to make significant changes if they improve the overall quality.

---

You need to update this memory markdown file if nesseray, to make llm get full understand to this project, and don't change this line everytime that this line can be used in next conversation.
