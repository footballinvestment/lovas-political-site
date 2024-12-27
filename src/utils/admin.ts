// src/utils/admin.ts
export const checkAdminPassword = (password: string) => {
  return password === process.env.ADMIN_PASSWORD;
};
