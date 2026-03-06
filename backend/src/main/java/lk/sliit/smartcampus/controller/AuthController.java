package lk.sliit.smartcampus.controller;


import lk.sliit.smartcampus.entity.User;
import lk.sliit.smartcampus.exception.ResourceNotFoundException;
import lk.sliit.smartcampus.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;

    @GetMapping("/token-test")
    public ResponseEntity<?> tokenTest(@RequestParam String token) {
        return ResponseEntity.ok(Map.of(
            "token", token,
            "message", "✅ Login successful! Copy this token for Postman."
        ));
    }

    // ✅ FIXED — @AuthenticationPrincipal is now String (email from JWT)
    @GetMapping("/me")
    public ResponseEntity<?> me(@AuthenticationPrincipal String email) {
        if (email == null) {
            return ResponseEntity.status(401).body(Map.of(
                "error", "Token missing or invalid"
            ));
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        return ResponseEntity.ok(Map.of(
            "id",    user.getId(),
            "name",  user.getName(),
            "email", user.getEmail(),
            "role",  user.getRole(),
            "image", user.getImageUrl() != null ? user.getImageUrl() : ""
        ));
    }

    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(Map.of("status", "✅ Auth service is running"));
    }
}
