package lk.sliit.smartcampus.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String message;
    private boolean isRead;

    @Enumerated(EnumType.STRING)
    private NotificationEvent eventType;

    // Target user (who receives it)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    // Actor (who triggered it — null for system events)
    private String actorEmail;
    private String actorName;

    @CreationTimestamp
    private LocalDateTime createdAt;
}