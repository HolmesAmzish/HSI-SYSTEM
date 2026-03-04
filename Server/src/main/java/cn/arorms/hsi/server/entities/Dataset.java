package cn.arorms.hsi.server.entities;

import jakarta.persistence.*;
import lombok.Data;

/**
 * Dataset entity for organizing hyperspectral images.
 * 
 * @author Cacciatore
 * @version 1.0 2026-03-01
 */
@Data
@Entity @Table(name = "datasets")
public class Dataset {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String description;
    private Integer height;
    private Integer width;
    private Integer bands;
    private Integer minBand;
    private Integer maxBand;
    private Integer defaultRed;
    private Integer defaultGreen;
    private Integer defaultBlue;
}