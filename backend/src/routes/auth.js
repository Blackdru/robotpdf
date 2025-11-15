const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { supabase, supabaseAdmin } = require('../config/supabase');
const { validateRequest, schemas } = require('../middleware/validation');
const { generateOTP, sendOTPEmail, sendWelcomeEmail } = require('../services/emailService');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';
const REFRESH_TOKEN_EXPIRES_IN = '30d';

// Helper function to generate tokens
const generateTokens = (userId, email) => {
  const accessToken = jwt.sign(
    { userId, email, type: 'access' },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  const refreshToken = jwt.sign(
    { userId, email, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  );

  return { accessToken, refreshToken };
};

// Register new user - Step 1: Send OTP
router.post('/register', validateRequest(schemas.register), async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email_verified, auth_provider')
      .eq('email', email)
      .single();

    if (existingUser && existingUser.email_verified) {
      // User already exists and is verified - block signup, tell them to login
      return res.status(400).json({ 
        error: 'Account already exists. Please log in instead.',
        shouldLogin: true,
        authProvider: existingUser.auth_provider
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in database
    const { error: otpError } = await supabaseAdmin
      .from('otp_codes')
      .insert([
        {
          email,
          otp_code: otp,
          type: 'verification',
          expires_at: expiresAt.toISOString()
        }
      ]);

    if (otpError) {
      console.error('OTP storage error:', otpError);
      return res.status(500).json({ error: 'Failed to generate OTP' });
    }

    // Hash password and store temporarily (we'll create user after verification)
    const passwordHash = await bcrypt.hash(password, 10);

    // Store user data temporarily (or update if exists)
    if (existingUser) {
      await supabaseAdmin
        .from('users')
        .update({ password_hash: passwordHash, name, auth_provider: 'email' })
        .eq('email', email);
    } else {
      // Create unverified user
      const { error: userError } = await supabaseAdmin
        .from('users')
        .insert([
          {
            email,
            name,
            password_hash: passwordHash,
            email_verified: false,
            auth_provider: 'email',
            role: 'user'
          }
        ]);

      if (userError) {
        console.error('User creation error:', userError);
        return res.status(500).json({ error: 'Failed to create user' });
      }
    }

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp, 'verification');

    if (!emailResult.success) {
      return res.status(500).json({ error: 'Failed to send verification email' });
    }

    res.status(200).json({
      message: 'OTP sent to your email. Please verify to complete registration.',
      email
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Verify OTP and complete registration
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    // Find valid OTP
    const { data: otpData, error: otpError } = await supabaseAdmin
      .from('otp_codes')
      .select('*')
      .eq('email', email)
      .eq('otp_code', otp)
      .eq('type', 'verification')
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (otpError || !otpData) {
      console.error('OTP verification failed:', otpError);
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Mark OTP as used
    await supabaseAdmin
      .from('otp_codes')
      .update({ used: true, used_at: new Date().toISOString() })
      .eq('id', otpData.id);

    // Update user as verified
    const { data: user, error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        email_verified: true,
        verified_at: new Date().toISOString()
      })
      .eq('email', email)
      .select()
      .single();

    if (updateError) {
      console.error('User verification error:', updateError);
      return res.status(500).json({ error: 'Failed to verify user' });
    }

    // Create subscription for new user
    const { error: subError } = await supabaseAdmin
      .from('subscriptions')
      .insert([
        {
          user_id: user.id,
          plan: 'free',
          status: 'active',
          started_at: new Date().toISOString()
        }
      ]);

    if (subError) {
      console.error('Subscription creation error:', subError);
    }

    // Send welcome email
    await sendWelcomeEmail(email, user.name);

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id, user.email);

    // Store session
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    await supabaseAdmin
      .from('user_sessions')
      .insert([
        {
          user_id: user.id,
          token: accessToken,
          refresh_token: refreshToken,
          expires_at: expiresAt.toISOString(),
          ip_address: req.ip,
          user_agent: req.headers['user-agent']
        }
      ]);

    res.status(200).json({
      message: 'Email verified successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        email_verified: user.email_verified
      },
      session: {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: 7 * 24 * 60 * 60 // 7 days in seconds
      }
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Resend OTP
router.post('/resend-otp', async (req, res) => {
  try {
    const { email, type = 'verification' } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists
    const { data: user } = await supabase
      .from('users')
      .select('email_verified')
      .eq('email', email)
      .single();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (type === 'verification' && user.email_verified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP
    const { error: otpError } = await supabaseAdmin
      .from('otp_codes')
      .insert([
        {
          email,
          otp_code: otp,
          type,
          expires_at: expiresAt.toISOString()
        }
      ]);

    if (otpError) {
      console.error('OTP storage error:', otpError);
      return res.status(500).json({ error: 'Failed to generate OTP' });
    }

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp, type);

    if (!emailResult.success) {
      return res.status(500).json({ error: 'Failed to send OTP email' });
    }

    res.status(200).json({
      message: 'OTP sent successfully',
      email
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ error: 'Failed to resend OTP' });
  }
});

// Login user
router.post('/login', validateRequest(schemas.login), async (req, res) => {
  try {
    const { email, password } = req.body;

    // Get user from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if email is verified
    if (!user.email_verified) {
      return res.status(401).json({ 
        error: 'Email not verified. Please verify your email first.',
        needsVerification: true 
      });
    }

    // Check if user has a password set (they might have signed up with OAuth only)
    if (!user.password_hash) {
      // User signed up with Google, doesn't have password
      return res.status(401).json({ 
        error: 'This account was created with Google. Please continue with Google.',
        useGoogle: true 
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update auth_provider to 'both' if they're logging in with password after Google signup
    if (user.auth_provider === 'google') {
      await supabaseAdmin
        .from('users')
        .update({ auth_provider: 'both' })
        .eq('id', user.id);
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id, user.email);

    // Store session
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    await supabase
      .from('user_sessions')
      .insert([
        {
          user_id: user.id,
          token: accessToken,
          refresh_token: refreshToken,
          expires_at: expiresAt.toISOString(),
          ip_address: req.ip,
          user_agent: req.headers['user-agent']
        }
      ]);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        email_verified: user.email_verified
      },
      session: {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: 7 * 24 * 60 * 60 // 7 days in seconds
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Logout user
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Delete session
      await supabase
        .from('user_sessions')
        .delete()
        .eq('token', token);
    }

    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refresh_token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    if (decoded.type !== 'refresh') {
      return res.status(401).json({ error: 'Invalid token type' });
    }

    // Check if session exists
    const { data: session } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('refresh_token', refresh_token)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (!session) {
      return res.status(401).json({ error: 'Session expired or invalid' });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
      decoded.userId,
      decoded.email
    );

    // Update session
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await supabase
      .from('user_sessions')
      .update({
        token: accessToken,
        refresh_token: newRefreshToken,
        expires_at: expiresAt.toISOString(),
        last_used_at: new Date().toISOString()
      })
      .eq('id', session.id);

    res.json({
      message: 'Token refreshed successfully',
      session: {
        access_token: accessToken,
        refresh_token: newRefreshToken,
        expires_in: 7 * 24 * 60 * 60
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

// Request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists
    const { data: user } = await supabase
      .from('users')
      .select('id, email_verified')
      .eq('email', email)
      .single();

    // Always return success to prevent email enumeration
    if (!user || !user.email_verified) {
      return res.status(200).json({
        message: 'If the email exists, a password reset OTP has been sent'
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP
    await supabaseAdmin
      .from('otp_codes')
      .insert([
        {
          email,
          otp_code: otp,
          type: 'password_reset',
          expires_at: expiresAt.toISOString()
        }
      ]);

    // Send OTP email
    await sendOTPEmail(email, otp, 'password_reset');

    res.status(200).json({
      message: 'If the email exists, a password reset OTP has been sent'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// Reset password with OTP
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, OTP, and new password are required' });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // Find valid OTP
    const { data: otpData, error: otpError } = await supabaseAdmin
      .from('otp_codes')
      .select('*')
      .eq('email', email)
      .eq('otp_code', otp)
      .eq('type', 'password_reset')
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (otpError || !otpData) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Mark OTP as used
    await supabaseAdmin
      .from('otp_codes')
      .update({ used: true, used_at: new Date().toISOString() })
      .eq('id', otpData.id);

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update user password
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('email', email);

    if (updateError) {
      console.error('Password update error:', updateError);
      return res.status(500).json({ error: 'Failed to reset password' });
    }

    // Invalidate all existing sessions for this user
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (user) {
      await supabaseAdmin
        .from('user_sessions')
        .delete()
        .eq('user_id', user.id);
    }

    res.status(200).json({
      message: 'Password reset successfully. Please login with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    
    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get user from database
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, role, email_verified, created_at')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Google OAuth Login - allows existing users to login
router.get('/google', async (req, res) => {
  try {
    // Use Supabase OAuth but with better error handling
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account'
        }
      }
    });

    if (error) {
      console.error('Google OAuth error:', error);
      const redirectUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${redirectUrl}/login?error=oauth_failed&message=${encodeURIComponent(error.message)}`);
    }

    if (data?.url) {
      res.redirect(data.url);
    } else {
      throw new Error('No OAuth URL returned');
    }
  } catch (error) {
    console.error('Google OAuth error:', error);
    const redirectUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${redirectUrl}/login?error=oauth_failed&message=OAuth initialization failed`);
  }
});

// Google OAuth Signup - blocks if user already exists
router.get('/google-signup', async (req, res) => {
  try {
    // Use Supabase OAuth but with better error handling
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account'
        }
      }
    });

    if (error) {
      console.error('Google OAuth signup error:', error);
      const redirectUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${redirectUrl}/register?error=oauth_failed&message=${encodeURIComponent(error.message)}`);
    }

    if (data?.url) {
      res.redirect(data.url);
    } else {
      throw new Error('No OAuth URL returned');
    }
  } catch (error) {
    console.error('Google OAuth signup error:', error);
    const redirectUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${redirectUrl}/register?error=oauth_failed&message=OAuth initialization failed`);
  }
});

// OAuth callback - handles both login and signup intents
router.get('/callback', async (req, res) => {
  try {
    const { code, intent } = req.query;

    if (!code) {
      console.error('OAuth callback missing authorization code');
      const redirectUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${redirectUrl}/login?error=oauth_failed&message=Authorization failed. Please try again.`);
    }

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Check if user with this email already exists in our database
    if (data.user) {
      const googleEmail = data.user.email;
      const googleId = data.user.id;
      const googleName = data.user.user_metadata?.full_name || data.user.user_metadata?.name || googleEmail.split('@')[0];

      // Check for existing user with this email
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', googleEmail)
        .single();

      if (existingUser) {
        // User already exists
        if (intent === 'signup') {
          // Block signup attempt - redirect with error
          const redirectUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
          return res.redirect(`${redirectUrl}/register?error=account_exists&message=Account already exists. Please log in instead.`);
        }
        
        console.log(`Linking Google account to existing user: ${existingUser.id} (${existingUser.email})`);
        console.log(`Existing auth_provider: ${existingUser.auth_provider}, has password: ${!!existingUser.password_hash}`);
        
        // User exists and this is a login - link the Google account to existing user
        const newAuthProvider = existingUser.password_hash ? 'both' : 'google';
        
        const { error: updateError } = await supabaseAdmin
          .from('users')
          .update({ 
            google_id: googleId,
            auth_provider: newAuthProvider,
            email_verified: true,
            verified_at: existingUser.verified_at || new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingUser.id);
        
        console.log(`Updating user ${existingUser.id} auth_provider to: ${newAuthProvider}`);

        if (updateError) {
          console.error('Error updating user with Google info:', updateError);
          throw new Error('Failed to link Google account');
        }

        // Ensure user has a subscription (create free if none exists)
        const { data: existingSubscription } = await supabaseAdmin
          .from('subscriptions')
          .select('id, plan, status')
          .eq('user_id', existingUser.id)
          .single();

        if (!existingSubscription) {
          console.log(`Creating free subscription for existing user: ${existingUser.id}`);
          await supabaseAdmin
            .from('subscriptions')
            .insert([
              {
                user_id: existingUser.id,
                plan: 'free',
                status: 'active',
                started_at: new Date().toISOString()
              }
            ]);
        } else {
          console.log(`User has existing subscription: ${existingSubscription.plan} (${existingSubscription.status})`);
        }

        // Generate JWT tokens for our system using existing user ID
        const { accessToken, refreshToken } = generateTokens(existingUser.id, existingUser.email);

        // Store session with our custom user ID (not Supabase auth ID)
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await supabaseAdmin
          .from('user_sessions')
          .insert([
            {
              user_id: existingUser.id,
              token: accessToken,
              refresh_token: refreshToken,
              expires_at: expiresAt.toISOString(),
              ip_address: req.ip,
              user_agent: req.headers['user-agent']
            }
          ]);

        console.log(`OAuth login successful for existing user: ${existingUser.id}`);
        console.log(`User role: ${existingUser.role}, auth_provider updated to: ${newAuthProvider}`);
        
        // Redirect with our JWT tokens
        const redirectUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${redirectUrl}/auth/callback?access_token=${accessToken}&refresh_token=${refreshToken}&type=custom&linked=true`);
      } else {
        // No existing user
        if (intent === 'login') {
          // This shouldn't happen in normal flow, but handle gracefully
          console.log(`No existing user found for login attempt: ${googleEmail}`);
        }
        
        console.log(`Creating new user for Google OAuth: ${googleEmail}`);
        
        // New user - create profile with Google auth
        const { data: newUser, error: createError } = await supabaseAdmin
          .from('users')
          .insert([
            {
              email: googleEmail,
              name: googleName,
              google_id: googleId,
              auth_provider: 'google',
              role: 'user',
              email_verified: true,
              verified_at: new Date().toISOString()
            }
          ])
          .select()
          .single();

        if (createError) {
          console.error('Profile creation error:', createError);
          throw new Error('Failed to create user profile');
        }

        // Create free subscription for new user
        await supabaseAdmin
          .from('subscriptions')
          .insert([
            {
              user_id: newUser.id,
              plan: 'free',
              status: 'active',
              started_at: new Date().toISOString()
            }
          ]);

        // Generate JWT tokens
        const { accessToken, refreshToken } = generateTokens(newUser.id, newUser.email);

        // Store session
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await supabaseAdmin
          .from('user_sessions')
          .insert([
            {
              user_id: newUser.id,
              token: accessToken,
              refresh_token: refreshToken,
              expires_at: expiresAt.toISOString(),
              ip_address: req.ip,
              user_agent: req.headers['user-agent']
            }
          ]);

        console.log(`New user created via Google OAuth: ${newUser.id}`);
        
        // Redirect with our JWT tokens
        const redirectUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${redirectUrl}/auth/callback?access_token=${accessToken}&refresh_token=${refreshToken}&type=custom&new=true`);
      }
    }
  } catch (error) {
    console.error('OAuth callback error:', error);
    const redirectUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${redirectUrl}/login?error=oauth_failed`);
  }
});

// Link Google account endpoint (called from frontend after Supabase OAuth)
router.post('/link-google-account', async (req, res) => {
  try {
    const { googleEmail, googleId, googleName } = req.body;
    
    if (!googleEmail || !googleId) {
      return res.status(400).json({ error: 'Missing Google account information' });
    }
    
    console.log(`Linking Google account: ${googleEmail}`);
    
    // Check for existing user with this email
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', googleEmail)
      .single();
    
    if (existingUser) {
      console.log(`Found existing user: ${existingUser.id} (role: ${existingUser.role})`);
      
      // Link Google account to existing user
      const newAuthProvider = existingUser.password_hash ? 'both' : 'google';
      
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          google_id: googleId,
          auth_provider: newAuthProvider,
          email_verified: true,
          verified_at: existingUser.verified_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingUser.id);
      
      if (updateError) {
        console.error('Error linking Google account:', updateError);
        return res.status(500).json({ error: 'Failed to link Google account' });
      }
      
      // Generate custom JWT tokens
      const { accessToken, refreshToken } = generateTokens(existingUser.id, existingUser.email);
      
      // Store session
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await supabaseAdmin
        .from('user_sessions')
        .insert([
          {
            user_id: existingUser.id,
            token: accessToken,
            refresh_token: refreshToken,
            expires_at: expiresAt.toISOString(),
            ip_address: req.ip,
            user_agent: req.headers['user-agent']
          }
        ]);
      
      console.log(`Google account linked successfully for user: ${existingUser.id}`);
      
      return res.json({
        success: true,
        linked: true,
        user: {
          id: existingUser.id,
          email: existingUser.email,
          name: existingUser.name,
          role: existingUser.role,
          email_verified: true
        },
        customToken: {
          access_token: accessToken,
          refresh_token: refreshToken
        }
      });
    } else {
      // New user - this should be handled by regular Supabase flow
      console.log(`New Google user: ${googleEmail}`);
      return res.json({ success: true, linked: false });
    }
    
  } catch (error) {
    console.error('Link Google account error:', error);
    res.status(500).json({ error: 'Failed to link Google account' });
  }
});

module.exports = router;
