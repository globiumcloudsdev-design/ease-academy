import Branch from '@/backend/models/Branch';
import User from '@/backend/models/User';
import connectDB from '@/lib/database';
import { setCache, getCache, deleteCache } from '@/lib/redis';

/**
 * Get all branches with stats
 */
export async function getAllBranches(filters = {}) {
  try {
    await connectDB();
    
    const { status, search, page = 1, limit = 10 } = filters;
    
    // Build query
    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ];
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get branches with admin details
    const branches = await Branch.find(query)
      .populate('admin', 'fullName email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count
    const total = await Branch.countDocuments(query);
    
    return {
      success: true,
      data: {
        branches,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
        },
      },
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Get branch by ID
 */
export async function getBranchById(branchId) {
  try {
    await connectDB();
    
    // Try cache first
    const cached = await getCache(`branch:${branchId}`);
    if (cached) {
      return { success: true, data: cached };
    }
    
    const branch = await Branch.findById(branchId).populate('admin', 'fullName email phone');
    
    if (!branch) {
      throw new Error('Branch not found');
    }
    
    // Cache branch data
    await setCache(`branch:${branchId}`, branch, 3600);
    
    return {
      success: true,
      data: branch,
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Create new branch
 */
export async function createBranch(branchData) {
  try {
    await connectDB();
    
    const { name, code, address, contact, adminId, settings } = branchData;
    
    // Check if code already exists
    const existingBranch = await Branch.findOne({ code });
    if (existingBranch) {
      throw new Error('Branch code already exists');
    }
    
    // Create branch
    const branch = new Branch({
      name,
      code: code.toUpperCase(),
      address,
      contact,
      admin: adminId || null,
      settings: settings || {},
      status: 'active',
    });
    
    await branch.save();
    
    // If admin assigned, update user's branchId
    if (adminId) {
      await User.findByIdAndUpdate(adminId, { branchId: branch._id });
    }
    
    // Clear cache
    await deleteCache('branches:*');
    
    return {
      success: true,
      data: branch,
      message: 'Branch created successfully',
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Update branch
 */
export async function updateBranch(branchId, updates) {
  try {
    await connectDB();
    
    const branch = await Branch.findById(branchId);
    
    if (!branch) {
      throw new Error('Branch not found');
    }
    
    // If code is being updated, check uniqueness
    if (updates.code && updates.code !== branch.code) {
      const existingBranch = await Branch.findOne({ code: updates.code });
      if (existingBranch) {
        throw new Error('Branch code already exists');
      }
    }
    
    // Update branch
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        branch[key] = updates[key];
      }
    });
    
    await branch.save();
    
    // Clear cache
    await deleteCache(`branch:${branchId}`);
    await deleteCache('branches:*');
    
    return {
      success: true,
      data: branch,
      message: 'Branch updated successfully',
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Delete branch
 */
export async function deleteBranch(branchId) {
  try {
    await connectDB();
    
    const branch = await Branch.findById(branchId);
    
    if (!branch) {
      throw new Error('Branch not found');
    }
    
    // Check if branch has users
    const userCount = await User.countDocuments({ branchId });
    if (userCount > 0) {
      throw new Error('Cannot delete branch with existing users. Please reassign or delete users first.');
    }
    
    await branch.deleteOne();
    
    // Clear cache
    await deleteCache(`branch:${branchId}`);
    await deleteCache('branches:*');
    
    return {
      success: true,
      message: 'Branch deleted successfully',
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Get branch statistics
 */
export async function getBranchStats(branchId = null) {
  try {
    await connectDB();
    
    if (branchId) {
      // Stats for specific branch
      const branch = await Branch.findById(branchId);
      if (!branch) {
        throw new Error('Branch not found');
      }
      
      const stats = {
        totalStudents: await User.countDocuments({ branchId, role: 'student', isActive: true }),
        totalTeachers: await User.countDocuments({ branchId, role: 'teacher', isActive: true }),
        totalParents: await User.countDocuments({ branchId, role: 'parent', isActive: true }),
        totalAdmins: await User.countDocuments({ branchId, role: 'branch_admin', isActive: true }),
      };
      
      return {
        success: true,
        data: stats,
      };
    } else {
      // Global stats for all branches
      const totalBranches = await Branch.countDocuments();
      const activeBranches = await Branch.countDocuments({ status: 'active' });
      const inactiveBranches = await Branch.countDocuments({ status: 'inactive' });
      
      const totalUsers = await User.countDocuments({ role: { $ne: 'super_admin' } });
      const totalStudents = await User.countDocuments({ role: 'student', isActive: true });
      const totalTeachers = await User.countDocuments({ role: 'teacher', isActive: true });
      const totalParents = await User.countDocuments({ role: 'parent', isActive: true });
      
      return {
        success: true,
        data: {
          totalBranches,
          activeBranches,
          inactiveBranches,
          totalUsers,
          totalStudents,
          totalTeachers,
          totalParents,
        },
      };
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Toggle branch status
 */
export async function toggleBranchStatus(branchId) {
  try {
    await connectDB();
    
    const branch = await Branch.findById(branchId);
    
    if (!branch) {
      throw new Error('Branch not found');
    }
    
    branch.status = branch.status === 'active' ? 'inactive' : 'active';
    await branch.save();
    
    // Clear cache
    await deleteCache(`branch:${branchId}`);
    await deleteCache('branches:*');
    
    return {
      success: true,
      data: branch,
      message: `Branch ${branch.status === 'active' ? 'activated' : 'deactivated'} successfully`,
    };
  } catch (error) {
    throw error;
  }
}

export default {
  getAllBranches,
  getBranchById,
  createBranch,
  updateBranch,
  deleteBranch,
  getBranchStats,
  toggleBranchStatus,
};
