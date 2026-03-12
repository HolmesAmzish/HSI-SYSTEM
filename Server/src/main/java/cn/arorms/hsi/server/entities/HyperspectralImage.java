package cn.arorms.hsi.server.entities;

import cn.arorms.hsi.server.enums.ProcessStatus;
import com.fasterxml.jackson.annotation.JsonIncludeProperties;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Entity representing a hyperspectral image.
 * 
 * @author Cacciatore
 * @version 1.0 2026-03-01
 */
@Data
@Entity
@Table(name = "hyperspectral_images")
public class HyperspectralImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String filename;

    @Enumerated(EnumType.STRING)
    private ProcessStatus status = ProcessStatus.PENDING;

    @Column(nullable = false, comment = "MAT file")
    private String matPath;

    @Column(comment = "BIN file")
    private String binPath;

    @Column(name = "pca_path", comment = "BIN file of PCA result")
    private String pcaPath;

    @Column(comment = "hash of file header 1MB")
    private String headerHash;

    @Column(comment = "JPG file for fake coloured image")
    private String overviewPicturePath;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dataset_id")
//    @JsonIncludeProperties("dataset_id")
    private Dataset dataset;

    // Define by user
    @Column(name = "spatial_resolution", comment = "Length(m) of every pixel")
    private double spatialResolution;

    private Long fileSize;

    @Column(comment = "Data type of binary file")
    private String dataType;

    private LocalDateTime createdAt = LocalDateTime.now();
}