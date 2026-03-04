package cn.arorms.hsi.server.controllers;

import cn.arorms.hsi.server.services.GroundTruthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/gt")
public class GroundTruthController {
    private GroundTruthService gtService;
    public GroundTruthController(GroundTruthService gtService) {
        this.gtService = gtService;
    }

    @PostMapping("/upload/{hsi_id}")
    public ResponseEntity<String> handleGtMatUpload(
            @PathVariable("hsi_id") Long hsiId,
            @RequestParam("file")MultipartFile file
    ) {
        gtService.uploadGtMatFile(hsiId, file);
        return ResponseEntity.ok("Ground truth mat file upload success")
    }
}
