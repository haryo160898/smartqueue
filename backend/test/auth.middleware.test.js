const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { authMiddleware, adminMiddleware } = require('../dist/middleware/auth');

function createRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  return res;
}

test('authMiddleware rejects requests without a token', (t) => {
  const req = { headers: {} };
  const res = createRes();
  let nextCalled = false;

  authMiddleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.success, false);
});

test('authMiddleware accepts a valid token and attaches the user', (t) => {
  process.env.JWT_SECRET = 'test-secret';
  const token = jwt.sign({ id: 1, email: 'user@example.com', role: 'user' }, 'test-secret');
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = createRes();
  let nextCalled = false;

  authMiddleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(req.user.role, 'user');
  assert.equal(res.statusCode, 200);
});

test('adminMiddleware blocks non-admin users', (t) => {
  const req = { user: { role: 'user' } };
  const res = createRes();
  let nextCalled = false;

  adminMiddleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
  assert.equal(res.body.success, false);
});

test('adminMiddleware allows admin users', (t) => {
  const req = { user: { role: 'admin' } };
  const res = createRes();
  let nextCalled = false;

  adminMiddleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, 200);
});
