package com.aurelia.backend.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/uploads")
public class UploadController {

    private static final Path UPLOAD_DIR = Paths.get("src/main/resources/static/uploads");

    @PostMapping
    public ResponseEntity<Map<String, String>> upload(HttpServletRequest request, @RequestParam("file") MultipartFile file) throws IOException {
        if (!Files.exists(UPLOAD_DIR)) {
            Files.createDirectories(UPLOAD_DIR);
        }

        String original = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
        String ext = "";
        int idx = original.lastIndexOf('.');
        if (idx >= 0) ext = original.substring(idx);

        String filename = UUID.randomUUID().toString() + ext;
        Path dest = UPLOAD_DIR.resolve(filename);
        Files.copy(file.getInputStream(), dest);

        String baseUrl = request.getScheme() + "://" + request.getServerName() + ":" + request.getServerPort();
        Map<String, String> res = new HashMap<>();
        res.put("url", baseUrl + "/uploads/" + filename);
        return ResponseEntity.ok(res);
    }
}
