// Import PrismaClient from the generated location
const { PrismaClient } = require('../generated/prisma');

// Instantiate PrismaClient
// It's good practice to instantiate it once and export the instance
const prisma = new PrismaClient();

// Optional: Add logging middleware for development/debugging if desired
// prisma.$use(async (params, next) => {
//   const before = Date.now();
//   const result = await next(params);
//   const after = Date.now();
//   console.log(`Query ${params.model}.${params.action} took ${after - before}ms`);
//   return result;
// });

module.exports = prisma;
