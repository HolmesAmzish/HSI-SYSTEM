package cn.arorms.hsi.server.entities

import jakarta.persistence.*

@Entity
@Table(name = "segmentation_labels")
data class SegmentationLabel(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,

    @Column(comment = "Chinese name for display")
    var name: String = "",

    @Column(comment = "English name of label")
    var aliasName: String = "",

    @Column(comment = "Hex colour code, e.g., #123ABC")
    var colourCode: String = ""
) {
    constructor(name: String, aliasName: String, colourCode: String) : this() {
        this.name = name
        this.aliasName = aliasName
        this.colourCode = colourCode
    }
}

