import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import {
  adminUsersTable,
  siteSettingsTable,
  navItemsTable,
  servicesTable,
  sectionsTable,
} from "@workspace/db";
import { logger } from "./logger";

export async function seedIfEmpty(): Promise<void> {
  const existing = await db.select().from(adminUsersTable).limit(1);
  if (existing.length > 0) return;

  logger.info("Seeding initial data...");

  // Admin user
  const hash = await bcrypt.hash("admin123", 12);
  await db.insert(adminUsersTable).values({ username: "admin", passwordHash: hash });

  // Site settings
  const defaultSettings = [
    { key: "site_title_ar", value: "محمد الحسيني | مطور ويب" },
    { key: "site_title_en", value: "Mohammed Al-Husseini | Web Developer" },
    { key: "site_description_ar", value: "مطور ويب محترف متخصص في بناء حلول رقمية متكاملة" },
    { key: "site_description_en", value: "Professional web developer specializing in complete digital solutions" },
    { key: "hero_name_ar", value: "محمد الحسيني" },
    { key: "hero_name_en", value: "Mohammed Al-Husseini" },
    { key: "hero_title_ar", value: "مطور ويب متكامل" },
    { key: "hero_title_en", value: "Full-Stack Web Developer" },
    { key: "hero_intro_ar", value: "أبني حلولاً رقمية متكاملة، لا مجرد صفحات ويب. أجمع بين الكود النظيف والأداء العالي لأقدم تجارب استثنائية." },
    { key: "hero_intro_en", value: "I build complete digital solutions, not just web pages. Combining clean code with high performance to deliver exceptional experiences." },
    { key: "contact_email", value: "contact@example.com" },
    { key: "contact_whatsapp", value: "+966500000000" },
    { key: "contact_phone", value: "+966500000000" },
    { key: "social_github", value: "https://github.com" },
    { key: "social_linkedin", value: "https://linkedin.com" },
    { key: "social_twitter", value: "https://twitter.com" },
    { key: "logo_text_ar", value: "م.ح" },
    { key: "logo_text_en", value: "MH" },
    { key: "footer_text_ar", value: "جميع الحقوق محفوظة" },
    { key: "footer_text_en", value: "All rights reserved" },
    { key: "default_lang", value: "ar" },
  ];
  await db.insert(siteSettingsTable).values(defaultSettings);

  // Nav items
  await db.insert(navItemsTable).values([
    { labelAr: "الرئيسية", labelEn: "Home", url: "/", sortOrder: 1 },
    { labelAr: "من أنا", labelEn: "About", url: "/about.html", sortOrder: 2 },
    { labelAr: "خدماتي", labelEn: "Services", url: "/services.html", sortOrder: 3 },
    { labelAr: "أعمالي", labelEn: "Portfolio", url: "/portfolio.html", sortOrder: 4 },
    { labelAr: "تواصل معي", labelEn: "Contact", url: "/contact.html", sortOrder: 5 },
  ]);

  // Services
  await db.insert(servicesTable).values([
    { titleAr: "تطوير المواقع", titleEn: "Website Development", descriptionAr: "تصميم وتطوير مواقع ويب احترافية بأحدث التقنيات", descriptionEn: "Design and develop professional websites using the latest technologies", icon: "globe", sortOrder: 1 },
    { titleAr: "حلول ويب مخصصة", titleEn: "Custom Web Solutions", descriptionAr: "بناء تطبيقات وأنظمة ويب مخصصة حسب احتياجاتك", descriptionEn: "Build custom web applications and systems tailored to your needs", icon: "settings", sortOrder: 2 },
    { titleAr: "مواقع الأعمال", titleEn: "Business Websites", descriptionAr: "مواقع احترافية تعكس هوية شركتك وتجذب العملاء", descriptionEn: "Professional websites that reflect your company identity and attract clients", icon: "briefcase", sortOrder: 3 },
    { titleAr: "متاجر إلكترونية", titleEn: "E-commerce Websites", descriptionAr: "متاجر إلكترونية متكاملة مع نظام إدارة المنتجات والطلبات", descriptionEn: "Full-featured online stores with product and order management", icon: "shopping-cart", sortOrder: 4 },
    { titleAr: "لوحات التحكم والإدارة", titleEn: "Dashboard & Management Systems", descriptionAr: "أنظمة إدارة متكاملة للتحكم في بيانات أعمالك", descriptionEn: "Comprehensive management systems to control your business data", icon: "layout-dashboard", sortOrder: 5 },
    { titleAr: "الاستضافة والدعم التقني", titleEn: "Hosting & Technical Support", descriptionAr: "استضافة موقعك ودعم تقني مستمر لضمان الأداء المثالي", descriptionEn: "Website hosting and continuous technical support for optimal performance", icon: "server", sortOrder: 6 },
  ]);

  // Home sections
  await db.insert(sectionsTable).values([
    { pageKey: "home", sectionKey: "about_brief_ar", contentAr: "أنا مطور ويب متكامل شغوف بالكود النظيف والأداء العالي. أؤمن بأن كل موقع يجب أن يكون تجربة لا مجرد صفحة.", contentEn: "", sortOrder: 1 },
    { pageKey: "home", sectionKey: "about_brief_en", contentAr: "", contentEn: "I am a full-stack web developer passionate about clean code and high performance. I believe every website should be an experience, not just a page.", sortOrder: 2 },
    { pageKey: "about", sectionKey: "bio_ar", contentAr: "أنا مطور ويب متكامل مع خبرة تمتد لسنوات في بناء حلول رقمية متكاملة. شغفي هو تحويل الأفكار إلى تجارب رقمية استثنائية تخدم العملاء وتحقق أهدافهم التجارية.", contentEn: "", sortOrder: 1 },
    { pageKey: "about", sectionKey: "bio_en", contentAr: "", contentEn: "I am a full-stack web developer with years of experience building complete digital solutions. My passion is transforming ideas into exceptional digital experiences that serve clients and achieve their business goals.", sortOrder: 2 },
    { pageKey: "about", sectionKey: "skills", contentAr: "HTML, CSS, JavaScript, TypeScript, React, Node.js, Express, PostgreSQL, MongoDB, Git", contentEn: "HTML, CSS, JavaScript, TypeScript, React, Node.js, Express, PostgreSQL, MongoDB, Git", sortOrder: 3 },
    { pageKey: "contact", sectionKey: "intro_ar", contentAr: "هل لديك مشروع في ذهنك؟ تواصل معي وسنبني شيئاً استثنائياً معاً.", contentEn: "", sortOrder: 1 },
    { pageKey: "contact", sectionKey: "intro_en", contentAr: "", contentEn: "Have a project in mind? Get in touch and we'll build something exceptional together.", sortOrder: 2 },
  ]);

  logger.info("Seeding complete. Admin: admin / admin123");
}
