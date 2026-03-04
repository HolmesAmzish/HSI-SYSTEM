package cn.arorms.hsi.server.entities;

import jakarta.persistence.*;
import lombok.Data;

/**
 * GroundTruthMask, the MAT file of gt user upload or python inference.
 * 
 * @author Cacciatore
 * @version 1.0 2026-02-22
 */
@Data
@Entity
@Table(name = "ground_truth_rasters")
public class GroundTruthRaster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "hsi_id", nullable = false, comment = "Hyperspectral Image id")
    private HyperspectralImage image;

    private String filename;

    @Column(comment = "GT MAT file")
    private String matPath;

    @Column(name = "raster", columnDefinition = "raster")
    private byte[] raster;


}