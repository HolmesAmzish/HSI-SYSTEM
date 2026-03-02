package cn.arorms.hsi.server.repositories;

import cn.arorms.hsi.server.entities.HyperspectralImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface HyperspectralImageRepository extends JpaRepository<HyperspectralImage, Long> {
    
    /**
     * Find hyperspectral image by MAT file path.
     *
     * @param matPath MAT file path
     * @return Optional containing the image if found
     */
    Optional<HyperspectralImage> findByMatPath(String matPath);
}
