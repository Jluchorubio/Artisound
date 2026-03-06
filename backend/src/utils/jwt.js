import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
    },
    env.jwtAccessSecret,
    { expiresIn: env.jwtAccessExpiresIn },
  );
}

export function signTwoFaToken(userId) {
  return jwt.sign(
    {
      sub: userId,
      twoFaPending: true,
    },
    env.jwtTwoFaSecret,
    { expiresIn: env.jwtTwoFaExpiresIn },
  );
}

export function signEmailChallengeToken(userId, purpose) {
  return jwt.sign(
    {
      sub: userId,
      emailChallenge: true,
      purpose,
    },
    env.jwtEmailChallengeSecret,
    { expiresIn: env.jwtEmailChallengeExpiresIn },
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtAccessSecret);
}

export function verifyTwoFaToken(token) {
  return jwt.verify(token, env.jwtTwoFaSecret);
}

export function verifyEmailChallengeToken(token) {
  return jwt.verify(token, env.jwtEmailChallengeSecret);
}
