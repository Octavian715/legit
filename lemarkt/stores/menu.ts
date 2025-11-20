import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '~/stores/user'
import { storeToRefs } from 'pinia'
import { MENU_CONFIG } from '~/constants/menuConfig'
import { buildMenuForRole, validateMenuConfig } from '~/utils/menuUtils'
import type { MenuItem } from '~/types/menu'
import type { UserRole } from '~/types/auth'

export const useMenuStore = defineStore('menu', () => {
    const { t } = useI18n()
    const userStore = useUserStore()
    const { primaryRole } = storeToRefs(userStore)

    const validationResult = ref(validateMenuConfig(MENU_CONFIG))
    const currentPath = ref('')

    const activeRole = computed<UserRole | null>(() => {
        if (!currentPath.value) return primaryRole.value

        const i18nRegex = /^\/[a-z]{2}(?:-[A-Z]{2})?(?=\/|$)/
        const cleanPath = currentPath.value.replace(i18nRegex, '')
        const match = cleanPath.match(/^\/(buyer|supplier|serviceProvider|admin)/)

        return match ? (match[1] as UserRole) : primaryRole.value
    })

    const menuItems = computed<MenuItem[]>(() => {
        if (!activeRole.value) return []
        return buildMenuForRole(MENU_CONFIG, activeRole.value, t)
    })

    const setCurrentPath = (path: string) => {
        currentPath.value = path
    }

    return {
        menuItems,
        activeRole,
        currentPath: computed(() => currentPath.value),
        setCurrentPath,
        isMenuValid: computed(() => validationResult.value.isValid),
    }
})

if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useMenuStore, import.meta.hot))
}
