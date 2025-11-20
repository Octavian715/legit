import { computed, ref, watch, onMounted } from 'vue'
import { useMenuStore } from '~/stores/menu'
import { useRoute } from '#app'
import type { MenuItem } from '~/types/menu'

export const useMenuItems = () => {
    const menuStore = useMenuStore()
    const route = useRoute()
    const activeSubMenu = ref<MenuItem | null>(null)

    const menu = computed(() => menuStore.menuItems)

    const syncPathToStore = () => {
        if (route?.path) {
            menuStore.setCurrentPath(route.path)
        }
    }

    watch(() => route.path, syncPathToStore, { immediate: true })

    onMounted(() => {
        syncPathToStore()
    })

    const normalizePath = (path: string): string => {
        if (!path) return ''
        const i18nRegex = /^\/[a-z]{2}(?:-[A-Z]{2})?/
        return path.replace(i18nRegex, '').toLowerCase()
    }

    const isActive = (item: MenuItem): boolean => {
        if (!item.path || !route?.path) return false
        return normalizePath(route.path) === normalizePath(item.path)
    }

    const hasActiveChild = (item: MenuItem): boolean => {
        if (!item.children || item.children.length === 0) return false
        return item.children.some((child: MenuItem) => {
            if (isActive(child)) return true
            return hasActiveChild(child)
        })
    }

    const getActiveParentItem = computed((): MenuItem | null => {
        if (!menu.value.length || !route?.path) return null
        return menu.value.find((item) => hasActiveChild(item)) || null
    })

    const toggleSubMenu = (item: MenuItem): void => {
        if (!item.children?.length) return
        activeSubMenu.value = activeSubMenu.value?.key === item.key ? null : item
    }

    const handleSubmenuToggle = (item: MenuItem): void => {
        if (!item.children || item.children.length === 0) return

        const isCurrentlyOpen = activeSubMenu.value?.key === item.key
        const isParentOfActiveItem = hasActiveChild(item)

        if (isCurrentlyOpen) {
            if (!isParentOfActiveItem) {
                activeSubMenu.value = null
            }
        } else {
            activeSubMenu.value = item
        }
    }

    const shouldShowSubmenu = (item: MenuItem): boolean => {
        return Boolean(
            item.children && item.children.length > 0 && activeSubMenu.value?.key === item.key
        )
    }

    const openActiveParentSubmenu = (): void => {
        const activeParent = getActiveParentItem.value

        if (activeParent && activeSubMenu.value?.key !== activeParent.key) {
            activeSubMenu.value = activeParent
        }
    }

    const shouldAddTopMargin = (item: MenuItem, index: number): boolean => {
        const settingsGroupKeys = ['settings', 'support', 'guide']

        if (!menu.value.length || index === 0) return false

        const isSettingsGroup = settingsGroupKeys.includes(item.key || '')
        const prevItem = menu.value[index - 1]
        const prevIsNotSettings = prevItem && !settingsGroupKeys.includes(prevItem.key || '')

        return isSettingsGroup && prevIsNotSettings
    }

    return {
        menu,
        activeSubMenu,
        isActive,
        hasActiveChild,
        getActiveParentItem,
        toggleSubMenu,
        handleSubmenuToggle,
        shouldShowSubmenu,
        openActiveParentSubmenu,
        shouldAddTopMargin,
    }
}
