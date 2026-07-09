import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 },  // simulate ramp-up of traffic from 1 to 50 users over 30 seconds
    { duration: '1m', target: 50 },   // stay at 50 users for 1 minute
    { duration: '30s', target: 0 },   // ramp-down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.01'],   // http errors should be less than 1%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function loadTest() {
  const res = http.get(`${BASE_URL}/api/health`);
  check(res, {
    'status is 200': (r) => r.status === 200,
    'health check passes': (r) => r.json().overall === 'healthy',
  });
  sleep(1);
}
