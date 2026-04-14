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
  OPEN: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  RESOLVED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-gray-100 text-gray-800',
  REJECTED: 'bg-red-100 text-red-800'
};

// Priority badge colors
export const PRIORITY_COLORS = {
  URGENT: 'bg-red-100 text-red-800',
  HIGH: 'bg-orange-100 text-orange-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  LOW: 'bg-green-100 text-green-800'
};

// Valid status transitions
export const VALID_TRANSITIONS = {
  OPEN: ['IN_PROGRESS', 'REJECTED'],
  IN_PROGRESS: ['RESOLVED', 'REJECTED'],
  RESOLVED: ['CLOSED'],
  CLOSED: [],
  REJECTED: []
};