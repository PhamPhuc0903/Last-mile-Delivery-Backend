const services = [
  ['api-gateway', 'http://localhost:3000/health'],
  ['auth-service', 'http://localhost:3001/health'],
  ['user-service', 'http://localhost:3008/health'],
  ['order-service', 'http://localhost:3002/health'],
  ['payment-service', 'http://localhost:3011/health'],
  ['driver-service', 'http://localhost:3003/health'],
  ['dispatch-service', 'http://localhost:3005/health'],
  ['tracking-service', 'http://localhost:3004/health'],
  ['notification-service', 'http://localhost:3006/health'],
  ['ai-service', 'http://localhost:3007/health'],
  ['chatbot-service', 'http://localhost:3010/health'],
  ['admin-service', 'http://localhost:3009/health']
];

const timeout = (ms) => new Promise((_, reject) =>
  setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
);

const check = async ([name, url]) => {
  const startedAt = Date.now();

  try {
    const response = await Promise.race([
      fetch(url),
      timeout(5000)
    ]);

    const ms = Date.now() - startedAt;
    const ok = response.ok;
    let body = null;

    try {
      body = await response.json();
    } catch {}

    return {
      name,
      url,
      status: ok ? 'UP' : 'DOWN',
      httpStatus: response.status,
      responseTimeMs: ms,
      body
    };
  } catch (error) {
    return {
      name,
      url,
      status: 'DOWN',
      error: error.message,
      responseTimeMs: Date.now() - startedAt
    };
  }
};

const results = await Promise.all(services.map(check));

console.table(results.map((item) => ({
  service: item.name,
  status: item.status,
  httpStatus: item.httpStatus || '-',
  responseTimeMs: item.responseTimeMs,
  error: item.error || ''
})));

const down = results.filter((item) => item.status !== 'UP');

if (down.length > 0) {
  console.error(`\n${down.length} service DOWN:`);
  for (const item of down) {
    console.error(`- ${item.name}: ${item.error || item.httpStatus}`);
  }
  process.exit(1);
}

console.log('\nAll services are UP.');