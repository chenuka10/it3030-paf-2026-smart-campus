// Ticket Status Enum
export const TICKET_STATUS = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
  REJECTED: 'REJECTED'
};

// Ticket Priority Enum
export const TICKET_PRIORITY = {
  URGENT: 'URGENT',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW'
};

// Ticket Category Enum
export const TICKET_CATEGORY = {
  ELECTRICAL: 'ELECTRICAL',
  PLUMBING: 'PLUMBING',
  IT: 'IT',
  FURNITURE: 'FURNITURE',
  CLEANING: 'CLEANING',
  HVAC: 'HVAC',
  OTHER: 'OTHER'
};

// Status badge colors (for Tailwind CSS)
export const STATUS_COLORS = {
  OPEN: 'border border-ui-warn/22 bg-ui-warn/10 text-ui-warn',
  IN_PROGRESS: 'border border-ui-sky/22 bg-ui-sky/12 text-ui-sky',
  RESOLVED: 'border border-ui-green/22 bg-ui-green/12 text-ui-green',
  CLOSED: 'border border-ui-sky/16 bg-ui-sky/6 text-ui-muted',
  REJECTED: 'border border-ui-danger/24 bg-ui-danger/10 text-ui-danger'
};

// Priority badge colors
export const PRIORITY_COLORS = {
  URGENT: 'border border-ui-danger/24 bg-ui-danger/10 text-ui-danger',
  HIGH: 'border border-ui-warn/22 bg-ui-warn/10 text-ui-warn',
  MEDIUM: 'border border-ui-sky/22 bg-ui-sky/12 text-ui-sky',
  LOW: 'border border-ui-green/22 bg-ui-green/12 text-ui-green'
};

// Valid status transitions
export const VALID_TRANSITIONS = {
  OPEN: ['IN_PROGRESS', 'REJECTED'],
  IN_PROGRESS: ['RESOLVED', 'REJECTED'],
  RESOLVED: ['CLOSED'],
  CLOSED: [],
  REJECTED: []
};