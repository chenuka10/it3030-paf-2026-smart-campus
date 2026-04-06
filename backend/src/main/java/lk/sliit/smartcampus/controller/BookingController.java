package lk.sliit.smartcampus.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lk.sliit.smartcampus.dto.BookingResponseDTO;
import lk.sliit.smartcampus.dto.CheckInRequestDTO;
import lk.sliit.smartcampus.dto.CheckInResponseDTO;
import lk.sliit.smartcampus.dto.CreateBookingRequest;
import lk.sliit.smartcampus.dto.RejectBookingRequest;
import lk.sliit.smartcampus.service.BookingService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

        private final BookingService bookingService;

        @PostMapping
        @PreAuthorize("isAuthenticated()")
        public ResponseEntity<BookingResponseDTO> createBooking(
                        @Valid @RequestBody CreateBookingRequest request,
                        Authentication authentication) {
                return ResponseEntity.ok(
                                bookingService.createBooking(request, authentication.getName()));
        }

        @GetMapping("/my")
        @PreAuthorize("isAuthenticated()")
        public ResponseEntity<List<BookingResponseDTO>> getMyBookings(
                        Authentication authentication) {
                return ResponseEntity.ok(
                                bookingService.getMyBookings(authentication.getName()));
        }

        @GetMapping("/{bookingId}")
        @PreAuthorize("isAuthenticated()")
        public ResponseEntity<BookingResponseDTO> getBookingById(
                        @PathVariable Long bookingId,
                        Authentication authentication) {
                boolean isAdmin = authentication.getAuthorities().stream()
                                .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));

                return ResponseEntity.ok(
                                bookingService.getBookingById(bookingId, authentication.getName(), isAdmin));
        }

        @PutMapping("/{bookingId}/cancel")
        @PreAuthorize("isAuthenticated()")
        public ResponseEntity<BookingResponseDTO> cancelBooking(
                        @PathVariable Long bookingId,
                        Authentication authentication) {
                boolean isAdmin = authentication.getAuthorities().stream()
                                .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));

                return ResponseEntity.ok(
                                bookingService.cancelBooking(bookingId, authentication.getName(), isAdmin));
        }

        @GetMapping
        @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<List<BookingResponseDTO>> getAllBookings(
                        @RequestParam(required = false) String status) {
                return ResponseEntity.ok(
                                bookingService.getAllBookings(status));
        }

        @PutMapping("/{bookingId}/approve")
        @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<BookingResponseDTO> approveBooking(
                        @PathVariable Long bookingId) {
                return ResponseEntity.ok(
                                bookingService.approveBooking(bookingId));
        }

        @PutMapping("/{bookingId}/reject")
        @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<BookingResponseDTO> rejectBooking(
                        @PathVariable Long bookingId,
                        @Valid @RequestBody RejectBookingRequest request) {
                return ResponseEntity.ok(
                                bookingService.rejectBooking(bookingId, request.getReason()));
        }

        @GetMapping("/resource/{resourceId}/availability")
        @PreAuthorize("isAuthenticated()")
        public ResponseEntity<List<BookingResponseDTO>> getApprovedBookingsForResource(
                        @PathVariable Long resourceId,
                        @RequestParam LocalDate date) {
                return ResponseEntity.ok(
                                bookingService.getApprovedBookingsForResource(resourceId, date));
        }

        @PostMapping("/check-in")
        @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<CheckInResponseDTO> checkIn(@Valid @RequestBody CheckInRequestDTO request) {
                return ResponseEntity.ok(bookingService.checkIn(request.getQrToken()));
        }
}