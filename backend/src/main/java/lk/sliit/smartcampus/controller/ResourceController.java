package lk.sliit.smartcampus.controller;

import lk.sliit.smartcampus.entity.Resource;
import lk.sliit.smartcampus.repository.ResourceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/resources")
@CrossOrigin(origins = "http://localhost:5173") // match your React dev port
public class ResourceController {

    @Autowired
    private ResourceRepository resourceRepository;

    @GetMapping
    public List<Resource> getAllResources(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String location
    ) {
        List<Resource> resources = resourceRepository.findAll();
        if (type != null && !type.isEmpty()) {
            resources = resources.stream()
                    .filter(r -> r.getType().name().equalsIgnoreCase(type))
                    .toList();
        }
        if (location != null && !location.isEmpty()) {
            resources = resources.stream()
                    .filter(r -> r.getLocation().toLowerCase().contains(location.toLowerCase()))
                    .toList();
        }
        return resources;
    }

    @GetMapping("/{id}")
    public Resource getResourceById(@PathVariable Long id) {
        return resourceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Resource not found"));
    }

    @PostMapping
    public Resource createResource(@RequestBody Resource resource) {
        return resourceRepository.save(resource);
    }

    @PutMapping("/{id}")
    public Resource updateResource(@PathVariable Long id, @RequestBody Resource updated) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Resource not found"));

        resource.setName(updated.getName());
        resource.setType(updated.getType());
        resource.setDescription(updated.getDescription());
        resource.setLocation(updated.getLocation());
        resource.setCapacity(updated.getCapacity());
        resource.setStatus(updated.getStatus());
        resource.setAvailableFrom(updated.getAvailableFrom());
        resource.setAvailableTo(updated.getAvailableTo());
        resource.setMaxBookingHours(updated.getMaxBookingHours());

        return resourceRepository.save(resource);
    }

    @DeleteMapping("/{id}")
    public void deleteResource(@PathVariable Long id) {
        resourceRepository.deleteById(id);
    }
}