package com.aurelia.backend.service;

import com.aurelia.backend.dto.request.SubmitDriverReviewRequest;
import com.aurelia.backend.entity.Order;
import com.aurelia.backend.entity.User;
import com.aurelia.backend.enums.Role;
import com.aurelia.backend.enums.StatutCommande;
import com.aurelia.backend.exception.BusinessException;
import com.aurelia.backend.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServiceReviewTest {

    @Mock private OrderRepository orderRepository;
    @Mock private CartRepository cartRepository;
    @Mock private UserRepository userRepository;
    @Mock private ProductRepository productRepository;
    @Mock private PartnerService partnerService;
    @Mock private AssignationService assignationService;
    @Mock private BrevoService brevoService;
    @Mock private DriverReviewRepository driverReviewRepository;

    @InjectMocks private OrderService orderService;

    @Test
    void submitDriverReview_shouldRejectOrderNotDelivered() {
        User client = User.builder().id(1L).email("client@test.com").role(Role.CLIENT).build();
        User driver = User.builder().id(2L).email("driver@test.com").role(Role.LIVREUR).build();
        Order order = Order.builder().id(10L).user(client).driver(driver).status(StatutCommande.PRISE_EN_CHARGE).build();

        when(orderRepository.findById(10L)).thenReturn(Optional.of(order));
        when(userRepository.findByEmail("client@test.com")).thenReturn(Optional.of(client));

        SubmitDriverReviewRequest request = new SubmitDriverReviewRequest();
        request.setRating(5);
        request.setComment("Excellent");

        assertThrows(BusinessException.class, () -> orderService.submitDriverReview(10L, "client@test.com", request));
    }
}
