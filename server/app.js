require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const { trackVisitor } = require('./middleware/analytics');
const pageRoutes = require('./routes/pages');
const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;
const ADMIN_PATH = process.env.ADMIN_PATH || 'gestion-interne-aroman';
const SITE_URL = process.env.SITE_URL || `http://localhost:${PORT}`;
const SITE_NAME = process.env.SITE_NAME || 'Aroman EMETSHU';

app.locals.adminPath = ADMIN_PATH;
app.locals.siteUrl = SITE_URL;
app.locals.siteName = SITE_NAME;

const uploadsDir = process.env.VERCEL
  ? path.join('/tmp', 'uploads')
  : path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdnjs.cloudflare.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https://cdnjs.cloudflare.com'],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
      imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
      connectSrc: ["'self'"]
    }
  }
}));
app.use(compression());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public'), { maxAge: process.env.NODE_ENV === 'production' ? '7d' : 0 }));
app.get('/favicon.ico', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'assets', 'img', 'logo.png'));
});

app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true, env: process.env.VERCEL ? 'vercel' : 'node' });
});

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax'
  }
}));

app.use(trackVisitor);

const contactLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { error: 'Trop de requêtes.' } });
app.use('/api/contact', contactLimiter);

const { initDb } = require('./db');

async function createApp() {
  await initDb();

  app.use('/api', apiRoutes());
  app.use(`/${ADMIN_PATH}`, adminRoutes(ADMIN_PATH));
  app.use('/', pageRoutes({ siteUrl: SITE_URL, siteName: SITE_NAME }));

  app.use((_req, res) => {
    res.status(404).render('pages/404', {
      siteUrl: SITE_URL,
      siteName: SITE_NAME,
      title: 'Page introuvable',
      description: 'La page demandée n\'existe pas.',
      canonical: SITE_URL
    });
  });

  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).send('Erreur serveur.');
  });

  return app;
}

const appReady = createApp().catch((err) => {
  console.error('App bootstrap failed:', err.message);
  throw err;
});

if (require.main === module) {
  appReady
    .then((server) => {
      server.listen(PORT, () => {
        console.log(`\n  ✦ ${SITE_NAME} — Portfolio v2.0`);
        console.log(`  → Site    : http://localhost:${PORT}`);
        console.log(`  → Admin   : http://localhost:${PORT}/${ADMIN_PATH}\n`);
      });
    })
    .catch((err) => {
      console.error('Startup failed:', err);
      process.exit(1);
    });
}

module.exports = appReady;
