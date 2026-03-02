package cn.arorms.hsi.server.entities;

import cn.arorms.hsi.server.enums.ProcessStatus;
import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * Entity representing a hyperspectral image.
 * 
 * @author Cacciatore
 * @version 1.0 2026-03-01
 */
@Entity
@Table(name = "hyperspectral_images")
public class HyperspectralImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String filename = "";

    @Enumerated(EnumType.STRING)
    private ProcessStatus status = ProcessStatus.PENDING;

    @Column(nullable = false, comment = "MAT file")
    private String matPath = "";

    @Column(comment = "BIN file")
    private String binPath;

    @Column(comment = "hash of file header 1MB")
    private String headerHash;

    @Column(comment = "JPG file for fake coloured image")
    private String overviewPicturePath;

    private String metadata;

    private Long fileSize;

    private Integer height;

    private Integer width;

    private Integer bands;

    @Column(comment = "Data type of binary file")
    private String dataType;

    @Column(comment = "Processing completion timestamp")
    private LocalDateTime processedAt;

    public HyperspectralImage() {
    }

    public HyperspectralImage(String filename, String matPath) {
        this.filename = filename;
        this.matPath = matPath;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFilename() {
        return filename;
    }

    public void setFilename(String filename) {
        this.filename = filename;
    }

    public ProcessStatus getStatus() {
        return status;
    }

    public void setStatus(ProcessStatus status) {
        this.status = status;
    }

    public String getMatPath() {
        return matPath;
    }

    public void setMatPath(String matPath) {
        this.matPath = matPath;
    }

    public String getBinPath() {
        return binPath;
    }

    public void setBinPath(String binPath) {
        this.binPath = binPath;
    }

    public String getHeaderHash() {
        return headerHash;
    }

    public void setHeaderHash(String headerHash) {
        this.headerHash = headerHash;
    }

    public String getOverviewPicturePath() {
        return overviewPicturePath;
    }

    public void setOverviewPicturePath(String overviewPicturePath) {
        this.overviewPicturePath = overviewPicturePath;
    }

    public String getMetadata() {
        return metadata;
    }

    public void setMetadata(String metadata) {
        this.metadata = metadata;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }

    public Integer getHeight() {
        return height;
    }

    public void setHeight(Integer height) {
        this.height = height;
    }

    public Integer getWidth() {
        return width;
    }

    public void setWidth(Integer width) {
        this.width = width;
    }

    public Integer getBands() {
        return bands;
    }

    public void setBands(Integer bands) {
        this.bands = bands;
    }

    public String getDataType() {
        return dataType;
    }

    public void setDataType(String dataType) {
        this.dataType = dataType;
    }

    public LocalDateTime getProcessedAt() {
        return processedAt;
    }

    public void setProcessedAt(LocalDateTime processedAt) {
        this.processedAt = processedAt;
    }
}