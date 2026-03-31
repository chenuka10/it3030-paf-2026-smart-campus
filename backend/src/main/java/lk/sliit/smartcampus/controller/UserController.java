package lk.sliit.smartcampus.controller;

import lk.sliit.smartcampus.dto.UpdateProfileRequest;
import lk.sliit.smartcampus.dto.UpdateRoleRequest;
import lk.sliit.smartcampus.dto.UserResponseDTO;
import lk.sliit.smartcampus.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // ── Self-service endpoints (declared FIRST to avoid /{id} conflict) ───────

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserResponseDTO> getMyProfile(Authentication authentication) {
        return ResponseEntity.ok(userService.getUserByEmail(resolveEmail(authentication)));
    }

    @PutMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserResponseDTO> updateMyProfile(
            Authentication authentication,
            @Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(
                userService.updateMyProfile(resolveEmail(authentication), request));
    }

    // ── Admin endpoints ───────────────────────────────────────────────────────

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserResponseDTO>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponseDTO> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PutMapping("/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponseDTO> updateRole(
            @PathVariable Long id,
            @Valid @RequestBody UpdateRoleRequest request) {
        return ResponseEntity.ok(userService.updateUserRole(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    /**
     * JwtAuthFilter sets the principal as a plain String (email).
     * Guard against both String and UserDetails so this works in all cases.
     */
    private String resolveEmail(Authentication authentication) {
        if (authentication == null) throw new IllegalStateException("Not authenticated");
        Object principal = authentication.getPrincipal();
        if (principal instanceof UserDetails ud) return ud.getUsername();
        if (principal instanceof String s)       return s;
        throw new IllegalStateException("Unknown principal type: " + principal.getClass());
    }
}