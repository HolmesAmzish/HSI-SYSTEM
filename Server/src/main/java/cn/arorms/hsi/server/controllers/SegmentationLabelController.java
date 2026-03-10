package cn.arorms.hsi.server.controllers;

import cn.arorms.hsi.server.entities.SegmentationLabel;
import cn.arorms.hsi.server.services.SegmentationLabelService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller for SegmentationLabel CRUD operations.
 * 
 * @author Cacciatore
 * @version 1.0 2026-03-08
 */
@RestController
@RequestMapping("/api/labels")
public class SegmentationLabelController {

    private final SegmentationLabelService segmentationLabelService;

    public SegmentationLabelController(SegmentationLabelService segmentationLabelService) {
        this.segmentationLabelService = segmentationLabelService;
    }

    /**
     * Get all segmentation labels.
     * GET /api/labels
     * @return list of all segmentation labels
     */
    @GetMapping
    public List<SegmentationLabel> getAllLabels() {
        return segmentationLabelService.getAllLabels();
    }

    /**
     * Get all segmentation labels by dataset ID.
     * GET /api/labels/dataset/{datasetId}
     * @param datasetId the dataset ID
     * @return list of segmentation labels for the dataset
     */
    @GetMapping("/dataset/{datasetId}")
    public List<SegmentationLabel> getLabelsByDatasetId(@PathVariable Long datasetId) {
        return segmentationLabelService.getLabelsByDatasetId(datasetId);
    }

    /**
     * Get a segmentation label by ID.
     * GET /api/labels/{id}
     * @param id the label ID
     * @return the segmentation label
     */
    @GetMapping("/{id}")
    public SegmentationLabel getLabelById(@PathVariable Long id) {
        return segmentationLabelService.getLabelById(id);
    }

    /**
     * Create a new segmentation label.
     * POST /api/labels
     * @param label the label to create
     * @return the created label
     */
    @PostMapping
    public SegmentationLabel createLabel(@RequestBody SegmentationLabel label) {
        return segmentationLabelService.createLabel(label);
    }

    /**
     * Update an existing segmentation label.
     * PUT /api/labels/{id}
     * @param id the label ID
     * @param label the updated label data
     * @return the updated label
     */
    @PutMapping("/{id}")
    public SegmentationLabel updateLabel(@PathVariable Long id, @RequestBody SegmentationLabel label) {
        return segmentationLabelService.updateLabel(id, label);
    }

    /**
     * Delete a segmentation label by ID.
     * DELETE /api/labels/{id}
     * @param id the label ID
     * @return no content response
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLabel(@PathVariable Long id) {
        segmentationLabelService.deleteLabel(id);
        return ResponseEntity.noContent().build();
    }
}