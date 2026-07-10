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

  // Admin user - فايز محمد
  const hash = await bcrypt.hash("admin123", 12);
  await db.insert(adminUsersTable).values({ username: "admin", passwordHash: hash });

  // Site settings
  const defaultSettings = [
    { key: "site_title_ar", value: "فايز محمد | مطور ويب" },
    { key: "site_title_en", value: "Fayiz Mohammed | Web Developer" },
    { key: "site_description_ar", value: "أبني مواقع إلكترونية من الصفر. البرمجة شغفي وهوايتي المفضلة." },
    { key: "site_description_en", value: "I build websites from scratch. Programming is my passion and favorite hobby." },
    { key: "hero_name_ar", value: "فايز محمد" },
    { key: "hero_name_en", value: "Fayiz Mohammed" },
    { key: "hero_title_ar", value: "مطور ويب" },
    { key: "hero_title_en", value: "Web Developer" },
    { key: "hero_intro_ar", value: "أبني مواقع إلكترونية من الصفر. أستمتع بإنشاء حلول رقمية متكاملة. البرمجة بالنسبة لي أكثر من عمل، إنها شغفي وإحدى هواياتي المفضلة." },
    { key: "hero_intro_en", value: "I build websites from scratch. I enjoy creating complete digital solutions. For me, programming is more than work - it's my passion and one of my favorite hobbies." },
    { key: "contact_email", value: "fayiz.abualaileh1k@gmail.com" },
    { key: "contact_whatsapp", value: "+962780777050" },
    { key: "contact_telegram", value: "+962780777050" },
    { key: "contact_facebook", value: "Fayiz Abualaileh" },
    { key: "contact_phone", value: "+962780777050" },
    { key: "logo_text_ar", value: "ف" },
    { key: "logo_text_en", value: "F" },
    { key: "footer_text_ar", value: "جميع الحقوق محفوظة © فايز محمد" },
    { key: "footer_text_en", value: "All rights reserved © Fayiz Mohammed" },
    { key: "default_lang", value: "ar" },
  ];
  await db.insert(siteSettingsTable).values(defaultSettings);

  // Nav items
  await db.insert(navItemsTable).values([
    { labelAr: "الرئيسية", labelEn: "Home", url: "/", sortOrder: 1 },
    { labelAr: "من أنا", labelEn: "About", url: "/about.html", sortOrder: 2 },
    { labelAr: "أعمالي", labelEn: "Portfolio", url: "/portfolio.html", sortOrder: 3 },
    { labelAr: "تواصل معي", labelEn: "Contact", url: "/contact.html", sortOrder: 4 },
  ]);

  // Services
  await db.insert(servicesTable).values([
    { titleAr: "بناء المواقع من الصفر", titleEn: "Build Websites from Scratch", descriptionAr: "أبني مواقع إلكترونية متكاملة من التصميم حتى التسليم، بأكواد نظيفة ومنظمة.", descriptionEn: "I build complete websites from design to delivery, with clean and organized code.", icon: "code", sortOrder: 1 },
    { titleAr: "حلول رقمية مخصصة", titleEn: "Custom Digital Solutions", descriptionAr: "أحول أفكارك إلى مواقع وتطبيقات ويب حقيقية تعمل بالضبط كما تتخيل.", descriptionEn: "I turn your ideas into real websites and web applications that work exactly as you imagine.", icon: "zap", sortOrder: 2 },
    { titleAr: "مواقع سهلة الإدارة", titleEn: "Easy-to-Manage Websites", descriptionAr: "أنشئ لك لوحة تحكم تمكنك من تعديل موقعك بنفسك دون الحاجة لمعرفة برمجية.", descriptionEn: "I create an admin panel that lets you edit your website yourself without needing programming knowledge.", icon: "settings", sortOrder: 3 },
    { titleAr: "أداء عالٍ", titleEn: "High Performance", descriptionAr: "أهتم بسرعة تحميل موقعك وأدائه لضمان أفضل تجربة للمستخدمين.", descriptionEn: "I care about your website's loading speed and performance to ensure the best user experience.", icon: "rocket", sortOrder: 4 },
  ]);

  // Home sections
  await db.insert(sectionsTable).values([
    { pageKey: "home", sectionKey: "about_brief_ar", contentAr: "أبني مواقع إلكترونية من الصفر. البرمجة بالنسبة لي أكثر من مجرد عمل، إنها شغفي وإحدى هواياتي المفضلة. أهتم بالكود النظيف والتنظيم والأداء العالي.", contentEn: "", sortOrder: 1 },
    { pageKey: "home", sectionKey: "about_brief_en", contentAr: "", contentEn: "I build websites from scratch. For me, programming is more than just work - it's my passion and one of my favorite hobbies. I care about clean code, organization, and high performance.", sortOrder: 2 },
    { pageKey: "about", sectionKey: "bio_ar", contentAr: "أنا فايز محمد، مطور ويب محترف. أؤمن بأنه عندما أبني موقعاً، العميل يجب أن يمتلكه بالكامل. لا أحب أن يشعر العميل بالتبعية للمطور لإجراء كل تغيير صغير. لذلك أبني مواقع سهلة الإدارة.", contentEn: "", sortOrder: 1 },
    { pageKey: "about", sectionKey: "bio_en", contentAr: "", contentEn: "I'm Fayiz Mohammed, a professional web developer. I believe when I build a website, the client should fully own it. I don't like clients feeling dependent on the developer for every small change. That's why I build easy-to-manage websites.", sortOrder: 2 },
    { pageKey: "about", sectionKey: "approach_ar", contentAr: "أفضل التواصل الصادق والمباشر مع العملاء. لا أحب المبالغة أو لغة التسويق غير الواقعية. أريد أن يشعر زوار موقعي بأنهم يتعاملون مع مطور حقيقي يستمتع حقاً ببناء المواقع الإلكترونية.", contentEn: "", sortOrder: 3 },
    { pageKey: "about", sectionKey: "approach_en", contentAr: "", contentEn: "I prefer honest and direct communication with clients. I don't like exaggeration or unrealistic marketing language. I want visitors to my site to feel like they're dealing with a real developer who truly enjoys building websites.", sortOrder: 4 },
    { pageKey: "contact", sectionKey: "intro_ar", contentAr: "هل لديك فكرة أو مشروع في ذهنك؟ تواصل معي مباشرة ونناقش كيف أقدر أساعدك.", contentEn: "", sortOrder: 1 },
    { pageKey: "contact", sectionKey: "intro_en", contentAr: "", contentEn: "Do you have an idea or project in mind? Get in touch directly and let's discuss how I can help you.", sortOrder: 2 },
  ]);

  logger.info("Seeding complete. Admin: admin / admin123");
}
