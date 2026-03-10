package cn.arorms.hsi.server.controllers;

import cn.arorms.hsi.server.dtos.GroundTruthMatrix;
import cn.arorms.hsi.server.dtos.GroundTruthStats;
import cn.arorms.hsi.server.entities.GroundTruth;
import cn.arorms.hsi.server.services.GroundTruthService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/gt")
public class GroundTruthController {
    private final GroundTruthService groundTruthService;
    public GroundTruthController(GroundTruthService gtService) {
        this.groundTruthService = gtService;
    }

    @GetMapping
    public ResponseEntity<Page<GroundTruth>> getAllGt(
            @PageableDefault(direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(groundTruthService.getAllGt(pageable));
    }

    @PostMapping("/{hsi_id}")
    public ResponseEntity<GroundTruth> addGt(@PathVariable(name = "hsi_id") Long hsiId, @RequestBody GroundTruth gt) {
        return ResponseEntity.ok(groundTruthService.addGroundTruth(hsiId, gt));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGt(Long id) {
        groundTruthService.deleteGt(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/upload/{hsi_id}")
    public ResponseEntity<String> handleGtMatUpload(
            @PathVariable("hsi_id") Long hsiId,
            @RequestParam("file")MultipartFile file
    ) {
        groundTruthService.uploadGtMatFile(hsiId, file);
        return ResponseEntity.ok("Ground truth mat file upload success");
    }

    @GetMapping("/mask/{id}")
    public ResponseEntity<GroundTruthMatrix> getGtMask(@PathVariable Long id) {
        GroundTruthMatrix matrix = groundTruthService.getGtMaskMatrix(id);
        return ResponseEntity.ok(matrix);
    }

    @GetMapping("/stats/{id}")
    public ResponseEntity<GroundTruthStats> getGtStats(@PathVariable Long id) {
        GroundTruthStats stats = groundTruthService.getGtStats(id);
        return ResponseEntity.ok(stats);
    }
}
