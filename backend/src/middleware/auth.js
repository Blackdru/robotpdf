const jwt = require('jsonwebtoken');
const { supabase, supabaseAdmin } = require('../config/supabase');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    
    // Try JWT verification first (new auth system)
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      if (decoded.type !== 'access') {
        return res.status(401).json({ error: 'Invalid token type' });
      }
      
      console.log('✓ JWT verified for user:', decoded.userId)

      // Get user from database
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', decoded.userId)
        .single();

      if (userError || !user) {
        return res.status(401).json({ error: 'User not found' });
      }

      if (!user.email_verified) {
        return res.status(401).json({ error: 'Email not verified' });
      }

      // Attach user to request
      req.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      };

      return next();
    } catch (jwtError) {
      console.log('⚠ JWT verification failed:', jwtError.message);
      
      // Check if token is expired
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired', expired: true });
      }
      
      // If JWT verification fails, try Supabase auth (for backward compatibility with Google OAuth)
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      // Look up user by Google ID or email
      let profile = null;
      
      // First, try to find by Google ID
      const { data: googleProfile } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('google_id', user.id)
        .single();

      if (googleProfile) {
        profile = googleProfile;
      } else {
        // If not found by Google ID, try by email (for legacy users)
        const { data: emailProfile } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('email', user.email)
          .single();

        if (emailProfile) {
          // Link this Supabase auth user to existing profile
          await supabaseAdmin
            .from('users')
            .update({ 
              google_id: user.id,
              auth_provider: emailProfile.password_hash ? 'both' : 'google',
              email_verified: true,
              verified_at: emailProfile.verified_at || new Date().toISOString()
            })
            .eq('id', emailProfile.id);

          profile = { ...emailProfile, google_id: user.id };
        }
      }

      if (!profile) {
        // User profile doesn't exist, create it
        const { data: newProfile, error: createError } = await supabaseAdmin
          .from('users')
          .insert([
            {
              email: user.email,
              google_id: user.id,
              name: user.user_metadata?.name || user.user_metadata?.full_name || user.email.split('@')[0],
              auth_provider: 'google',
              role: 'user',
              email_verified: true,
              verified_at: new Date().toISOString()
            }
          ])
          .select()
          .single();

        if (createError) {
          console.error('Error creating user profile in middleware:', createError);
          return res.status(500).json({ error: 'Failed to create user profile' });
        }

        // Create free subscription for new user
        await supabaseAdmin
          .from('subscriptions')
          .insert([{
            user_id: newProfile.id,
            plan: 'free',
            status: 'active',
            started_at: new Date().toISOString()
          }]);

        profile = newProfile;
      }

      // Use profile data for consistency
      req.user = {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role
      };
      next();
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user has admin role in the database
    const { data: userData, error } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', req.user.id)
      .single();

    if (error) {
      console.error('Error checking admin role:', error);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!userData || userData.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({ error: 'Authorization failed' });
  }
};

// Optional authentication - doesn't fail if no token provided
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without user
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);
    
    // Try JWT verification first
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      if (decoded.type === 'access') {
        const { data: user } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('id', decoded.userId)
          .single();

        if (user && user.email_verified) {
          req.user = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          };
          return next();
        }
      }
    } catch (jwtError) {
      // Try Supabase auth
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (!error && user) {
        req.user = user;
        return next();
      }
    }

    req.user = null;
    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    req.user = null;
    next();
  }
};

module.exports = {
  authenticateUser,
  requireAdmin,
  optionalAuth
};