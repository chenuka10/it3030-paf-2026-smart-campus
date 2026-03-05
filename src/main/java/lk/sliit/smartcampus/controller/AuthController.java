package lk.sliit.smartcampus.controller;


import lk.sliit.smartcampus.security.CustomOAuth2User;
import lk.sliit.smartcampus.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final JwtUtil jwtUtil;

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal CustomOAuth2User user) {
        if (user == null) return ResponseEntity.status(401).body("Not authenticated");
        return ResponseEntity.ok(Map.of(
            "name", user.getUser().getName(),
            "email", user.getUser().getEmail(),
            "role", user.getUser().getRole()
        ));
    }

    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(Map.of("status", "Auth service running ✅"));
    }
}
