package lk.sliit.smartcampus.repository;

import lk.sliit.smartcampus.entity.Booking;
import lk.sliit.smartcampus.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByUserOrderByCreatedAtDesc(User user);

    List<Booking> findByStatusOrderByCreatedAtDesc(Booking.BookingStatus status);

    List<Booking> findAllByOrderByCreatedAtDesc();

    @Query("""
        SELECT CASE WHEN COUNT(b) > 0 THEN true ELSE false END
        FROM Booking b
        WHERE b.resource.id = :resourceId
          AND b.bookingDate = :bookingDate
          AND b.status = :status
          AND :startTime < b.endTime
          AND :endTime > b.startTime
    """)
    boolean existsOverlappingBooking(Long resourceId,
                                     LocalDate bookingDate,
                                     LocalTime startTime,
                                     LocalTime endTime,
                                     Booking.BookingStatus status);

    @Query("""
        SELECT b
        FROM Booking b
        WHERE b.resource.id = :resourceId
          AND b.bookingDate = :bookingDate
          AND b.status = :status
        ORDER BY b.startTime ASC
    """)
    List<Booking> findByResourceAndDateAndStatus(Long resourceId,
                                                 LocalDate bookingDate,
                                                 Booking.BookingStatus status);
}