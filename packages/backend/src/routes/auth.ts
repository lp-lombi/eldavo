import { Router } from 'express';
import { DataSource } from 'typeorm';
import { authenticateUser, createToken } from '../auth';

export function createAuthRouter(dataSource: DataSource): Router {
  const router = Router();

  router.post('/login', async (request, response) => {
    const { username, password } = request.body as { username?: string; password?: string };
    if (!username || !password) {
      response.status(400).json({ message: 'username and password are required' });
      return;
    }

    const user = await authenticateUser(dataSource, username, password);
    if (!user) {
      response.status(401).json({ message: 'Invalid username or password' });
      return;
    }

    response.json({
      token: createToken(user),
      user: { id: user.id, username: user.username, role: user.role },
    });
  });

  return router;
}