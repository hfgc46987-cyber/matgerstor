export const en = {
  // Navigation & Common
  'nav.overview': 'Overview',
  'nav.orders': 'Orders',
  'nav.products': 'Products',
  'nav.categories': 'Categories',
  'nav.customers': 'Customers',
  'nav.inventory': 'Inventory',
  'nav.analytics': 'Analytics',
  'nav.customization': 'Store Customization',
  'nav.marketing': 'Marketing',
  'nav.settings': 'Settings',
  'nav.admin.overview': 'Overview',
  'nav.admin.users': 'Users',
  'nav.admin.stores': 'Stores',
  'nav.admin.plans': 'Plans',
  'nav.storeManager': 'Store Manager',
  'nav.platformAdmin': 'Platform Admin',
  'nav.viewStorefront': 'View storefront',
  'nav.backToDashboard': 'Back to dashboard',
  
  // Actions
  'action.save': 'Save',
  'action.cancel': 'Cancel',
  'action.delete': 'Delete',
  'action.edit': 'Edit',
  'action.create': 'Create',
  'action.add': 'Add',
  'action.search': 'Search...',
  'action.refresh': 'Refresh',
  'action.clearAll': 'Clear all',
  'action.markAllRead': 'Mark all read',
  'action.signIn': 'Sign in',
  'action.signOut': 'Sign out',
  'action.signUp': 'Sign up',
  'action.getStarted': 'Get started',
  'action.continue': 'Continue',
  'action.exportCsv': 'Export CSV',

  // UI
  'ui.loading': 'Loading...',
  'ui.noResults': 'No results found',
  'ui.showing': 'Showing',
  'ui.of': 'of',
  'ui.yes': 'Yes',
  'ui.no': 'No',
  'ui.confirm': 'Confirm',

  // StoreSwitcher
  'storeswitcher.title': 'Your stores',
  'storeswitcher.search': 'Search stores...',
  'storeswitcher.create': 'Create new store',
  'storeswitcher.noStores': 'No stores found',

  // UserMenu
  'usermenu.user': 'StoreCraft user',
  'usermenu.viewStorefront': 'View storefront',
  'usermenu.createStore': 'Create new store',
  'usermenu.settings': 'Store settings',
  'usermenu.signOut': 'Sign out',

  // NotificationsMenu
  'notifications.title': 'Notifications',
  'notifications.markAllRead': 'Mark all read',
  'notifications.noNotifications': 'No notifications yet',
  'notifications.refresh': 'Refresh',
  'notifications.clearAll': 'Clear all',
} as const;

export type TranslationKey = keyof typeof en;
