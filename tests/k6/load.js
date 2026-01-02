
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 20 }, // Ramp to 20 users
    { duration: '20s', target: 20 }, // Stay at 20 users
    { duration: '10s', target: 0 },  // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
  },
};

export default function () {
  // Test the Main Updates Endpoint
  const res = http.get('http://localhost:5554/api/v1/updates?range=30d');
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  // Test with Date Filter
  const resDate = http.get('http://localhost:5554/api/v1/updates?date=2025-01-01');
  check(resDate, {
    'date filter status 200': (r) => r.status === 200,
  });

  sleep(1);
}
