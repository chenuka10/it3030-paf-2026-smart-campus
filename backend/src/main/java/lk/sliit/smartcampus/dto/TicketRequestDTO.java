package lk.sliit.smartcampus.dto;

import lk.sliit.smartcampus.entity.TicketCategory;
import lk.sliit.smartcampus.entity.TicketPriority;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TicketRequestDTO {
    
    @NotNull(message = "Resource ID is required")
    private Long resourceId;
    
    @NotNull(message = "Category is required")
    private TicketCategory category;
    
    @NotBlank(message = "Description is required")
    private String description;
    
    @NotNull(message = "Priority is required")
    private TicketPriority priority;
    
    @NotBlank(message = "Contact email is required")
    @Email(message = "Invalid email format")
    private String contactEmail;
    
    private String contactPhone;
}