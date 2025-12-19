import bcrypt from 'bcryptjs';
import User from '@/backend/models/User';
import connectDB from '@/lib/database';
import { generateAccessToken, generateRefreshToken, verifyToken } from '@/backend/middleware/auth';
import { setCache, getCache, deleteCache } from '@/lib/redis';
import Branch from '@/backend/models/Branch';
/**
 * Register new user
 */
export async function registerUser(userData) {
  try {
    await connectDB();
    
    const { fullName, email, phone, password, role, branchId, permissions } = userData;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }
    
    // Create new user
    const user = new User({
      fullName,
      email,
      phone,
      passwordHash: password, // Will be hashed by pre-save hook
      role: role || 'student',
      branchId: branchId || null,
      permissions: permissions || [],
      isActive: true,
    });
    
    await user.save();
    
    // Clear cache
    await deleteCache('users:*');
    
    return {
      success: true,
      data: user,
      message: 'User registered successfully',
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Login user
 */
export async function loginUser(email, password) {
  try {
    await connectDB();
    
    // Find user with password field and populate branch
    const user = await User.findOne({ email })
      .select('+passwordHash')
      .populate('branchId', 'name code address contact');
    
    if (!user) {
      throw new Error('Invalid email or password');
    }
    
    // Check if user is active
    if (!user.isActive) {
      throw new Error('Your account has been deactivated. Please contact administrator.');
    }
    
    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }
    
    // Generate tokens
    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      branchId: user.branchId?.toString(),
    };
    
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);
    
    // Save refresh token to user
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();
    
    // Prepare user data with branch info
    const userData = user.toJSON();
    if (user.branchId) {
      userData.branchName = user.branchId.name;
      userData.branchCode = user.branchId.code;
    }
    
    // Cache user data
    await setCache(`user:${user._id}`, userData, 3600);
    
    return {
      success: true,
      data: {
        user: userData,
        accessToken,
        refreshToken,
      },
      message: 'Login successful',
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Logout user
 */
export async function logoutUser(userId) {
  try {
    await connectDB();
    
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Clear refresh token
    user.refreshToken = null;
    await user.save();
    
    // Clear cache
    await deleteCache(`user:${userId}`);
    
    return {
      success: true,
      message: 'Logout successful',
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(refreshToken) {
  try {
    await connectDB();
    
    // Verify refresh token
    const decoded = verifyToken(refreshToken);
    
    // Find user and verify refresh token matches
    const user = await User.findById(decoded.userId).select('+refreshToken');
    
    if (!user || user.refreshToken !== refreshToken) {
      throw new Error('Invalid refresh token');
    }
    
    if (!user.isActive) {
      throw new Error('Your account has been deactivated');
    }
    
    // Generate new access token
    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      branchId: user.branchId?.toString(),
    };
    
    const newAccessToken = generateAccessToken(tokenPayload);
    
    return {
      success: true,
      data: {
        accessToken: newAccessToken,
      },
      message: 'Token refreshed successfully',
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Change password
 */
export async function changePassword(userId, currentPassword, newPassword) {
  try {
    await connectDB();
    
    // Find user with password
    const user = await User.findById(userId).select('+passwordHash');
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }
    
    // Validate new password
    if (newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long');
    }
    
    // Update password
    user.passwordHash = newPassword; // Will be hashed by pre-save hook
    await user.save();
    
    // Clear cache
    await deleteCache(`user:${userId}`);
    
    return {
      success: true,
      message: 'Password changed successfully',
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Request password reset
 */
export async function requestPasswordReset(email) {
  try {
    await connectDB();
    
    const user = await User.findOne({ email });
    
    if (!user) {
      // Don't reveal if user exists
      return {
        success: true,
        message: 'If the email exists, a reset link has been sent',
      };
    }
    
    // Generate reset token
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash token before saving
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();
    
    // TODO: Send email with reset link
    // For now, return token (in production, send via email)
    
    return {
      success: true,
      data: { resetToken }, // Remove this in production
      message: 'Password reset link sent to your email',
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Reset password with token
 */
export async function resetPassword(resetToken, newPassword) {
  try {
    await connectDB();
    
    // Hash token to compare
    const crypto = require('crypto');
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });
    
    if (!user) {
      throw new Error('Invalid or expired reset token');
    }
    
    // Validate new password
    if (newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }
    
    // Update password and clear reset token
    user.passwordHash = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    
    return {
      success: true,
      message: 'Password reset successfully',
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Get current user profile
 */
export async function getCurrentUser(userId) {
  try {
    await connectDB();
    
    // Try to get from cache first
    const cached = await getCache(`user:${userId}`);
    if (cached) {
      return {
        success: true,
        data: cached,
      };
    }
    
    // Get from database
    const user = await User.findById(userId).populate('branchId', 'name code');
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Cache user data
    await setCache(`user:${userId}`, user.toJSON(), 3600);
    
    return {
      success: true,
      data: user,
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId, updates) {
  try {
    await connectDB();
    
    const allowedUpdates = ['fullName', 'phone', 'avatar'];
    const filteredUpdates = {};
    
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    });
    
    const user = await User.findByIdAndUpdate(
      userId,
      filteredUpdates,
      { new: true, runValidators: true }
    );
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Clear cache
    await deleteCache(`user:${userId}`);
    
    return {
      success: true,
      data: user,
      message: 'Profile updated successfully',
    };
  } catch (error) {
    throw error;
  }
}

export default {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changePassword,
  requestPasswordReset,
  resetPassword,
  getCurrentUser,
  updateUserProfile,
};
