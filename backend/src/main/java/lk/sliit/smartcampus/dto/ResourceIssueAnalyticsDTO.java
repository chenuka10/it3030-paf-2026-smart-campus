package lk.sliit.smartcampus.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResourceIssueAnalyticsDTO {
    private Summary summary;
    private List<ResourceInsight> topProblemResources;
    private List<TypeInsight> issuesByResourceType;
    private List<StatusInsight> statusBreakdown;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Summary {
        private long totalTickets;
        private long openTickets;
        private long resolvedTickets;
        private long urgentTickets;
        private long affectedResources;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResourceInsight {
        private Long resourceId;
        private String resourceName;
        private String resourceType;
        private String location;
        private long totalTickets;
        private long openTickets;
        private long urgentTickets;
        private long resolvedTickets;
        private double averageResolutionHours;
        private long riskScore;
        private String lastReportedAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TypeInsight {
        private String resourceType;
        private long ticketCount;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatusInsight {
        private String status;
        private long ticketCount;
    }
}
