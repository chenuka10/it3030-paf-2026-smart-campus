package lk.sliit.smartcampus.service.impl;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityNotFoundException;
import lk.sliit.smartcampus.dto.BookingResponseDTO;
import lk.sliit.smartcampus.dto.CheckInResponseDTO;
import lk.sliit.smartcampus.dto.CreateBookingRequest;
import lk.sliit.smartcampus.entity.Booking;
import lk.sliit.smartcampus.entity.Resource;
import lk.sliit.smartcampus.entity.User;
import lk.sliit.smartcampus.repository.BookingRepository;
import lk.sliit.smartcampus.repository.ResourceRepository;
import lk.sliit.smartcampus.repository.UserRepository;
import lk.sliit.smartcampus.service.BookingEmailService;
import lk.sliit.smartcampus.service.BookingService;
import lk.sliit.smartcampus.service.QrCodeService;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class BookingServiceImpl implements BookingService {

    private final ResourceRepository resourceRepository;
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final QrCodeService qrCodeService;
    private final BookingEmailService bookingEmailService;

    @Override
    public BookingResponseDTO createBooking(CreateBookingRequest request, String userEmail) {
        User bookingOwner = getUserByEmail(userEmail);
        Resource resource = getResourceById(request.getResourceId());

        validateBookingRequest(request, resource);
        validateCreateConflict(request, resource);
        validateCapacity(resource, request.getAttendeesCount());

        Booking booking = Booking.builder()
                .resource(resource)
                .user(bookingOwner)
                .bookingDate(request.getBookingDate())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .purpose(request.getPurpose())
                .attendeesCount(request.getAttendeesCount())
                .status(Booking.BookingStatus.PENDING)
                .build();

        Booking savedBooking = bookingRepository.save(booking);

        return mapToResponse(savedBooking);
    }

    @Override
    public BookingResponseDTO updateBooking(Long bookingId, CreateBookingRequest request, String userEmail) {
        Booking booking = getBookingEntityById(bookingId);

        if (!booking.getUser().getEmail().equals(userEmail)) {
            throw new AccessDeniedException("You are not allowed to edit this booking");
        }

        if (booking.getStatus() != Booking.BookingStatus.PENDING) {
            throw new IllegalStateException("Only pending bookings can be edited");
        }

        if (Boolean.TRUE.equals(booking.getCheckedIn())) {
            throw new IllegalStateException("Checked-in bookings cannot be edited");
        }

        Resource resource = getResourceById(request.getResourceId());

        validateBookingRequest(request, resource);
        validateUpdateConflict(bookingId, request, resource);
        validateCapacity(resource, request.getAttendeesCount());

        booking.setResource(resource);
        booking.setBookingDate(request.getBookingDate());
        booking.setStartTime(request.getStartTime());
        booking.setEndTime(request.getEndTime());
        booking.setPurpose(request.getPurpose());
        booking.setAttendeesCount(request.getAttendeesCount());

        Booking savedBooking = bookingRepository.save(booking);

        return mapToResponse(savedBooking);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponseDTO> getMyBookings(String userEmail) {
        User user = getUserByEmail(userEmail);
        return bookingRepository.findByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public BookingResponseDTO getBookingById(Long bookingId, String userEmail, boolean isAdmin) {
        Booking booking = getBookingEntityById(bookingId);

        if (!isAdmin && !booking.getUser().getEmail().equals(userEmail)) {
            throw new AccessDeniedException("You are not allowed to view this booking");
        }

        return mapToResponse(booking);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponseDTO> getAllBookings(String status) {
        List<Booking> bookings;

        if (status == null || status.isBlank()) {
            bookings = bookingRepository.findAllByOrderByCreatedAtDesc();
        } else {
            try {
                Booking.BookingStatus bookingStatus = Booking.BookingStatus.valueOf(status.toUpperCase());
                bookings = bookingRepository.findByStatusOrderByCreatedAtDesc(bookingStatus);
            } catch (IllegalArgumentException ex) {
                throw new IllegalArgumentException("Invalid booking status: " + status);
            }
        }

        return bookings.stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public BookingResponseDTO approveBooking(Long bookingId) {
        Booking booking = getBookingEntityById(bookingId);

        if (booking.getStatus() != Booking.BookingStatus.PENDING) {
            throw new IllegalStateException("Only pending bookings can be approved");
        }

        validateApprovedConflict(booking);

        booking.setStatus(Booking.BookingStatus.APPROVED);

        String qrToken = UUID.randomUUID().toString();
        booking.setQrToken(qrToken);
        booking.setQrGeneratedAt(LocalDateTime.now());

        Booking savedBooking = bookingRepository.saveAndFlush(booking);

        String qrPayload = "BOOKING_TOKEN:" + savedBooking.getQrToken();
        byte[] qrCodeBytes = qrCodeService.generateQrCode(qrPayload, 300, 300);

        try {
            bookingEmailService.sendApprovedBookingEmail(savedBooking, qrCodeBytes);
            savedBooking.setQrEmailSentAt(LocalDateTime.now());
            savedBooking = bookingRepository.saveAndFlush(savedBooking);
        } catch (Exception e) {
            System.err.println("Failed to send booking approval email: " + e.getMessage());
        }

        return mapToResponse(savedBooking);
    }

    @Override
    public BookingResponseDTO rejectBooking(Long bookingId, String reason) {
        Booking booking = getBookingEntityById(bookingId);

        if (booking.getStatus() != Booking.BookingStatus.PENDING) {
            throw new IllegalStateException("Only pending bookings can be rejected");
        }

        booking.setStatus(Booking.BookingStatus.REJECTED);
        booking.setAdminReason(reason);

        return mapToResponse(bookingRepository.save(booking));
    }

    @Override
    public BookingResponseDTO cancelBooking(Long bookingId, String userEmail, boolean isAdmin) {
        Booking booking = getBookingEntityById(bookingId);

        if (!isAdmin && !booking.getUser().getEmail().equals(userEmail)) {
            throw new AccessDeniedException("You are not allowed to cancel this booking");
        }

        if (booking.getStatus() == Booking.BookingStatus.REJECTED ||
                booking.getStatus() == Booking.BookingStatus.CANCELLED) {
            throw new IllegalStateException("This booking cannot be cancelled");
        }

        booking.setStatus(Booking.BookingStatus.CANCELLED);

        return mapToResponse(bookingRepository.save(booking));
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponseDTO> getApprovedBookingsForResource(Long resourceId, LocalDate date) {
        return bookingRepository.findByResourceAndDateAndStatus(
                resourceId,
                date,
                Booking.BookingStatus.APPROVED).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public CheckInResponseDTO checkIn(String qrToken) {
        String normalizedToken = normalizeQrToken(qrToken);

        Booking booking = bookingRepository.findByQrToken(normalizedToken)
                .orElseThrow(() -> new EntityNotFoundException("Invalid QR code"));

        if (booking.getStatus() != Booking.BookingStatus.APPROVED) {
            throw new IllegalStateException("Booking is not approved for check-in");
        }

        if (!booking.getBookingDate().equals(LocalDate.now())) {
            throw new IllegalStateException("Booking is not valid for today");
        }

        LocalTime now = LocalTime.now();

        if (now.isBefore(booking.getStartTime()) || now.isAfter(booking.getEndTime())) {
            throw new IllegalStateException("Booking is not valid at this time");
        }

        if (Boolean.TRUE.equals(booking.getCheckedIn())) {
            throw new IllegalStateException("Booking has already been checked in");
        }

        booking.setCheckedIn(true);
        booking.setCheckedInAt(LocalDateTime.now());

        Booking savedBooking = bookingRepository.save(booking);

        return CheckInResponseDTO.builder()
                .message("Check-in successful")
                .bookingId(savedBooking.getId())
                .resourceName(savedBooking.getResource().getName())
                .userEmail(savedBooking.getUser().getEmail())
                .bookingDate(savedBooking.getBookingDate())
                .startTime(savedBooking.getStartTime())
                .endTime(savedBooking.getEndTime())
                .checkedIn(savedBooking.getCheckedIn())
                .checkedInAt(savedBooking.getCheckedInAt())
                .build();
    }

    private String normalizeQrToken(String qrToken) {
        if (qrToken == null || qrToken.isBlank()) {
            throw new IllegalArgumentException("QR token is required");
        }

        String cleaned = qrToken.trim();

        if (cleaned.startsWith("BOOKING_TOKEN:")) {
            cleaned = cleaned.substring("BOOKING_TOKEN:".length()).trim();
        }

        return cleaned;
    }

    private void validateBookingRequest(CreateBookingRequest request, Resource resource) {
        if (resource.getStatus() != Resource.ResourceStatus.ACTIVE) {
            throw new IllegalStateException("Resource is not available for booking");
        }

        if (request.getBookingDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Booking date cannot be in the past");
        }

        if (!request.getStartTime().isBefore(request.getEndTime())) {
            throw new IllegalArgumentException("Start time must be before end time");
        }

        if (request.getStartTime().isBefore(resource.getAvailableFrom()) ||
                request.getEndTime().isAfter(resource.getAvailableTo())) {
            throw new IllegalArgumentException("Booking time is outside the resource availability window");
        }

        long durationMinutes = Duration.between(request.getStartTime(), request.getEndTime()).toMinutes();

        if (durationMinutes <= 0) {
            throw new IllegalArgumentException("Booking duration must be greater than zero");
        }

        if (resource.getMaxBookingHours() != null &&
                durationMinutes > resource.getMaxBookingHours() * 60L) {
            throw new IllegalArgumentException("Booking exceeds the maximum allowed hours for this resource");
        }
    }

    private void validateCapacity(Resource resource, int attendeesCount) {
        if (resource.getCapacity() != null && attendeesCount > resource.getCapacity()) {
            throw new IllegalArgumentException("Attendee count exceeds resource capacity");
        }
    }

    private void validateApprovedConflict(Booking booking) {
        boolean hasConflict = bookingRepository.existsOverlappingBooking(
                booking.getResource().getId(),
                booking.getBookingDate(),
                booking.getStartTime(),
                booking.getEndTime(),
                List.of(Booking.BookingStatus.APPROVED));

        if (hasConflict) {
            throw new IllegalStateException("This booking conflicts with an already approved booking");
        }
    }

    private void validateCreateConflict(CreateBookingRequest request, Resource resource) {
        boolean hasConflict = bookingRepository.existsOverlappingBooking(
                resource.getId(),
                request.getBookingDate(),
                request.getStartTime(),
                request.getEndTime(),
                List.of(
                        Booking.BookingStatus.PENDING,
                        Booking.BookingStatus.APPROVED));

        if (hasConflict) {
            throw new IllegalStateException("This resource is already booked for the selected time range");
        }
    }

    private void validateUpdateConflict(Long bookingId, CreateBookingRequest request, Resource resource) {
        boolean hasConflict = bookingRepository.existsOverlappingBookingExcludingId(
                bookingId,
                resource.getId(),
                request.getBookingDate(),
                request.getStartTime(),
                request.getEndTime(),
                List.of(
                        Booking.BookingStatus.PENDING,
                        Booking.BookingStatus.APPROVED));

        if (hasConflict) {
            throw new IllegalStateException("This resource is already booked for the selected time range");
        }
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
    }

    private Resource getResourceById(Long resourceId) {
        return resourceRepository.findById(resourceId)
                .orElseThrow(() -> new EntityNotFoundException("Resource not found"));
    }

    private Booking getBookingEntityById(Long bookingId) {
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new EntityNotFoundException("Booking not found"));
    }

    private BookingResponseDTO mapToResponse(Booking booking) {
        return BookingResponseDTO.builder()
                .id(booking.getId())
                .resourceId(booking.getResource().getId())
                .resourceName(booking.getResource().getName())
                .userId(booking.getUser().getId())
                .userEmail(booking.getUser().getEmail())
                .bookingDate(booking.getBookingDate())
                .startTime(booking.getStartTime())
                .endTime(booking.getEndTime())
                .purpose(booking.getPurpose())
                .attendeesCount(booking.getAttendeesCount())
                .status(booking.getStatus())
                .adminReason(booking.getAdminReason())
                .createdAt(booking.getCreatedAt())
                .updatedAt(booking.getUpdatedAt())
                .checkedIn(booking.getCheckedIn())
                .checkedInAt(booking.getCheckedInAt())
                .qrToken(booking.getQrToken())
                .build();
    }
}