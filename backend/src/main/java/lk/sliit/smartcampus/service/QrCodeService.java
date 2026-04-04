package lk.sliit.smartcampus.service;

public interface QrCodeService {
    byte[] generateQrCode(String content, int width, int height);
}