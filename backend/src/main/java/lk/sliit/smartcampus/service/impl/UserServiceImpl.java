package lk.sliit.smartcampus.service.impl;

import lk.sliit.smartcampus.dto.UpdateProfileRequest;
import lk.sliit.smartcampus.dto.UpdateRoleRequest;
import lk.sliit.smartcampus.dto.UserResponseDTO;
import lk.sliit.smartcampus.entity.Role;
import lk.sliit.smartcampus.entity.User;
import lk.sliit.smartcampus.exception.ResourceNotFoundException;
import lk.sliit.smartcampus.repository.UserRepository;
import lk.sliit.smartcampus.service.NotificationService;
import lk.sliit.smartcampus.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;
import lk.sliit.smartcampus.dto.CreateTechnicianRequest;
import lk.sliit.smartcampus.exception.ConflictException;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository      userRepository;
    private final NotificationService notificationService;

    @Override
    public List<UserResponseDTO> getAllUsers() {
        return userRepository.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Override
    public UserResponseDTO getUserById(Long id) {
        return toDTO(findById(id));
    }

    @Override
    public UserResponseDTO getUserByEmail(String email) {
        return toDTO(findByEmail(email));
    }

    @Override
    @Transactional
    public UserResponseDTO updateUserRole(Long id, UpdateRoleRequest request, String actorEmail) {
        User user    = findById(id);
        Role oldRole = user.getRole();
        Role newRole = request.getRole();
        if (oldRole == newRole) return toDTO(user);
        user.setRole(newRole);
        User saved = userRepository.save(user);
        notificationService.onRoleChanged(saved, oldRole, newRole, actorEmail);
        return toDTO(saved);
    }

    @Override
    @Transactional
    public UserResponseDTO updateMyProfile(String email, UpdateProfileRequest request) {
        User user = findByEmail(email);
        if (request.getName() != null && !request.getName().isBlank()) user.setName(request.getName());
        if (request.getPhone()      != null) user.setPhone(request.getPhone());
        if (request.getBio()        != null) user.setBio(request.getBio());
        if (request.getDepartment() != null) user.setDepartment(request.getDepartment());
        User saved = userRepository.save(user);
        notificationService.onProfileUpdated(saved);
        return toDTO(saved);
    }

    @Override
    @Transactional
    public void deleteUser(Long id, String actorEmail) {
        User user = findById(id);
        notificationService.onUserDeleted(user, actorEmail);
        userRepository.deleteById(id);
    }

    @Override
    @Transactional
    public UserResponseDTO createTechnician(CreateTechnicianRequest request, String actorEmail) {
        String email = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("A user with this email already exists");
        }

        User technician = User.builder()
                .name(request.getName().trim())
                .email(email)
                .role(Role.TECHNICIAN)
                .provider("ADMIN_CREATED")
                .imageUrl(request.getImageUrl())
                .phone(request.getPhone())
                .bio(request.getBio())
                .department(request.getDepartment())
                .build();

        User saved = userRepository.save(technician);

        return toDTO(saved);
    }

    // Called by CustomOAuth2UserService on first Google login
    public UserResponseDTO registerNewUser(User user) {
        User saved = userRepository.save(user);
        notificationService.onUserRegistered(saved);
        return toDTO(saved);
    }

    private User findById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
    }

    private User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    private UserResponseDTO toDTO(User u) {
        return UserResponseDTO.builder()
                .id(u.getId()).name(u.getName()).email(u.getEmail())
                .role(u.getRole()).imageUrl(u.getImageUrl())
                .phone(u.getPhone()).bio(u.getBio()).department(u.getDepartment())
                .createdAt(u.getCreatedAt()).updatedAt(u.getUpdatedAt())
                .build();
    }
}