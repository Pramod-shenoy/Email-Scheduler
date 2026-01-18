import { Router } from 'express';
import { authService } from '../services/authService';

const router = Router();

// Dev login for local testing
router.post('/dev-login', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required for dev login' });
    }

    // Mock Google data for dev login
    const mockGoogleData = {
      email: email,
      name: email.split('@')[0],
      picture: 'https://via.placeholder.com/150', // Placeholder avatar
      sub: 'dev_user_' + Math.random().toString(36).substring(7),
    };

    // Find or create user
    const user = await authService.findOrCreateUser({
      email: mockGoogleData.email,
      name: mockGoogleData.name,
      picture: mockGoogleData.picture,
      sub: mockGoogleData.sub,
    });

    // Generate JWT tokens
    const accessToken = authService.generateJWT(user.id);
    const refreshToken = authService.generateRefreshToken(user.id);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Dev auth error:', error);
    res.status(401).json({
      error: 'Authentication failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Google OAuth login
router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Google token is required' });
    }

    // Verify Google token
    const googleData = await authService.verifyGoogleToken(token);

    // Find or create user
    const user = await authService.findOrCreateUser(googleData);

    // Generate JWT tokens
    const accessToken = authService.generateJWT(user.id);
    const refreshToken = authService.generateRefreshToken(user.id);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({
      error: 'Authentication failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    // Verify refresh token
    const { userId } = authService.verifyRefreshToken(refreshToken);

    // Generate new access token
    const accessToken = authService.generateJWT(userId);

    res.json({ accessToken });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

export { router as authRoutes };