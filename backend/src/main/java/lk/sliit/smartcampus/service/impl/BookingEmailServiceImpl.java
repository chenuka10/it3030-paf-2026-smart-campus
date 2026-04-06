package lk.sliit.smartcampus.service.impl;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lk.sliit.smartcampus.entity.Booking;
import lk.sliit.smartcampus.service.BookingEmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class BookingEmailServiceImpl implements BookingEmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String fromEmail;

    @Value("${app.frontend-base-url}")
    private String frontendBaseUrl;

    @Override
    public void sendApprovedBookingEmail(Booking booking, byte[] qrCodeBytes) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");

            String resourceName = booking.getResource().getName();
            String bookedDate = booking.getBookingDate().format(dateFormatter);
            String startTime = booking.getStartTime().format(timeFormatter);
            String endTime = booking.getEndTime().format(timeFormatter);
            String purpose = booking.getPurpose() != null ? booking.getPurpose() : "N/A";
            String userName = booking.getUser().getName() != null ? booking.getUser().getName() : "User";

            String qrInfoUrl = frontendBaseUrl + "/bookings/" + booking.getId();

            String html = """
                    <html>
                    <body style="font-family: Arial, sans-serif;">
                        <h2>Booking Approved</h2>
                        <p>Hello %s,</p>
                        <p>Your booking has been <b>approved</b>.</p>

                        <h3>Booking Details</h3>
                        <ul>
                            <li><b>Booking ID:</b> %d</li>
                            <li><b>Resource:</b> %s</li>
                            <li><b>Date:</b> %s</li>
                            <li><b>Time:</b> %s - %s</li>
                            <li><b>Purpose:</b> %s</li>
                            <li><b>Status:</b> %s</li>
                        </ul>

                        <p>Please use the attached QR code when entering the venue.</p>
                        <p>You can also view the booking here: <a href="%s">%s</a></p>

                        <p>Smart Campus System</p>
                    </body>
                    </html>
                    """.formatted(
                    userName,
                    booking.getId(),
                    resourceName,
                    bookedDate,
                    startTime,
                    endTime,
                    purpose,
                    booking.getStatus().name(),
                    qrInfoUrl,
                    qrInfoUrl
            );

            helper.setFrom(fromEmail);
            helper.setTo(booking.getUser().getEmail());
            helper.setSubject("Booking Approved - " + resourceName);
            helper.setText(html, true);

            helper.addAttachment(
                    "booking-" + booking.getId() + "-qr.png",
                    new ByteArrayResource(qrCodeBytes)
            );

            mailSender.send(message);

        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send booking approval email", e);
        }
    }
}