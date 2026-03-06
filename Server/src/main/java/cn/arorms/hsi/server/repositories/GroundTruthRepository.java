package cn.arorms.hsi.server.repositories;

import cn.arorms.hsi.server.entities.GroundTruth;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GroundTruthRepository extends JpaRepository<GroundTruth, Long> {
}
