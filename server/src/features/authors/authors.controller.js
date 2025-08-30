import { featuredAuthors } from '../../data/authors.js';

export function getFeaturedAuthors(req, res) {
  res.json(featuredAuthors);
}
