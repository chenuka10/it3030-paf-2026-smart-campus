package lk.sliit.smartcampus.dto;

import lk.sliit.smartcampus.entity.Role;
import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponseDTO {
    private Long id;
    private String name;
    private String email;
    private Role role;
    private String imageUrl;
    private LocalDateTime createdAt;
}