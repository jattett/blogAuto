import axios from 'axios';
import { env } from '../../config/env.js';

const isOkStatus = (status) => ['publish', 'draft', 'pending', 'private', 'future'].includes(status);

const sanitizeError = (error) => {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.response?.data?.error) return error.response.data.error;
  if (typeof error?.response?.data === 'string') return error.response.data;
  return error?.message || 'WordPress 발행 실패';
};

export const publishWordpressPost = async ({
  siteUrl = env.wordpressDefaultSiteUrl,
  username = env.wordpressDefaultUsername,
  appPassword = env.wordpressDefaultAppPassword,
  title,
  content,
  status = 'publish',
  slug,
  excerpt,
  categories,
  tags,
  featuredMedia,
  date
} = {}) => {
  if (!siteUrl || !username || !appPassword) {
    return {
      ok: false,
      reason: 'WordPress 기본 계정 정보가 설정되지 않았습니다.'
    };
  }

  if (!title || !content) {
    return {
      ok: false,
      reason: 'title/content가 필요합니다.'
    };
  }

  const payload = {
    title,
    content,
    status: isOkStatus(status) ? status : 'publish',
    ...(slug ? { slug } : {}),
    ...(excerpt ? { excerpt } : {}),
    ...(categories ? { categories } : {}),
    ...(tags ? { tags } : {}),
    ...(featuredMedia ? { featured_media: featuredMedia } : {}),
    ...(date ? { date } : {})
  };

  try {
    const response = await axios.post(
      `${siteUrl.replace(/\/$/, '')}/wp-json/wp/v2/posts`,
      payload,
      {
        auth: { username, password: appPassword },
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    const published = response.data || {};
    return {
      ok: true,
      postId: String(published.id),
      publishedUrl: published.link,
      platform: 'WORDPRESS',
      status: published.status,
      title: published.title?.rendered || title
    };
  } catch (error) {
    return {
      ok: false,
      reason: sanitizeError(error)
    };
  }
};
