const { waitForAllServices } = require('./wait-for-services');

async function globalSetup(config) {
  console.log('Running global setup...');

  const allReady = await waitForAllServices();
  if (!allReady) {
    throw new Error('Services are not ready. Please check that frontend and backend are running.');
  }

  console.log('Global setup completed successfully.');
}

module.exports = globalSetup;
