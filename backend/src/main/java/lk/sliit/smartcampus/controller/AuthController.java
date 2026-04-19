package lk.sliit.smartcampus.controller;

import lk.sliit.smartcampus.dto.*;
import lk.sliit.smartcampus.security.CustomOAuth2User;
import lk.sliit.smartcampus.service.AuthService;
import lk.sliit.smartcampus.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserService userService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            return ResponseEntity.ok(authService.register(request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            return ResponseEntity.ok(authService.login(request));
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("error", "Login failed: " + e.getMessage()));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }

        String email = resolveEmail(authentication);
        if (email == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Cannot resolve user identity"));
        }

        return ResponseEntity.ok(userService.getUserByEmail(email));
    }

    @GetMapping("/token-test")
    public ResponseEntity<?> tokenTest(@RequestParam String token) {
        return ResponseEntity.ok(Map.of(
                "token", token,
                "message", "✅ Login successful! Copy this token for Postman."
        ));
    }

    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(Map.of("status", "✅ Auth service running"));
    }

    private String resolveEmail(Authentication authentication) {
        Object p = authentication.getPrincipal();
        if (p instanceof UserDetails ud) return ud.getUsername();
        if (p instanceof String s && s.contains("@")) return s;
        if (p instanceof CustomOAuth2User o) return o.getUser().getEmail();
        return null;
    }
}