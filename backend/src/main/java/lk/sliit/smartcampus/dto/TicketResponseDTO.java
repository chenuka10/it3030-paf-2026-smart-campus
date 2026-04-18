package lk.sliit.smartcampus.dto;

import lk.sliit.smartcampus.entity.TicketCategory;
import lk.sliit.smartcampus.entity.TicketPriority;
import lk.sliit.smartcampus.entity.TicketStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TicketResponseDTO {
    private Long id;
    private Long resourceId;
    private TicketCategory category;
    private String description;
    private TicketPriority priority;
    private TicketStatus status;
    private String contactEmail;
    private String contactPhone;
    private Long assignedTechnicianId;
    private String assignedTechnicianName;
    private String rejectionReason;
    private String resolutionNotes;
    private Long createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<AttachmentDTO> attachments;
    private int commentCount;
}
