package lk.sliit.smartcampus.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import lk.sliit.smartcampus.entity.Booking;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BookingResponseDTO {
    private Long id;
    private Long resourceId;
    private String resourceName;
    private Long userId;
    private String userEmail;
    private LocalDate bookingDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String purpose;
    private Integer attendeesCount;
    private Booking.BookingStatus status;
    private String adminReason;
    private List<Long> participantIds;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String qrToken;
    private LocalDateTime qrGeneratedAt;
    private LocalDateTime qrEmailSentAt;
    private Boolean checkedIn;
    private LocalDateTime checkedInAt;
}