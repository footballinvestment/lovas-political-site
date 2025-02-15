// jest.config.mjs
import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  // Next.js projekt gyökér könyvtárának megadása a Jest számára
  dir: "./",
});

// Jest beállítások hozzáadása
const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jest-environment-node",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  transform: {
    "^.+\\.(t|j)sx?$": ["@swc/jest"],
  },
  transformIgnorePatterns: [
    "/node_modules/(?!uuid)",
    "^.+\\.module\\.(css|sass|scss)$",
  ],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
};

// createJestConfig használata az aszinkron konfigurációhoz
export default createJestConfig(customJestConfig);
