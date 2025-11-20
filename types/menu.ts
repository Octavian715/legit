// types/menu.ts
import type { UserRole } from './auth'

export interface MenuItem {
    key?: string
    label: string
    icon: string
    path?: string
    children?: MenuItem[]
    actions?: string
    count?: number
    badge?: string | number
    disabled?: boolean
    order?: number
    visible?: boolean
    target?: '_blank' | '_self'
    tooltip?: string
    shortcut?: string
    className?: string
}

export interface MenuItemConfig {
    key: string
    labelKey: string
    icon: string
    path?: string
    roles: UserRole[]
    requiresAuth?: boolean
    children?: MenuItemConfig[]
    permissions?: string[]
    order?: number
    visible?: boolean
    featureFlags?: string[]
    target?: '_blank' | '_self'
    tooltip?: string
    shortcut?: string
    className?: string
}

export interface MenuSection {
    key: string
    labelKey: string
    items: MenuItemConfig[]
    roles: UserRole[]
    order: number
    collapsible?: boolean
    defaultCollapsed?: boolean
    permissions?: string[]
    featureFlags?: string[]
}

export interface MenuConfiguration {
    sections: MenuSection[]
    globalSettings?: {
        enableBreadcrumbs?: boolean
        enableSearch?: boolean
        enableCollapse?: boolean
        maxDepth?: number
        showIcons?: boolean
        showTooltips?: boolean
    }
    roleOverrides?: Partial<Record<UserRole, MenuOverride>>
}

export interface MenuOverride {
    hideItems?: string[]
    showItems?: string[]
    reorderItems?: Record<string, number>
    customItems?: MenuItemConfig[]
}

export interface MenuState {
    activeItem?: MenuItem
    expandedItems: Set<string>
    collapsedSections: Set<string>
    searchQuery: string
    isLoading: boolean
    error?: string
}

export interface MenuContext {
    userRoles: UserRole[]
    userPermissions: string[]
    pathPrefix: string
    featureFlags: string[]
    currentPath: string
}

export interface BreadcrumbItem {
    label: string
    path?: string
    icon?: string
    active?: boolean
}

export interface MenuStatistics {
    totalItems: number
    visibleItems: number
    hiddenItems: number
    totalSections: number
    itemsByRole: Record<UserRole, number>
    maxDepth: number
    hasIcons: number
    hasChildren: number
}

export interface MenuValidationResult {
    isValid: boolean
    errors: string[]
    warnings: string[]
    totalItems: number
    totalSections: number
}

export interface MenuSearchResult {
    item: MenuItem
    matches: string[]
    score: number
    breadcrumb: string[]
}

export interface MenuPreferences {
    collapsedSections: string[]
    favoriteItems: string[]
    recentItems: string[]
    customOrder?: Record<string, number>
    showBadges: boolean
    showTooltips: boolean
    compactMode: boolean
}
