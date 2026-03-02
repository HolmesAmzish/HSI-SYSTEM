package cn.arorms.hsi.server.entities;

import jakarta.persistence.*;

/**
 * GroundTruthMask, the MAT file of gt user upload or python inference.
 * 
 * @author Cacciatore
 * @version 1.0 2026-02-22
 */
@Entity
@Table(name = "ground_truth_masks")
public class GroundTruthMask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String filename = "";

    @Column(comment = "GT MAT file")
    private String matPath = "";

    @Column(comment = "GT BIN file")
    private String binPath = "";

    @ManyToOne
    @JoinColumn(name = "hsi_id", nullable = false, comment = "Hyperspectral Image id")
    private HyperspectralImage image;

    public GroundTruthMask() {
    }

    public GroundTruthMask(String filename, String matPath) {
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

    public HyperspectralImage getImage() {
        return image;
    }

    public void setImage(HyperspectralImage image) {
        this.image = image;
    }
}