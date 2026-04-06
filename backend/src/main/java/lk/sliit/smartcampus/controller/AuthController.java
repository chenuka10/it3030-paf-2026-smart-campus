package lk.sliit.smartcampus.controller;

import lk.sliit.smartcampus.dto.UserResponseDTO;
import lk.sliit.smartcampus.security.CustomOAuth2User;
import lk.sliit.smartcampus.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }

        // Resolve email regardless of auth type (JWT UserDetails or OAuth2 session)
        String email = resolveEmail(authentication);
        if (email == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Cannot resolve user identity"));
        }

        UserResponseDTO dto = userService.getUserByEmail(email);
        return ResponseEntity.ok(dto);
    }

    private String resolveEmail(Authentication authentication) {
        Object principal = authentication.getPrincipal();

        // Case 1: JWT filter ran → principal is a String (email) or UserDetails
        if (principal instanceof UserDetails ud) {
            return ud.getUsername();
        }
        if (principal instanceof String s && s.contains("@")) {
            return s;
        }

        // Case 2: OAuth2 session still active → principal is CustomOAuth2User
        if (principal instanceof CustomOAuth2User oAuth2User) {
            return oAuth2User.getUser().getEmail();
        }

        return null;
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
}