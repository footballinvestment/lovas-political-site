import "@testing-library/jest-dom";
import { TextEncoder, TextDecoder } from "util";

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// A MockResponse módosítása:
class MockResponse {
  constructor(body, init = {}) {
    this._body = body;
    this.status = init?.status ?? 200;
    this.ok = this.status >= 200 && this.status < 300;
    this.headers = new Headers(init?.headers);
  }

  async json() {
    return this._body;
  }
}

// A NextResponse mock módosítása:
jest.mock("next/server", () => ({
  NextResponse: {
    json: (body, init = {}) => {
      const response = new MockResponse(body, init);
      return response;
    },
    next: jest.fn(),
    rewrite: jest.fn(),
    redirect: jest.fn(),
  },
  NextRequest: class NextRequest {
    constructor(input, init = {}) {
      const url = new URL(input);
      this._url = url;
      this.method = init.method || "GET";
      this.body = init.body;
    }
    get url() {
      return this._url.toString();
    }
    async json() {
      return this.body;
    }
  },
}));

// A rate-limit mock módosítása:
jest.mock("@/lib/rate-limit", () => {
  return {
    withRateLimit: (routeName, handler) => async () => {
      try {
        const isAllowed = await mockCheckRateLimit(routeName);
        if (!isAllowed) {
          return new MockResponse(
            { error: "Too Many Requests" },
            { status: 429 }
          );
        }
        const response = await handler();
        return response;
      } catch (error) {
        return new MockResponse(
          { error: error.message || "Internal Server Error" },
          { status: 500 }
        );
      }
    },
    checkRateLimit: mockCheckRateLimit,
  };
});

global.fetch = jest.fn();

global.Headers = class Headers extends Map {
  constructor(init) {
    super();
    if (init) {
      Object.entries(init).forEach(([key, value]) => this.set(key, value));
    }
  }
};

global.URL = class URL {
  constructor(url, base = "http://localhost") {
    const fullUrl = url.startsWith("http")
      ? url
      : `${base}/${url}`.replace(/([^:]\/)\/+/g, "$1");
    const [urlPath, search] = fullUrl.split("?");
    this.href = fullUrl;
    this.pathname = urlPath;
    this.searchParams = new URLSearchParams(search ? `?${search}` : "");
  }
  toString() {
    return this.href;
  }
};

global.URLSearchParams = class URLSearchParams {
  constructor(init) {
    this.params = new Map();
    if (typeof init === "string") {
      init
        .replace("?", "")
        .split("&")
        .forEach((pair) => {
          if (pair) {
            const [key, value] = pair.split("=");
            this.params.set(key, decodeURIComponent(value));
          }
        });
    }
  }
  get(key) {
    return this.params.get(key);
  }
  set(key, value) {
    this.params.set(key, value);
  }
};
