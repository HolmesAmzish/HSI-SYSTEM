package cn.arorms.hsi.server.entities

import jakarta.persistence.*

/**
 * The result of Hsi Load Task
 */
@Entity
@Table(name = "hyperspectral_image_metadatas")
data class HyperspectralImageMetadata(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,

    @OneToOne
    @JoinColumn(name = "hsi_id")
    var hsi: HyperspectralImage? = null,

    var metadata: String? = null,

    var height: Int? = null,

    var width: Int? = null,

    var bands: Int? = null
)
