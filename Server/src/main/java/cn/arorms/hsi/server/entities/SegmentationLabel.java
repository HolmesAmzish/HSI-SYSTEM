package cn.arorms.hsi.server.entities;

import jakarta.persistence.*;
import lombok.Data;

/**
 * Entity representing a segmentation label with color information.
 * 
 * @author Cacciatore
 * @version 1.0 2026-03-01
 */
@Data
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
}