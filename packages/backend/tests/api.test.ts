import request from 'supertest';
import { DataSource } from 'typeorm';
import { createApp } from '../src/app';
import { createDataSource } from '../src/database';

let dataSource: DataSource;

beforeEach(async () => {
  dataSource = createDataSource(':memory:');
  await dataSource.initialize();
});

afterEach(async () => {
  await dataSource.destroy();
});

test('reports health', async () => {
  const response = await request(createApp(dataSource)).get('/health');

  expect(response.status).toBe(200);
  expect(response.body).toEqual({ status: 'ok' });
});

test('creates a client with only the required name', async () => {
  const response = await request(createApp(dataSource))
    .post('/clients')
    .send({ name: 'Ada Lovelace' });

  expect(response.status).toBe(201);
  expect(response.body).toMatchObject({ name: 'Ada Lovelace' });
  expect(response.body.email).toBeNull();
});

test('creates and lists a client with optional contact data', async () => {
  const app = createApp(dataSource);
  const created = await request(app)
    .post('/clients')
    .send({ name: 'Ada Lovelace', email: 'ada@example.com', phone: '555-0100', address: 'London' });

  expect(created.status).toBe(201);

  const listed = await request(app).get('/clients');
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
  const response = await request(createApp(dataSource)).post('/clients').send({ email: 'missing@example.com' });

  expect(response.status).toBe(400);
});

test('registers an order for an existing client', async () => {
  const app = createApp(dataSource);
  const client = await request(app).post('/clients').send({ name: 'Ada Lovelace' });

  const response = await request(app)
    .post('/orders')
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
  const missingClient = await request(app).post('/orders').send({ clientId: 999, value: 10 });
  expect(missingClient.status).toBe(404);

  const client = await request(app).post('/clients').send({ name: 'Ada' });
  const response = await request(app).post('/orders').send({ clientId: client.body.id, value: 10 });

  expect(response.status).toBe(201);
  expect(response.body.completionDate).toBeNull();
});

test('rejects invalid order data', async () => {
  const response = await request(createApp(dataSource)).post('/orders').send({ clientId: 1, value: 'invalid' });

  expect(response.status).toBe(400);
});