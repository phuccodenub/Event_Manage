const mongoose = require('mongoose');

/**
 * Safe transaction wrapper để tránh session leaks và đảm bảo proper cleanup
 * @param {Function} operations - Async function chứa các operations cần thực hiện trong transaction
 * @param {Object} options - Transaction options
 * @returns {Promise} - Promise resolve với result hoặc reject với error
 */
const withTransaction = async (operations, options = {}) => {
  const session = await mongoose.startSession();
  
  const transactionOptions = {
    readPreference: 'primary',
    readConcern: { level: 'local' },
    writeConcern: { w: 'majority' },
    maxTimeMS: 30000, // 30 seconds timeout
    ...options
  };

  try {
    session.startTransaction(transactionOptions);
    
    // Execute operations with session
    const result = await operations(session);
    
    // Commit transaction
    await session.commitTransaction();
    
    return result;
  } catch (error) {
    // Abort transaction on any error
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    
    // Re-throw the original error
    throw error;
  } finally {
    // Always end session
    await session.endSession();
  }
};

/**
 * Retry wrapper cho operations có thể fail do concurrent access
 * @param {Function} operation - Operation cần retry
 * @param {number} maxRetries - Số lần retry tối đa
 * @param {number} baseDelay - Base delay giữa các retry (ms)
 * @returns {Promise} - Promise với result hoặc final error
 */
const withRetry = async (operation, maxRetries = 3, baseDelay = 100) => {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Không retry với một số loại lỗi nhất định
      if (
        error.code === 11000 || // Duplicate key
        error.name === 'ValidationError' ||
        error.name === 'CastError' ||
        attempt === maxRetries
      ) {
        throw error;
      }
      
      // Exponential backoff với jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 100;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

/**
 * Optimistic locking helper sử dụng version field
 * @param {mongoose.Model} Model - Mongoose model
 * @param {string} id - Document ID
 * @param {Function} updateFn - Function nhận document và trả về updated fields
 * @param {number} maxRetries - Số lần retry tối đa
 * @returns {Promise} - Updated document
 */
const withOptimisticLocking = async (Model, id, updateFn, maxRetries = 5) => {
  return withRetry(async () => {
    const doc = await Model.findById(id);
    if (!doc) {
      throw new Error('Document not found');
    }
    
    const updates = await updateFn(doc);
    const currentVersion = doc.__v || 0;
    
    // Update với version check
    const result = await Model.findOneAndUpdate(
      { _id: id, __v: currentVersion },
      { 
        ...updates, 
        __v: currentVersion + 1 
      },
      { new: true }
    );
    
    if (!result) {
      // Document đã được update bởi process khác
      throw new Error('Document version conflict');
    }
    
    return result;
  }, maxRetries);
};

/**
 * Atomic array operation helper
 * @param {mongoose.Model} Model - Mongoose model
 * @param {string} id - Document ID
 * @param {string} arrayField - Tên field array
 * @param {*} value - Giá trị cần add/remove
 * @param {string} operation - 'add' hoặc 'remove'
 * @returns {Promise} - Updated document
 */
const atomicArrayOperation = async (Model, id, arrayField, value, operation = 'add') => {
  const updateOp = operation === 'add' 
    ? { $addToSet: { [arrayField]: value } }
    : { $pull: { [arrayField]: value } };
    
  return Model.findByIdAndUpdate(id, updateOp, { new: true });
};

/**
 * Batch operations với transaction
 * @param {Array} operations - Array of {model, operation, data}
 * @returns {Promise} - Array of results
 */
const batchOperations = async (operations) => {
  return withTransaction(async (session) => {
    const results = [];
    
    for (const op of operations) {
      const { model, operation, data } = op;
      
      let result;
      switch (operation) {
        case 'create':
          result = await model.create([data], { session });
          break;
        case 'update':
          result = await model.findByIdAndUpdate(data.id, data.updates, { 
            session, 
            new: true 
          });
          break;
        case 'delete':
          result = await model.findByIdAndDelete(data.id, { session });
          break;
        default:
          throw new Error(`Unsupported operation: ${operation}`);
      }
      
      results.push(result);
    }
    
    return results;
  });
};

module.exports = {
  withTransaction,
  withRetry,
  withOptimisticLocking,
  atomicArrayOperation,
  batchOperations
}; 