package cn.arorms.hsi.server.entities;

import jakarta.persistence.*;
import org.locationtech.jts.geom.Geometry;

/**
 * Entity representing a ground truth polygon with geometry data.
 * 
 * @author Cacciatore
 * @version 1.0 2026-03-01
 */
@Entity
@Table(name = "ground_truth_polygon")
public class GroundTruthPolygon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "gt_mask_id", nullable = false, comment = "Hyperspectral Image id")
    private GroundTruthMask gtMask;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "label_id", nullable = false)
    private SegmentationLabel label;

    @Column(columnDefinition = "geometry(MultiPolygon, 0)", nullable = false)
    private Geometry geometry;

    public GroundTruthPolygon() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public GroundTruthMask getGtMask() {
        return gtMask;
    }

    public void setGtMask(GroundTruthMask gtMask) {
        this.gtMask = gtMask;
    }

    public SegmentationLabel getLabel() {
        return label;
    }

    public void setLabel(SegmentationLabel label) {
        this.label = label;
    }

    public Geometry getGeometry() {
        return geometry;
    }

    public void setGeometry(Geometry geometry) {
        this.geometry = geometry;
    }
}