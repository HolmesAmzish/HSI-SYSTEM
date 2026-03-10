package cn.arorms.hsi.server.services;

import cn.arorms.hsi.server.entities.Dataset;
import cn.arorms.hsi.server.entities.SegmentationLabel;
import cn.arorms.hsi.server.repositories.DatasetRepository;
import cn.arorms.hsi.server.repositories.SegmentationLabelRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;

/**
 * Service for SegmentationLabel CRUD operations.
 * 
 * @author Cacciatore
 * @version 1.0 2026-03-08
 */
@Service
public class SegmentationLabelService {

    private final SegmentationLabelRepository segmentationLabelRepository;
    private final DatasetRepository datasetRepository;

    public SegmentationLabelService(SegmentationLabelRepository segmentationLabelRepository,
                                    DatasetRepository datasetRepository) {
        this.segmentationLabelRepository = segmentationLabelRepository;
        this.datasetRepository = datasetRepository;
    }

    /**
     * Get all segmentation labels.
     * @return list of all segmentation labels
     */
    public List<SegmentationLabel> getAllLabels() {
        return segmentationLabelRepository.findAll();
    }

    /**
     * Get all segmentation labels by dataset ID.
     * @param datasetId the dataset ID
     * @return list of segmentation labels for the dataset
     */
    public List<SegmentationLabel> getLabelsByDatasetId(Long datasetId) {
        return segmentationLabelRepository.findByDatasetId(datasetId);
    }

    /**
     * Get a segmentation label by ID.
     * @param id the label ID
     * @return the segmentation label
     * @throws NoSuchElementException if label not found
     */
    public SegmentationLabel getLabelById(Long id) {
        return segmentationLabelRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("SegmentationLabel not found with ID: " + id));
    }

    /**
     * Create a new segmentation label.
     * @param label the label to create
     * @return the created label
     * @throws NoSuchElementException if dataset not found
     */
    public SegmentationLabel createLabel(SegmentationLabel label) {
        if (label.getDataset() != null && label.getDataset().getId() != null) {
            Dataset dataset = datasetRepository.findById(label.getDataset().getId())
                    .orElseThrow(() -> new NoSuchElementException("Dataset not found with ID: " + label.getDataset().getId()));
            label.setDataset(dataset);
        }
        return segmentationLabelRepository.save(label);
    }

    /**
     * Update an existing segmentation label.
     * @param id the label ID
     * @param label the updated label data
     * @return the updated label
     * @throws NoSuchElementException if label or dataset not found
     */
    public SegmentationLabel updateLabel(Long id, SegmentationLabel label) {
        SegmentationLabel existing = getLabelById(id);
        
        if (label.getDataset() != null && label.getDataset().getId() != null) {
            Dataset dataset = datasetRepository.findById(label.getDataset().getId())
                    .orElseThrow(() -> new NoSuchElementException("Dataset not found with ID: " + label.getDataset().getId()));
            existing.setDataset(dataset);
        }
        
        if (label.getLabelIndex() != null) {
            existing.setLabelIndex(label.getLabelIndex());
        }
        if (label.getName() != null) {
            existing.setName(label.getName());
        }
        if (label.getAliasName() != null) {
            existing.setAliasName(label.getAliasName());
        }
        if (label.getColourCode() != null) {
            existing.setColourCode(label.getColourCode());
        }
        
        return segmentationLabelRepository.save(existing);
    }

    /**
     * Delete a segmentation label by ID.
     * @param id the label ID
     * @throws NoSuchElementException if label not found
     */
    public void deleteLabel(Long id) {
        if (!segmentationLabelRepository.existsById(id)) {
            throw new NoSuchElementException("SegmentationLabel not found with ID: " + id);
        }
        segmentationLabelRepository.deleteById(id);
    }
}