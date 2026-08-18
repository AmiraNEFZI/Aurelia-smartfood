package com.aurelia.backend.repository;

import com.aurelia.backend.entity.DriverApplication;
import com.aurelia.backend.enums.DriverApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DriverApplicationRepository extends JpaRepository<DriverApplication, Long> {

    List<DriverApplication> findByStatus(DriverApplicationStatus status);

    boolean existsByEmailAndStatus(String email, DriverApplicationStatus status);
}
