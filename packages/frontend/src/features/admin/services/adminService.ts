import { createUser, getUsers } from '../../../services';

export const loadUsers = (token: string) => getUsers(token);
export const addUser = (token: string, username: string, password: string) => createUser(token, username, password);
