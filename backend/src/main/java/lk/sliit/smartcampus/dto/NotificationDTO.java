package lk.sliit.smartcampus.dto;

import lk.sliit.smartcampus.entity.NotificationEvent;
import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationDTO {
    private Long id;
    private String title;
    private String message;
    private boolean isRead;
    private NotificationEvent eventType;
    private String actorName;
    private LocalDateTime createdAt;
}