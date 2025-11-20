// utils/menuUtils.ts
import type { MenuSection, MenuItemConfig } from '~/constants/menuConfig'
import type { UserRole } from '~/types/auth'
import type { MenuItem } from '~/types/menu'

export const buildMenuForRole = (
    config: MenuSection[],
    role: UserRole,
    t: (key: string) => string
): MenuItem[] => {
    const sortedSections = [...config]
        .filter((section) => section.roles.includes(role))
        .sort((a, b) => a.order - b.order)

    const allItems: MenuItem[] = []

    sortedSections.forEach((section) => {
        const sectionItems = section.items
            .filter((item) => item.roles.includes(role))
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map((item) => transformMenuItem(item, role, t))

        allItems.push(...sectionItems)
    })

    return allItems
}

const transformMenuItem = (
    item: MenuItemConfig,
    role: UserRole,
    t: (key: string) => string
): MenuItem => {
    return {
        ...item,
        label: t(item.labelKey),
        path: item.basePath ? buildPath(item.basePath, role) : undefined,
        children: item.children
            ?.filter((child) => child.roles.includes(role))
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map((child) => transformMenuItem(child, role, t)),
    }
}

const buildPath = (basePath: string, role: UserRole): string => {
    return `/${role}/${basePath}`
}

export const validateMenuConfig = (config: MenuSection[]) => {
    const errors: string[] = []
    const orderSet = new Set<number>()

    config.forEach((section) => {
        if (orderSet.has(section.order)) {
            errors.push(`Duplicate section order: ${section.order} (${section.key})`)
        }
        orderSet.add(section.order)

        section.items.forEach((item) => {
            if (!item.basePath && !item.actions) {
                errors.push(`Missing basePath or actions in item: ${item.key}`)
            }

            item.children?.forEach((child) => {
                if (!child.basePath && !child.actions) {
                    errors.push(`Missing basePath or actions in child: ${child.key}`)
                }
            })
        })
    })

    return {
        isValid: errors.length === 0,
        errors,
    }
}
