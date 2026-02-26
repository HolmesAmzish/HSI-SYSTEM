package cn.arorms.hsi.server.entities

import jakarta.persistence.*

/**
 * GroundTruthMask, the MAT file of gt user upload or python inference
 * @author Cacciatore
 * @version 1.0 2026-02-22
 */
@Entity
@Table(name = "ground_truth_masks")
data class GroundTruthMask(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,

    var filename: String = "",

    @Column(comment = "GT MAT file.")
    var filePath: String = "",

    @ManyToOne
    @JoinColumn(name = "hsi_id", nullable = false, comment = "Hyperspectral Image id")
    var image: HyperspectralImage? = null,
) {
    constructor(filename: String, filePath: String) : this() {
        this.filename = filename
        this.filePath = filePath
    }
}
