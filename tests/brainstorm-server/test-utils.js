/**
 * Shared test runner utility for brainstorm server tests.
 */

function createSuite() {
  let passed = 0;
  let failed = 0;

  /**
   * Run a test case.
   * @param {string} name - The name of the test.
   * @param {function} fn - The test function (can be sync or return a Promise).
   * @returns {Promise<void>|void}
   */
  function test(name, fn) {
    try {
      const result = fn();
      if (result instanceof Promise) {
        return result
          .then(() => {
            console.log(`  PASS: ${name}`);
            passed++;
          })
          .catch((e) => {
            console.log(`  FAIL: ${name}`);
            console.log(`    ${e.message}`);
            failed++;
          });
      } else {
        console.log(`  PASS: ${name}`);
        passed++;
      }
    } catch (e) {
      console.log(`  FAIL: ${name}`);
      console.log(`    ${e.message}`);
      failed++;
    }
  }

  /**
   * Print test summary and exit if there are failures.
   */
  function summary() {
    console.log(`\n--- Results: ${passed} passed, ${failed} failed ---`);
    if (failed > 0) {
      process.exit(1);
    }
  }

  return { test, summary };
}

module.exports = { createSuite };
