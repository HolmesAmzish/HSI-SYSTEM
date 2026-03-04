package cn.arorms.hsi.server.services;

import cn.arorms.hsi.server.entities.AuditLog;
import cn.arorms.hsi.server.enums.LogLevel;
import cn.arorms.hsi.server.repositories.AuditLogRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@Slf4j
public class AuditLogService {

    private final AuditLogRepository logRepository;

    public AuditLogService(AuditLogRepository logRepository) {
        this.logRepository = logRepository;
    }

    public Page<AuditLog> getLogs(Pageable pageable) {
        return logRepository.findAll(pageable);
    }

    public void info(Class<?> internalClass, String format, Object... args) {
        handle(LogLevel.INFO, internalClass, format, args);
    }

    public void debug(Class<?> internalClass, String format, Object... args) {
        handle(LogLevel.DEBUG, internalClass, format, args);
    }

    public void error(Class<?> internalClass, String format, Object... args) {
        handle(LogLevel.ERROR, internalClass, format, args);
    }

    private void handle(LogLevel level, Class<?> clazz, String format, Object... args) {
        String content = org.slf4j.helpers.MessageFormatter.arrayFormat(format, args).getMessage();

        org.slf4j.Logger bizLogger = org.slf4j.LoggerFactory.getLogger(clazz);

        switch (level) {
            case INFO -> bizLogger.info(content);
            case DEBUG -> bizLogger.debug(content);
            case ERROR -> bizLogger.error(content);
            case WARNING -> bizLogger.warn(content);
        }

        saveToDb(level, content);
    }

    @Async
    protected void saveToDb(LogLevel level, String content) {
        try {
            var auditLog = new AuditLog();
            auditLog.setLevel(level);
            auditLog.setContent(content);
            auditLog.setTimestamp(LocalDateTime.now());
            logRepository.save(auditLog);
        } catch (Exception e) {
            log.error("CRITICAL: Failed to save audit log to DB: {}", e.getMessage());
        }
    }
}
