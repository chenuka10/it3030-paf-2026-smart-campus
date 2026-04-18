package lk.sliit.smartcampus.service.impl;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityNotFoundException;
import lk.sliit.smartcampus.dto.BookingResponseDTO;
import lk.sliit.smartcampus.dto.CheckInResponseDTO;
import lk.sliit.smartcampus.dto.CreateBookingRequest;
import lk.sliit.smartcampus.dto.ResourceUtilizationAnalyticsDTO;
import lk.sliit.smartcampus.entity.Booking;
import lk.sliit.smartcampus.entity.BookingParticipant;
import lk.sliit.smartcampus.entity.Resource;
import lk.sliit.smartcampus.entity.User;
import lk.sliit.smartcampus.repository.BookingParticipantRepository;
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

    private final BookingParticipantRepository bookingParticipantRepository;
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

        List<Long> cleanParticipantIds = sanitizeParticipantIds(request.getParticipantIds(), bookingOwner.getId());
        List<User> participants = getUsersByIds(cleanParticipantIds);

        int attendeesCount = 1 + participants.size();
        validateCapacity(resource, attendeesCount);

        Booking booking = Booking.builder()
                .resource(resource)
                .user(bookingOwner)
                .bookingDate(request.getBookingDate())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .purpose(request.getPurpose())
                .attendeesCount(attendeesCount)
                .status(Booking.BookingStatus.PENDING)
                .build();

        Booking savedBooking = bookingRepository.save(booking);

        List<BookingParticipant> bookingParticipants = participants.stream()
                .map(user -> BookingParticipant.builder()
                        .booking(savedBooking)
                        .user(user)
                        .build())
                .toList();

        bookingParticipantRepository.saveAll(bookingParticipants);
        savedBooking.setParticipants(bookingParticipants);

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
            Booking.BookingStatus bookingStatus = Booking.BookingStatus.valueOf(status.toUpperCase());
            bookings = bookingRepository.findByStatusOrderByCreatedAtDesc(bookingStatus);
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

        // force immediate DB write
        Booking savedBooking = bookingRepository.saveAndFlush(booking);

        Booking debugBooking = bookingRepository.findById(bookingId).orElseThrow();
        System.out.println("DEBUG TOKEN FROM DB: " + debugBooking.getQrToken());

        String qrPayload = "BOOKING_TOKEN:" + savedBooking.getQrToken();
        byte[] qrCodeBytes = qrCodeService.generateQrCode(qrPayload, 300, 300);

        try {
            bookingEmailService.sendApprovedBookingEmail(savedBooking, qrCodeBytes);
            savedBooking.setQrEmailSentAt(LocalDateTime.now());
            savedBooking = bookingRepository.saveAndFlush(savedBooking);
        } catch (Exception e) {
            // keep approval and token saved even if email sending fails
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
    @Transactional(readOnly = true)
    public ResourceUtilizationAnalyticsDTO getResourceUtilizationAnalytics(int days) {
        int safeDays = Math.max(1, Math.min(days, 365));
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(safeDays - 1L);

        List<Resource> allResources = resourceRepository.findAll();
        List<Resource> activeResources = allResources.stream()
                .filter(resource -> resource.getStatus() == Resource.ResourceStatus.ACTIVE)
                .toList();
        Map<Long, Resource> resourceById = allResources.stream()
                .collect(Collectors.toMap(Resource::getId, resource -> resource));

        List<Booking> bookingsInRange = bookingRepository.findAll().stream()
                .filter(booking -> !booking.getBookingDate().isBefore(startDate) && !booking.getBookingDate().isAfter(endDate))
                .toList();

        List<Booking> approvedBookings = bookingsInRange.stream()
                .filter(booking -> booking.getStatus() == Booking.BookingStatus.APPROVED)
                .toList();

        double totalBookedHours = roundHours(approvedBookings.stream()
                .mapToDouble(this::getBookingDurationHours)
                .sum());

        double totalBookableHours = activeResources.stream()
                .mapToDouble(resource -> getResourceBookableHours(resource) * safeDays)
                .sum();

        Map<Long, List<Booking>> bookingsByResource = bookingsInRange.stream()
                .collect(Collectors.groupingBy(booking -> booking.getResource().getId()));

        List<ResourceUtilizationAnalyticsDTO.ResourceUtilization> topResources = bookingsByResource.entrySet().stream()
                .map(entry -> buildResourceUtilization(resourceById.get(entry.getKey()), entry.getValue(), safeDays))
                .filter(Objects::nonNull)
                .sorted(Comparator.comparingDouble(ResourceUtilizationAnalyticsDTO.ResourceUtilization::getBookedHours).reversed()
                        .thenComparingLong(ResourceUtilizationAnalyticsDTO.ResourceUtilization::getBookingCount).reversed())
                .limit(6)
                .toList();

        List<ResourceUtilizationAnalyticsDTO.ResourceUtilization> underutilizedResources = activeResources.stream()
                .map(resource -> buildResourceUtilization(
                        resource,
                        bookingsByResource.getOrDefault(resource.getId(), Collections.emptyList()),
                        safeDays))
                .filter(Objects::nonNull)
                .sorted(Comparator.comparingDouble(ResourceUtilizationAnalyticsDTO.ResourceUtilization::getUtilizationRate)
                        .thenComparingLong(ResourceUtilizationAnalyticsDTO.ResourceUtilization::getBookingCount)
                        .thenComparing(ResourceUtilizationAnalyticsDTO.ResourceUtilization::getResourceName))
                .limit(6)
                .toList();

        List<ResourceUtilizationAnalyticsDTO.TypeUtilization> typeBreakdown = allResources.stream()
                .collect(Collectors.groupingBy(resource -> resource.getType().name()))
                .entrySet().stream()
                .map(entry -> buildTypeUtilization(entry.getKey(), entry.getValue(), approvedBookings, safeDays))
                .sorted(Comparator.comparingDouble(ResourceUtilizationAnalyticsDTO.TypeUtilization::getBookedHours).reversed())
                .toList();

        List<ResourceUtilizationAnalyticsDTO.StatusBreakdown> statusBreakdown = bookingsInRange.stream()
                .collect(Collectors.groupingBy(booking -> booking.getStatus().name(), Collectors.counting()))
                .entrySet().stream()
                .map(entry -> new ResourceUtilizationAnalyticsDTO.StatusBreakdown(entry.getKey(), entry.getValue()))
                .sorted(Comparator.comparingLong(ResourceUtilizationAnalyticsDTO.StatusBreakdown::getBookingCount).reversed())
                .toList();

        List<ResourceUtilizationAnalyticsDTO.HourlyDistribution> hourlyDistribution = buildHourlyDistribution(approvedBookings);
        List<ResourceUtilizationAnalyticsDTO.DailyTrend> dailyTrend = buildDailyTrend(startDate, endDate, bookingsInRange);

        long totalBookings = bookingsInRange.size();
        long approvedCount = approvedBookings.size();
        long pendingCount = bookingsInRange.stream()
                .filter(booking -> booking.getStatus() == Booking.BookingStatus.PENDING)
                .count();
        long resourcesUsed = approvedBookings.stream()
                .map(booking -> booking.getResource().getId())
                .distinct()
                .count();

        return new ResourceUtilizationAnalyticsDTO(
                new ResourceUtilizationAnalyticsDTO.Summary(
                        totalBookings,
                        approvedCount,
                        pendingCount,
                        calculatePercentage(approvedCount, totalBookings),
                        totalBookedHours,
                        calculatePercentage(totalBookedHours, totalBookableHours),
                        activeResources.size(),
                        resourcesUsed),
                topResources,
                underutilizedResources,
                typeBreakdown,
                statusBreakdown,
                hourlyDistribution,
                dailyTrend);
    }

    @Override
    public CheckInResponseDTO checkIn(String qrToken) {
        Booking booking = bookingRepository.findByQrToken(qrToken)
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

    private List<Long> sanitizeParticipantIds(List<Long> participantIds, Long bookingOwnerId) {
        if (participantIds == null) {
            return Collections.emptyList();
        }

        return participantIds.stream()
                .filter(Objects::nonNull)
                .filter(id -> !id.equals(bookingOwnerId))
                .distinct()
                .toList();
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

    private List<User> getUsersByIds(List<Long> ids) {
        if (ids.isEmpty()) {
            return Collections.emptyList();
        }

        List<User> users = userRepository.findAllById(ids);

        if (users.size() != ids.size()) {
            throw new EntityNotFoundException("One or more participant users were not found");
        }

        return users;
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
        List<Long> participantIds = bookingParticipantRepository.findByBookingId(booking.getId())
                .stream()
                .map(bp -> bp.getUser().getId())
                .collect(Collectors.toList());

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
                .participantIds(participantIds)
                .createdAt(booking.getCreatedAt())
                .updatedAt(booking.getUpdatedAt())
                .build();
    }

    private ResourceUtilizationAnalyticsDTO.ResourceUtilization buildResourceUtilization(
            Resource resource,
            List<Booking> bookings,
            int days) {
        if (resource == null) {
            return null;
        }

        List<Booking> approvedBookings = bookings.stream()
                .filter(booking -> booking.getStatus() == Booking.BookingStatus.APPROVED)
                .toList();

        long bookingCount = bookings.size();
        long approvedCount = approvedBookings.size();
        long pendingCount = bookings.stream().filter(booking -> booking.getStatus() == Booking.BookingStatus.PENDING).count();
        long cancelledCount = bookings.stream()
                .filter(booking -> booking.getStatus() == Booking.BookingStatus.CANCELLED || booking.getStatus() == Booking.BookingStatus.REJECTED)
                .count();

        double bookedHours = roundHours(approvedBookings.stream()
                .mapToDouble(this::getBookingDurationHours)
                .sum());

        double resourceBookableHours = getResourceBookableHours(resource) * days;
        double utilizationRate = calculatePercentage(bookedHours, resourceBookableHours);

        Map<Integer, Long> hourlyCounts = approvedBookings.stream()
                .collect(Collectors.groupingBy(booking -> booking.getStartTime().getHour(), Collectors.counting()));

        String peakHourLabel = hourlyCounts.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(entry -> formatHourLabel(entry.getKey()))
                .orElse("No peak yet");

        String lastBookedAt = bookings.stream()
                .max(Comparator.comparing(this::toBookingDateTime))
                .map(booking -> toBookingDateTime(booking).format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
                .orElse(null);

        return new ResourceUtilizationAnalyticsDTO.ResourceUtilization(
                resource.getId(),
                resource.getName(),
                resource.getType().name(),
                resource.getLocation(),
                resource.getStatus().name(),
                bookingCount,
                approvedCount,
                pendingCount,
                cancelledCount,
                bookedHours,
                utilizationRate,
                peakHourLabel,
                lastBookedAt);
    }

    private ResourceUtilizationAnalyticsDTO.TypeUtilization buildTypeUtilization(
            String resourceType,
            List<Resource> resources,
            List<Booking> approvedBookings,
            int days) {
        List<Long> resourceIds = resources.stream().map(Resource::getId).toList();

        long bookingCount = approvedBookings.stream()
                .filter(booking -> resourceIds.contains(booking.getResource().getId()))
                .count();

        double bookedHours = roundHours(approvedBookings.stream()
                .filter(booking -> resourceIds.contains(booking.getResource().getId()))
                .mapToDouble(this::getBookingDurationHours)
                .sum());

        double totalBookableHours = resources.stream()
                .filter(resource -> resource.getStatus() == Resource.ResourceStatus.ACTIVE)
                .mapToDouble(resource -> getResourceBookableHours(resource) * days)
                .sum();

        return new ResourceUtilizationAnalyticsDTO.TypeUtilization(
                resourceType,
                resources.size(),
                bookingCount,
                bookedHours,
                calculatePercentage(bookedHours, totalBookableHours));
    }

    private List<ResourceUtilizationAnalyticsDTO.HourlyDistribution> buildHourlyDistribution(List<Booking> approvedBookings) {
        Map<Integer, Long> countsByHour = new LinkedHashMap<>();
        for (int hour = 6; hour <= 21; hour++) {
            countsByHour.put(hour, 0L);
        }

        approvedBookings.forEach(booking -> countsByHour.compute(
                booking.getStartTime().getHour(),
                (hour, count) -> (count == null ? 0L : count) + 1));

        return countsByHour.entrySet().stream()
                .map(entry -> new ResourceUtilizationAnalyticsDTO.HourlyDistribution(
                        formatHourLabel(entry.getKey()),
                        entry.getValue()))
                .toList();
    }

    private List<ResourceUtilizationAnalyticsDTO.DailyTrend> buildDailyTrend(
            LocalDate startDate,
            LocalDate endDate,
            List<Booking> bookingsInRange) {
        Map<LocalDate, List<Booking>> bookingsByDate = bookingsInRange.stream()
                .collect(Collectors.groupingBy(Booking::getBookingDate));

        return startDate.datesUntil(endDate.plusDays(1))
                .map(date -> {
                    List<Booking> dayBookings = bookingsByDate.getOrDefault(date, Collections.emptyList());
                    List<Booking> approvedDayBookings = dayBookings.stream()
                            .filter(booking -> booking.getStatus() == Booking.BookingStatus.APPROVED)
                            .toList();

                    return new ResourceUtilizationAnalyticsDTO.DailyTrend(
                            date.toString(),
                            dayBookings.size(),
                            approvedDayBookings.size(),
                            roundHours(approvedDayBookings.stream()
                                    .mapToDouble(this::getBookingDurationHours)
                                    .sum()));
                })
                .toList();
    }

    private double getBookingDurationHours(Booking booking) {
        return Duration.between(booking.getStartTime(), booking.getEndTime()).toMinutes() / 60.0;
    }

    private double getResourceBookableHours(Resource resource) {
        if (resource.getAvailableFrom() == null || resource.getAvailableTo() == null) {
            return 0;
        }

        return Math.max(Duration.between(resource.getAvailableFrom(), resource.getAvailableTo()).toMinutes(), 0) / 60.0;
    }

    private double calculatePercentage(double numerator, double denominator) {
        if (denominator <= 0) {
            return 0;
        }
        return roundHours((numerator / denominator) * 100.0);
    }

    private double roundHours(double value) {
        return Math.round(value * 10.0) / 10.0;
    }

    private LocalDateTime toBookingDateTime(Booking booking) {
        return LocalDateTime.of(booking.getBookingDate(), booking.getStartTime());
    }

    private String formatHourLabel(int hour) {
        LocalTime time = LocalTime.of(hour % 24, 0);
        return time.format(DateTimeFormatter.ofPattern("ha")).toLowerCase();
    }
}
