// ─────────────────────────────────────────────────────────────────────────────
// Validation utilities for SmartCampus user forms
// ─────────────────────────────────────────────────────────────────────────────

const EMAIL_RE    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE    = /^[+]?[\d\s\-().]{7,20}$/;   // international-friendly
const NAME_MIN    = 2;
const NAME_MAX    = 100;
const DEPT_MAX    = 100;
const BIO_MAX     = 300;

// ── Individual field validators ───────────────────────────────────────────────

export function validateName(name) {
  if (!name?.trim())              return 'Name is required';
  if (name.trim().length < NAME_MIN) return `Name must be at least ${NAME_MIN} characters`;
  if (name.trim().length > NAME_MAX) return `Name must be under ${NAME_MAX} characters`;
  return null;
}

export function validateEmail(email) {
  if (!email?.trim())             return 'Email is required';
  if (!EMAIL_RE.test(email.trim())) return 'Enter a valid email address';
  return null;
}

export function validatePhone(phone) {
  if (!phone || phone.trim() === '') return null; // optional field
  if (!PHONE_RE.test(phone.trim()))  return 'Enter a valid phone number (e.g. +94 77 123 4567)';
  return null;
}

export function validateDepartment(department) {
  if (!department || department.trim() === '') return null; // optional
  if (department.trim().length > DEPT_MAX)     return `Department must be under ${DEPT_MAX} characters`;
  return null;
}

export function validateBio(bio) {
  if (!bio || bio.trim() === '') return null; // optional
  if (bio.length > BIO_MAX)     return `Bio must be under ${BIO_MAX} characters`;
  return null;
}

export function validateRole(role) {
  const valid = ['USER', 'ADMIN', 'TECHNICIAN'];
  if (!role)               return 'Role is required';
  if (!valid.includes(role)) return `Role must be one of: ${valid.join(', ')}`;
  return null;
}

// ── Composite validators ──────────────────────────────────────────────────────

/**
 * Validate the profile edit form.
 * Returns an object of { fieldName: errorMessage } — empty means valid.
 */
export function validateProfileForm(form) {
  const errors = {};
  const name  = validateName(form.name);
  const phone = validatePhone(form.phone);
  const dept  = validateDepartment(form.department);
  const bio   = validateBio(form.bio);
  if (name)  errors.name       = name;
  if (phone) errors.phone      = phone;
  if (dept)  errors.department = dept;
  if (bio)   errors.bio        = bio;
  return errors;
}

/**
 * Validate the role change — used before showing confirmation dialog.
 */
export function validateRoleChange(currentRole, newRole, isSelf) {
  const errors = {};
  const roleErr = validateRole(newRole);
  if (roleErr) {
    errors.role = roleErr;
    return errors;
  }
  if (currentRole === newRole) errors.role = 'User already has this role';
  if (isSelf) errors.role = 'You cannot change your own role';
  return errors;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns true if the errors object has no keys */
export const isValid = (errors) => Object.keys(errors).length === 0;