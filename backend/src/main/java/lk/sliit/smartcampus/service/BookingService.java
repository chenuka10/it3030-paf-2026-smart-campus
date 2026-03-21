package lk.sliit.smartcampus.service;

import lk.sliit.smartcampus.dto.BookingResponseDTO;
import lk.sliit.smartcampus.dto.CreateBookingRequest;

import java.time.LocalDate;
import java.util.List;

public interface BookingService {

    BookingResponseDTO createBooking(CreateBookingRequest request, String userEmail);

    List<BookingResponseDTO> getMyBookings(String userEmail);

    BookingResponseDTO getBookingById(Long bookingId, String userEmail, boolean isAdmin);

    List<BookingResponseDTO> getAllBookings(String status);

    BookingResponseDTO approveBooking(Long bookingId);

    BookingResponseDTO rejectBooking(Long bookingId, String reason);

    BookingResponseDTO cancelBooking(Long bookingId, String userEmail, boolean isAdmin);

    List<BookingResponseDTO> getApprovedBookingsForResource(Long resourceId, LocalDate date);
}