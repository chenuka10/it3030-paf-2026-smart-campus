package lk.sliit.smartcampus.service;

import lk.sliit.smartcampus.dto.AuthResponse;
import lk.sliit.smartcampus.dto.LoginRequest;
import lk.sliit.smartcampus.dto.RegisterRequest;
import lk.sliit.smartcampus.entity.Role;
import lk.sliit.smartcampus.entity.User;
import lk.sliit.smartcampus.repository.UserRepository;
import lk.sliit.smartcampus.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository      userRepository;
    private final PasswordEncoder     passwordEncoder;
    private final JwtUtil             jwtUtil;
    private final NotificationService notificationService;

    // ── Register ──────────────────────────────────────────────────────────────

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail().trim())) {
            throw new IllegalArgumentException("An account with this email already exists.");
        }

        User user = User.builder()
                .name(request.getName().trim())
                .email(request.getEmail().trim().toLowerCase())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.USER)
                .provider("LOCAL")
                .build();

        User saved = userRepository.save(user);
        notificationService.onUserRegistered(saved);

        String token = jwtUtil.generateToken(saved.getEmail(), saved.getRole().name());
        return buildResponse(saved, token);
    }

    // ── Login ─────────────────────────────────────────────────────────────────

    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password."));

        // Block OAuth2-only accounts from manual login
        if (user.getPassword() == null) {
            throw new BadCredentialsException(
                "This account uses Google Sign-In. Please login with Google.");
        }

        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("Invalid email or password.");
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return buildResponse(user, token);
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private AuthResponse buildResponse(User user, String token) {
        return AuthResponse.builder()
                .token(token)
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }
}