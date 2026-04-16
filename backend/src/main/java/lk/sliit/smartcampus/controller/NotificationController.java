package lk.sliit.smartcampus.controller;

import lk.sliit.smartcampus.dto.NotificationDTO;
import lk.sliit.smartcampus.service.NotificationService;
import lk.sliit.smartcampus.service.SseEmitterService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final SseEmitterService   sseEmitterService;

    /**
     * SSE endpoint — browser connects here to receive real-time events.
     * Must be GET with text/event-stream content type.
     */
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @PreAuthorize("isAuthenticated()")
    public SseEmitter stream(Authentication auth) {
        return sseEmitterService.createEmitter(email(auth));
    }

    /** Fetch all notifications for the current user */
    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<NotificationDTO>> getMyNotifications(Authentication auth) {
        return ResponseEntity.ok(notificationService.getMyNotifications(email(auth)));
    }

    /** Unread count — used by the bell badge */
    @GetMapping("/me/unread-count")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Long>> getUnreadCount(Authentication auth) {
        return ResponseEntity.ok(Map.of("count", notificationService.countUnread(email(auth))));
    }

    /** Mark all as read */
    @PutMapping("/me/read-all")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> markAllRead(Authentication auth) {
        notificationService.markAllRead(email(auth));
        return ResponseEntity.ok(Map.of("message", "All marked as read"));
    }

    /** Mark one as read */
    @PutMapping("/{id}/read")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> markOneRead(@PathVariable Long id, Authentication auth) {
        notificationService.markOneRead(id, email(auth));
        return ResponseEntity.ok(Map.of("message", "Marked as read"));
    }

    private String email(Authentication auth) {
        if (auth == null) throw new IllegalStateException("Not authenticated");
        Object p = auth.getPrincipal();
        if (p instanceof UserDetails ud) return ud.getUsername();
        if (p instanceof String s)       return s;
        throw new IllegalStateException("Unknown principal: " + p.getClass());
    }
}