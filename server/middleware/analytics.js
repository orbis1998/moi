const { UAParser } = require('ua-parser-js');
const { getDb } = require('../db');
const crypto = require('crypto');

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || '';
}

function detectSource(referrer) {
  if (!referrer) return 'direct';
  const r = referrer.toLowerCase();
  if (r.includes('google.')) return 'google';
  if (r.includes('facebook.') || r.includes('fb.')) return 'facebook';
  if (r.includes('instagram.')) return 'instagram';
  if (r.includes('linkedin.')) return 'linkedin';
  if (r.includes('twitter.') || r.includes('x.com')) return 'twitter';
  if (r.includes('tiktok.')) return 'tiktok';
  if (r.includes('youtube.')) return 'youtube';
  return 'referral';
}

async function trackVisitor(req, res, next) {
  const adminPath = req.app.locals.adminPath;
  if (req.path.startsWith(`/${adminPath}`) || req.path.startsWith('/api/admin') || req.path === '/health') return next();
  if (req.path.match(/\.(css|js|png|jpg|jpeg|gif|webp|svg|ico|woff2?)$/)) return next();

  res.locals.pageViewStart = Date.now();

  try {
    const db = getDb();
    let sessionId = req.cookies?.visitor_sid;
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      res.cookie('visitor_sid', sessionId, {
        maxAge: 365 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      });
    }

    const parser = new UAParser(req.headers['user-agent']);
    const ua = parser.getResult();
    const ip = getClientIp(req);
    const referrer = req.headers.referer || '';
    const source = detectSource(referrer);

    void (async () => {
      try {
        const existing = await db.prepare('SELECT id FROM visitors WHERE session_id = ?').get(sessionId);
        if (existing) {
          await db.prepare(`UPDATE visitors SET last_visit = datetime('now'), ip_address = ?, referrer = ?, source = ? WHERE session_id = ?`)
            .run(ip, referrer, source, sessionId);
          req.visitorId = existing.id;
        } else {
          const result = await db.prepare(`
            INSERT INTO visitors (session_id, ip_address, country, city, device, browser, os, referrer, source)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            sessionId, ip, null, null,
            ua.device.type || 'desktop',
            `${ua.browser.name || 'Unknown'} ${ua.browser.version || ''}`.trim(),
            `${ua.os.name || 'Unknown'} ${ua.os.version || ''}`.trim(),
            referrer, source
          );
          req.visitorId = result.lastInsertRowid;
        }
      } catch (err) {
        console.error('Analytics visitor error:', err.message);
      }
    })();
  } catch (err) {
    console.error('Analytics error:', err.message);
  }

  res.on('finish', () => {
    if (!req.visitorId || res.statusCode >= 400) return;
    try {
      const db = getDb();
      const duration = Math.round((Date.now() - res.locals.pageViewStart) / 1000);
      db.prepare('INSERT INTO page_views (visitor_id, page_path, duration_seconds) VALUES (?, ?, ?)')
        .run(req.visitorId, req.path, duration)
        .catch(err => console.error('Page view error:', err.message));
    } catch (err) {
      console.error('Page view error:', err.message);
    }
  });

  next();
}

module.exports = { trackVisitor, getClientIp };
