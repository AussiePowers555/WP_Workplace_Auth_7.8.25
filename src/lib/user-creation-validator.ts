import { DatabaseService } from './database';
import CryptoJS from 'crypto-js';

export interface ValidationResult {
  success: boolean;
  message: string;
  details?: any;
}

// Password hashing - MUST match everywhere
function hashPassword(password: string): string {
  return CryptoJS.SHA256(password + 'salt_pbr_2024').toString();
}

export class UserCreationValidator {
  /**
   * Validates that a password is correctly saved and can be used for authentication
   */
  static async validatePasswordSaving(email: string, password: string): Promise<ValidationResult> {
    try {
      // Get the user from database
      const user = DatabaseService.getUserByEmail(email);
      
      if (!user) {
        return {
          success: false,
          message: `User ${email} not found in database`,
        };
      }

      // Hash the provided password
      const hashedPassword = hashPassword(password);
      
      // Check if hashed password matches stored hash
      if (user.password_hash !== hashedPassword) {
        return {
          success: false,
          message: 'Password hash mismatch',
          details: {
            providedHash: hashedPassword,
            storedHash: user.password_hash,
            passwordProvided: password,
          }
        };
      }

      return {
        success: true,
        message: 'Password correctly saved and verifiable',
        details: {
          email: user.email,
          role: user.role,
          status: user.status,
          workspace_id: user.workspace_id,
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Simulates complete login flow to ensure user can authenticate
   */
  static async simulateLogin(email: string, password: string): Promise<ValidationResult> {
    try {
      // First validate password is saved correctly
      const passwordValidation = await this.validatePasswordSaving(email, password);
      
      if (!passwordValidation.success) {
        return passwordValidation;
      }

      // Simulate the exact authentication process used in login
      const user = DatabaseService.getUserByEmail(email);
      const hashedPassword = hashPassword(password);
      
      // This matches the authentication logic in user-auth.ts
      const authenticated = await DatabaseService.validateUser(email, hashedPassword);
      
      if (!authenticated) {
        return {
          success: false,
          message: 'Authentication failed - validateUser returned false',
          details: {
            email,
            passwordProvided: password,
            hashedPassword,
            userFound: !!user,
          }
        };
      }

      return {
        success: true,
        message: 'Login simulation successful - user can authenticate',
        details: {
          email: user!.email,
          role: user!.role,
          status: user!.status,
          needsPasswordChange: user!.status === 'pending_password_change',
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Login simulation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Creates a user with validation and immediate login test
   */
  static async createUserWithValidation(userData: {
    email: string;
    password: string;
    role: string;
    workspace_id?: string | null;
    contact_id?: string | null;
  }): Promise<ValidationResult> {
    try {
      // Check if user already exists
      const existingUser = DatabaseService.getUserByEmail(userData.email);
      if (existingUser) {
        return {
          success: false,
          message: `User ${userData.email} already exists`,
        };
      }

      // Create the user with proper password hashing
      const hashedPassword = hashPassword(userData.password);
      
      const newUser = DatabaseService.createUserAccount({
        email: userData.email,
        password_hash: hashedPassword,
        role: userData.role,
        status: 'pending_password_change',
        contact_id: userData.contact_id || null,
        workspace_id: userData.workspace_id || null,
        first_login: false,
        remember_login: false,
      });

      if (!newUser || !newUser.id) {
        return {
          success: false,
          message: 'Failed to create user - no user ID returned',
        };
      }

      // Immediately test login with the created credentials
      const loginTest = await this.simulateLogin(userData.email, userData.password);
      
      if (!loginTest.success) {
        // If login fails, we have a critical issue
        return {
          success: false,
          message: `User created but cannot login: ${loginTest.message}`,
          details: {
            userId: newUser.id,
            loginTestDetails: loginTest.details,
          }
        };
      }

      return {
        success: true,
        message: 'User created and login verified successfully',
        details: {
          userId: newUser.id,
          email: newUser.email,
          role: newUser.role,
          canLogin: true,
          passwordWorks: true,
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `User creation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Comprehensive test of the entire user creation flow
   */
  static async runComprehensiveTest(): Promise<ValidationResult> {
    const testEmail = `test_${Date.now()}@example.com`;
    const testPassword = 'TestPass123!';
    
    console.log('\n=== Running Comprehensive User Creation Test ===');
    console.log(`Test Email: ${testEmail}`);
    console.log(`Test Password: ${testPassword}`);
    
    try {
      // Step 1: Create user with validation
      console.log('\n1. Creating user with validation...');
      const createResult = await this.createUserWithValidation({
        email: testEmail,
        password: testPassword,
        role: 'workspace_user',
        workspace_id: 'workspace_001',
      });

      if (!createResult.success) {
        console.error('❌ User creation failed:', createResult.message);
        return createResult;
      }
      console.log('✅ User created successfully');

      // Step 2: Verify password is correctly stored
      console.log('\n2. Verifying password storage...');
      const passwordCheck = await this.validatePasswordSaving(testEmail, testPassword);
      
      if (!passwordCheck.success) {
        console.error('❌ Password validation failed:', passwordCheck.message);
        return passwordCheck;
      }
      console.log('✅ Password correctly stored');

      // Step 3: Test actual login simulation
      console.log('\n3. Testing login simulation...');
      const loginCheck = await this.simulateLogin(testEmail, testPassword);
      
      if (!loginCheck.success) {
        console.error('❌ Login simulation failed:', loginCheck.message);
        return loginCheck;
      }
      console.log('✅ Login simulation successful');

      // Step 4: Clean up test user
      console.log('\n4. Cleaning up test user...');
      // Note: Add cleanup method if needed

      console.log('\n=== All Tests Passed ===');
      return {
        success: true,
        message: 'All validation tests passed successfully',
        details: {
          testEmail,
          allTestsPassed: true,
          userCanLogin: true,
          passwordCorrectlyStored: true,
        }
      };
    } catch (error) {
      console.error('❌ Test failed with error:', error);
      return {
        success: false,
        message: `Test error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}

// Export for use in API routes and testing
export default UserCreationValidator;