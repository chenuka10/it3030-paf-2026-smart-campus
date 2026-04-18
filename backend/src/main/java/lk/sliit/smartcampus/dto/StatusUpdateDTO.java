package lk.sliit.smartcampus.dto;

import lk.sliit.smartcampus.entity.TicketStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StatusUpdateDTO {
    
    @NotNull(message = "Status is required")
    private TicketStatus status;
    
    private Long assignedTechnicianId;
    private String resolutionNotes;
    private String rejectionReason;
}