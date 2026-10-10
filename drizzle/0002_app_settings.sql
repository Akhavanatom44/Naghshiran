-- Additive: shared app settings (auto-provisioned session secret); nothing existing is modified.
CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
