package lk.sliit.smartcampus.service;

import lk.sliit.smartcampus.dto.*;
import lk.sliit.smartcampus.entity.TicketPriority;
import lk.sliit.smartcampus.entity.TicketStatus;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface TicketService {
    TicketResponseDTO createTicket(TicketRequestDTO requestDTO, Long userId, List<MultipartFile> attachments);
    TicketResponseDTO getTicketById(Long ticketId);
    List<TicketResponseDTO> getAllTickets(TicketStatus status, TicketPriority priority, Long assignedTechnicianId);
    List<TicketResponseDTO> getMyTickets(Long userId);
    TicketResponseDTO updateTicketStatus(Long ticketId, StatusUpdateDTO statusUpdate, Long userId);
    void deleteTicket(Long ticketId);
    
    // Comments
    CommentDTO addComment(Long ticketId, CommentDTO commentDTO, Long userId);
    CommentDTO updateComment(Long ticketId, Long commentId, CommentDTO commentDTO, Long userId);
    void deleteComment(Long ticketId, Long commentId, Long userId);
    List<CommentDTO> getTicketComments(Long ticketId);
}