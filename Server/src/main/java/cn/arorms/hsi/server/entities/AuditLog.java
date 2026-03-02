package cn.arorms.hsi.server.entities;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * Entity representing an audit log entry.
 * 
 * @author Cacciatore
 * @version 1.0 2026-03-01
 */
@Entity
@Table(name = "system_logs")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDateTime timestamp = LocalDateTime.now();

    @ManyToOne
    @JoinColumn(name = "operator_id")
    private User operator;

    public AuditLog() {
    }

    public AuditLog(User operator) {
        this.timestamp = LocalDateTime.now();
        this.operator = operator;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public User getOperator() {
        return operator;
    }

    public void setOperator(User operator) {
        this.operator = operator;
    }
}