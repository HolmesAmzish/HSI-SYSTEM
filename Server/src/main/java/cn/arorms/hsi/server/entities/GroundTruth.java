package cn.arorms.hsi.server.entities;

import cn.arorms.hsi.server.enums.ProcessStatus;
import jakarta.persistence.*;
import lombok.Data;

/**
 * GroundTruthMask, the MAT file of gt user upload or python inference.
 * 
 * @author Cacciatore
 * @version 1.1 2026-03-06
 */
@Data
@Entity
@Table(name = "ground_truth_rasters")
public class GroundTruth {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "hsi_id", nullable = false, comment = "Hyperspectral Image id")
    private HyperspectralImage image;

    private String filename;

    @Column(comment = "GT MAT file path")
    private String matPath;

    @Column(comment = "GT BIN file path")
    private String binPath;

    @Column(name = "num_classes")
    private int numClasses;

    private Integer height;

    private Integer width;

    private Long fileSize;

    @Enumerated(EnumType.STRING)
    private ProcessStatus status = ProcessStatus.PENDING;
}
