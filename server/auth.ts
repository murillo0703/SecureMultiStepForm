import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Express } from 'express';
import session from 'express-session';
import { scrypt, randomBytes, timingSafeEqual, randomUUID } from 'crypto';
import { promisify } from 'util';
import { storage } from './storage';
import { User as SelectUser } from '@shared/schema';

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split('.');
  const hashedBuf = Buffer.from(hashed, 'hex');
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || crypto.randomBytes(64).toString('hex'),
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    name: 'murillo.sid', // Custom session name for security
    cookie: {
      maxAge: 1000 * 60 * 30, // 30 minutes (shorter timeout for security)
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'strict', // CSRF protection
      httpOnly: true, // Prevent XSS attacks
      domain: undefined,
    },
    // Regenerate session ID on login for security
    genid: () => randomUUID(),
  };

  app.set('trust proxy', 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        // Try to find user by username first, then by email
        let user = await storage.getUserByUsername(username);
        if (!user) {
          user = await storage.getUserByEmail(username);
        }

        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    })
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post('/api/register', async (req, res, next) => {
    try {
      const { username, password, email, companyName, role = 'employer' } = req.body;

      if (!username || !password || !email) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }

      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: 'Email already exists' });
      }

      const user = await storage.createUser({
        username,
        password: await hashPassword(password),
        email,
        name: username, // Use username as name for now
        companyName,
        role,
      });

      // Regenerate session ID for security
      req.session.regenerate((err) => {
        if (err) {
          console.error('Session regeneration error:', err);
          return next(err);
        }

        req.login(user, err => {
          if (err) {
            console.error('Login error after registration:', err);
            return next(err);
          }
          console.log(
            'User logged in after registration:',
            user.username,
            'Session ID:',
            req.sessionID
          );
          res.status(201).json(user);
        });
      });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/login', (req, res, next) => {
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: 'Invalid username or password' });

      // Regenerate session ID for security
      req.session.regenerate((err) => {
        if (err) {
          console.error('Session regeneration error:', err);
          return next(err);
        }

        req.login(user, err => {
          if (err) {
            console.error('Login error:', err);
            return next(err);
          }
          console.log(
            'User logged in:',
            user.username,
            'Session ID:',
            req.sessionID,
            'Authenticated:',
            req.isAuthenticated()
          );
          return res.status(200).json(user);
        });
      });
    })(req, res, next);
  });

  app.post('/api/logout', (req, res, next) => {
    req.logout(err => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get('/api/user', (req, res) => {
    console.log(
      'GET /api/user - Session ID:',
      req.sessionID,
      'Authenticated:',
      req.isAuthenticated(),
      'User:',
      req.user?.username
    );
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}
