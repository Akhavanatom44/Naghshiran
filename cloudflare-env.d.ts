/**
 * Cloudflare Workers bindings used by this app.
 *
 * The DB binding is the D1 database d1_naghshiran
 * (database_id: 96fcda7f-4093-47d2-b210-75b749658c65) configured in wrangler.jsonc.
 *
 * Minimal structural types are declared here on purpose: pulling in the full
 * @cloudflare/workers-types package conflicts with @types/node in this
 * Next.js project, while drizzle-orm's D1 driver accepts the shapes below.
 */

declare global {
  interface D1Meta {
    changed_db?: boolean;
    changes?: number;
    duration?: number;
    last_row_id?: number;
    rows_read?: number;
    rows_written?: number;
    served_by?: string;
    size_after?: number;
    [key: string]: unknown;
  }

  interface D1Result<T = unknown> {
    results: T[];
    success: boolean;
    meta: D1Meta;
  }

  interface D1PreparedStatement {
    bind(...values: unknown[]): D1PreparedStatement;
    first<T = unknown>(column?: string): Promise<T | null>;
    run(): Promise<D1Result>;
    all<T = unknown>(): Promise<D1Result<T>>;
    raw<T = unknown>(): Promise<T[]>;
  }

  interface D1Database {
    prepare(query: string): D1PreparedStatement;
    dump(): Promise<ArrayBuffer>;
    batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
    exec(query: string): Promise<D1Result>;
  }

  interface CloudflareEnv {
    /** D1 binding for the naghshiran database (see wrangler.jsonc). */
    DB: D1Database;
    SESSION_SECRET?: string;
    TELEGRAM_BOT_TOKEN?: string;
    TELEGRAM_ADMIN_CHAT_IDS?: string;
    NEXT_PUBLIC_SITE_URL?: string;
  }
}

export {};
