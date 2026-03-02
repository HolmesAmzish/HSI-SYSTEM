package cn.arorms.hsi.server.controllers;

import cn.arorms.hsi.server.exceptions.StorageFileNotFoundException;
import cn.arorms.hsi.server.services.StorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * Reserved API for file uploading
 * @author Cacciatore
 * @version 1.0 2026-02-27
 */
@RestController
@RequestMapping("/api/upload")
class FileUploadController {
    private final StorageService storageService;
    @Autowired
    public FileUploadController(StorageService storageService) {
        this.storageService = storageService;
    }

    @PostMapping
    public ResponseEntity<?> handleFileUpload(@RequestParam("file") MultipartFile file) {
        String filepath = storageService.store(file);
        return ResponseEntity.ok("Upload success, filepath: " + filepath);
    }

    @GetMapping
    public ResponseEntity<Resource> serveFile(@RequestParam String filename) {
        Resource file = storageService.loadAsResource(filename);
        if (file == null) throw new StorageFileNotFoundException("File not found");
        return ResponseEntity.ok().body(file);
    }

    @ExceptionHandler(StorageFileNotFoundException.class)
    public ResponseEntity<?> handleStorageFileNotFound(StorageFileNotFoundException exc) {
        return ResponseEntity.notFound().build();
    }
}