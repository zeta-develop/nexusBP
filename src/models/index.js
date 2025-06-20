// This file can be used to export all models or the Prisma client instance
// For now, let's re-export the Prisma client instance from its new location.
const prisma = require('../lib/prisma');

module.exports = {
  prisma,
  // You could also export individual models if needed for some patterns, e.g.:
  // User: prisma.user,
};
