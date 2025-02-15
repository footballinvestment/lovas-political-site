// tests/admin-auth.test.ts
import { test, expect } from "@playwright/test";

test.describe("Admin authentication", () => {
  test("should not allow non-admin users to access admin panel", async ({
    page,
  }) => {
    await page.goto("/admin");
    expect(page.url()).toContain("/admin/login");
  });

  test("should allow admin user to access admin panel", async ({ page }) => {
    // Login as admin
    await page.goto("/admin/login");
    await page.click('button:has-text("Bejelentkezés Google-lal")');
    // Add admin login steps...
    expect(page.url()).toContain("/admin");
  });

  test("should redirect to requested page after login", async ({ page }) => {
    await page.goto("/admin/events");
    // Should redirect to login
    expect(page.url()).toContain("/admin/login");
    // Login
    await page.click('button:has-text("Bejelentkezés Google-lal")');
    // Should redirect back to events
    expect(page.url()).toContain("/admin/events");
  });

  test("should allow logout", async ({ page }) => {
    // First login
    await page.goto("/admin");
    // Then logout
    await page.click('button:has-text("Kijelentkezés")');
    expect(page.url()).toBe("/");
  });
});
