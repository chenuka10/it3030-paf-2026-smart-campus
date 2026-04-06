package lk.sliit.smartcampus.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CheckInResponseDTO {

    private String message;
    private Long bookingId;
    private String resourceName;
    private String userEmail;
    private LocalDate bookingDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private Boolean checkedIn;
    private LocalDateTime checkedInAt;
}