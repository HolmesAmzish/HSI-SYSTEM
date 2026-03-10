package cn.arorms.hsi.server.repositories;

import cn.arorms.hsi.server.entities.SegmentationLabel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * Repository for SegmentationLabel entity.
 * 
 * @author Cacciatore
 * @version 1.0 2026-03-06
 */
public interface SegmentationLabelRepository extends JpaRepository<SegmentationLabel, Long> {
    List<SegmentationLabel> findByDatasetId(Long datasetId);
}