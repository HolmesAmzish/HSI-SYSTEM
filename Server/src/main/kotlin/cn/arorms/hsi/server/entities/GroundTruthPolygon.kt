package cn.arorms.hsi.server.entities

import jakarta.persistence.*
import org.locationtech.jts.geom.Geometry

@Entity
@Table(name = "ground_truth_polygon")
data class GroundTruthPolygon(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,

    @ManyToOne
    @JoinColumn(name = "hsi_id", nullable = false, comment = "Hyperspectral Image id")
    var image: HyperspectralImage? = null,

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "label_id", nullable = false)
    var label: SegmentationLabel? = null,

    // We store every patch of the segmentation instance to the database
    @Column(columnDefinition = "geometry(MultiPolygon, 0)", nullable = false)
    var geometry: Geometry? = null
) {
    constructor(image: HyperspectralImage?, label: SegmentationLabel?, geometry: Geometry?) : this() {
        this.image = image
        this.label = label
        this.geometry = geometry
    }
}
