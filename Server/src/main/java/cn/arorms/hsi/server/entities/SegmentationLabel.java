package cn.arorms.hsi.server.entities;

import jakarta.persistence.*;

/**
 * Entity representing a segmentation label with color information.
 * 
 * @author Cacciatore
 * @version 1.0 2026-03-01
 */
@Entity
@Table(name = "segmentation_labels")
public class SegmentationLabel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(comment = "Chinese name for display")
    private String name = "";

    @Column(comment = "English name of label")
    private String aliasName = "";

    @Column(comment = "Hex colour code, e.g., #123ABC")
    private String colourCode = "";

    public SegmentationLabel() {
    }

    public SegmentationLabel(String name, String aliasName, String colourCode) {
        this.name = name;
        this.aliasName = aliasName;
        this.colourCode = colourCode;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getAliasName() {
        return aliasName;
    }

    public void setAliasName(String aliasName) {
        this.aliasName = aliasName;
    }

    public String getColourCode() {
        return colourCode;
    }

    public void setColourCode(String colourCode) {
        this.colourCode = colourCode;
    }
}