package com.aurelia.backend.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class BrevoServiceTest {

    @Test
    void resolveSenderEmail_shouldFallbackToTransactionalSenderForPersonalInbox() {
        BrevoService service = new BrevoService(
                "test-key",
                "amiranefzi2003@gmail.com",
                "Aurelia SmartFood",
                "AURELIA",
                true);

        assertEquals("hello@aurelia-smartfood.com", service.resolveSenderEmail("amiranefzi2003@gmail.com"));
    }
}
