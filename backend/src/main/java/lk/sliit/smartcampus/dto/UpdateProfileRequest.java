package lk.sliit.smartcampus.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProfileRequest {

    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    private String name;

    @Size(max = 20, message = "Phone number too long")
    private String phone;

    @Size(max = 300, message = "Bio must be under 300 characters")
    private String bio;

    @Size(max = 100, message = "Department name too long")
    private String department;
}