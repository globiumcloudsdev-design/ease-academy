import Subscription from '@/backend/models/Subscription';
import Branch from '@/backend/models/Branch';
import connectDB from '@/lib/database';
import { setCache, getCache, deleteCache } from '@/lib/redis';

/**
 * Create new subscription
 */
export async function createSubscription(subscriptionData) {
  try {
    await connectDB();
    
    const {
      branchId,
      planName,
      planType,
      price,
      currency,
      billingCycle,
      startDate,
      endDate,
      features,
      maxStudents,
      maxTeachers,
      maxClasses,
      storageLimit,
      autoRenew,
      notes,
    } = subscriptionData;
    
    // Verify branch exists
    const branch = await Branch.findById(branchId);
    if (!branch) {
      throw new Error('Branch not found');
    }
    
    // Create subscription
    const subscription = new Subscription({
      branchId,
      planName,
      planType,
      price,
      currency,
      billingCycle,
      startDate,
      endDate,
      features: features || [],
      maxStudents,
      maxTeachers,
      maxClasses,
      storageLimit,
      autoRenew: autoRenew !== undefined ? autoRenew : true,
      notes,
      status: 'active',
    });
    
    await subscription.save();
    
    // Clear cache
    await deleteCache('subscriptions:*');
    
    return {
      success: true,
      data: subscription,
      message: 'Subscription created successfully',
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Get all subscriptions
 */
export async function getAllSubscriptions(filters = {}) {
  try {
    await connectDB();
    
    const { page = 1, limit = 10, branchId, status, planType, search } = filters;
    
    // Build query
    const query = {};
    
    if (branchId) query.branchId = branchId;
    if (status) query.status = status;
    if (planType) query.planType = planType;
    if (search) {
      query.planName = { $regex: search, $options: 'i' };
    }
    
    // Execute query
    const skip = (page - 1) * limit;
    
    const [subscriptions, total] = await Promise.all([
      Subscription.find(query)
        .populate('branchId', 'name code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Subscription.countDocuments(query),
    ]);
    
    return {
      success: true,
      data: subscriptions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Get subscription by ID
 */
export async function getSubscriptionById(subscriptionId) {
  try {
    await connectDB();
    
    const subscription = await Subscription.findById(subscriptionId)
      .populate('branchId', 'name code address phone email');
    
    if (!subscription) {
      throw new Error('Subscription not found');
    }
    
    return {
      success: true,
      data: subscription,
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Update subscription
 */
export async function updateSubscription(subscriptionId, updates) {
  try {
    await connectDB();
    
    const allowedUpdates = [
      'planName', 'planType', 'price', 'currency', 'billingCycle',
      'startDate', 'endDate', 'status', 'features', 'maxStudents',
      'maxTeachers', 'maxClasses', 'storageLimit', 'autoRenew', 'notes',
    ];
    
    const filteredUpdates = {};
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    });
    
    const subscription = await Subscription.findByIdAndUpdate(
      subscriptionId,
      filteredUpdates,
      { new: true, runValidators: true }
    ).populate('branchId', 'name code');
    
    if (!subscription) {
      throw new Error('Subscription not found');
    }
    
    // Clear cache
    await deleteCache(`subscription:${subscriptionId}`);
    await deleteCache('subscriptions:*');
    
    return {
      success: true,
      data: subscription,
      message: 'Subscription updated successfully',
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Delete subscription
 */
export async function deleteSubscription(subscriptionId) {
  try {
    await connectDB();
    
    const subscription = await Subscription.findByIdAndDelete(subscriptionId);
    
    if (!subscription) {
      throw new Error('Subscription not found');
    }
    
    // Clear cache
    await deleteCache(`subscription:${subscriptionId}`);
    await deleteCache('subscriptions:*');
    
    return {
      success: true,
      message: 'Subscription deleted successfully',
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Add payment to subscription
 */
export async function addPayment(subscriptionId, paymentData) {
  try {
    await connectDB();
    
    const { amount, method, status, transactionId } = paymentData;
    
    const subscription = await Subscription.findById(subscriptionId);
    
    if (!subscription) {
      throw new Error('Subscription not found');
    }
    
    subscription.paymentHistory.push({
      date: new Date(),
      amount,
      method,
      status: status || 'paid',
      transactionId,
    });
    
    await subscription.save();
    
    // Clear cache
    await deleteCache(`subscription:${subscriptionId}`);
    await deleteCache('subscriptions:*');
    
    return {
      success: true,
      data: subscription,
      message: 'Payment added successfully',
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Get subscription statistics
 */
export async function getSubscriptionStats() {
  try {
    await connectDB();
    
    const [
      totalSubscriptions,
      activeSubscriptions,
      expiredSubscriptions,
      revenueByMonth,
      subscriptionsByPlan,
    ] = await Promise.all([
      Subscription.countDocuments(),
      Subscription.countDocuments({ status: 'active' }),
      Subscription.countDocuments({ status: 'expired' }),
      Subscription.aggregate([
        {
          $match: {
            'paymentHistory.status': 'paid',
          },
        },
        { $unwind: '$paymentHistory' },
        {
          $match: {
            'paymentHistory.status': 'paid',
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$paymentHistory.date' },
              month: { $month: '$paymentHistory.date' },
            },
            revenue: { $sum: '$paymentHistory.amount' },
          },
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 },
      ]),
      Subscription.aggregate([
        {
          $group: {
            _id: '$planType',
            count: { $sum: 1 },
            revenue: { $sum: '$price' },
          },
        },
      ]),
    ]);
    
    const totalRevenue = revenueByMonth.reduce((sum, item) => sum + item.revenue, 0);
    
    return {
      success: true,
      data: {
        totalSubscriptions,
        activeSubscriptions,
        expiredSubscriptions,
        totalRevenue,
        revenueByMonth,
        subscriptionsByPlan,
      },
    };
  } catch (error) {
    throw error;
  }
}

export default {
  createSubscription,
  getAllSubscriptions,
  getSubscriptionById,
  updateSubscription,
  deleteSubscription,
  addPayment,
  getSubscriptionStats,
};
