package lk.sliit.smartcampus.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResourceUtilizationAnalyticsDTO {
    private Summary summary;
    private List<ResourceUtilization> topResources;
    private List<ResourceUtilization> underutilizedResources;
    private List<TypeUtilization> typeBreakdown;
    private List<StatusBreakdown> statusBreakdown;
    private List<HourlyDistribution> hourlyDistribution;
    private List<DailyTrend> dailyTrend;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Summary {
        private long totalBookings;
        private long approvedBookings;
        private long pendingBookings;
        private double approvalRate;
        private double bookedHours;
        private double utilizationRate;
        private long activeResources;
        private long resourcesUsed;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResourceUtilization {
        private Long resourceId;
        private String resourceName;
        private String resourceType;
        private String location;
        private String status;
        private long bookingCount;
        private long approvedCount;
        private long pendingCount;
        private long cancelledCount;
        private double bookedHours;
        private double utilizationRate;
        private String peakHourLabel;
        private String lastBookedAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TypeUtilization {
        private String resourceType;
        private long resourceCount;
        private long bookingCount;
        private double bookedHours;
        private double utilizationRate;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatusBreakdown {
        private String status;
        private long bookingCount;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HourlyDistribution {
        private String hourLabel;
        private long bookingCount;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyTrend {
        private String date;
        private long totalBookings;
        private long approvedBookings;
        private double bookedHours;
    }
}
