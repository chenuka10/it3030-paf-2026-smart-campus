package lk.sliit.smartcampus.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "resources")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Resource {

    public enum ResourceType {
        LECTURE_ROOM,
        LAB,
        MEETING_ROOM,
        EQUIPMENT,
        SPORTS,
        EVENT_SPACE
    }

    public enum ResourceStatus {
        ACTIVE,
        OUT_OF_SERVICE
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ResourceType type;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String location;

    @Column
    private Integer capacity;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ResourceStatus status = ResourceStatus.ACTIVE;

    // ✅ FIXED TIME FORMAT
    @JsonFormat(pattern = "HH:mm")
    @Column(name = "available_from", nullable = false)
    private LocalTime availableFrom;

    @JsonFormat(pattern = "HH:mm")
    @Column(name = "available_to", nullable = false)
    private LocalTime availableTo;

    @Column(name = "max_booking_hours", nullable = false)
    private Integer maxBookingHours;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;

        if (this.status == null) {
            this.status = ResourceStatus.ACTIVE;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}