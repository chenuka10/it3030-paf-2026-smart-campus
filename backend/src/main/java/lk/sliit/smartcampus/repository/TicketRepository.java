package lk.sliit.smartcampus.repository;

import lk.sliit.smartcampus.entity.Ticket;
import lk.sliit.smartcampus.entity.TicketStatus;
import lk.sliit.smartcampus.entity.TicketPriority;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {
    
    List<Ticket> findByCreatedBy(Long userId);
    
    List<Ticket> findByStatus(TicketStatus status);
    
    List<Ticket> findByPriority(TicketPriority priority);
    
    List<Ticket> findByAssignedTechnicianId(Long technicianId);
    
    @Query("SELECT t FROM Ticket t WHERE " +
           "(:status IS NULL OR t.status = :status) AND " +
           "(:priority IS NULL OR t.priority = :priority) AND " +
           "(:assignedTechnicianId IS NULL OR t.assignedTechnicianId = :assignedTechnicianId)")
    List<Ticket> findByFilters(
        @Param("status") TicketStatus status,
        @Param("priority") TicketPriority priority,
        @Param("assignedTechnicianId") Long assignedTechnicianId
    );
}