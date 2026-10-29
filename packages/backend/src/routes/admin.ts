import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { DataSource } from 'typeorm';
import { User, UserRole } from '../entities/User';

export function createAdminRouter(dataSource: DataSource): Router {
  const router = Router();
  const repository = dataSource.getRepository(User);

  router.get('/users', async (_request, response) => {
    const users = await repository.find({ select: { id: true, username: true, role: true }, order: { username: 'ASC' } });
    response.json(users);
  });

  router.post('/users', async (request, response) => {
    const { username: rawUsername, password } = request.body as { username?: string; password?: string };
    const username = rawUsername?.trim();
    if (!username || !password || password.length < 6) {
      response.status(400).json({ message: 'username and a password of at least 6 characters are required' });
      return;
    }
    if (await repository.findOneBy({ username })) {
      response.status(409).json({ message: 'Username already exists' });
      return;
    }
    const user = await repository.save(repository.create({ username, passwordHash: await bcrypt.hash(password, 12), role: UserRole.USER }));
    response.status(201).json({ id: user.id, username: user.username, role: user.role });
  });

  return router;
}