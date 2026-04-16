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

    // ── Self-service (declared before /{id} to avoid path conflict) ──────────

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserResponseDTO> getMyProfile(Authentication auth) {
        return ResponseEntity.ok(userService.getUserByEmail(email(auth)));
    }

    @PutMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserResponseDTO> updateMyProfile(
            Authentication auth,
            @Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(userService.updateMyProfile(email(auth), request));
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

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
            Authentication auth,
            @PathVariable Long id,
            @Valid @RequestBody UpdateRoleRequest request) {
        return ResponseEntity.ok(userService.updateUserRole(id, request, email(auth)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteUser(Authentication auth, @PathVariable Long id) {
        userService.deleteUser(id, email(auth));
        return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private String email(Authentication auth) {
        if (auth == null) throw new IllegalStateException("Not authenticated");
        Object p = auth.getPrincipal();
        if (p instanceof UserDetails ud) return ud.getUsername();
        if (p instanceof String s)       return s;
        throw new IllegalStateException("Unknown principal: " + p.getClass());
    }
}