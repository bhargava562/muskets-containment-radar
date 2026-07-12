package com.muskets.backend.alerts;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Spring Data JPA repository for {@link AlertLogEntity}.
 */
@Repository
public interface AlertLogRepository extends JpaRepository<AlertLogEntity, Long> {

    List<AlertLogEntity> findByAccountId(String accountId);

    List<AlertLogEntity> findByPriority(String priority);

    long countByPriority(String priority);
}
