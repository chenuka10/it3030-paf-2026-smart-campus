package lk.sliit.smartcampus.service;

import lk.sliit.smartcampus.dto.UpdateProfileRequest;
import lk.sliit.smartcampus.dto.UpdateRoleRequest;
import lk.sliit.smartcampus.dto.UserResponseDTO;
import java.util.List;

public interface UserService {
    List<UserResponseDTO> getAllUsers();
    UserResponseDTO getUserById(Long id);
    UserResponseDTO getUserByEmail(String email);
    UserResponseDTO updateUserRole(Long id, UpdateRoleRequest request);
    UserResponseDTO updateMyProfile(String email, UpdateProfileRequest request);
    void deleteUser(Long id);
}