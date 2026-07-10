import { pool } from "@workspace/db";
import { logger } from "./logger";

async function execute(sql: string): Promise<void> {
  await pool.query(sql);
}

export async function migrate(): Promise<void> {
  logger.info("Running database migrations...");

  try {
    // Create tables if they don't exist
    await execute(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await execute(`
      CREATE TABLE IF NOT EXISTS site_settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(255) NOT NULL UNIQUE,
        value TEXT NOT NULL DEFAULT '',
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await execute(`
      CREATE TABLE IF NOT EXISTS nav_items (
        id SERIAL PRIMARY KEY,
        label_ar VARCHAR(255) NOT NULL DEFAULT '',
        label_en VARCHAR(255) NOT NULL DEFAULT '',
        url VARCHAR(500) NOT NULL DEFAULT '/',
        target VARCHAR(50) NOT NULL DEFAULT '_self',
        sort_order INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await execute(`
      CREATE TABLE IF NOT EXISTS services (
        id SERIAL PRIMARY KEY,
        title_ar VARCHAR(255) NOT NULL DEFAULT '',
        title_en VARCHAR(255) NOT NULL DEFAULT '',
        description_ar TEXT NOT NULL DEFAULT '',
        description_en TEXT NOT NULL DEFAULT '',
        icon VARCHAR(100) NOT NULL DEFAULT 'code',
        sort_order INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await execute(`
      CREATE TABLE IF NOT EXISTS pages (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(255) NOT NULL UNIQUE,
        title_ar VARCHAR(500) NOT NULL DEFAULT '',
        title_en VARCHAR(500) NOT NULL DEFAULT '',
        content_ar TEXT NOT NULL DEFAULT '',
        content_en TEXT NOT NULL DEFAULT '',
        is_published BOOLEAN NOT NULL DEFAULT FALSE,
        sort_order INTEGER NOT NULL DEFAULT 0,
        is_system BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await execute(`
      CREATE TABLE IF NOT EXISTS sections (
        id SERIAL PRIMARY KEY,
        page_key VARCHAR(100) NOT NULL,
        section_key VARCHAR(100) NOT NULL,
        content_ar TEXT NOT NULL DEFAULT '',
        content_en TEXT NOT NULL DEFAULT '',
        sort_order INTEGER NOT NULL DEFAULT 0,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(page_key, section_key)
      );
    `);

    await execute(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        title_ar VARCHAR(500) NOT NULL DEFAULT '',
        title_en VARCHAR(500) NOT NULL DEFAULT '',
        description_ar TEXT NOT NULL DEFAULT '',
        description_en TEXT NOT NULL DEFAULT '',
        problem_ar TEXT NOT NULL DEFAULT '',
        problem_en TEXT NOT NULL DEFAULT '',
        solution_ar TEXT NOT NULL DEFAULT '',
        solution_en TEXT NOT NULL DEFAULT '',
        category VARCHAR(255) NOT NULL DEFAULT '',
        technologies TEXT[] NOT NULL DEFAULT '{}',
        cover_image VARCHAR(1000) NOT NULL DEFAULT '',
        cover_image_data TEXT,
        is_featured BOOLEAN NOT NULL DEFAULT FALSE,
        is_published BOOLEAN NOT NULL DEFAULT TRUE,
        sort_order INTEGER NOT NULL DEFAULT 0,
        live_url VARCHAR(500) NOT NULL DEFAULT '',
        github_url VARCHAR(500) NOT NULL DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Add cover_image column if it doesn't exist (for existing databases)
    await execute(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'projects' AND column_name = 'cover_image') THEN
          ALTER TABLE projects ADD COLUMN cover_image VARCHAR(1000) NOT NULL DEFAULT '';
        END IF;
      END $$;
    `);

    // Add cover_image_data column for Base64 image storage
    await execute(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'projects' AND column_name = 'cover_image_data') THEN
          ALTER TABLE projects ADD COLUMN cover_image_data TEXT;
        END IF;
      END $$;
    `);

    await execute(`
      CREATE TABLE IF NOT EXISTS project_images (
        id SERIAL PRIMARY KEY,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        filename VARCHAR(255) NOT NULL,
        alt_ar VARCHAR(500) NOT NULL DEFAULT '',
        alt_en VARCHAR(500) NOT NULL DEFAULT '',
        sort_order INTEGER NOT NULL DEFAULT 0,
        is_primary BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Create indexes
    await execute(`CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);`);
    await execute(`CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(key);`);
    await execute(`CREATE INDEX IF NOT EXISTS idx_nav_items_sort_order ON nav_items(sort_order);`);
    await execute(`CREATE INDEX IF NOT EXISTS idx_nav_items_is_active ON nav_items(is_active);`);
    await execute(`CREATE INDEX IF NOT EXISTS idx_services_sort_order ON services(sort_order);`);
    await execute(`CREATE INDEX IF NOT EXISTS idx_services_is_active ON services(is_active);`);
    await execute(`CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug);`);
    await execute(`CREATE INDEX IF NOT EXISTS idx_pages_is_published ON pages(is_published);`);
    await execute(`CREATE INDEX IF NOT EXISTS idx_pages_sort_order ON pages(sort_order);`);
    await execute(`CREATE INDEX IF NOT EXISTS idx_sections_page_key ON sections(page_key);`);
    await execute(`CREATE INDEX IF NOT EXISTS idx_sections_sort_order ON sections(sort_order);`);
    await execute(`CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);`);
    await execute(`CREATE INDEX IF NOT EXISTS idx_projects_is_featured ON projects(is_featured);`);
    await execute(`CREATE INDEX IF NOT EXISTS idx_projects_is_published ON projects(is_published);`);
    await execute(`CREATE INDEX IF NOT EXISTS idx_projects_sort_order ON projects(sort_order);`);
    await execute(`CREATE INDEX IF NOT EXISTS idx_project_images_project_id ON project_images(project_id);`);
    await execute(`CREATE INDEX IF NOT EXISTS idx_project_images_sort_order ON project_images(sort_order);`);
    await execute(`CREATE INDEX IF NOT EXISTS idx_project_images_is_primary ON project_images(is_primary);`);

    // Create auto-update trigger function
    await execute(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Create triggers for auto-updating updated_at
    const tablesWithTrigger = [
      'admin_users',
      'site_settings',
      'nav_items',
      'services',
      'pages',
      'sections',
      'projects'
    ];

    for (const table of tablesWithTrigger) {
      await execute(`
        DROP TRIGGER IF EXISTS update_${table}_updated_at ON ${table};
        CREATE TRIGGER update_${table}_updated_at
          BEFORE UPDATE ON ${table}
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `);
    }

    logger.info("Database migrations completed successfully!");
  } catch (error) {
    logger.error({ error }, "Migration failed");
    throw error;
  }
}

export async function closePool(): Promise<void> {
  await pool.end();
}
