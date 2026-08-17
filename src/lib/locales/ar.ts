import { TranslationKey } from './en';

export const ar: Record<TranslationKey, string> = {
  // Navigation & Common
  'nav.overview': 'نظرة عامة',
  'nav.orders': 'الطلبات',
  'nav.products': 'المنتجات',
  'nav.categories': 'التصنيفات',
  'nav.customers': 'العملاء',
  'nav.inventory': 'المخزون',
  'nav.analytics': 'التحليلات',
  'nav.customization': 'تخصيص المتجر',
  'nav.marketing': 'التسويق',
  'nav.settings': 'الإعدادات',
  'nav.admin.overview': 'نظرة عامة',
  'nav.admin.users': 'المستخدمين',
  'nav.admin.stores': 'المتاجر',
  'nav.admin.plans': 'الخطط',
  'nav.storeManager': 'مدير المتجر',
  'nav.platformAdmin': 'مدير المنصة',
  'nav.viewStorefront': 'عرض المتجر',
  'nav.backToDashboard': 'العودة للوحة التحكم',
  
  // Actions
  'action.save': 'حفظ',
  'action.cancel': 'إلغاء',
  'action.delete': 'حذف',
  'action.edit': 'تعديل',
  'action.create': 'إنشاء',
  'action.add': 'إضافة',
  'action.search': 'بحث...',
  'action.refresh': 'تحديث',
  'action.clearAll': 'مسح الكل',
  'action.markAllRead': 'تحديد الكل كمقروء',
  'action.signIn': 'تسجيل الدخول',
  'action.signOut': 'تسجيل الخروج',
  'action.signUp': 'إنشاء حساب',
  'action.getStarted': 'البدء',
  'action.continue': 'متابعة',
  'action.exportCsv': 'تصدير CSV',

  // UI
  'ui.loading': 'جاري التحميل...',
  'ui.noResults': 'لم يتم العثور على نتائج',
  'ui.showing': 'عرض',
  'ui.of': 'من',
  'ui.yes': 'نعم',
  'ui.no': 'لا',
  'ui.confirm': 'تأكيد',

  // StoreSwitcher
  'storeswitcher.title': 'متاجرك',
  'storeswitcher.search': 'البحث عن المتاجر...',
  'storeswitcher.create': 'إنشاء متجر جديد',
  'storeswitcher.noStores': 'لم يتم العثور على متاجر',

  // UserMenu
  'usermenu.user': 'مستخدم ستور كرافت',
  'usermenu.viewStorefront': 'عرض المتجر',
  'usermenu.createStore': 'إنشاء متجر جديد',
  'usermenu.settings': 'إعدادات المتجر',
  'usermenu.signOut': 'تسجيل الخروج',

  // NotificationsMenu
  'notifications.title': 'الإشعارات',
  'notifications.markAllRead': 'تحديد الكل كمقروء',
  'notifications.noNotifications': 'لا توجد إشعارات بعد',
  'notifications.refresh': 'تحديث',
  'notifications.clearAll': 'مسح الكل',
} as const;
