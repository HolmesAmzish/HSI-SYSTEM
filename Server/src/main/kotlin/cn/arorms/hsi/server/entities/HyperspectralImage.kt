package cn.arorms.hsi.server.entities

import cn.arorms.hsi.server.enums.ProcessStatus
import jakarta.persistence.*

@Entity
@Table(name = "hyperspectral_images")
data class HyperspectralImage(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,

    @Column(nullable = false)
    var filename: String = "",

    @Enumerated(EnumType.STRING)
    var status: ProcessStatus? = ProcessStatus.PENDING,

    // File name included
    @Column(nullable = false, comment = "MAT file")
    var matPath: String = "",
    @Column(comment = "BIN file")
    var binPath: String? = null,

    // Ready for file duplicated check
    @Column(comment = "hash of file header 1MB")
    var headerHash: String? = null,

    // TODO: Add a overview picture for fake coloured hsi display
    @Column(comment = "JPG file for fake coloured image")
    var overviewPicturePath: String? = null,

    // Metadata line from matlab file header
    var metadata: String? = null,

    // Size and shape
    var fileSize: Long? = null,
    var height: Int? = null,
    var width: Int? = null,
    var bands: Int? = null,

    ) {
    constructor(filename: String, matPath: String) : this() {
        this.filename = filename
        this.matPath = matPath
    }
}
