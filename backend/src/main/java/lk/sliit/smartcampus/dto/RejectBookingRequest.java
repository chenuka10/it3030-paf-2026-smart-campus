package lk.sliit.smartcampus.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RejectBookingRequest {

    @NotBlank
    private String reason;
}