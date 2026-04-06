package lk.sliit.smartcampus.repository;

import lk.sliit.smartcampus.entity.BookingParticipant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BookingParticipantRepository extends JpaRepository<BookingParticipant, Long> {
    List<BookingParticipant> findByBookingId(Long bookingId);
}