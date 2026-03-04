package cn.arorms.hsi.server.repositories;

import cn.arorms.hsi.server.entities.Dataset;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DatasetRepository extends JpaRepository<Dataset, Long> {
}