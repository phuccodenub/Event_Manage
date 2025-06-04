const bcrypt = require('bcryptjs');
const crypto = require('crypto');

class PasswordSecurity {
  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @returns {Object} - Validation result with score and suggestions
   */
  static validateStrength(password) {
    const result = {
      isValid: false,
      score: 0,
      suggestions: [],
      strength: 'weak'
    };

    if (!password) {
      result.suggestions.push('Mật khẩu không được để trống');
      return result;
    }

    // Check minimum length (8 characters)
    if (password.length < 8) {
      result.suggestions.push('Mật khẩu phải có ít nhất 8 ký tự');
    } else {
      result.score += 20;
    }

    // Check for uppercase letters
    if (!/[A-Z]/.test(password)) {
      result.suggestions.push('Mật khẩu phải có ít nhất 1 chữ hoa');
    } else {
      result.score += 20;
    }

    // Check for lowercase letters
    if (!/[a-z]/.test(password)) {
      result.suggestions.push('Mật khẩu phải có ít nhất 1 chữ thường');
    } else {
      result.score += 20;
    }

    // Check for numbers
    if (!/\d/.test(password)) {
      result.suggestions.push('Mật khẩu phải có ít nhất 1 số');
    } else {
      result.score += 20;
    }

    // Check for special characters
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      result.suggestions.push('Mật khẩu phải có ít nhất 1 ký tự đặc biệt (!@#$%^&*...)');
    } else {
      result.score += 20;
    }

    // Additional checks for stronger passwords
    if (password.length >= 12) {
      result.score += 10;
    }

    // Check for common patterns
    const commonPatterns = [
      /(.)\1{2,}/, // Repeated characters (aaa, 111)
      /123456/,
      /password/i,
      /qwerty/i,
      /abc/i
    ];

    let hasCommonPattern = false;
    commonPatterns.forEach(pattern => {
      if (pattern.test(password)) {
        hasCommonPattern = true;
        result.suggestions.push('Tránh sử dụng các mẫu phổ biến (123456, password, qwerty...)');
      }
    });

    if (hasCommonPattern) {
      result.score -= 30;
    }

    // Determine strength level
    if (result.score >= 80) {
      result.strength = 'very-strong';
    } else if (result.score >= 60) {
      result.strength = 'strong';
    } else if (result.score >= 40) {
      result.strength = 'medium';
    } else if (result.score >= 20) {
      result.strength = 'weak';
    } else {
      result.strength = 'very-weak';
    }

    // Password is valid if no suggestions and score >= 60
    result.isValid = result.suggestions.length === 0 && result.score >= 60;

    return result;
  }

  /**
   * Generate temporary password
   * @returns {string} - 8 character temporary password
   */
  static generateTempPassword() {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const specialChars = '!@#$%^&*';

    let password = '';
    
    // Ensure at least one character from each category
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += specialChars[Math.floor(Math.random() * specialChars.length)];

    // Fill remaining 4 characters randomly
    const allChars = uppercase + lowercase + numbers + specialChars;
    for (let i = 4; i < 8; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password to randomize positions
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Generate secure token
   * @param {number} length - Token length in bytes (default: 32)
   * @returns {string} - Hex token
   */
  static generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Check if password exists in user's password history
   * @param {string} userId - User ID
   * @param {string} newPassword - New password to check
   * @returns {Promise<boolean>} - True if password exists in history
   */
  static async checkPasswordHistory(userId, newPassword) {
    try {
      const User = require('../models/userModel');
      const user = await User.findById(userId).select('+passwordHistory');
      
      if (!user || !user.passwordHistory || user.passwordHistory.length === 0) {
        return false;
      }

      // Check against each password in history
      for (const oldPasswordHash of user.passwordHistory) {
        const isMatch = await bcrypt.compare(newPassword, oldPasswordHash);
        if (isMatch) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking password history:', error);
      return false;
    }
  }

  /**
   * Enhanced password hashing with higher cost factor
   * @param {string} password - Password to hash
   * @returns {Promise<string>} - Hashed password
   */
  static async hashPassword(password) {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
  }

  /**
   * Compare password with hash
   * @param {string} password - Plain text password
   * @param {string} hash - Hashed password
   * @returns {Promise<boolean>} - Comparison result
   */
  static async comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate password reset token with expiration
   * @returns {Object} - Token and expiration info
   */
  static generatePasswordResetToken() {
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    return {
      token,
      hashedToken,
      expires
    };
  }

  /**
   * Generate email verification token with expiration
   * @returns {Object} - Token and expiration info
   */
  static generateEmailVerificationToken() {
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    return {
      token,
      hashedToken,
      expires
    };
  }

  /**
   * Validate email format with enhanced checks
   * @param {string} email - Email to validate
   * @returns {Object} - Validation result
   */
  static validateEmail(email) {
    const result = {
      isValid: false,
      suggestions: []
    };

    if (!email) {
      result.suggestions.push('Email không được để trống');
      return result;
    }

    // Basic email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      result.suggestions.push('Định dạng email không hợp lệ');
      return result;
    }

    // Check for HUTECH domain (optional - adjust based on requirements)
    const hutechDomains = ['@hutech.edu.vn', '@student.hutech.edu.vn'];
    const isHutechEmail = hutechDomains.some(domain => email.toLowerCase().includes(domain));
    
    if (!isHutechEmail) {
      result.suggestions.push('Khuyến nghị sử dụng email HUTECH (@hutech.edu.vn hoặc @student.hutech.edu.vn)');
    }

    result.isValid = emailRegex.test(email);
    return result;
  }

  /**
   * Generate account lockout info
   * @param {number} attempts - Current login attempts
   * @returns {Object} - Lockout information
   */
  static getLockoutInfo(attempts) {
    const MAX_ATTEMPTS = 5;
    const LOCK_TIME = 30 * 60 * 1000; // 30 minutes

    return {
      maxAttempts: MAX_ATTEMPTS,
      remainingAttempts: Math.max(0, MAX_ATTEMPTS - attempts),
      isLocked: attempts >= MAX_ATTEMPTS,
      lockDuration: LOCK_TIME,
      lockDurationMinutes: LOCK_TIME / (60 * 1000)
    };
  }

  /**
   * Check if password meets minimum requirements
   * @param {string} password - Password to check
   * @returns {boolean} - True if meets minimum requirements
   */
  static meetsMinimumRequirements(password) {
    if (!password || password.length < 8) return false;
    
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    return hasUppercase && hasLowercase && hasNumber && hasSpecialChar;
  }

  /**
   * Sanitize password input
   * @param {string} password - Password to sanitize
   * @returns {string} - Sanitized password
   */
  static sanitizePassword(password) {
    if (typeof password !== 'string') return '';
    
    // Remove leading/trailing whitespace
    return password.trim();
  }

  /**
   * Get password strength color for UI
   * @param {string} strength - Strength level
   * @returns {string} - CSS color class
   */
  static getStrengthColor(strength) {
    const colors = {
      'very-weak': 'text-red-600',
      'weak': 'text-red-500',
      'medium': 'text-yellow-500',
      'strong': 'text-green-500',
      'very-strong': 'text-green-600'
    };

    return colors[strength] || 'text-gray-500';
  }

  /**
   * Get password strength progress percentage
   * @param {number} score - Password score
   * @returns {number} - Progress percentage (0-100)
   */
  static getStrengthProgress(score) {
    return Math.min(100, Math.max(0, score));
  }
}

module.exports = PasswordSecurity; 