package lk.sliit.smartcampus.repository;

import lk.sliit.smartcampus.entity.Resource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResourceRepository extends JpaRepository<Resource, Long> {

    List<Resource> findByStatus(Resource.ResourceStatus status);

    List<Resource> findByType(Resource.ResourceType type);

    List<Resource> findByTypeAndStatus(Resource.ResourceType type, Resource.ResourceStatus status);

    List<Resource> findByLocationContainingIgnoreCase(String location);

    List<Resource> findByCapacityGreaterThanEqual(Integer capacity);
}