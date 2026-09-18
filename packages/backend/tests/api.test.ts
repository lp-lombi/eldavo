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
    .send({ name: 'Ada Lovelace', email: 'ada@example.com', phone: '555-0100', address: 'London', facebookUrl: ' https://facebook.com/ada ' });

  expect(created.status).toBe(201);

  const listed = await request(app).get('/clients').set('Authorization', `Bearer ${token}`);
  expect(listed.status).toBe(200);
  expect(listed.body).toHaveLength(1);
  expect(listed.body[0]).toMatchObject({
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    phone: '+549555-0100',
    address: 'London',
    facebookUrl: 'https://facebook.com/ada',
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

test('updates all client fields', async () => {
  const app = createApp(dataSource);
  const token = await login(app);
  const created = await request(app)
    .post('/clients')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Ada Lovelace' });

  const response = await request(app)
    .put(`/clients/${created.body.id}`)
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Grace Hopper', email: 'grace@example.com', phone: '555-0199', address: 'New York', facebookUrl: 'https://facebook.com/grace' });

  expect(response.status).toBe(200);
  expect(response.body).toMatchObject({
    name: 'Grace Hopper',
    email: 'grace@example.com',
    phone: '+549555-0199',
    address: 'New York',
    facebookUrl: 'https://facebook.com/grace',
  });
});

test('preserves a phone number that already has an international prefix', async () => {
  const app = createApp(dataSource);
  const token = await login(app);
  const response = await request(app)
    .post('/clients')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Grace Hopper', phone: '+34123456789' });

  expect(response.status).toBe(201);
  expect(response.body.phone).toBe('+34123456789');
});

test('deletes a client without orders', async () => {
  const app = createApp(dataSource);
  const token = await login(app);
  const created = await request(app)
    .post('/clients')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Ada Lovelace' });

  const response = await request(app)
    .delete(`/clients/${created.body.id}`)
    .set('Authorization', `Bearer ${token}`);

  expect(response.status).toBe(204);
  const listed = await request(app).get('/clients').set('Authorization', `Bearer ${token}`);
  expect(listed.body).toHaveLength(0);
});

test('rejects deleting a client with orders', async () => {
  const app = createApp(dataSource);
  const token = await login(app);
  const client = await request(app)
    .post('/clients')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Ada Lovelace' });
  await request(app)
    .post('/orders')
    .set('Authorization', `Bearer ${token}`)
    .send({ clientId: client.body.id, value: 10 });

  const response = await request(app)
    .delete(`/clients/${client.body.id}`)
    .set('Authorization', `Bearer ${token}`);

  expect(response.status).toBe(409);
});

test('lists orders and notes for a client and deletes a note', async () => {
  const app = createApp(dataSource);
  const token = await login(app);
  const client = await request(app)
    .post('/clients')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Ada Lovelace' });
  const otherClient = await request(app)
    .post('/clients')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Grace Hopper' });

  await request(app)
    .post('/orders')
    .set('Authorization', `Bearer ${token}`)
    .send({ clientId: client.body.id, value: 20 });
  await request(app)
    .post('/orders')
    .set('Authorization', `Bearer ${token}`)
    .send({ clientId: otherClient.body.id, value: 30 });

  const orders = await request(app)
    .get(`/orders?clientId=${client.body.id}`)
    .set('Authorization', `Bearer ${token}`);
  expect(orders.status).toBe(200);
  expect(orders.body).toHaveLength(1);
  expect(orders.body[0].value).toBe(20);

  const note = await request(app)
    .post(`/clients/${client.body.id}/notes`)
    .set('Authorization', `Bearer ${token}`)
    .send({ text: 'Llamar el lunes' });
  expect(note.status).toBe(201);
  expect(note.body.text).toBe('Llamar el lunes');

  const listedNotes = await request(app)
    .get(`/clients/${client.body.id}/notes`)
    .set('Authorization', `Bearer ${token}`);
  expect(listedNotes.body).toHaveLength(1);

  const deleted = await request(app)
    .delete(`/clients/${client.body.id}/notes/${note.body.id}`)
    .set('Authorization', `Bearer ${token}`);
  expect(deleted.status).toBe(204);
});

test('stores order observations and changes its status', async () => {
  const app = createApp(dataSource);
  const token = await login(app);
  const client = await request(app)
    .post('/clients')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Ada Lovelace' });

  const created = await request(app)
    .post('/orders')
    .set('Authorization', `Bearer ${token}`)
    .send({ clientId: client.body.id, title: 'Entrega de repuestos', value: 125, observations: 'Entregar por la tarde' });
  expect(created.status).toBe(201);
  expect(created.body).toMatchObject({ title: 'Entrega de repuestos', observations: 'Entregar por la tarde', status: 'pending' });

  const updated = await request(app)
    .put(`/orders/${created.body.id}`)
    .set('Authorization', `Bearer ${token}`)
    .send({ completionDate: '2026-11-15', value: 150, observations: 'Entregar por la mañana', status: 'resolved' });
  expect(updated.status).toBe(200);
  expect(updated.body).toMatchObject({ completionDate: expect.stringContaining('2026-11-15'), value: 150, observations: 'Entregar por la mañana', status: 'resolved' });
});

test('deletes an order', async () => {
  const app = createApp(dataSource);
  const token = await login(app);
  const client = await request(app)
    .post('/clients')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Ada Lovelace' });
  const created = await request(app)
    .post('/orders')
    .set('Authorization', `Bearer ${token}`)
    .send({ clientId: client.body.id, value: 125 });

  const deleted = await request(app)
    .delete(`/orders/${created.body.id}`)
    .set('Authorization', `Bearer ${token}`);
  expect(deleted.status).toBe(204);

  const orders = await request(app).get('/orders').set('Authorization', `Bearer ${token}`);
  expect(orders.body).toHaveLength(0);
});

test('exports clients, orders, and notes as CSV', async () => {
  const app = createApp(dataSource);
  const token = await login(app);
  const client = await request(app)
    .post('/clients')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Ada Lovelace' });
  await request(app)
    .post('/orders')
    .set('Authorization', `Bearer ${token}`)
    .send({ clientId: client.body.id, title: 'Entrega', value: 25 });
  await request(app)
    .post(`/clients/${client.body.id}/notes`)
    .set('Authorization', `Bearer ${token}`)
    .send({ text: 'Llamar mañana' });

  const response = await request(app).get('/export.csv').set('Authorization', `Bearer ${token}`);

  expect(response.status).toBe(200);
  expect(response.headers['content-type']).toContain('text/csv');
  expect(response.text).toContain('"tipo","id","titulo"');
  expect(response.text).toContain('Ada Lovelace');
  expect(response.text).toContain('Entrega');
  expect(response.text).toContain('Llamar mañana');
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
