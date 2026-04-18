package lk.sliit.smartcampus.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CommentDTO {
    private Long id;
    private Long userId;
    private String userName; // You'll populate this from User service
    
    @NotBlank(message = "Comment text is required")
    private String commentText;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}