/**
 * Executes an array of task functions with a bounded concurrency limit.
 *
 * @param {Array<Function>} tasks - An array of functions returning Promises.
 * @param {number} maxConcurrent - The maximum number of promises to run in parallel.
 * @returns {Promise<Array<any>>} - Resolves with an array of results in the order of the tasks (similar to Promise.allSettled).
 */
export async function runWithConcurrencyLimit(tasks, maxConcurrent) {
  const results = new Array(tasks.length);
  let currentIndex = 0;

  async function worker() {
    while (currentIndex < tasks.length) {
      const taskIndex = currentIndex++;
      try {
        const result = await tasks[taskIndex]();
        results[taskIndex] = { status: 'fulfilled', value: result };
      } catch (error) {
        results[taskIndex] = { status: 'rejected', reason: error };
      }
    }
  }

  const workers = [];
  for (let i = 0; i < Math.min(maxConcurrent, tasks.length); i++) {
    workers.push(worker());
  }

  await Promise.all(workers);
  return results;
}
