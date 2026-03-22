package lk.sliit.smartcampus.service;

import lk.sliit.smartcampus.entity.Booking;

public interface BookingEmailService {
    void sendApprovedBookingEmail(Booking booking, byte[] qrCodeBytes);
}