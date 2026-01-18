import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';
import { User } from '../types';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export class AuthService {
  async verifyGoogleToken(token: string): Promise<{
    email: string;
    name: string;
    picture?: string;
    sub: string;
  }> {
    try {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new Error('Invalid Google token payload');
      }

      return {
        email: payload.email!,
        name: payload.name!,
        picture: payload.picture,
        sub: payload.sub,
      };
    } catch (error) {
      console.error('Google token verification error:', error);
      throw new Error('Invalid Google token');
    }
  }

  async findOrCreateUser(googleData: {
    email: string;
    name: string;
    picture?: string;
    sub: string;
  }): Promise<User> {
    let user = await prisma.user.findUnique({
      where: { googleId: googleData.sub },
    });

    if (!user) {
      // Check if user exists with same email
      const existingUser = await prisma.user.findUnique({
        where: { email: googleData.email },
      });

      if (existingUser) {
        // Update existing user with Google ID
        user = await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            googleId: googleData.sub,
            name: googleData.name,
            avatar: googleData.picture,
          },
        });
      } else {
        // Create new user
        user = await prisma.user.create({
          data: {
            email: googleData.email,
            name: googleData.name,
            avatar: googleData.picture,
            googleId: googleData.sub,
          },
        });
      }
    } else {
      // Update existing user info
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: googleData.name,
          avatar: googleData.picture,
        },
      });
    }

    return user;
  }

  generateJWT(userId: string): string {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );
  }

  generateRefreshToken(userId: string): string {
    return jwt.sign(
      { userId, type: 'refresh' },
      process.env.JWT_SECRET!,
      { expiresIn: '30d' }
    );
  }

  verifyRefreshToken(token: string): { userId: string } {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid refresh token');
    }

    return { userId: decoded.userId };
  }
}

export const authService = new AuthService();