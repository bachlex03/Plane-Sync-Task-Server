/**
 * Utility functions for batching and async operations
 */

/**
 * Sleep utility function
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after the specified time
 */
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Process items in batches with concurrent execution and sleep between batches
 * @param {Array} items - Array of items to process
 * @param {Function} processor - Async function to process each item
 * @param {Object} options - Configuration options
 * @param {number} options.batchSize - Number of items to process concurrently per batch (default: 20)
 * @param {number} options.sleepMs - Milliseconds to sleep between batches (default: 2000)
 * @param {Function} options.onBatchStart - Callback when batch starts (batchNumber, totalBatches, batchSize)
 * @param {Function} options.onItemStart - Callback when item processing starts (item, index, total)
 * @param {Function} options.onItemSuccess - Callback when item processing succeeds (item, result, index)
 * @param {Function} options.onItemError - Callback when item processing fails (item, error, index)
 * @param {Function} options.onBatchComplete - Callback when batch completes (batchNumber, results, timing)
 * @param {Function} options.onAllComplete - Callback when all batches complete (totalResults)
 * @returns {Promise<Object>} Results summary with successful, failed, and timing information
 */
export async function processBatches(items, processor, options = {}) {
  const {
    batchSize = 20,
    sleepMs = 2000,
    onBatchStart,
    onItemStart,
    onItemSuccess,
    onItemError,
    onBatchComplete,
    onAllComplete,
  } = options;

  const totalBatches = Math.ceil(items.length / batchSize);
  const allResults = [];
  const startTime = Date.now();

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;

    // Notify batch start
    if (onBatchStart) {
      onBatchStart(batchNumber, totalBatches, batch.length);
    }

    // Start timing for this batch
    const batchStartTime = Date.now();

    // Process all items in this batch concurrently
    const batchPromises = batch.map(async (item, index) => {
      const globalIndex = i + index;

      try {
        // Notify item start
        if (onItemStart) {
          onItemStart(item, globalIndex + 1, items.length);
        }

        // Process the item
        const result = await processor(item, globalIndex);

        // Notify item success
        if (onItemSuccess) {
          onItemSuccess(item, result, globalIndex);
        }

        return { success: true, result, index: globalIndex };
      } catch (error) {
        // Notify item error
        if (onItemError) {
          onItemError(item, error, globalIndex);
        }

        return { success: false, error, index: globalIndex };
      }
    });

    // Wait for all items in this batch to complete
    const batchResults = await Promise.allSettled(batchPromises);
    const processedResults = batchResults.map((r) =>
      r.status === "fulfilled"
        ? r.value
        : { success: false, error: r.reason, index: -1 }
    );

    // Calculate timing for this batch
    const batchEndTime = Date.now();
    const batchTime = batchEndTime - batchStartTime;

    // Store batch results
    allResults.push(...processedResults);

    // Notify batch completion
    if (onBatchComplete) {
      const successful = processedResults.filter((r) => r.success).length;
      const failed = processedResults.length - successful;
      onBatchComplete(
        batchNumber,
        { successful, failed, batchTime },
        processedResults
      );
    }

    // Sleep between batches (except after the last batch)
    if (i + batchSize < items.length) {
      await sleep(sleepMs);
    }
  }

  // Calculate total timing
  const endTime = Date.now();
  const totalTime = endTime - startTime;

  // Calculate final results
  const successful = allResults.filter((r) => r.success).length;
  const failed = allResults.length - successful;

  const finalResults = {
    successful,
    failed,
    total: allResults.length,
    totalTime,
    results: allResults,
  };

  // Notify all completion
  if (onAllComplete) {
    onAllComplete(finalResults);
  }

  return finalResults;
}

/**
 * Create a batching processor specifically for API calls
 * @param {Function} apiCall - The API function to call
 * @param {Object} options - Configuration options
 * @returns {Function} Configured processor function
 */
export function createApiBatchProcessor(apiCall, options = {}) {
  return async function apiProcessor(item, index) {
    return await apiCall(item);
  };
}
