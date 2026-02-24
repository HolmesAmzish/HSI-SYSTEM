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
    var status: ProcessStatus? = null,

    // File name included
    @Column(nullable = false, comment = "MAT file")
    var matlabFilePath: String = "",

    @Column(comment = "BIN file")
    var binaryFilePath: String? = null,

    @Column(comment = "JPG file for fake coloured image")
    var overviewPicturePath: String? = null
) {
    constructor(filename: String, matlabFilePath: String) : this() {
        this.filename = filename
        this.matlabFilePath = matlabFilePath
    }
}
