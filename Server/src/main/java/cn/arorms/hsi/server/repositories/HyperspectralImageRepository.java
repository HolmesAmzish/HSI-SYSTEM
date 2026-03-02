package cn.arorms.hsi.server.repositories;

import cn.arorms.hsi.server.entities.HyperspectralImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface HyperspectralImageRepository extends JpaRepository<HyperspectralImage, Long> {
}
