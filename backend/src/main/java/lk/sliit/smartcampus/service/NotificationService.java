package lk.sliit.smartcampus.service;

import lk.sliit.smartcampus.dto.NotificationDTO;
import lk.sliit.smartcampus.entity.*;
import lk.sliit.smartcampus.repository.NotificationRepository;
import lk.sliit.smartcampus.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SseEmitterService sseEmitterService;

    // ── Public event methods called by UserServiceImpl ────────────────────────

    public void onUserRegistered(User newUser) {
        String title   = "New User Registered";
        String message = newUser.getName() + " (" + newUser.getEmail() + ") joined SmartCampus.";
        notifyAllAdmins(title, message, NotificationEvent.USER_REGISTERED, null, newUser.getName());
    }

    public void onRoleChanged(User target, Role oldRole, Role newRole, String actorEmail) {
        // 1. Notify the affected user
        String userTitle   = "Your Role Was Updated";
        String userMessage = "Your role has been changed from " + oldRole + " to " + newRole + ".";
        saveAndPush(target, userTitle, userMessage, NotificationEvent.ROLE_CHANGED, actorEmail, resolveActorName(actorEmail));

        // 2. Notify all admins
        String adminTitle   = "Role Changed";
        String adminMessage = target.getName() + "'s role was changed from " + oldRole + " to " + newRole + ".";
        notifyAllAdmins(adminTitle, adminMessage, NotificationEvent.ROLE_CHANGED, actorEmail, resolveActorName(actorEmail));
    }

    public void onUserDeleted(User target, String actorEmail) {
        // Notify admins only (target is gone)
        String title   = "User Deleted";
        String message = target.getName() + " (" + target.getEmail() + ") was removed from SmartCampus.";
        notifyAllAdmins(title, message, NotificationEvent.USER_DELETED, actorEmail, resolveActorName(actorEmail));
    }

    public void onProfileUpdated(User target) {
        // Notify admins silently
        String title   = "Profile Updated";
        String message = target.getName() + " updated their profile information.";
        notifyAllAdmins(title, message, NotificationEvent.PROFILE_UPDATED, target.getEmail(), target.getName());
    }

    // ── Fetch for current user ────────────────────────────────────────────────

    public List<NotificationDTO> getMyNotifications(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return notificationRepository
                .findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public long countUnread(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return notificationRepository.countByUserIdAndIsReadFalse(user.getId());
    }

    @Transactional
    public void markAllRead(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        notificationRepository.markAllReadByUserId(user.getId());
    }

    @Transactional
    public void markOneRead(Long notificationId, String email) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            if (n.getUser().getEmail().equals(email)) {
                n.setRead(true);
                notificationRepository.save(n);
            }
        });
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void notifyAllAdmins(String title, String message, NotificationEvent event,
                                 String actorEmail, String actorName) {
        List<User> admins = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.ADMIN)
                .collect(Collectors.toList());

        Set<String> adminEmails = admins.stream().map(User::getEmail).collect(Collectors.toSet());

        for (User admin : admins) {
            saveAndPush(admin, title, message, event, actorEmail, actorName);
        }
    }

    private void saveAndPush(User recipient, String title, String message,
                              NotificationEvent event, String actorEmail, String actorName) {
        Notification n = Notification.builder()
                .title(title)
                .message(message)
                .isRead(false)
                .eventType(event)
                .user(recipient)
                .actorEmail(actorEmail)
                .actorName(actorName)
                .build();
        Notification saved = notificationRepository.save(n);
        sseEmitterService.sendToUser(recipient.getEmail(), toDTO(saved));
    }

    private String resolveActorName(String actorEmail) {
        if (actorEmail == null) return "System";
        return userRepository.findByEmail(actorEmail)
                .map(User::getName).orElse(actorEmail);
    }

    private NotificationDTO toDTO(Notification n) {
        return NotificationDTO.builder()
                .id(n.getId())
                .title(n.getTitle())
                .message(n.getMessage())
                .isRead(n.isRead())
                .eventType(n.getEventType())
                .actorName(n.getActorName())
                .createdAt(n.getCreatedAt())
                .build();
    }
}