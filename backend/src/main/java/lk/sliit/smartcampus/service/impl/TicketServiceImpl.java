package lk.sliit.smartcampus.service.impl;

import lk.sliit.smartcampus.dto.*;
import lk.sliit.smartcampus.entity.*;
import lk.sliit.smartcampus.exception.ResourceNotFoundException;
import lk.sliit.smartcampus.exception.UnauthorizedException;
import lk.sliit.smartcampus.exception.ValidationException;
import lk.sliit.smartcampus.repository.*;
import lk.sliit.smartcampus.service.FileStorageService;
import lk.sliit.smartcampus.service.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TicketServiceImpl implements TicketService {
    
    private final TicketRepository ticketRepository;
    private final TicketAttachmentRepository attachmentRepository;
    private final TicketCommentRepository commentRepository;
    private final UserRepository userRepository;
    private final ResourceRepository resourceRepository;
    private final FileStorageService fileStorageService;
    
    @Override
    @Transactional
    public TicketResponseDTO createTicket(TicketRequestDTO requestDTO, Long userId, List<MultipartFile> attachments) {
        // Validate attachment count
        if (attachments != null && attachments.size() > 3) {
            throw new ValidationException("Maximum 3 attachments allowed per ticket");
        }
        
        // Create ticket entity
        Ticket ticket = new Ticket();
        ticket.setResourceId(requestDTO.getResourceId());
        ticket.setCategory(requestDTO.getCategory());
        ticket.setDescription(requestDTO.getDescription());
        ticket.setPriority(requestDTO.getPriority());
        ticket.setContactEmail(requestDTO.getContactEmail());
        ticket.setContactPhone(requestDTO.getContactPhone());
        ticket.setCreatedBy(userId);
        ticket.setStatus(TicketStatus.OPEN);
        
        // Save ticket first
        ticket = ticketRepository.save(ticket);
        
        // Handle attachments
        if (attachments != null && !attachments.isEmpty()) {
            for (MultipartFile file : attachments) {
                if (!file.isEmpty()) {
                    try {
                        String filename = fileStorageService.storeFile(file);
                        
                        TicketAttachment attachment = new TicketAttachment();
                        attachment.setTicket(ticket);
                        attachment.setFileName(file.getOriginalFilename());
                        attachment.setFilePath(filename);
                        
                        attachmentRepository.save(attachment);
                    } catch (Exception e) {
                        throw new RuntimeException("Failed to upload file: " + file.getOriginalFilename(), e);
                    }
                }
            }
        }
        
        return convertToResponseDTO(ticket);
    }
    
    @Override
    public TicketResponseDTO getTicketById(Long ticketId) {
        Ticket ticket = ticketRepository.findById(ticketId)
            .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + ticketId));
        return convertToResponseDTO(ticket);
    }
    
    @Override
    public List<TicketResponseDTO> getAllTickets(TicketStatus status, TicketPriority priority, Long assignedTechnicianId) {
        List<Ticket> tickets = ticketRepository.findByFilters(status, priority, assignedTechnicianId);
        return tickets.stream()
            .map(this::convertToResponseDTO)
            .collect(Collectors.toList());
    }
    
    @Override
    public List<TicketResponseDTO> getMyTickets(Long userId) {
        List<Ticket> tickets = ticketRepository.findByCreatedBy(userId);
        return tickets.stream()
            .map(this::convertToResponseDTO)
            .collect(Collectors.toList());
    }

    @Override
    public ResourceIssueAnalyticsDTO getResourceIssueAnalytics() {
        List<Ticket> tickets = ticketRepository.findAll();
        Map<Long, Resource> resourceById = resourceRepository.findAll().stream()
            .collect(Collectors.toMap(Resource::getId, Function.identity()));

        Map<Long, List<Ticket>> ticketsByResource = tickets.stream()
            .collect(Collectors.groupingBy(Ticket::getResourceId));

        long openTickets = tickets.stream()
            .filter(ticket -> ticket.getStatus() == TicketStatus.OPEN || ticket.getStatus() == TicketStatus.IN_PROGRESS)
            .count();

        long resolvedTickets = tickets.stream()
            .filter(ticket -> ticket.getStatus() == TicketStatus.RESOLVED || ticket.getStatus() == TicketStatus.CLOSED)
            .count();

        long urgentTickets = tickets.stream()
            .filter(ticket -> ticket.getPriority() == TicketPriority.URGENT || ticket.getPriority() == TicketPriority.HIGH)
            .count();

        List<ResourceIssueAnalyticsDTO.ResourceInsight> topProblemResources = ticketsByResource.entrySet().stream()
            .map(entry -> buildResourceInsight(entry.getKey(), entry.getValue(), resourceById.get(entry.getKey())))
            .sorted(Comparator.comparingLong(ResourceIssueAnalyticsDTO.ResourceInsight::getRiskScore).reversed())
            .limit(8)
            .collect(Collectors.toList());

        List<ResourceIssueAnalyticsDTO.TypeInsight> issuesByResourceType = ticketsByResource.entrySet().stream()
            .collect(Collectors.groupingBy(
                entry -> {
                    Resource resource = resourceById.get(entry.getKey());
                    return resource != null ? resource.getType().name() : "UNKNOWN";
                },
                Collectors.summingLong(entry -> entry.getValue().size())
            ))
            .entrySet().stream()
            .map(entry -> new ResourceIssueAnalyticsDTO.TypeInsight(entry.getKey(), entry.getValue()))
            .sorted(Comparator.comparingLong(ResourceIssueAnalyticsDTO.TypeInsight::getTicketCount).reversed())
            .collect(Collectors.toList());

        List<ResourceIssueAnalyticsDTO.StatusInsight> statusBreakdown = tickets.stream()
            .collect(Collectors.groupingBy(ticket -> ticket.getStatus().name(), Collectors.counting()))
            .entrySet().stream()
            .map(entry -> new ResourceIssueAnalyticsDTO.StatusInsight(entry.getKey(), entry.getValue()))
            .sorted(Comparator.comparingLong(ResourceIssueAnalyticsDTO.StatusInsight::getTicketCount).reversed())
            .collect(Collectors.toList());

        return new ResourceIssueAnalyticsDTO(
            new ResourceIssueAnalyticsDTO.Summary(
                tickets.size(),
                openTickets,
                resolvedTickets,
                urgentTickets,
                ticketsByResource.size()
            ),
            topProblemResources,
            issuesByResourceType,
            statusBreakdown
        );
    }
    
    @Override
    @Transactional
    public TicketResponseDTO updateTicketStatus(Long ticketId, StatusUpdateDTO statusUpdate, Long userId) {
        Ticket ticket = ticketRepository.findById(ticketId)
            .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + ticketId));
        
        // Validate status transition
        validateStatusTransition(ticket.getStatus(), statusUpdate.getStatus());
        validateStatusUpdate(statusUpdate);
        
        ticket.setStatus(statusUpdate.getStatus());
        
        if (statusUpdate.getAssignedTechnicianId() != null) {
            User technician = userRepository.findById(statusUpdate.getAssignedTechnicianId())
                .orElseThrow(() -> new ResourceNotFoundException(
                    "User not found with id: " + statusUpdate.getAssignedTechnicianId()
                ));

            if (technician.getRole() != Role.TECHNICIAN) {
                throw new ValidationException("Assigned user must have TECHNICIAN role");
            }

            ticket.setAssignedTechnicianId(statusUpdate.getAssignedTechnicianId());
        }
        
        if (statusUpdate.getResolutionNotes() != null) {
            ticket.setResolutionNotes(statusUpdate.getResolutionNotes());
        }
        
        if (statusUpdate.getRejectionReason() != null) {
            ticket.setRejectionReason(statusUpdate.getRejectionReason());
        }
        
        ticket = ticketRepository.save(ticket);
        return convertToResponseDTO(ticket);
    }
    
    @Override
    @Transactional
    public void deleteTicket(Long ticketId) {
        Ticket ticket = ticketRepository.findById(ticketId)
            .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + ticketId));
        
        // Delete associated files
        for (TicketAttachment attachment : ticket.getAttachments()) {
            try {
                fileStorageService.deleteFile(attachment.getFilePath());
            } catch (Exception e) {
                // Log error but continue deletion
            }
        }
        
        ticketRepository.delete(ticket);
    }
    
    // ==================== COMMENT METHODS ====================
    
    @Override
    @Transactional
    public CommentDTO addComment(Long ticketId, CommentDTO commentDTO, Long userId) {
        // Check if ticket exists
        Ticket ticket = ticketRepository.findById(ticketId)
            .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + ticketId));
        
        // Create comment
        TicketComment comment = new TicketComment();
        comment.setTicket(ticket);
        comment.setUserId(userId);
        comment.setCommentText(commentDTO.getCommentText());
        
        comment = commentRepository.save(comment);
        
        return convertToCommentDTO(comment);
    }
    
    @Override
    @Transactional
    public CommentDTO updateComment(Long ticketId, Long commentId, CommentDTO commentDTO, Long userId) {
        // Check if ticket exists
        ticketRepository.findById(ticketId)
            .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + ticketId));
        
        // Get comment
        TicketComment comment = commentRepository.findById(commentId)
            .orElseThrow(() -> new ResourceNotFoundException("Comment not found with id: " + commentId));
        
        // Check ownership - only the user who created the comment can edit it
        if (!comment.getUserId().equals(userId)) {
            throw new UnauthorizedException("You can only edit your own comments");
        }
        
        // Update comment text
        comment.setCommentText(commentDTO.getCommentText());
        comment = commentRepository.save(comment);
        
        return convertToCommentDTO(comment);
    }
    
    @Override
    @Transactional
    public void deleteComment(Long ticketId, Long commentId, Long userId) {
        // Check if ticket exists
        ticketRepository.findById(ticketId)
            .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + ticketId));
        
        // Get comment
        TicketComment comment = commentRepository.findById(commentId)
            .orElseThrow(() -> new ResourceNotFoundException("Comment not found with id: " + commentId));
        
        // Check ownership - only the user who created the comment can delete it
        if (!comment.getUserId().equals(userId)) {
            throw new UnauthorizedException("You can only delete your own comments");
        }
        
        commentRepository.delete(comment);
    }
    
    @Override
    public List<CommentDTO> getTicketComments(Long ticketId) {
        // Check if ticket exists
        ticketRepository.findById(ticketId)
            .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + ticketId));
        
        List<TicketComment> comments = commentRepository.findByTicketIdOrderByCreatedAtAsc(ticketId);
        
        return comments.stream()
            .map(this::convertToCommentDTO)
            .collect(Collectors.toList());
    }
    
    // ==================== HELPER METHODS ====================
    
    private void validateStatusTransition(TicketStatus currentStatus, TicketStatus newStatus) {
        // Define valid transitions
        boolean isValidTransition = false;
        
        switch (currentStatus) {
            case OPEN:
                isValidTransition = (newStatus == TicketStatus.IN_PROGRESS || 
                                   newStatus == TicketStatus.REJECTED);
                break;
            case IN_PROGRESS:
                isValidTransition = (newStatus == TicketStatus.RESOLVED || 
                                   newStatus == TicketStatus.REJECTED);
                break;
            case RESOLVED:
                isValidTransition = (newStatus == TicketStatus.CLOSED);
                break;
            case CLOSED:
            case REJECTED:
                isValidTransition = false; // Terminal states
                break;
        }
        
        if (!isValidTransition) {
            throw new ValidationException(
                String.format("Invalid status transition from %s to %s", currentStatus, newStatus)
            );
        }
    }

    private void validateStatusUpdate(StatusUpdateDTO statusUpdate) {
        if (statusUpdate.getStatus() == TicketStatus.IN_PROGRESS &&
            statusUpdate.getAssignedTechnicianId() == null) {
            throw new ValidationException("A technician must be assigned when moving a ticket to IN_PROGRESS");
        }

        if (statusUpdate.getStatus() == TicketStatus.RESOLVED &&
            (statusUpdate.getResolutionNotes() == null || statusUpdate.getResolutionNotes().isBlank())) {
            throw new ValidationException("Resolution notes are required when resolving a ticket");
        }

        if (statusUpdate.getStatus() == TicketStatus.REJECTED &&
            (statusUpdate.getRejectionReason() == null || statusUpdate.getRejectionReason().isBlank())) {
            throw new ValidationException("Rejection reason is required when rejecting a ticket");
        }
    }

    private ResourceIssueAnalyticsDTO.ResourceInsight buildResourceInsight(Long resourceId, List<Ticket> resourceTickets, Resource resource) {
        long totalTickets = resourceTickets.size();
        long openTickets = resourceTickets.stream()
            .filter(ticket -> ticket.getStatus() == TicketStatus.OPEN || ticket.getStatus() == TicketStatus.IN_PROGRESS)
            .count();
        long urgentTickets = resourceTickets.stream()
            .filter(ticket -> ticket.getPriority() == TicketPriority.URGENT || ticket.getPriority() == TicketPriority.HIGH)
            .count();
        long resolvedTickets = resourceTickets.stream()
            .filter(ticket -> ticket.getStatus() == TicketStatus.RESOLVED || ticket.getStatus() == TicketStatus.CLOSED)
            .count();

        double averageResolutionHours = resourceTickets.stream()
            .filter(ticket -> ticket.getStatus() == TicketStatus.RESOLVED || ticket.getStatus() == TicketStatus.CLOSED)
            .mapToLong(ticket -> Duration.between(ticket.getCreatedAt(), ticket.getUpdatedAt()).toHours())
            .average()
            .orElse(0);

        String lastReportedAt = resourceTickets.stream()
            .map(Ticket::getCreatedAt)
            .max(LocalDateTime::compareTo)
            .map(date -> date.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
            .orElse(null);

        long riskScore = totalTickets + openTickets + (urgentTickets * 2);

        return new ResourceIssueAnalyticsDTO.ResourceInsight(
            resourceId,
            resource != null ? resource.getName() : "Unknown Resource",
            resource != null ? resource.getType().name() : "UNKNOWN",
            resource != null ? resource.getLocation() : "Unknown Location",
            totalTickets,
            openTickets,
            urgentTickets,
            resolvedTickets,
            Math.round(averageResolutionHours * 10.0) / 10.0,
            riskScore,
            lastReportedAt
        );
    }
    
    // Convert Ticket entity to TicketResponseDTO
    private TicketResponseDTO convertToResponseDTO(Ticket ticket) {
        User assignedTechnician = ticket.getAssignedTechnicianId() != null
            ? userRepository.findById(ticket.getAssignedTechnicianId()).orElse(null)
            : null;

        TicketResponseDTO dto = new TicketResponseDTO();
        dto.setId(ticket.getId());
        dto.setResourceId(ticket.getResourceId());
        dto.setCategory(ticket.getCategory());
        dto.setDescription(ticket.getDescription());
        dto.setPriority(ticket.getPriority());
        dto.setStatus(ticket.getStatus());
        dto.setContactEmail(ticket.getContactEmail());
        dto.setContactPhone(ticket.getContactPhone());
        dto.setAssignedTechnicianId(ticket.getAssignedTechnicianId());
        dto.setAssignedTechnicianName(assignedTechnician != null ? assignedTechnician.getName() : null);
        dto.setRejectionReason(ticket.getRejectionReason());
        dto.setResolutionNotes(ticket.getResolutionNotes());
        dto.setCreatedBy(ticket.getCreatedBy());
        dto.setCreatedAt(ticket.getCreatedAt());
        dto.setUpdatedAt(ticket.getUpdatedAt());
        
        // Map attachments
        List<AttachmentDTO> attachmentDTOs = ticket.getAttachments().stream()
            .map(att -> new AttachmentDTO(
                att.getId(),
                att.getFileName(),
                "/api/tickets/attachments/" + att.getFilePath()
            ))
            .collect(Collectors.toList());
        dto.setAttachments(attachmentDTOs);
        
        // Count comments
        dto.setCommentCount((int) commentRepository.countByTicketId(ticket.getId()));
        
        return dto;
    }
    
    // Convert TicketComment entity to CommentDTO
    private CommentDTO convertToCommentDTO(TicketComment comment) {
        User user = userRepository.findById(comment.getUserId()).orElse(null);
        CommentDTO dto = new CommentDTO();
        dto.setId(comment.getId());
        dto.setUserId(comment.getUserId());
        dto.setUserName(user != null ? user.getName() : null);
        dto.setCommentText(comment.getCommentText());
        dto.setCreatedAt(comment.getCreatedAt());
        dto.setUpdatedAt(comment.getUpdatedAt());

        return dto;
    }
}
