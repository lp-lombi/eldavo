import request from 'supertest';
import { DataSource } from 'typeorm';
import { createApp } from '../src/app';
import { ensureAdminUser } from '../src/auth';
import { createDataSource } from '../src/database';

let dataSource: DataSource;

beforeEach(async () => {
  process.env.ADMIN_USERNAME = 'admin';
  process.env.ADMIN_PASSWORD = 'test-password';
  process.env.JWT_SECRET = 'test-secret';
  dataSource = createDataSource(':memory:');
  await dataSource.initialize();
  await ensureAdminUser(dataSource);
});

afterEach(async () => {
  await dataSource.destroy();
  delete process.env.ADMIN_USERNAME;
  delete process.env.ADMIN_PASSWORD;
  delete process.env.JWT_SECRET;
});

async function login(app: ReturnType<typeof createApp>): Promise<string> {
  const response = await request(app)
    .post('/auth/login')
    .send({ username: 'admin', password: 'test-password' });
  return response.body.token;
}

test('reports health', async () => {
  const response = await request(createApp(dataSource)).get('/health');

  expect(response.status).toBe(200);
  expect(response.body).toEqual({ status: 'ok' });
});

test('requires authentication for protected endpoints', async () => {
  const response = await request(createApp(dataSource)).get('/clients');

  expect(response.status).toBe(401);
});

test('logs in with username and password', async () => {
  const response = await request(createApp(dataSource))
    .post('/auth/login')
    .send({ username: 'admin', password: 'test-password' });

  expect(response.status).toBe(200);
  expect(response.body.token).toEqual(expect.any(String));
  expect(response.body.user).toMatchObject({ username: 'admin', role: 'admin' });
});

test('rejects invalid credentials', async () => {
  const response = await request(createApp(dataSource))
    .post('/auth/login')
    .send({ username: 'admin', password: 'wrong-password' });

  expect(response.status).toBe(401);
});

test('creates a client with only the required name', async () => {
  const app = createApp(dataSource);
  const response = await request(app)
    .post('/clients')
    .set('Authorization', `Bearer ${await login(app)}`)
    .send({ name: 'Ada Lovelace' });

  expect(response.status).toBe(201);
  expect(response.body).toMatchObject({ name: 'Ada Lovelace' });
  expect(response.body.email).toBeNull();
});

test('creates and lists a client with optional contact data', async () => {
  const app = createApp(dataSource);
  const token = await login(app);
  const created = await request(app)
    .post('/clients')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Ada Lovelace', email: 'ada@example.com', phone: '555-0100', address: 'London' });

  expect(created.status).toBe(201);

  const listed = await request(app).get('/clients').set('Authorization', `Bearer ${token}`);
  expect(listed.status).toBe(200);
  expect(listed.body).toHaveLength(1);
  expect(listed.body[0]).toMatchObject({
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    phone: '555-0100',
    address: 'London',
  });
});

test('requires a client name', async () => {
  const app = createApp(dataSource);
  const response = await request(app)
    .post('/clients')
    .set('Authorization', `Bearer ${await login(app)}`)
    .send({ email: 'missing@example.com' });

  expect(response.status).toBe(400);
});

test('registers an order for an existing client', async () => {
  const app = createApp(dataSource);
  const token = await login(app);
  const client = await request(app)
    .post('/clients')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Ada Lovelace' });

  const response = await request(app)
    .post('/orders')
    .set('Authorization', `Bearer ${token}`)
    .send({ clientId: client.body.id, value: 125.5, completionDate: '2026-10-01' });

  expect(response.status).toBe(201);
  expect(response.body).toMatchObject({
    clientId: client.body.id,
    value: 125.5,
    client: { name: 'Ada Lovelace' },
  });
  expect(response.body.createdAt).toBeDefined();
  expect(response.body.completionDate).toContain('2026-10-01');
});

test('allows an order without completion date and rejects unknown clients', async () => {
  const app = createApp(dataSource);
  const token = await login(app);
  const missingClient = await request(app)
    .post('/orders')
    .set('Authorization', `Bearer ${token}`)
    .send({ clientId: 999, value: 10 });
  expect(missingClient.status).toBe(404);

  const client = await request(app)
    .post('/clients')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Ada' });
  const response = await request(app)
    .post('/orders')
    .set('Authorization', `Bearer ${token}`)
    .send({ clientId: client.body.id, value: 10 });

  expect(response.status).toBe(201);
  expect(response.body.completionDate).toBeNull();
});

test('rejects invalid order data', async () => {
  const app = createApp(dataSource);
  const response = await request(app)
    .post('/orders')
    .set('Authorization', `Bearer ${await login(app)}`)
    .send({ clientId: 1, value: 'invalid' });

  expect(response.status).toBe(400);
});
