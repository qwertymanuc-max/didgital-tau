"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"

export type Language = "en" | "ru" | "kz"

type Translation = {
  en: string
  ru: string
  kz: string
}

type Translations = Record<string, Translation>

const translations: Translations = {
  /* ================= NAVIGATION ================= */
  home: { en: "Home", ru: "Главная", kz: "Басты бет" },
  projects: { en: "Projects", ru: "Проекты", kz: "Жобалар" },
  technologies: { en: "Technologies", ru: "Технологии", kz: "Технологиялар" },
  about: { en: "About", ru: "О нас", kz: "Біз туралы" },
  adminPanel: { en: "Admin Panel", ru: "Админ-панель", kz: "Әкімші панелі" },

  /* ================= HERO ================= */
  digitalTau: { en: "DIGITAL TAU", ru: "DIGITAL TAU", kz: "DIGITAL TAU" },
  innovationShowcase: {
    en: "Innovation & Research Showcase",
    ru: "Витрина инноваций и исследований",
    kz: "Инновация және зерттеу көрмесі",
  },
  whereIdeasMeet: {
    en: "Where ideas meet technology",
    ru: "Где идеи встречаются с технологиями",
    kz: "Идеялар технологиямен кездесетін жер",
  },
  exploreProjects: {
    en: "Explore Projects",
    ru: "Изучить проекты",
    kz: "Жобаларды зерттеу",
  },

  /* ================= HOME STATS (optional) ================= */
  digitalTauByNumbers: {
    en: "Digital TAU by the Numbers",
    ru: "Digital TAU в цифрах",
    kz: "Digital TAU сандармен",
  },
  projectsCount: { en: "Projects", ru: "Проекты", kz: "Жобалар" },
  studentsCount: { en: "Students", ru: "Студенты", kz: "Студенттер" },
  technologiesCount: { en: "Technologies", ru: "Технологии", kz: "Технологиялар" },

  /* ================= PROJECTS ================= */
  projectCatalog: {
    en: "Project Catalog",
    ru: "Каталог проектов",
    kz: "Жобалар каталогы",
  },
  searchProjects: {
    en: "Search projects...",
    ru: "Поиск проектов...",
    kz: "Жобаларды іздеу...",
  },
  all: { en: "All", ru: "Все", kz: "Барлығы" },
  featuredProjects: {
    en: "Featured Projects",
    ru: "Избранные проекты",
    kz: "Таңдаулы жобалар",
  },
  viewProject: {
    en: "View Project",
    ru: "Смотреть проект",
    kz: "Жобаны көру",
  },
  loading: { en: "Loading…", ru: "Загрузка…", kz: "Жүктелуде…" },
  failedToLoadProjects: {
    en: "Failed to load projects",
    ru: "Не удалось загрузить проекты",
    kz: "Жобаларды жүктеу мүмкін болмады",
  },
  checkApi: {
    en: "Check reverse proxy routing: /api/projects must reach the backend with the /api prefix preserved.",
    ru: "Проверь reverse proxy: /api/projects должен попадать в backend с сохранением префикса /api.",
    kz: "Reverse proxy баптауын тексер: /api/projects backend-ке /api префиксі сақталып жетуі керек.",
  },
  noProjectsFound: {
    en: "No projects found matching your criteria.",
    ru: "Проекты по вашему запросу не найдены.",
    kz: "Сұранысыңыз бойынша жобалар табылмады.",
  },
  noProjects: {
    en: "No projects yet.",
    ru: "Проектов пока нет.",
    kz: "Әзірге жобалар жоқ.",
  },

  /* ================= ABOUT – UNIVERSITY ================= */
  aboutDigitalTau: {
    en: "About Digital TAU",
    ru: "О Digital TAU",
    kz: "Digital TAU туралы",
  },
  aboutDesc: {
    en: "Digital TAU is a platform that showcases student projects, research initiatives, and technologies at Turan-Astana University.",
    ru: "Digital TAU — платформа, которая демонстрирует студенческие проекты, исследовательские инициативы и технологии в Университете «Туран-Астана».",
    kz: "Digital TAU — «Тұран-Астана» университетіндегі студенттік жобалар, зерттеу бастамалары және технологияларды көрсететін платформа.",
  },
  universityName: {
    en: "Turan-Astana University",
    ru: "Университет «Туран-Астана»",
    kz: "«Тұран-Астана» университеті",
  },
  tarazKazakhstan: {
    en: "Astana, Kazakhstan",
    ru: "Астана, Казахстан",
    kz: "Астана, Қазақстан",
  },
  universityDesc: {
    en: "Turan-Astana University is a leading educational institution in Kazakhstan focused on innovation, research excellence and student development.",
    ru: "Университет «Туран-Астана» — ведущее образовательное учреждение Казахстана, ориентированное на инновации, исследования и развитие студентов.",
    kz: "«Тұран-Астана» университеті — инновация, зерттеу және студенттер дамуына бағытталған жетекші оқу орны.",
  },

  keyMilestones: {
    en: "Key Milestones",
    ru: "Ключевые достижения",
    kz: "Негізгі жетістіктер",
  },
  foundedYear: {
    en: "Founded in 1998",
    ru: "Основан в 1998 году",
    kz: "1998 жылы құрылған",
  },
  researchProjects: {
    en: "150+ Research Projects",
    ru: "150+ исследовательских проектов",
    kz: "150+ зерттеу жобасы",
  },
  activeStudents: {
    en: "2500+ Active Students",
    ru: "2500+ активных студентов",
    kz: "2500+ белсенді студент",
  },
  globalPartnerships: {
    en: "Global Partnerships",
    ru: "Глобальные партнерства",
    kz: "Жаһандық серіктестіктер",
  },

  /* ================= ABOUT – VALUES ================= */
  innovation: { en: "Innovation", ru: "Инновации", kz: "Инновация" },
  innovationDesc: {
    en: "Cutting-edge technologies and ideas",
    ru: "Передовые технологии и идеи",
    kz: "Озық технологиялар мен идеялар",
  },
  impact: { en: "Impact", ru: "Влияние", kz: "Әсер" },
  impactDesc: {
    en: "Creating positive impact on society",
    ru: "Создание позитивного влияния на общество",
    kz: "Қоғамға оң әсер ету",
  },
  collaboration: {
    en: "Collaboration",
    ru: "Сотрудничество",
    kz: "Ынтымақтастық",
  },
  collaborationDesc: {
    en: "Bringing together students and faculty",
    ru: "Объединение студентов и преподавателей",
    kz: "Студенттер мен оқытушыларды біріктіру",
  },
  diversity: { en: "Diversity", ru: "Разнообразие", kz: "Әртүрлілік" },
  diversityDesc: {
    en: "Diverse approaches and technologies",
    ru: "Разнообразные подходы и технологии",
    kz: "Әртүрлі тәсілдер мен технологиялар",
  },
  learnMore: {
    en: "Learn More",
    ru: "Узнать больше",
    kz: "Көбірек білу",
  },

  /* ================= TECHNOLOGIES PAGE ================= */
  cuttingEdgeTech: {
    en: "Cutting-edge tools and stacks used in our projects",
    ru: "Передовые инструменты и стеки, используемые в наших проектах",
    kz: "Жобаларымызда қолданылатын озық құралдар мен стек",
  },
  andManyMore: {
    en: "…and many more technologies across AI, web, mobile, IoT, and beyond.",
    ru: "…и ещё множество технологий в AI, вебе, мобайле, IoT и не только.",
    kz: "…сондай-ақ AI, веб, мобайл, IoT және басқа да бағыттардағы көптеген технологиялар.",
  },
  exploreAllTech: {
    en: "Explore All Technologies",
    ru: "Смотреть все технологии",
    kz: "Барлық технологияларды көру",
  },

  /* ================= FOOTER ================= */
  footerDesc: {
    en: "Showcasing innovation and research excellence at Turan-Astana University",
    ru: "Демонстрация инноваций и исследовательского мастерства в Университете «Туран-Астана»",
    kz: "«Тұран-Астана» университетіндегі инновация және зерттеу шеберлігін көрсету",
  },
  contacts: { en: "Contacts", ru: "Контакты", kz: "Байланыс" },
  socialMedia: {
    en: "Social Media",
    ru: "Социальные сети",
    kz: "Әлеуметтік желілер",
  },
  copyright: {
    en: "Digital TAU. All rights reserved.",
    ru: "Digital TAU. Все права защищены.",
    kz: "Digital TAU. Барлық құқықтар қорғалған.",
  },
  privacy: { en: "Privacy Policy", ru: "Политика конфиденциальности", kz: "Құпиялық саясаты" },
  terms: { en: "Terms of Service", ru: "Условия использования", kz: "Пайдалану шарттары" },
  accessibility: { en: "Accessibility", ru: "Доступность", kz: "Қолжетімділік" },

  /* ================= ADMIN ================= */
  admin: { en: "Admin", ru: "Админ", kz: "Әкімші" },
  dashboard: { en: "Dashboard", ru: "Панель управления", kz: "Басқару тақтасы" },
  manageProjects: {
    en: "Manage Projects",
    ru: "Управление проектами",
    kz: "Жобаларды басқару",
  },
  manageTech: {
    en: "Manage Technologies",
    ru: "Управление технологиями",
    kz: "Технологияларды басқару",
  },
  settings: { en: "Settings", ru: "Настройки", kz: "Параметрлер" },
  logout: { en: "Logout", ru: "Выход", kz: "Шығу" },

  totalProjects: { en: "Total Projects", ru: "Всего проектов", kz: "Жобалар саны" },
  totalStudents: { en: "Total Students", ru: "Всего студентов", kz: "Студенттер саны" },
  activeTechnologies: { en: "Active Technologies", ru: "Активные технологии", kz: "Белсенді технологиялар" },
  recentActivity: { en: "Recent Activity", ru: "Последняя активность", kz: "Соңғы белсенділік" },
  projectsByCategory: { en: "Projects by Category", ru: "Проекты по категориям", kz: "Санаттар бойынша жобалар" },
  noActivityYet: { en: "No activity yet.", ru: "Пока нет активности.", kz: "Әзірге белсенділік жоқ." },
  noProjectsInDb: { en: "No projects in DB yet.", ru: "В базе пока нет проектов.", kz: "Дерекқорда әзірге жобалар жоқ." },
  featuredProject: { en: "Featured project", ru: "Избранный проект", kz: "Таңдаулы жоба" },
  projectUpdated: { en: "Project updated/added", ru: "Проект обновлён/добавлен", kz: "Жоба жаңартылды/қосылды" },

  /* ================= AUTH ================= */
  adminLogin: { en: "Admin Login", ru: "Вход для администратора", kz: "Әкімшіге кіру" },
  loginSubtitle: { en: "Sign in to manage content", ru: "Войдите, чтобы управлять контентом", kz: "Контентті басқару үшін кіріңіз" },
  username: { en: "Username", ru: "Логин", kz: "Логин" },
  enterUsername: { en: "Enter username", ru: "Введите логин", kz: "Логин енгізіңіз" },
  password: { en: "Password", ru: "Пароль", kz: "Құпиясөз" },
  enterPassword: { en: "Enter password", ru: "Введите пароль", kz: "Құпиясөз енгізіңіз" },
  rememberMe: { en: "Remember me", ru: "Запомнить меня", kz: "Мені есте сақтау" },
  invalidCredentials: { en: "Invalid credentials", ru: "Неверный логин или пароль", kz: "Логин немесе құпиясөз қате" },
  loggingIn: { en: "Logging in…", ru: "Вход…", kz: "Кіру…" },
  login: { en: "Login", ru: "Войти", kz: "Кіру" },
  demoCredentials: { en: "Demo credentials", ru: "Демо-доступ", kz: "Демо кіру деректері" },

  /* ================= ADMIN: USERS ================= */
  users: { en: "Users", ru: "Пользователи", kz: "Пайдаланушылар" },
  status: { en: "Status", ru: "Статус", kz: "Мәртебе" },
  totalUsers: { en: "Total Users", ru: "Всего пользователей", kz: "Пайдаланушылар саны" },
  admins: { en: "Admins", ru: "Администраторы", kz: "Әкімшілер" },
  active: { en: "Active", ru: "Активные", kz: "Белсенді" },
  name: { en: "Name", ru: "Имя", kz: "Аты" },
  email: { en: "Email", ru: "Email", kz: "Email" },
  role: { en: "Role", ru: "Роль", kz: "Рөлі" },
  faculty: { en: "Faculty", ru: "Преподаватель", kz: "Оқытушы" },
  student: { en: "Student", ru: "Студент", kz: "Студент" },

  /* ================= ADMIN: PROJECTS CRUD ================= */
  addProject: { en: "Add project", ru: "Добавить проект", kz: "Жоба қосу" },
  editProject: { en: "Edit project", ru: "Редактировать проект", kz: "Жобаны өңдеу" },
  addTechnology: { en: "Add Technology", ru: "Добавить технологию", kz: "Технология қосу" },
  actions: { en: "Actions", ru: "Действия", kz: "Әрекеттер" },
  edit: { en: "Edit", ru: "Редактировать", kz: "Өңдеу" },
  delete: { en: "Delete", ru: "Удалить", kz: "Жою" },
  title: { en: "Title", ru: "Название", kz: "Атауы" },
  category: { en: "Category", ru: "Категория", kz: "Санат" },
  featured: { en: "Featured", ru: "Избранное", kz: "Таңдаулы" },
  cancel: { en: "Cancel", ru: "Отмена", kz: "Бас тарту" },
  submit: { en: "Submit", ru: "Сохранить", kz: "Сақтау" },
  saving: { en: "Saving…", ru: "Сохранение…", kz: "Сақталуда…" },
  confirmDeleteProject: {
    en: "Delete project \"{title}\"?",
    ru: "Удалить проект «{title}»?",
    kz: "«{title}» жобасын жою керек пе?",
  },
  fieldTitleRu: { en: "Title (RU)", ru: "Название (RU)", kz: "Атауы (RU)" },
  fieldTitleKz: { en: "Title (KZ)", ru: "Название (KZ)", kz: "Атауы (KZ)" },
  fieldTitleEn: { en: "Title (EN)", ru: "Название (EN)", kz: "Атауы (EN)" },
  fieldDescRu: { en: "Description (RU)", ru: "Описание (RU)", kz: "Сипаттама (RU)" },
  fieldDescKz: { en: "Description (KZ)", ru: "Описание (KZ)", kz: "Сипаттама (KZ)" },
  fieldDescEn: { en: "Description (EN)", ru: "Описание (EN)", kz: "Сипаттама (EN)" },
  fieldTech: { en: "Technologies (comma-separated)", ru: "Технологии (через запятую)", kz: "Технологиялар (үтір арқылы)" },
  fieldProjectUrl: { en: "Project URL", ru: "Ссылка на проект", kz: "Жоба сілтемесі" },
  fieldImage: { en: "Image", ru: "Картинка", kz: "Сурет" },
  keepImageHint: {
    en: "If you don't choose a file when editing, the existing image will be kept.",
    ru: "Если при редактировании не выбрать файл — картинка останется прежней.",
    kz: "Өңдеу кезінде файл таңдамасаңыз — бұрынғы сурет сақталады.",
  },
  noProjectsTable: { en: "No projects.", ru: "Проектов нет.", kz: "Жобалар жоқ." },

  /* ================= ADMIN: SETTINGS ================= */
  language: { en: "Language", ru: "Язык", kz: "Тіл" },
  languageDesc: { en: "Choose your preferred language", ru: "Выберите предпочтительный язык", kz: "Қалаған тілді таңдаңыз" },
  notifications: { en: "Notifications", ru: "Уведомления", kz: "Хабарландырулар" },
  notificationsDesc: { en: "Manage notification preferences", ru: "Управление уведомлениями", kz: "Хабарландыру баптаулары" },
  emailNotifications: { en: "Email notifications", ru: "Email-уведомления", kz: "Email хабарландырулар" },
  projectUpdates: { en: "Project updates", ru: "Обновления проектов", kz: "Жоба жаңартулары" },
  security: { en: "Security", ru: "Безопасность", kz: "Қауіпсіздік" },
  securityDesc: { en: "Manage your account security", ru: "Управление безопасностью аккаунта", kz: "Аккаунт қауіпсіздігін басқару" },
  changePassword: { en: "Change Password", ru: "Сменить пароль", kz: "Құпиясөзді өзгерту" },
  theme: { en: "Theme", ru: "Тема", kz: "Тақырып" },
  themeDesc: { en: "Customize appearance", ru: "Настроить внешний вид", kz: "Сыртқы көріністі баптау" },
  dark: { en: "Dark", ru: "Тёмная", kz: "Қараңғы" },
  light: { en: "Light", ru: "Светлая", kz: "Жарық" },
  usedInProjects: { en: "Used in {count} projects", ru: "Используется в {count} проектах", kz: "{count} жобада қолданылады" },
}

/* ================= CONTEXT ================= */

interface I18nContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, vars?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextType | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en")

  useEffect(() => {
    const saved = localStorage.getItem("lang")
    if (saved === "en" || saved === "ru" || saved === "kz") {
      setLanguageState(saved)
    }
  }, [])

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem("lang", lang)
  }, [])

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const raw = translations[key]?.[language] ?? translations[key]?.en ?? key
      if (!vars) return raw
      return Object.entries(vars).reduce((acc, [k, v]) => {
        return acc.split(`{${k}}`).join(String(v))
      }, raw)
    },
    [language]
  )

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider")
  return ctx
}
