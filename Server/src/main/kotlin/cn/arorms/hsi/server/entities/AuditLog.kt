package cn.arorms.hsi.server.entities

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "system_logs")
data class AuditLog(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,

    var timestamp: LocalDateTime = LocalDateTime.now(),

    @ManyToOne
    @JoinColumn(name = "operator_id")
    var operator: User? = null
) {
    constructor(operator: User?) : this() {
        this.timestamp = LocalDateTime.now()
        this.operator = operator
    }
}
