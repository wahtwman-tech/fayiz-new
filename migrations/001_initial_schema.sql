-- =============================================================================
-- Portfolio CMS Database Schema
-- Target: PostgreSQL (Neon)
-- =============================================================================

-- =============================================================================
-- Extensions
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- Table: admin_users
-- Description: Admin users for CMS authentication
-- =============================================================================
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admin_users_username ON admin_users(username);

-- =============================================================================
-- Table: site_settings
-- Description: Key-value store for website settings
-- =============================================================================
CREATE TABLE IF NOT EXISTS site_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) NOT NULL UNIQUE,
    value TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_site_settings_key ON site_settings(key);

-- =============================================================================
-- Table: nav_items
-- Description: Navigation menu items
-- =============================================================================
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

CREATE INDEX idx_nav_items_sort_order ON nav_items(sort_order);
CREATE INDEX idx_nav_items_is_active ON nav_items(is_active);

-- =============================================================================
-- Table: services
-- Description: Services offered by the developer
-- =============================================================================
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

CREATE INDEX idx_services_sort_order ON services(sort_order);
CREATE INDEX idx_services_is_active ON services(is_active);

-- =============================================================================
-- Table: pages
-- Description: Dynamic pages content
-- =============================================================================
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

CREATE INDEX idx_pages_slug ON pages(slug);
CREATE INDEX idx_pages_is_published ON pages(is_published);
CREATE INDEX idx_pages_sort_order ON pages(sort_order);

-- =============================================================================
-- Table: sections
-- Description: Page sections for modular content
-- =============================================================================
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

CREATE INDEX idx_sections_page_key ON sections(page_key);
CREATE INDEX idx_sections_sort_order ON sections(sort_order);

-- =============================================================================
-- Table: projects
-- Description: Portfolio projects
-- =============================================================================
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
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    live_url VARCHAR(500) NOT NULL DEFAULT '',
    github_url VARCHAR(500) NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_projects_category ON projects(category);
CREATE INDEX idx_projects_is_featured ON projects(is_featured);
CREATE INDEX idx_projects_is_published ON projects(is_published);
CREATE INDEX idx_projects_sort_order ON projects(sort_order);

-- =============================================================================
-- Table: project_images
-- Description: Images for portfolio projects
-- =============================================================================
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

CREATE INDEX idx_project_images_project_id ON project_images(project_id);
CREATE INDEX idx_project_images_sort_order ON project_images(sort_order);
CREATE INDEX idx_project_images_is_primary ON project_images(is_primary);

-- =============================================================================
-- Default Site Settings (for initial data)
-- =============================================================================
INSERT INTO site_settings (key, value) VALUES
    ('site_title_ar', 'محمد الحسيني | مطور ويب'),
    ('site_title_en', 'Mohammed Al-Husseini | Web Developer'),
    ('site_description_ar', 'مطور ويب محترف متخصص في بناء حلول رقمية متكاملة'),
    ('site_description_en', 'Professional web developer specializing in complete digital solutions'),
    ('hero_name_ar', 'محمد الحسيني'),
    ('hero_name_en', 'Mohammed Al-Husseini'),
    ('hero_title_ar', 'مطور ويب متكامل'),
    ('hero_title_en', 'Full-Stack Web Developer'),
    ('hero_intro_ar', 'أبني حلولاً رقمية متكاملة، لا مجرد صفحات ويب. أجمع بين الكود النظيف والأداء العالي لأقدم تجارب استثنائية.'),
    ('hero_intro_en', 'I build complete digital solutions, not just web pages. Combining clean code with high performance to deliver exceptional experiences.'),
    ('contact_email', 'contact@example.com'),
    ('contact_whatsapp', '+966500000000'),
    ('contact_phone', '+966500000000'),
    ('social_github', 'https://github.com'),
    ('social_linkedin', 'https://linkedin.com'),
    ('social_twitter', 'https://twitter.com'),
    ('logo_text_ar', 'م.ح'),
    ('logo_text_en', 'MH'),
    ('footer_text_ar', 'جميع الحقوق محفوظة'),
    ('footer_text_en', 'All rights reserved'),
    ('default_lang', 'ar')
ON CONFLICT (key) DO NOTHING;

-- =============================================================================
-- Default Navigation Items
-- =============================================================================
INSERT INTO nav_items (label_ar, label_en, url, sort_order) VALUES
    ('الرئيسية', 'Home', '/', 1),
    ('من أنا', 'About', '/about.html', 2),
    ('خدماتي', 'Services', '/services.html', 3),
    ('أعمالي', 'Portfolio', '/portfolio.html', 4),
    ('تواصل معي', 'Contact', '/contact.html', 5)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- Default Services
-- =============================================================================
INSERT INTO services (title_ar, title_en, description_ar, description_en, icon, sort_order) VALUES
    ('تطوير المواقع', 'Website Development', 'تصميم وتطوير مواقع ويب احترافية بأحدث التقنيات', 'Design and develop professional websites using the latest technologies', 'globe', 1),
    ('حلول ويب مخصصة', 'Custom Web Solutions', 'بناء تطبيقات وأنظمة ويب مخصصة حسب احتياجاتك', 'Build custom web applications and systems tailored to your needs', 'settings', 2),
    ('مواقع الأعمال', 'Business Websites', 'مواقع احترافية تعكس هوية شركتك وتجذب العملاء', 'Professional websites that reflect your company identity and attract clients', 'briefcase', 3),
    ('متاجر إلكترونية', 'E-commerce Websites', 'متاجر إلكترونية متكاملة مع نظام إدارة المنتجات والطلبات', 'Full-featured online stores with product and order management', 'shopping-cart', 4),
    ('لوحات التحكم والإدارة', 'Dashboard & Management Systems', 'أنظمة إدارة متكاملة للتحكم في بيانات أعمالك', 'Comprehensive management systems to control your business data', 'layout-dashboard', 5),
    ('الاستضافة والدعم التقني', 'Hosting & Technical Support', 'استضافة موقعك ودعم تقني مستمر لضمان الأداء المثالي', 'Website hosting and continuous technical support for optimal performance', 'server', 6)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- Default Sections
-- =============================================================================
INSERT INTO sections (page_key, section_key, content_ar, content_en, sort_order) VALUES
    ('home', 'about_brief_ar', 'أنا مطور ويب متكامل شغوف بالكود النظيف والأداء العالي. أؤمن بأن كل موقع يجب أن يكون تجربة لا مجرد صفحة.', '', 1),
    ('home', 'about_brief_en', '', 'I am a full-stack web developer passionate about clean code and high performance. I believe every website should be an experience, not just a page.', 2),
    ('about', 'bio_ar', 'أنا مطور ويب متكامل مع خبرة تمتد لسنوات في بناء حلول رقمية متكاملة. شغفي هو تحويل الأفكار إلى تجارب رقمية استثنائية تخدم العملاء وتحقق أهدافهم التجارية.', '', 1),
    ('about', 'bio_en', '', 'I am a full-stack web developer with years of experience building complete digital solutions. My passion is transforming ideas into exceptional digital experiences that serve clients and achieve their business goals.', 2),
    ('about', 'skills', 'HTML, CSS, JavaScript, TypeScript, React, Node.js, Express, PostgreSQL, MongoDB, Git', 'HTML, CSS, JavaScript, TypeScript, React, Node.js, Express, PostgreSQL, MongoDB, Git', 3),
    ('contact', 'intro_ar', 'هل لديك مشروع في ذهنك؟ تواصل معي وسنبني شيئاً استثنائياً معاً.', '', 1),
    ('contact', 'intro_en', '', 'Have a project in mind? Get in touch and we''ll build something exceptional together.', 2)
ON CONFLICT (page_key, section_key) DO NOTHING;

-- =============================================================================
-- Default Admin User (username: admin, password: admin123)
-- =============================================================================
-- Note: You should change this password immediately after first login!
INSERT INTO admin_users (username, password_hash) VALUES
    ('admin', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyDAXmZ4.PJ1Oa')
ON CONFLICT (username) DO NOTHING;

-- =============================================================================
-- Function: Auto-update updated_at timestamp
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =============================================================================
-- Triggers for auto-updating updated_at
-- =============================================================================
DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
CREATE TRIGGER update_admin_users_updated_at
    BEFORE UPDATE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_site_settings_updated_at ON site_settings;
CREATE TRIGGER update_site_settings_updated_at
    BEFORE UPDATE ON site_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_nav_items_updated_at ON nav_items;
CREATE TRIGGER update_nav_items_updated_at
    BEFORE UPDATE ON nav_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_services_updated_at ON services;
CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pages_updated_at ON pages;
CREATE TRIGGER update_pages_updated_at
    BEFORE UPDATE ON pages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sections_updated_at ON sections;
CREATE TRIGGER update_sections_updated_at
    BEFORE UPDATE ON sections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Summary
-- =============================================================================
-- Tables created: 8
-- Indexes created: 21
-- Functions created: 1
-- Triggers created: 7
-- Default data inserted for: settings, nav, services, sections, admin
