package com.aurelia.backend.repository;

import com.aurelia.backend.entity.Order;
import com.aurelia.backend.enums.StatutCommande;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByUserIdOrderByOrderDateDesc(Long userId);

    List<Order> findByDriverIdOrderByOrderDateDesc(Long driverId);

    List<Order> findByStatus(StatutCommande status);

    List<Order> findByStatusOrderByOrderDateAsc(StatutCommande status);
}
