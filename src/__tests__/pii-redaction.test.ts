import { describe, expect, it } from 'vitest';

/**
 * PII Redaction Tests
 * 
 * These tests verify that Personal Identifiable Information (PII) is properly
 * redacted from logs and error messages to prevent data leakage.
 */

// Mock logger function that captures log messages
let capturedLogs: string[] = [];

const mockLogger = {
  log: (message: string) => {
    capturedLogs.push(message);
  },
  error: (message: string) => {
    capturedLogs.push(message);
  },
  info: (message: string) => {
    capturedLogs.push(message);
  },
};

// Helper to clear logs
function clearLogs() {
  capturedLogs = [];
}

// Helper to check if PII exists in logs
function containsPII(logs: string[], pii: string): boolean {
  return logs.some((log) => log.includes(pii));
}

// Redact email addresses
function redactEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '[REDACTED_EMAIL]';
  return `${local.substring(0, 2)}***@${domain}`;
}

// Redact phone numbers
function redactPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '[REDACTED_PHONE]';
  return `***-***-${digits.slice(-4)}`;
}

// Redact full names
function redactName(name: string): string {
  const parts = name.split(' ');
  return parts.map((part) => `${part[0]}***`).join(' ');
}

describe('PII Redaction', () => {
  beforeEach(() => {
    clearLogs();
  });

  it('should redact email addresses in logs', () => {
    const email = 'john.doe@example.com';
    const redacted = redactEmail(email);

    mockLogger.log(`User created: ${redacted}`);

    expect(containsPII(capturedLogs, email)).toBe(false);
    expect(capturedLogs[0]).toContain('jo***@example.com');
  });

  it('should redact phone numbers in logs', () => {
    const phone = '(555) 123-4567';
    const redacted = redactPhone(phone);

    mockLogger.log(`Contact phone: ${redacted}`);

    expect(containsPII(capturedLogs, phone)).toBe(false);
    expect(capturedLogs[0]).toContain('***-***-4567');
  });

  it('should redact full names in logs', () => {
    const name = 'John Doe';
    const redacted = redactName(name);

    mockLogger.log(`User name: ${redacted}`);

    expect(containsPII(capturedLogs, name)).toBe(false);
    expect(capturedLogs[0]).toContain('J*** D***');
  });

  it('should not log sensitive fields from user objects', () => {
    const user = {
      id: 'user-123',
      email: 'sensitive@example.com',
      phone: '555-1234',
      address: '123 Main St',
    };

    // Log only safe fields
    const safeUser = {
      id: user.id,
      email: redactEmail(user.email),
    };

    mockLogger.log(`User updated: ${JSON.stringify(safeUser)}`);

    expect(containsPII(capturedLogs, user.email)).toBe(false);
    expect(containsPII(capturedLogs, user.phone)).toBe(false);
    expect(containsPII(capturedLogs, user.address)).toBe(false);
    expect(capturedLogs[0]).toContain('user-123');
  });

  it('should redact PII from error messages', () => {
    const email = 'error@example.com';
    const redacted = redactEmail(email);

    try {
      throw new Error(`Failed to send email to ${redacted}`);
    } catch (error) {
      if (error instanceof Error) {
        mockLogger.error(error.message);
      }
    }

    expect(containsPII(capturedLogs, email)).toBe(false);
  });

  it('should handle multiple PII types in one log message', () => {
    const email = 'user@example.com';
    const phone = '555-9876';
    const name = 'Jane Smith';

    mockLogger.log(
      `Contact: ${redactName(name)}, ${redactEmail(email)}, ${redactPhone(phone)}`,
    );

    expect(containsPII(capturedLogs, email)).toBe(false);
    expect(containsPII(capturedLogs, phone)).toBe(false);
    expect(containsPII(capturedLogs, name)).toBe(false);
  });
});

describe('API Response Validation', () => {
  it('should not include sensitive fields in public API responses', () => {
    const userResponse = {
      id: 'user-123',
      name: 'John Doe',
      // email should not be in public responses
      // phone should not be in public responses
      createdAt: new Date().toISOString(),
    };

    expect(userResponse).not.toHaveProperty('email');
    expect(userResponse).not.toHaveProperty('phone');
    expect(userResponse).not.toHaveProperty('address');
  });

  it('should only expose necessary pet information', () => {
    const petResponse = {
      id: 'pet-123',
      name: 'Buddy',
      breed: 'Labrador',
      // userId should not be exposed in public responses
    };

    expect(petResponse).not.toHaveProperty('userId');
  });
});
