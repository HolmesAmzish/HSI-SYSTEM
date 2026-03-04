package cn.arorms.hsi.server.entities;

import cn.arorms.hsi.server.enums.LogLevel;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Entity representing an audit log entry.
 * 
 * @author Cacciatore
 * @version 1.0 2026-03-01
 */
@Data
@Entity
@Table(name = "audit_logs")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private LogLevel level;

    private String content;

    @ManyToOne
    @JoinColumn(name = "operator_id")
    private User operator;

    private LocalDateTime timestamp = LocalDateTime.now();
}