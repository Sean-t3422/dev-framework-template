/**
 * Unit Test Template with Proper Mocks
 *
 * This template ensures unit tests NEVER call real services
 * All external dependencies MUST be mocked
 */

// STEP 1: Import the functions to test
import {
  functionToTest1,
  functionToTest2
} from '@/lib/{{module}}/{{filename}}';

// STEP 2: Mock ALL external dependencies BEFORE imports
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn()
}));

jest.mock('@/lib/sms/twilio-service', () => ({
  sendSMS: jest.fn()
}));

jest.mock('@/lib/email/sendgrid-service', () => ({
  sendEmail: jest.fn()
}));

// Add more mocks as needed for your specific dependencies

// STEP 3: Import mocked modules for type safety
import { createClient } from '@/lib/supabase/server';
import { sendSMS } from '@/lib/sms/twilio-service';
import { sendEmail } from '@/lib/email/sendgrid-service';

describe('{{Module}} - {{Feature}}', () => {
  let mockSupabase: any;
  const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
  const mockSendSMS = sendSMS as jest.MockedFunction<typeof sendSMS>;
  const mockSendEmail = sendEmail as jest.MockedFunction<typeof sendEmail>;

  beforeEach(() => {
    // STEP 4: Reset all mocks before each test
    jest.clearAllMocks();

    // STEP 5: Setup Supabase mock with chainable API
    mockSupabase = {
      from: jest.fn((table: string) => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { /* mock data here */ },
              error: null
            })
          })),
          in: jest.fn(() => ({
            then: jest.fn().mockResolvedValue({
              data: [/* mock array data */],
              error: null
            })
          }))
        })),
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { id: 'mock-id', /* other fields */ },
              error: null
            })
          }))
        })),
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: { /* updated data */ },
                error: null
              })
            }))
          }))
        })),
        delete: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: null
          })
        }))
      })),
      rpc: jest.fn().mockResolvedValue({
        data: { /* rpc result */ },
        error: null
      }),
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null
        })
      }
    };

    // Wire up the mock
    mockCreateClient.mockResolvedValue(mockSupabase);

    // Setup other service mocks
    mockSendSMS.mockResolvedValue({
      success: true,
      messageId: 'msg-123'
    });

    mockSendEmail.mockResolvedValue({
      success: true,
      messageId: 'email-123'
    });
  });

  describe('functionToTest1', () => {
    it('should [describe expected behavior]', async () => {
      // STEP 6: Arrange - Setup specific mock responses for this test
      mockSupabase.from.mockImplementationOnce(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'test-123',
                name: 'Test Name',
                // Add specific test data
              },
              error: null
            })
          }))
        }))
      }));

      // STEP 7: Act - Call the function being tested
      const result = await functionToTest1('test-param');

      // STEP 8: Assert - Check the results
      expect(result).toBeDefined();
      expect(result.success).toBe(true);

      // Verify mocks were called correctly
      expect(mockSupabase.from).toHaveBeenCalledWith('expected_table');
      expect(mockSupabase.from).toHaveBeenCalledTimes(1);
    });

    it('should handle errors gracefully', async () => {
      // Setup error scenario
      mockSupabase.from.mockImplementationOnce(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found' }
            })
          }))
        }))
      }));

      const result = await functionToTest1('invalid-param');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Not found');
    });
  });

  describe('functionToTest2', () => {
    it('should send SMS when conditions are met', async () => {
      // Test that uses SMS mock
      const result = await functionToTest2({
        phoneNumber: '555-555-5555',
        message: 'Test message'
      });

      expect(mockSendSMS).toHaveBeenCalledWith(
        '555-555-5555',
        'Test message'
      );
      expect(mockSendSMS).toHaveBeenCalledTimes(1);
      expect(result.success).toBe(true);
    });

    it('should not send SMS when validation fails', async () => {
      const result = await functionToTest2({
        phoneNumber: '', // Invalid
        message: 'Test message'
      });

      expect(mockSendSMS).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid phone');
    });
  });

  // IMPORTANT: Test edge cases and error scenarios
  describe('error handling', () => {
    it('should handle database connection errors', async () => {
      mockCreateClient.mockRejectedValueOnce(new Error('Connection failed'));

      const result = await functionToTest1('test-param');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Connection failed');
    });

    it('should handle SMS service failures', async () => {
      mockSendSMS.mockResolvedValueOnce({
        success: false,
        error: 'Service unavailable'
      });

      const result = await functionToTest2({
        phoneNumber: '555-555-5555',
        message: 'Test'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Service unavailable');
    });
  });
});

/**
 * UNIT TEST CHECKLIST:
 *
 * ✅ All external services mocked (database, SMS, email, etc.)
 * ✅ No real IDs used (no 'user-123' from real DB)
 * ✅ Tests run without network/database
 * ✅ Each test is isolated (beforeEach resets mocks)
 * ✅ Error scenarios tested
 * ✅ Mock call verification (toHaveBeenCalledWith)
 * ✅ Tests run in < 100ms each
 *
 * ❌ NEVER:
 * - Call createClient() without mock
 * - Use real database IDs
 * - Make actual HTTP requests
 * - Read/write real files
 * - Call external APIs
 */