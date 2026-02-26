package cn.arorms.hsi.server.services;

import cn.arorms.hsi.server.annotations.ValidFile;
import cn.arorms.hsi.server.entities.HyperspectralImage;
import cn.arorms.hsi.server.enums.FileType;
import cn.arorms.hsi.server.repositories.HyperspectralImageRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Objects;

@Service
public class HyperspectralImageService {
    private static final Logger logger = LoggerFactory.getLogger(HyperspectralImageService.class);
    private final HyperspectralImageRepository hsiRepository;
    private final StorageService storageService;

    public HyperspectralImageService(StorageService storageService, HyperspectralImageRepository hsiRepository) {
        this.hsiRepository = hsiRepository;
        this.storageService = storageService;
    }

    public Page<HyperspectralImage> getHsiList(Pageable pageable) {
        return hsiRepository.findAll(pageable);
    }

    @ValidFile
    public void uploadHsiMatFile(MultipartFile file) {
        String matPath = storageService.store(file, FileType.HSI_MAT);
        String filename = file.getOriginalFilename();
        Long fileSize = file.getSize();

        logger.debug("File upload request: filename: {}, size: {} bytes, path: {}",
                filename, fileSize, matPath);

        var hsi = new HyperspectralImage();
        //noinspection ConstantConditions the filename has checked in file validation annotation
        hsi.setFilename(filename);
        hsi.setFileSize(fileSize);
        hsi.setMatPath(matPath);
        hsiRepository.save(hsi);
    }
}
