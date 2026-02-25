import express from 'express';
import { env } from '../config/env.js';
import { publishWordpressPost } from '../drivers/wordpress/index.js';

const router = express.Router();

router.post('/publish', async (req, res) => {
  const {
    siteUrl = env.wordpressDefaultSiteUrl,
    username = env.wordpressDefaultUsername,
    appPassword = env.wordpressDefaultAppPassword,
    title,
    content,
    status,
    slug,
    excerpt,
    categories,
    tags,
    featuredMedia,
    date
  } = req.body || {};

  const result = await publishWordpressPost({
    siteUrl,
    username,
    appPassword,
    title,
    content,
    status,
    slug,
    excerpt,
    categories,
    tags,
    featuredMedia,
    date
  });

  if (!result.ok) {
    return res.status(400).json(result);
  }

  return res.json(result);
});

export default router;
