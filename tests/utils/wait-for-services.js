const http = require('http');

const services = [
  { name: 'Frontend', url: 'http://localhost:3227', path: '/' },
  { name: 'Backend', url: 'http://localhost:8227', path: '/products' }
];

function checkService(service, timeout = 5000) {
  return new Promise((resolve) => {
    const url = new URL(service.path, service.url);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'GET',
      timeout
    };

    const req = http.request(options, (res) => {
      resolve({ ok: res.statusCode < 500, status: res.statusCode });
    });

    req.on('error', () => {
      resolve({ ok: false, status: 0 });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, status: 0 });
    });

    req.end();
  });
}

async function waitForService(service, maxAttempts = 30, interval = 2000) {
  console.log(`Waiting for ${service.name} to be ready...`);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const result = await checkService(service);
    if (result.ok) {
      console.log(`✅ ${service.name} is ready (status: ${result.status})`);
      return true;
    }
    console.log(`⏳ Attempt ${attempt}/${maxAttempts}: ${service.name} not ready yet, retrying in ${interval}ms...`);
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  console.error(`❌ ${service.name} failed to become ready after ${maxAttempts} attempts`);
  return false;
}

async function waitForAllServices() {
  console.log('Starting service readiness check...\n');

  const results = [];
  for (const service of services) {
    const ready = await waitForService(service);
    results.push({ service, ready });
    if (!ready) break;
  }

  const allReady = results.every(r => r.ready);

  if (allReady) {
    console.log('\n🎉 All services are ready!');
  } else {
    console.log('\n❌ Some services failed to become ready');
    process.exitCode = 1;
  }

  return allReady;
}

if (require.main === module) {
  waitForAllServices();
}

module.exports = { waitForAllServices, waitForService, checkService };
