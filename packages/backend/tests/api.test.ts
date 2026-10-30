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
    .post('/api/auth/login')
    .send({ username: 'admin', password: 'test-password' });
  return response.body.token;
}

test('reports health', async () => {
  const response = await request(createApp(dataSource)).get('/api/health');

  expect(response.status).toBe(200);
  expect(response.body).toEqual({ status: 'ok' });
});

test('creates, updates, lists, and deletes stock items', async () => {
  const app = createApp(dataSource);
  const token = await login(app);
  const created = await request(app).post('/api/stock').set('Authorization', `Bearer ${token}`).send({ name: 'Tornillos', quantity: 12, unit: 'cajas', minimumQuantity: 5 });
  expect(created.status).toBe(201);
  expect(created.body).toMatchObject({ name: 'Tornillos', quantity: 12, unit: 'cajas', minimumQuantity: 5 });
  const updated = await request(app).put(`/api/stock/${created.body.id}`).set('Authorization', `Bearer ${token}`).send({ name: 'Tornillos grandes', quantity: 3, unit: 'cajas', minimumQuantity: 5 });
  expect(updated.status).toBe(200);
  expect(updated.body.quantity).toBe(3);
  const removed = await request(app).delete(`/api/stock/${created.body.id}`).set('Authorization', `Bearer ${token}`);
  expect(removed.status).toBe(204);
});

test('consumes and reverses stock through a resolved order', async () => {
  const app = createApp(dataSource);
  const token = await login(app);
  const stock = await request(app).post('/api/stock').set('Authorization', `Bearer ${token}`).send({ name: 'Cajas', quantity: 10, unit: 'unidades' });
  const client = await request(app).post('/api/clients').set('Authorization', `Bearer ${token}`).send({ name: 'Cliente stock' });
  const order = await request(app).post('/api/orders').set('Authorization', `Bearer ${token}`).send({ clientId: client.body.id, title: 'Salida', value: 100, status: 'resolved', stockItems: [{ stockItemId: stock.body.id, quantity: 3 }] });
  expect(order.status).toBe(201);
  expect((await request(app).get('/api/stock').set('Authorization', `Bearer ${token}`)).body[0].quantity).toBe(7);
  await request(app).put(`/api/orders/${order.body.id}`).set('Authorization', `Bearer ${token}`).send({ status: 'pending' });
  expect((await request(app).get('/api/stock').set('Authorization', `Bearer ${token}`)).body[0].quantity).toBe(10);
  await request(app).put(`/api/orders/${order.body.id}`).set('Authorization', `Bearer ${token}`).send({ status: 'resolved' });
  await request(app).delete(`/api/orders/${order.body.id}`).set('Authorization', `Bearer ${token}`);
  expect((await request(app).get('/api/stock').set('Authorization', `Bearer ${token}`)).body[0].quantity).toBe(10);
});

test('requires authentication for protected endpoints', async () => {
  const response = await request(createApp(dataSource)).get('/api/clients');

  expect(response.status).toBe(401);
});

test('logs in with username and password', async () => {
  const response = await request(createApp(dataSource))
    .post('/api/auth/login')
    .send({ username: 'admin', password: 'test-password' });

  expect(response.status).toBe(200);
  expect(response.body.token).toEqual(expect.any(String));
  expect(response.body.user).toMatchObject({ username: 'admin', role: 'admin' });
});

test('rejects invalid credentials', async () => {
  const response = await request(createApp(dataSource))
    .post('/api/auth/login')
    .send({ username: 'admin', password: 'wrong-password' });

  expect(response.status).toBe(401);
});

test('allows a user to change their own password', async () => {
  const app = createApp(dataSource);
  const token = await login(app);
  expect((await request(app).put('/api/auth/password').set('Authorization', `Bearer ${token}`).send({ currentPassword: 'wrong-password', newPassword: 'new-password' })).status).toBe(401);
  expect((await request(app).put('/api/auth/password').set('Authorization', `Bearer ${token}`).send({ currentPassword: 'test-password', newPassword: 'new-password' })).status).toBe(204);
  expect((await request(app).post('/api/auth/login').send({ username: 'admin', password: 'test-password' })).status).toBe(401);
  expect((await request(app).post('/api/auth/login').send({ username: 'admin', password: 'new-password' })).status).toBe(200);
});

test('allows only admins to create users and isolates their clients', async () => {
  const app = createApp(dataSource);
  const adminToken = await login(app);
  const created = await request(app).post('/api/admin/users').set('Authorization', `Bearer ${adminToken}`).send({ username: 'sales', password: 'sales-password' });
  expect(created.status).toBe(201);
  expect(created.body).toMatchObject({ username: 'sales', role: 'user' });

  const userLogin = await request(app).post('/api/auth/login').send({ username: 'sales', password: 'sales-password' });
  expect(userLogin.status).toBe(200);
  expect((await request(app).get('/api/clients').set('Authorization', `Bearer ${userLogin.body.token}`)).body).toEqual([]);
  expect((await request(app).post('/api/admin/users').set('Authorization', `Bearer ${userLogin.body.token}`).send({ username: 'blocked', password: 'blocked-password' })).status).toBe(403);
});

test('creates and lists appointments for the authenticated owner', async () => {
  const app = createApp(dataSource);
  const token = await login(app);
  const client = await request(app).post('/api/clients').set('Authorization', `Bearer ${token}`).send({ name: 'Cliente turno' });
  const created = await request(app).post('/api/appointments').set('Authorization', `Bearer ${token}`).send({ clientId: client.body.id, title: 'Reunión inicial', startsAt: '2026-10-21T10:00:00.000Z', endsAt: '2026-10-21T11:00:00.000Z', description: 'Revisar propuesta' });
  expect(created.status).toBe(201);
  expect(created.body).toMatchObject({ title: 'Reunión inicial', client: { name: 'Cliente turno' }, status: 'scheduled' });

  const listed = await request(app).get('/api/appointments').set('Authorization', `Bearer ${token}`);
  expect(listed.status).toBe(200);
  expect(listed.body).toHaveLength(1);
  expect(listed.body[0].description).toBe('Revisar propuesta');
});

test('rejects invalid appointment ranges and keeps appointments private', async () => {
  const app = createApp(dataSource);
  const token = await login(app);
  const invalid = await request(app).post('/api/appointments').set('Authorization', `Bearer ${token}`).send({ title: 'Turno inválido', startsAt: '2026-10-21T11:00:00.000Z', endsAt: '2026-10-21T10:00:00.000Z' });
  expect(invalid.status).toBe(400);

  const user = await request(app).post('/api/admin/users').set('Authorization', `Bearer ${token}`).send({ username: 'appointment-user', password: 'appointment-password' });
  const userToken = (await request(app).post('/api/auth/login').send({ username: 'appointment-user', password: 'appointment-password' })).body.token;
  expect((await request(app).get('/api/appointments').set('Authorization', `Bearer ${userToken}`)).body).toEqual([]);
  expect(user.status).toBe(201);
});

test('deletes an appointment for its owner', async () => {
  const app = createApp(dataSource);
  const token = await login(app);
  const created = await request(app).post('/api/appointments').set('Authorization', `Bearer ${token}`).send({ title: 'Turno a borrar', startsAt: '2026-10-21T10:00:00.000Z', endsAt: '2026-10-21T11:00:00.000Z' });
  const removed = await request(app).delete(`/api/appointments/${created.body.id}`).set('Authorization', `Bearer ${token}`);
  expect(removed.status).toBe(204);
  expect((await request(app).get('/api/appointments').set('Authorization', `Bearer ${token}`)).body).toEqual([]);
});

test('creates a client with only the required name', async () => {
  const app = createApp(dataSource);
  const response = await request(app)
    .post('/api/clients')
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
    .post('/api/clients')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Ada Lovelace', email: 'ada@example.com', phone: '555-0100', address: 'London', facebookUrl: ' https://facebook.com/ada ' });

  expect(created.status).toBe(201);

  const listed = await request(app).get('/api/clients').set('Authorization', `Bearer ${token}`);
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
    .post('/api/clients')
    .set('Authorization', `Bearer ${await login(app)}`)
    .send({ email: 'missing@example.com' });

  expect(response.status).toBe(400);
});

test('updates all client fields', async () => {
  const app = createApp(dataSource);
  const token = await login(app);
  const created = await request(app)
    .post('/api/clients')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Ada Lovelace' });

  const response = await request(app)
    .put(`/api/clients/${created.body.id}`)
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

test('creates, assigns, updates, and deletes client tags', async () => {
  const app = createApp(dataSource);
  const token = await login(app);
  const tag = await request(app)
    .post('/api/tags')
    .set('Authorization', `Bearer ${token}`)
    .send({ color: '#ff8800', name: 'VIP' });
  expect(tag.status).toBe(201);

  const created = await request(app)
    .post('/api/clients')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Ada Lovelace', tagIds: [tag.body.id] });
  expect(created.status).toBe(201);
  expect(tag.body.color).toBe('#ff8800');
  expect(created.body.tags).toEqual([{ color: '#ff8800', id: tag.body.id, name: 'VIP' }]);

  const updatedTag = await request(app)
    .put(`/api/tags/${tag.body.id}`)
    .set('Authorization', `Bearer ${token}`)
    .send({ color: '#00aa55', name: 'Preferente' });
  expect(updatedTag.status).toBe(200);

  const listed = await request(app).get('/api/clients').set('Authorization', `Bearer ${token}`);
  expect(listed.body[0].tags).toEqual([{ color: '#00aa55', id: tag.body.id, name: 'Preferente' }]);

  const deleted = await request(app)
    .delete(`/api/tags/${tag.body.id}`)
    .set('Authorization', `Bearer ${token}`);
  expect(deleted.status).toBe(204);
});

test('preserves a phone number that already has an international prefix', async () => {
  const app = createApp(dataSource);
  const token = await login(app);
  const response = await request(app)
    .post('/api/clients')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Grace Hopper', phone: '+34123456789' });

  expect(response.status).toBe(201);
  expect(response.body.phone).toBe('+34123456789');
});

test('deletes a client without orders', async () => {
  const app = createApp(dataSource);
  const token = await login(app);
  const created = await request(app)
    .post('/api/clients')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Ada Lovelace' });

  const response = await request(app)
    .delete(`/api/clients/${created.body.id}`)
    .set('Authorization', `Bearer ${token}`);

  expect(response.status).toBe(204);
  const listed = await request(app).get('/api/clients').set('Authorization', `Bearer ${token}`);
  expect(listed.body).toHaveLength(0);
});

test('rejects deleting a client with orders', async () => {
  const app = createApp(dataSource);
  const token = await login(app);
  const client = await request(app)
    .post('/api/clients')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Ada Lovelace' });
  await request(app)
    .post('/api/orders')
    .set('Authorization', `Bearer ${token}`)
    .send({ clientId: client.body.id, value: 10 });

  const response = await request(app)
    .delete(`/api/clients/${client.body.id}`)
    .set('Authorization', `Bearer ${token}`);

  expect(response.status).toBe(409);
});

test('lists orders and notes for a client and deletes a note', async () => {
  const app = createApp(dataSource);
  const token = await login(app);
  const client = await request(app)
    .post('/api/clients')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Ada Lovelace' });
  const otherClient = await request(app)
    .post('/api/clients')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Grace Hopper' });

  await request(app)
    .post('/api/orders')
    .set('Authorization', `Bearer ${token}`)
    .send({ clientId: client.body.id, value: 20 });
  await request(app)
    .post('/api/orders')
    .set('Authorization', `Bearer ${token}`)
    .send({ clientId: otherClient.body.id, value: 30 });

  const orders = await request(app)
    .get(`/api/orders?clientId=${client.body.id}`)
    .set('Authorization', `Bearer ${token}`);
  expect(orders.status).toBe(200);
  expect(orders.body).toHaveLength(1);
  expect(orders.body[0].value).toBe(20);

  const note = await request(app)
    .post(`/api/clients/${client.body.id}/notes`)
    .set('Authorization', `Bearer ${token}`)
    .send({ text: 'Llamar el lunes' });
  expect(note.status).toBe(201);
  expect(note.body.text).toBe('Llamar el lunes');

  const listedNotes = await request(app)
    .get(`/api/clients/${client.body.id}/notes`)
    .set('Authorization', `Bearer ${token}`);
  expect(listedNotes.body).toHaveLength(1);

  const deleted = await request(app)
    .delete(`/api/clients/${client.body.id}/notes/${note.body.id}`)
    .set('Authorization', `Bearer ${token}`);
  expect(deleted.status).toBe(204);
});

test('stores order observations and changes its status', async () => {
  const app = createApp(dataSource);
  const token = await login(app);
  const client = await request(app)
    .post('/api/clients')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Ada Lovelace' });

  const created = await request(app)
    .post('/api/orders')
    .set('Authorization', `Bearer ${token}`)
    .send({ clientId: client.body.id, title: 'Entrega de repuestos', value: 125, observations: 'Entregar por la tarde' });
  expect(created.status).toBe(201);
  expect(created.body).toMatchObject({ title: 'Entrega de repuestos', observations: 'Entregar por la tarde', status: 'pending' });

  const updated = await request(app)
    .put(`/api/orders/${created.body.id}`)
    .set('Authorization', `Bearer ${token}`)
    .send({ completionDate: '2026-11-15', value: 150, observations: 'Entregar por la mañana', status: 'resolved' });
  expect(updated.status).toBe(200);
  expect(updated.body).toMatchObject({ completionDate: expect.stringContaining('2026-11-15'), value: 150, observations: 'Entregar por la mañana', status: 'resolved' });
});

test('deletes an order', async () => {
  const app = createApp(dataSource);
  const token = await login(app);
  const client = await request(app)
    .post('/api/clients')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Ada Lovelace' });
  const created = await request(app)
    .post('/api/orders')
    .set('Authorization', `Bearer ${token}`)
    .send({ clientId: client.body.id, value: 125 });

  const deleted = await request(app)
    .delete(`/api/orders/${created.body.id}`)
    .set('Authorization', `Bearer ${token}`);
  expect(deleted.status).toBe(204);

  const orders = await request(app).get('/api/orders').set('Authorization', `Bearer ${token}`);
  expect(orders.body).toHaveLength(0);
});

test('exports clients, orders, and notes as CSV', async () => {
  const app = createApp(dataSource);
  const token = await login(app);
  const client = await request(app)
    .post('/api/clients')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Ada Lovelace' });
  await request(app)
    .post('/api/orders')
    .set('Authorization', `Bearer ${token}`)
    .send({ clientId: client.body.id, title: 'Entrega', value: 25 });
  await request(app)
    .post(`/api/clients/${client.body.id}/notes`)
    .set('Authorization', `Bearer ${token}`)
    .send({ text: 'Llamar mañana' });

  const response = await request(app).get('/api/export.csv').set('Authorization', `Bearer ${token}`);

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
    .post('/api/clients')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Ada Lovelace' });

  const response = await request(app)
    .post('/api/orders')
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
    .post('/api/orders')
    .set('Authorization', `Bearer ${token}`)
    .send({ clientId: 999, value: 10 });
  expect(missingClient.status).toBe(404);

  const client = await request(app)
    .post('/api/clients')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Ada' });
  const response = await request(app)
    .post('/api/orders')
    .set('Authorization', `Bearer ${token}`)
    .send({ clientId: client.body.id, value: 10 });

  expect(response.status).toBe(201);
  expect(response.body.completionDate).toBeNull();
});

test('rejects invalid order data', async () => {
  const app = createApp(dataSource);
  const response = await request(app)
    .post('/api/orders')
    .set('Authorization', `Bearer ${await login(app)}`)
    .send({ clientId: 1, value: 'invalid' });

  expect(response.status).toBe(400);
});

test('receives public booking requests without blocking until confirmation', async () => {
  const app = createApp(dataSource);
  const token = await login(app);
  const existingClient = await request(app)
    .post('/api/clients')
    .set('Authorization', 'Bearer ' + token)
    .send({ name: 'Cliente ya registrado', email: 'PUBLICO@example.com' });
  expect(existingClient.status).toBe(201);
  const profile = await request(app).get('/api/public-booking/admin');
  expect(profile.status).toBe(200);

  const publicRequest = await request(app)
    .post('/api/public-booking/admin/requests')
    .send({ name: 'Cliente público', email: 'publico@example.com', startsAt: '2026-10-22T10:00:00.000Z', endsAt: '2026-10-22T11:00:00.000Z' });
  expect(publicRequest.status).toBe(201);
  const pending = await request(app).get('/api/appointments').set('Authorization', 'Bearer ' + token);
  expect(pending.status).toBe(200);
  expect(pending.body).toHaveLength(0);

  const requests = await request(app).get('/api/appointment-requests').set('Authorization', 'Bearer ' + token);
  expect(requests.body).toHaveLength(1);
  const confirmed = await request(app).post(`/api/appointment-requests/${requests.body[0].id}/confirm`).set('Authorization', 'Bearer ' + token);
  expect(confirmed.status).toBe(201);
  expect(confirmed.body.client.email).toBe('PUBLICO@example.com');
  expect(confirmed.body.client.id).toBe(existingClient.body.id);
  const clients = await request(app).get('/api/clients').set('Authorization', 'Bearer ' + token);
  expect(clients.body.filter((client: { email: string }) => client.email.toLocaleLowerCase() === 'publico@example.com')).toHaveLength(1);
  const appointments = await request(app).get('/api/appointments').set('Authorization', 'Bearer ' + token);
  expect(appointments.body).toHaveLength(1);
});

test('returns one-hour public availability slots and rejects custom durations', async () => {
  const app = createApp(dataSource);
  const token = await login(app);
  const appointment = await request(app)
    .post('/api/appointments')
    .set('Authorization', 'Bearer ' + token)
    .send({ title: 'Ocupado', startsAt: '2099-10-22T10:00:00', endsAt: '2099-10-22T11:00:00' });
  expect(appointment.status).toBe(201);

  const availability = await request(app).get('/api/public-booking/admin/availability?date=2099-10-22');
  expect(availability.status).toBe(200);
  expect(availability.body).toHaveLength(9);
  expect(availability.body.filter((slot: { available: boolean }) => !slot.available)).toHaveLength(1);
  expect(availability.body.filter((slot: { available: boolean }) => slot.available)).toHaveLength(8);

  const invalidDuration = await request(app)
    .post('/api/public-booking/admin/requests')
    .send({ name: 'Cliente', email: 'cliente@example.com', startsAt: '2099-10-22T09:00:00', endsAt: '2099-10-22T10:30:00' });
  expect(invalidDuration.status).toBe(400);
});
