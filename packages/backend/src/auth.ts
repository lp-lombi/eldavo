import bcrypt from 'bcryptjs';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { RequestHandler } from 'express';
import { DataSource } from 'typeorm';
import { User, UserRole } from './entities/User';

const tokenLifetime = '8h';

function getJwtSecret(): string {
  return process.env.JWT_SECRET ?? 'development-secret-change-me';
}

export async function ensureAdminUser(dataSource: DataSource): Promise<void> {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) {
    return;
  }

  const repository = dataSource.getRepository(User);
  const existingUser = await repository.findOneBy({ username });
  if (!existingUser) {
    await repository.save(repository.create({
      username,
      passwordHash: await bcrypt.hash(password, 12),
      role: UserRole.ADMIN,
    }));
  }
}

export async function authenticateUser(
  dataSource: DataSource,
  username: string,
  password: string,
): Promise<{ id: number; username: string; role: UserRole } | null> {
  const user = await dataSource.getRepository(User).findOneBy({ username });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return null;
  }
  return { id: user.id, username: user.username, role: user.role };
}

export function createToken(user: { id: number; username: string; role: UserRole }): string {
  return jwt.sign({ username: user.username, role: user.role }, getJwtSecret(), {
    subject: String(user.id),
    expiresIn: tokenLifetime,
  });
}

export const requireAuth: RequestHandler = (request, response, next) => {
  const authorization = request.header('authorization');
  const [scheme, token] = authorization?.split(' ') ?? [];
  if (scheme !== 'Bearer' || !token) {
    response.status(401).json({ message: 'Authentication required' });
    return;
  }

  try {
    const payload = jwt.verify(token, getJwtSecret()) as JwtPayload;
    if (!payload.sub || typeof payload.role !== 'string') {
      response.status(401).json({ message: 'Invalid token' });
      return;
    }
    response.locals.user = { id: Number(payload.sub), role: payload.role };
    next();
  } catch {
    response.status(401).json({ message: 'Invalid or expired token' });
  }
};