/**
 * The first-run manager account requested for the store's admin panel.
 *
 * The password is only used by the database bootstrap (as a bcrypt hash in
 * `src/db/index.ts`); it is intentionally not exported to client components.
 * Change this credential before exposing a production deployment to the
 * public internet.
 */
export const ADMIN_USERNAME = "admin";
export const ADMIN_PASSWORD_LABEL = "12341234";
