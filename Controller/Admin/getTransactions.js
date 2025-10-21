const PaymentTransaction = require("../../Creators/PaymentTransaction");
const mongoose = require("mongoose");

/**
 * @desc Get all transactions for admin
 * @route GET /api/admin/transactions
 */
exports.getTransactions = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      status, 
      search, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;

    // Build query
    const query = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { orderId: { $regex: search, $options: 'i' } },
        { userId: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get transactions with pagination
    const transactions = await PaymentTransaction.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const totalCount = await PaymentTransaction.countDocuments(query);
    const totalPages = Math.ceil(totalCount / parseInt(limit));

    // Get transaction statistics
    const stats = await PaymentTransaction.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    // Get total revenue
    const revenueStats = await PaymentTransaction.aggregate([
      {
        $match: {
          status: { $in: ['confirmed', 'finished'] }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          totalTransactions: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      transactions,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      },
      stats,
      revenue: revenueStats[0] || { totalRevenue: 0, totalTransactions: 0 }
    });

  } catch (error) {
    console.error("Get transactions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch transactions",
      error: error.message
    });
  }
};

/**
 * @desc Get transaction by ID
 * @route GET /api/admin/transactions/:id
 */
exports.getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction ID"
      });
    }

    const transaction = await PaymentTransaction.findById(id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found"
      });
    }

    res.status(200).json({
      success: true,
      transaction
    });

  } catch (error) {
    console.error("Get transaction by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch transaction",
      error: error.message
    });
  }
};

/**
 * @desc Update transaction status
 * @route PUT /api/admin/transactions/:id/status
 */
exports.updateTransactionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction ID"
      });
    }

    const validStatuses = ['waiting', 'confirming', 'confirmed', 'finished', 'failed', 'expired'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status"
      });
    }

    const transaction = await PaymentTransaction.findByIdAndUpdate(
      id,
      { 
        status,
        $set: {
          'txData.adminNotes': notes,
          'txData.updatedBy': req.userId,
          'txData.updatedAt': new Date()
        }
      },
      { new: true }
    );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Transaction status updated",
      transaction
    });

  } catch (error) {
    console.error("Update transaction status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update transaction status",
      error: error.message
    });
  }
};

/**
 * @desc Get transaction statistics
 * @route GET /api/admin/transactions/stats
 */
exports.getTransactionStats = async (req, res) => {
  try {
    const { period = '30d' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get statistics
    const stats = await PaymentTransaction.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          avgAmount: { $avg: '$amount' }
        }
      }
    ]);

    // Get daily transaction counts
    const dailyStats = await PaymentTransaction.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Get total revenue
    const revenueStats = await PaymentTransaction.aggregate([
      {
        $match: {
          status: { $in: ['confirmed', 'finished'] },
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          totalTransactions: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      period,
      stats,
      dailyStats,
      revenue: revenueStats[0] || { totalRevenue: 0, totalTransactions: 0 }
    });

  } catch (error) {
    console.error("Get transaction stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch transaction statistics",
      error: error.message
    });
  }
};
