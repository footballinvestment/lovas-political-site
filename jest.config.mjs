import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  dir: "./",
});

const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"], // Jest setup fájl
  testEnvironment: "jest-environment-jsdom", // Tesztkörnyezet beállítása
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1", // Aliasok kezelése
  },
  transform: {
    "^.+\\.(t|j)sx?$": ["@swc/jest"], // SWC használata TypeScript és JavaScript fájlokhoz
    "^.+\\.js$": "jest-esm-transformer", // ESM támogatás
  },
  transformIgnorePatterns: [
    "/node_modules/(?!(uuid|next|next-auth|@auth/prisma-adapter|@panva|jose|@babel|@swc)/.*)", // Kizárt modulok
  ],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"], // Fájlkiterjesztések
  testEnvironmentOptions: {
    customExportConditions: ["node", "node-addons"], // Node.js környezet támogatása
  },
};

export default createJestConfig(customJestConfig);
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    forceSwcTransforms: true, // Ez kényszeríti az SWC használatát
  },
};

export default nextConfig;