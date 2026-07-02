const express = require('express');
const { getDb } = require('../db');

function parseJson(str, fallback = []) {
  if (str && typeof str === 'object') return str;
  try { return JSON.parse(str || ''); } catch { return fallback; }
}

function enrichItem(item, jsonFields = []) {
  if (!item) return item;
  const copy = { ...item };
  jsonFields.forEach(f => { copy[f] = parseJson(copy[f], f === 'statistics' ? {} : []); });
  return copy;
}

module.exports = function pageRoutes(siteConfig) {
  const router = express.Router();
  const { siteUrl, siteName } = siteConfig;

  const seoDefaults = {
    siteUrl,
    siteName,
    ogImage: `${siteUrl}/assets/img/logo.png`
  };

  router.get('/', async (req, res, next) => {
    try {
      const db = getDb();
      const projects = (await db.prepare('SELECT * FROM projects WHERE published = 1 ORDER BY sort_order, created_at DESC LIMIT 6').all()).map(p => enrichItem(p, ['technologies']));
      const campaigns = (await db.prepare('SELECT * FROM campaigns WHERE published = 1 ORDER BY sort_order, created_at DESC LIMIT 4').all()).map(c => enrichItem(c, ['screenshots', 'statistics']));
      const posts = await db.prepare('SELECT * FROM blog_posts WHERE published = 1 ORDER BY created_at DESC LIMIT 3').all();
      const testimonials = await db.prepare('SELECT * FROM testimonials WHERE published = 1 ORDER BY sort_order').all();
      res.render('pages/home', {
        ...seoDefaults,
        title: 'Aroman EMETSHU — Développeur Web & Media Buyer | Kinshasa, Brazzaville',
        description: 'Développeur web, logiciels, SaaS, PWA et expert Media Buying (Facebook Ads, Google Ads). Création de solutions digitales premium à Kinshasa et Brazzaville.',
        canonical: siteUrl,
        projects, campaigns, posts, testimonials,
        jsonLd: buildHomeJsonLd(siteUrl, siteName)
      });
    } catch (err) { next(err); }
  });

  router.get('/expertises', (req, res) => {
    res.render('pages/expertises', {
      ...seoDefaults,
      title: 'Expertises — Développement & Media Buying | Aroman EMETSHU',
      description: 'Développement web, SaaS, logiciels métier, PWA et stratégies publicitaires Facebook Ads, Google Ads.',
      canonical: `${siteUrl}/expertises`
    });
  });

  router.get('/realisations', async (req, res, next) => {
    try {
      const db = getDb();
      const projects = (await db.prepare('SELECT * FROM projects WHERE published = 1 ORDER BY sort_order, created_at DESC').all()).map(p => enrichItem(p, ['technologies']));
      res.render('pages/realisations', {
        ...seoDefaults,
        title: 'Réalisations Web — Portfolio | Aroman EMETSHU',
        description: 'Découvrez mes projets web, sites professionnels, applications et solutions digitales.',
        canonical: `${siteUrl}/realisations`,
        projects
      });
    } catch (err) { next(err); }
  });

  router.get('/applications', async (req, res, next) => {
    try {
      const db = getDb();
      const applications = (await db.prepare('SELECT * FROM applications WHERE published = 1 ORDER BY sort_order, created_at DESC').all()).map(a => enrichItem(a, ['technologies']));
      res.render('pages/applications', {
        ...seoDefaults,
        title: 'Applications — Portfolio | Aroman EMETSHU',
        description: 'Applications web, mobiles et PWA développées avec des technologies modernes.',
        canonical: `${siteUrl}/applications`,
        applications
      });
    } catch (err) { next(err); }
  });

  router.get('/campagnes', async (req, res, next) => {
    try {
      const db = getDb();
      const campaigns = (await db.prepare('SELECT * FROM campaigns WHERE published = 1 ORDER BY sort_order, created_at DESC').all()).map(c => enrichItem(c, ['screenshots', 'statistics']));
      res.render('pages/campagnes', {
        ...seoDefaults,
        title: 'Campagnes Marketing — Résultats | Aroman EMETSHU',
        description: 'Études de cas Media Buying : Facebook Ads, Instagram Ads, Google Ads.',
        canonical: `${siteUrl}/campagnes`,
        campaigns
      });
    } catch (err) { next(err); }
  });

  router.get('/blog', async (req, res, next) => {
    try {
      const db = getDb();
      const posts = await db.prepare('SELECT * FROM blog_posts WHERE published = 1 ORDER BY created_at DESC').all();
      res.render('pages/blog', {
        ...seoDefaults,
        title: 'Blog — Développement & Marketing Digital | Aroman EMETSHU',
        description: 'Articles sur le développement web, les logiciels, le SaaS et le Media Buying.',
        canonical: `${siteUrl}/blog`,
        posts
      });
    } catch (err) { next(err); }
  });

  router.get('/blog/:slug', async (req, res, next) => {
    try {
      const db = getDb();
      const post = await db.prepare('SELECT * FROM blog_posts WHERE slug = ? AND published = 1').get(req.params.slug);
      if (!post) return res.status(404).render('pages/404', { ...seoDefaults, title: 'Article introuvable' });
      res.render('pages/blog-article', {
        ...seoDefaults,
        title: post.meta_title || `${post.title} | Aroman EMETSHU`,
        description: post.meta_description || post.content?.substring(0, 160),
        canonical: `${siteUrl}/blog/${post.slug}`,
        ogImage: post.image ? `${siteUrl}${post.image}` : seoDefaults.ogImage,
        post,
        jsonLd: buildArticleJsonLd(siteUrl, siteName, post)
      });
    } catch (err) { next(err); }
  });

  router.get('/contact', (req, res) => {
    res.render('pages/contact', {
      ...seoDefaults,
      title: 'Contact — Demande de projet | Aroman EMETSHU',
      description: 'Décrivez votre projet : développement web, SaaS, logiciel, PWA ou stratégie marketing.',
      canonical: `${siteUrl}/contact`
    });
  });

  router.get('/a-propos', (req, res) => {
    res.render('pages/about', {
      ...seoDefaults,
      title: 'À propos — Développeur & Media Buyer | Aroman EMETSHU',
      description: 'Plus de 5 ans d\'expérience en développement web, logiciels et Media Buying.',
      canonical: `${siteUrl}/a-propos`
    });
  });

  router.get('/sitemap.xml', async (req, res, next) => {
    try {
      const db = getDb();
      const posts = await db.prepare('SELECT slug, updated_at FROM blog_posts WHERE published = 1').all();
      const staticPages = ['', '/expertises', '/realisations', '/applications', '/campagnes', '/blog', '/contact', '/a-propos'];
      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
      staticPages.forEach(p => {
        xml += `  <url><loc>${siteUrl}${p}</loc><changefreq>weekly</changefreq><priority>${p === '' ? '1.0' : '0.8'}</priority></url>\n`;
      });
      posts.forEach(p => {
        xml += `  <url><loc>${siteUrl}/blog/${p.slug}</loc><lastmod>${p.updated_at}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>\n`;
      });
      xml += '</urlset>';
      res.type('application/xml').send(xml);
    } catch (err) { next(err); }
  });

  router.get('/robots.txt', (_req, res) => {
    const adminPath = process.env.ADMIN_PATH || 'gestion-interne-aroman';
    res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /${adminPath}/\nDisallow: /api/\nSitemap: ${siteUrl}/sitemap.xml\n`);
  });

  return router;
};

function buildHomeJsonLd(siteUrl, siteName) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'Person', name: siteName, url: siteUrl, jobTitle: 'Développeur Web & Media Buyer' },
      { '@type': 'ProfessionalService', name: siteName, url: siteUrl },
      { '@type': 'WebSite', name: siteName, url: siteUrl }
    ]
  });
}

function buildArticleJsonLd(siteUrl, siteName, post) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    author: { '@type': 'Person', name: post.author || siteName },
    datePublished: post.created_at,
    mainEntityOfPage: `${siteUrl}/blog/${post.slug}`
  });
}
