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

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TicketServiceImpl implements TicketService {
    
    private final TicketRepository ticketRepository;
    private final TicketAttachmentRepository attachmentRepository;
    private final TicketCommentRepository commentRepository;
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
    @Transactional
    public TicketResponseDTO updateTicketStatus(Long ticketId, StatusUpdateDTO statusUpdate, Long userId) {
        Ticket ticket = ticketRepository.findById(ticketId)
            .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + ticketId));
        
        // Validate status transition
        validateStatusTransition(ticket.getStatus(), statusUpdate.getStatus());
        
        ticket.setStatus(statusUpdate.getStatus());
        
        if (statusUpdate.getAssignedTechnicianId() != null) {
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
    
    // Convert Ticket entity to TicketResponseDTO
    private TicketResponseDTO convertToResponseDTO(Ticket ticket) {
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
        CommentDTO dto = new CommentDTO();
        dto.setId(comment.getId());
        dto.setUserId(comment.getUserId());
        dto.setCommentText(comment.getCommentText());
        dto.setCreatedAt(comment.getCreatedAt());
        dto.setUpdatedAt(comment.getUpdatedAt());
        
        // Note: userName can be populated by frontend or via UserService if available
        
        return dto;
    }
}