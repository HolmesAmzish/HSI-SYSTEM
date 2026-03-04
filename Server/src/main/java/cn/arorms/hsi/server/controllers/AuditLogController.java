package cn.arorms.hsi.server.controllers;

import cn.arorms.hsi.server.entities.AuditLog;
import cn.arorms.hsi.server.services.AuditLogService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/log")
public class AuditLogController {
    private final AuditLogService logService;
    public AuditLogController(AuditLogService logService) {
        this.logService = logService;
    }

    @GetMapping("/latest")
    public ResponseEntity<Page<AuditLog>> getLastestLogs(
            @PageableDefault(size = 20, sort = "timestamp", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(logService.getLogs(pageable));
    }
}
