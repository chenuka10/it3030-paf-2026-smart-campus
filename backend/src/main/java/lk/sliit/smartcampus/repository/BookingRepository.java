package lk.sliit.smartcampus.repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import lk.sliit.smartcampus.entity.Booking;
import lk.sliit.smartcampus.entity.User;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByUserOrderByCreatedAtDesc(User user);

    List<Booking> findAllByOrderByCreatedAtDesc();

    List<Booking> findByStatusOrderByCreatedAtDesc(Booking.BookingStatus status);

    @Query("""
            SELECT b
            FROM Booking b
            WHERE b.resource.id = :resourceId
              AND b.bookingDate = :date
              AND b.status = :status
            ORDER BY b.startTime ASC
            """)
    List<Booking> findByResourceAndDateAndStatus(
            @Param("resourceId") Long resourceId,
            @Param("date") LocalDate date,
            @Param("status") Booking.BookingStatus status
    );

    @Query("""
            SELECT CASE WHEN COUNT(b) > 0 THEN true ELSE false END
            FROM Booking b
            WHERE b.resource.id = :resourceId
              AND b.bookingDate = :bookingDate
              AND b.status IN :statuses
              AND :startTime < b.endTime
              AND :endTime > b.startTime
            """)
    boolean existsOverlappingBooking(
            @Param("resourceId") Long resourceId,
            @Param("bookingDate") LocalDate bookingDate,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime,
            @Param("statuses") List<Booking.BookingStatus> statuses
    );

    @Query("""
            SELECT CASE WHEN COUNT(b) > 0 THEN true ELSE false END
            FROM Booking b
            WHERE b.resource.id = :resourceId
              AND b.bookingDate = :bookingDate
              AND b.status IN :statuses
              AND b.id <> :bookingId
              AND :startTime < b.endTime
              AND :endTime > b.startTime
            """)
    boolean existsOverlappingBookingExcludingId(
            @Param("bookingId") Long bookingId,
            @Param("resourceId") Long resourceId,
            @Param("bookingDate") LocalDate bookingDate,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime,
            @Param("statuses") List<Booking.BookingStatus> statuses
    );

    Optional<Booking> findByQrToken(String qrToken);
}