// jest.setup.js
import "@testing-library/jest-dom";

// Mock Next.js routing
jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      route: "/",
      pathname: "",
      query: "",
      asPath: "",
      push: jest.fn(),
      replace: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
    };
  },
  usePathname() {
    return "";
  },
}));

// Mock process.cwd()
process.cwd = () => "/fake/path";

// Mock fs promises
jest.mock("fs/promises", () => ({
  writeFile: jest.fn().mockResolvedValue(undefined),
}));

// Global setup
global.fetch = jest.fn();
