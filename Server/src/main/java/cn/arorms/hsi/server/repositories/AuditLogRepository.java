package cn.arorms.hsi.server.repositories;

import cn.arorms.hsi.server.entities.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
}
