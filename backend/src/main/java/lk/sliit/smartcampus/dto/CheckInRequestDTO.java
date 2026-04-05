package lk.sliit.smartcampus.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CheckInRequestDTO {

    @NotBlank(message = "QR token is required")
    private String qrToken;
}