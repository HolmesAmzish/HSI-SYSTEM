package cn.arorms.hsi.server.controllers;

import cn.arorms.hsi.server.entities.HyperspectralImage;
import cn.arorms.hsi.server.services.HyperspectralImageService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/hsi")
public class HyperspectralImageController {

    private final HyperspectralImageService hsiService;

    HyperspectralImageController(HyperspectralImageService hsiService) {
        this.hsiService = hsiService;
    }

    @GetMapping
    public Page<HyperspectralImage> getHsiList(
            // TODO: Adjust more filter conditions
            @PageableDefault(direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return hsiService.getHsiList(pageable);
    }

    @PostMapping("/upload")
    public ResponseEntity<?> handleHsiMatUpload(@RequestParam("file") MultipartFile file) {
        hsiService.uploadHsiMatFile(file);
        return ResponseEntity.ok("Upload success");
    }
}
