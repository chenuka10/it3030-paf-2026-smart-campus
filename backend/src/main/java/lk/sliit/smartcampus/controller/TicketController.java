package lk.sliit.smartcampus.controller;

import lk.sliit.smartcampus.dto.*;
import lk.sliit.smartcampus.entity.TicketCategory;
import lk.sliit.smartcampus.entity.TicketPriority;
import lk.sliit.smartcampus.entity.TicketStatus;
import lk.sliit.smartcampus.service.TicketService;
import lk.sliit.smartcampus.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.Resource;
//import org.springframework.core.io.UrlResource;
import java.nio.file.Path;
import java.nio.file.Paths;

//import java.nio.file.Paths;
import java.util.List;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {
    
    private final TicketService ticketService;
    private final UserService userService;  // ← Added this
    
    // ==================== TICKET ENDPOINTS ====================
    
    /**
 * POST /api/tickets - Create a new ticket
 * Accepts multipart form data with ticket details and up to 3 image attachments
 */
@PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
@PreAuthorize("hasRole('USER')")
public ResponseEntity<TicketResponseDTO> createTicket(
        @RequestParam("resourceId") Long resourceId,
        @RequestParam("category") String category,
        @RequestParam("description") String description,
        @RequestParam("priority") String priority,
        @RequestParam("contactEmail") String contactEmail,
        @RequestParam(value = "contactPhone", required = false) String contactPhone,
        @RequestParam(value = "attachments", required = false) List<MultipartFile> attachments,
        Authentication authentication) {
    
    // Build DTO manually from request params
    TicketRequestDTO ticketRequest = new TicketRequestDTO();
    ticketRequest.setResourceId(resourceId);
    ticketRequest.setCategory(TicketCategory.valueOf(category));
    ticketRequest.setDescription(description);
    ticketRequest.setPriority(TicketPriority.valueOf(priority));
    ticketRequest.setContactEmail(contactEmail);
    ticketRequest.setContactPhone(contactPhone);
    
    Long userId = getUserIdFromAuth(authentication);
    TicketResponseDTO response = ticketService.createTicket(ticketRequest, userId, attachments);
    
    return new ResponseEntity<>(response, HttpStatus.CREATED);
}
    
    /**
     * GET /api/tickets - Get all tickets with optional filters
     * Query params: status, priority, assignedTechnicianId
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'TECHNICIAN')")
    public ResponseEntity<List<TicketResponseDTO>> getAllTickets(
            @RequestParam(required = false) TicketStatus status,
            @RequestParam(required = false) TicketPriority priority,
            @RequestParam(required = false) Long assignedTechnicianId,
            Authentication authentication) {

        if (hasRole(authentication, "ROLE_TECHNICIAN")) {
            assignedTechnicianId = getUserIdFromAuth(authentication);
        }
        
        List<TicketResponseDTO> tickets = ticketService.getAllTickets(status, priority, assignedTechnicianId);
        return ResponseEntity.ok(tickets);
    }
    /**
 * GET /api/tickets/attachments/{filename} - Serve uploaded image files
 */
@GetMapping("/attachments/{filename}")
public ResponseEntity<Resource> getAttachment(@PathVariable String filename) {
    try {
        Path filePath = Paths.get("uploads/tickets").resolve(filename).normalize();
        Resource resource = new UrlResource(filePath.toUri());
        
        if (resource.exists() && resource.isReadable()) {
            return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_JPEG) // Adjust based on file type
                .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    } catch (Exception e) {
        return ResponseEntity.notFound().build();
    }
}
    /**
     * GET /api/tickets/my - Get current user's tickets
     */
    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'TECHNICIAN')")
    public ResponseEntity<List<TicketResponseDTO>> getMyTickets(Authentication authentication) {
        Long userId = getUserIdFromAuth(authentication);
        List<TicketResponseDTO> tickets = ticketService.getMyTickets(userId);
        return ResponseEntity.ok(tickets);
    }
    
    /**
     * GET /api/tickets/{id} - Get ticket by ID
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'TECHNICIAN')")
    public ResponseEntity<TicketResponseDTO> getTicketById(@PathVariable Long id) {
        TicketResponseDTO ticket = ticketService.getTicketById(id);
        return ResponseEntity.ok(ticket);
    }

    @GetMapping("/analytics/resources")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResourceIssueAnalyticsDTO> getResourceIssueAnalytics() {
        return ResponseEntity.ok(ticketService.getResourceIssueAnalytics());
    }
    
    /**
     * PATCH /api/tickets/{id}/status - Update ticket status
     * Used by ADMIN/TECHNICIAN to change status, assign technician, add resolution notes
     */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    public ResponseEntity<TicketResponseDTO> updateTicketStatus(
            @PathVariable Long id,
            @RequestBody @Valid StatusUpdateDTO statusUpdate,
            Authentication authentication) {
        
        Long userId = getUserIdFromAuth(authentication);
        TicketResponseDTO updated = ticketService.updateTicketStatus(id, statusUpdate, userId);
        
        return ResponseEntity.ok(updated);
    }
    
    /**
     * DELETE /api/tickets/{id} - Delete ticket (Admin only)
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteTicket(@PathVariable Long id) {
        ticketService.deleteTicket(id);
        return ResponseEntity.noContent().build();
    }
    
    // ==================== COMMENT ENDPOINTS ====================
    
    /**
     * GET /api/tickets/{ticketId}/comments - Get all comments for a ticket
     */
    @GetMapping("/{ticketId}/comments")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'TECHNICIAN')")
    public ResponseEntity<List<CommentDTO>> getTicketComments(@PathVariable Long ticketId) {
        List<CommentDTO> comments = ticketService.getTicketComments(ticketId);
        return ResponseEntity.ok(comments);
    }
    
    /**
     * POST /api/tickets/{ticketId}/comments - Add a comment to a ticket
     */
    @PostMapping("/{ticketId}/comments")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'TECHNICIAN')")
    public ResponseEntity<CommentDTO> addComment(
            @PathVariable Long ticketId,
            @RequestBody @Valid CommentDTO commentDTO,
            Authentication authentication) {
        
        Long userId = getUserIdFromAuth(authentication);
        CommentDTO created = ticketService.addComment(ticketId, commentDTO, userId);
        
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }
    
    /**
     * PUT /api/tickets/{ticketId}/comments/{commentId} - Update a comment
     */
    @PutMapping("/{ticketId}/comments/{commentId}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'TECHNICIAN')")
    public ResponseEntity<CommentDTO> updateComment(
            @PathVariable Long ticketId,
            @PathVariable Long commentId,
            @RequestBody @Valid CommentDTO commentDTO,
            Authentication authentication) {
        
        Long userId = getUserIdFromAuth(authentication);
        CommentDTO updated = ticketService.updateComment(ticketId, commentId, commentDTO, userId);
        
        return ResponseEntity.ok(updated);
    }
    
    /**
     * DELETE /api/tickets/{ticketId}/comments/{commentId} - Delete a comment
     */
    @DeleteMapping("/{ticketId}/comments/{commentId}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'TECHNICIAN')")
    public ResponseEntity<Void> deleteComment(
            @PathVariable Long ticketId,
            @PathVariable Long commentId,
            Authentication authentication) {
        
        Long userId = getUserIdFromAuth(authentication);
        ticketService.deleteComment(ticketId, commentId, userId);
        
        return ResponseEntity.noContent().build();
    }
    
    // ==================== HELPER METHODS ====================
    
    /**
     * Extract user ID from authentication token using UserService
     */
    private Long getUserIdFromAuth(Authentication authentication) {
        String email = authentication.getName(); // Get email from OAuth token
        UserResponseDTO user = userService.getUserByEmail(email);
        return user.getId();
    }

    private boolean hasRole(Authentication authentication, String role) {
        return authentication.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .anyMatch(role::equals);
    }
}
