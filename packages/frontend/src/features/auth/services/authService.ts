import { login } from '../../../services';

export const authenticate = (username: string, password: string) => login(username, password);
