package cn.arorms.hsi.server.controllers;

import cn.arorms.hsi.server.entities.GroundTruth;
import cn.arorms.hsi.server.services.GroundTruthService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.MediaType;
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

    @GetMapping(value = "/mask/{id}", produces = MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<byte[]> getGtMask(@PathVariable Long id) {
        byte[] imageBytes = groundTruthService.getGtMaskImage(id);
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .body(imageBytes);
    }
}
