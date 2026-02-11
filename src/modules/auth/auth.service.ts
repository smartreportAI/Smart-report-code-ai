import { User } from './user.model.js';
import { hashPassword, comparePassword } from '../../utils/password.js';
import type { JwtPayload } from '../../types/index.js';

export interface RegisterResult {
  id: string;
  email: string;
  createdAt: Date;
}

export interface LoginResult {
  token: string;
}

export async function register(email: string, password: string): Promise<RegisterResult> {
  const hashed = await hashPassword(password);
  const user = await User.create({ email, password: hashed });
  return {
    id: user._id.toString(),
    email: user.email,
    createdAt: user.createdAt,
  };
}

export async function login(email: string, password: string, sign: (payload: JwtPayload) => string): Promise<LoginResult> {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new Error('Invalid email or password');
  }
  const valid = await comparePassword(password, user.password);
  if (!valid) {
    throw new Error('Invalid email or password');
  }
  const token = sign({
    sub: user._id.toString(),
    email: user.email,
  });
  return { token };
}
