package lk.sliit.smartcampus.service.impl;

import lk.sliit.smartcampus.dto.UpdateProfileRequest;
import lk.sliit.smartcampus.dto.UpdateRoleRequest;
import lk.sliit.smartcampus.dto.UserResponseDTO;
import lk.sliit.smartcampus.entity.Role;
import lk.sliit.smartcampus.entity.User;
import lk.sliit.smartcampus.exception.ResourceNotFoundException;
import lk.sliit.smartcampus.repository.UserRepository;
import lk.sliit.smartcampus.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Override
    public List<UserResponseDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<UserResponseDTO> getUsersByRole(Role role) {
        return userRepository.findByRole(role).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public UserResponseDTO getUserById(Long id) {
        return mapToDTO(userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id)));
    }

    @Override
    public UserResponseDTO getUserByEmail(String email) {
        return mapToDTO(userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email)));
    }

    @Override
    public UserResponseDTO updateUserRole(Long id, UpdateRoleRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
        user.setRole(request.getRole());
        return mapToDTO(userRepository.save(user));
    }

    @Override
    @Transactional
    public UserResponseDTO updateMyProfile(String email, UpdateProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        // Only update fields that were provided (non-null)
        if (request.getName() != null && !request.getName().isBlank()) {
            user.setName(request.getName());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }
        if (request.getBio() != null) {
            user.setBio(request.getBio());
        }
        if (request.getDepartment() != null) {
            user.setDepartment(request.getDepartment());
        }

        return mapToDTO(userRepository.save(user));
        
    }

    @Override
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id))
            throw new ResourceNotFoundException("User not found: " + id);
        userRepository.deleteById(id);
    }

    private UserResponseDTO mapToDTO(User user) {
        return UserResponseDTO.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .imageUrl(user.getImageUrl())
                .phone(user.getPhone())
                .bio(user.getBio())
                .department(user.getDepartment())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
