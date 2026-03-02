package cn.arorms.hsi.server.controllers;

import cn.arorms.hsi.server.entities.HyperspectralImage;
import cn.arorms.hsi.server.services.HyperspectralImageService;

import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
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

    @GetMapping("/getBin/{id}")
    public ResponseEntity<Resource> getHsiBinFile(@PathVariable Long id) {
        Resource resource = hsiService.downloadHsiBinFile(id);

        String filename = resource.getFilename() != null ? resource.getFilename() : "hsi_data.bin";

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                // 对于 200MB+ 的大文件，Spring 会自动采用流式传输，不会占用过多 JVM 内存
                .body(resource);
    }
}
