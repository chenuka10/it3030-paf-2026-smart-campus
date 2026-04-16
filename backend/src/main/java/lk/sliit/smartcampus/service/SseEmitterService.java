package lk.sliit.smartcampus.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lk.sliit.smartcampus.dto.NotificationDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class SseEmitterService {

    // One emitter per connected user (email → emitter)
    private final Map<String, SseEmitter> emitters = new ConcurrentHashMap<>();
    private final ObjectMapper mapper;

    public SseEmitterService() {
        this.mapper = new ObjectMapper();
        this.mapper.registerModule(new JavaTimeModule());
    }

    public SseEmitter createEmitter(String email) {
        // 30-minute timeout; frontend reconnects on expiry
        SseEmitter emitter = new SseEmitter(30 * 60 * 1000L);

        emitter.onCompletion(() -> {
            emitters.remove(email);
            log.debug("SSE completed for {}", email);
        });
        emitter.onTimeout(() -> {
            emitters.remove(email);
            log.debug("SSE timed out for {}", email);
        });
        emitter.onError(e -> {
            emitters.remove(email);
            log.debug("SSE error for {}: {}", email, e.getMessage());
        });

        emitters.put(email, emitter);

        // Send an initial ping so the browser knows the connection is alive
        try {
            emitter.send(SseEmitter.event().name("CONNECTED").data("connected"));
        } catch (IOException e) {
            emitters.remove(email);
        }

        return emitter;
    }

    /**
     * Push a notification to a specific user.
     */
    public void sendToUser(String email, NotificationDTO dto) {
        SseEmitter emitter = emitters.get(email);
        if (emitter == null) return;
        try {
            String json = mapper.writeValueAsString(dto);
            emitter.send(SseEmitter.event().name("NOTIFICATION").data(json));
        } catch (IOException e) {
            emitters.remove(email);
            log.debug("Failed to send SSE to {}, removing emitter", email);
        }
    }

    /**
     * Broadcast a notification to ALL connected users (e.g. admin-wide events).
     */
    public void broadcast(NotificationDTO dto) {
        emitters.forEach((email, emitter) -> sendToUser(email, dto));
    }

    /**
     * Push to all ADMIN users only.
     */
    public void sendToAdmins(NotificationDTO dto, java.util.Set<String> adminEmails) {
        adminEmails.forEach(email -> sendToUser(email, dto));
    }
}