<!-- ~/pages/[user]/settings/index.vue -->
<template>
    <div class="settings-page relative px-4 md:px-0">
        <Breadcrumbs :items="breadcrumbs" />

        <PageHeader :title="t('navigation.settings')" />

        <div class="relative bg-white px-4 py-5 rounded-b-sm">
            <!-- Loading State -->
            <div v-if="isLoading" class="flex justify-center py-8">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>

            <Tabs2
                v-else
                ref="tabsRef"
                :model-value="activeTabIndex"
                :tabs="tabs"
                variant="underline"
                :loading="isLoadingCounts"
                size="md"
                :lazy="true"
                @update:model-value="handleTabChange"
            >
                <template v-for="(tab, index) in tabs" :key="tab.id" #[`tab-${index}`]>
                    <component
                        :is="componentMap[tab.id]"
                        v-if="hasTabBeenSelected[tab.id]"
                        :ref="(el) => setTabRef(el, tab.id)"
                    />
                </template>
            </Tabs2>
        </div>

        <div class="fixed left-0 right-0 bottom-0 bg-white border-t border-gray-200 z-[1]">
            <div class="flex gap-5 container mx-auto p-4">
                <Button variant="outline" color="gray" :label="t('cancel')" @click="handleCancel" />
                <Button
                    color="blue"
                    :label="t('saveChanges')"
                    :loading="isSaving"
                    @click="handleSaveChanges"
                />
            </div>
        </div>

        <!-- Exit Confirmation Modal -->
        <ExitConfirmationModal
            v-model:is-open="showExitModal"
            :modal-title="t('settings.unsavedChanges')"
            :modal-message="t('settings.unsavedChangesMessage')"
            :ok-text="t('settings.discardAndLeave')"
            @confirm="handleDiscardAndLeave"
            @cancel="handleCancelExit"
        >
            <template #primary-action>
                <Button
                    color="blue"
                    :label="t('settings.saveAndContinue')"
                    :loading="isSavingBeforeSwitch"
                    size="lg"
                    class="w-full"
                    @click="handleSaveAndContinue"
                />
            </template>
        </ExitConfirmationModal>
    </div>
</template>

<script setup lang="ts">
    import { useLocalePath } from '#imports'
    import { useToastNotification } from '~/composables/useToastNotification'
    import { useUserStore } from '~/stores/user'

    const DeliveryTab = defineAsyncComponent(
        () => import('~/components/features/ecommerce/settings/tabs/DeliveryTab.vue')
    )

    const CurrenciesTab = defineAsyncComponent(
        () => import('~/components/features/ecommerce/settings/tabs/CurrienciesTab.vue')
    )

    const CompanyProfileTab = defineAsyncComponent(
        () => import('~/components/features/ecommerce/settings/tabs/CompanyProfileTab.vue')
    )

    const SubscriptionTab = defineAsyncComponent(
        () => import('~/components/features/ecommerce/settings/tabs/SubscriptionTab.vue')
    )

    const ExportTab = defineAsyncComponent(
        () => import('~/components/features/ecommerce/settings/tabs/ExportTab.vue')
    )

    const ProductionTab = defineAsyncComponent(
        () => import('~/components/features/ecommerce/settings/tabs/ProductionTab.vue')
    )

    const NotificationSettingsTab = defineAsyncComponent(
        () => import('~/components/features/ecommerce/settings/tabs/NotificationSettingsTab.vue')
    )

    const ExitConfirmationModal = defineAsyncComponent(
        () => import('~/components/modals/ExitConfirmationModal.vue')
    )
    const CompanyDetailsTab = defineAsyncComponent(
        () => import('~/components/features/ecommerce/settings/tabs/CompanyDetailsTab.vue')
    )
    const AccountSettingsTab = defineAsyncComponent(
        () => import('~/components/features/ecommerce/settings/tabs/AccountSettingsTab.vue')
    )

    const BankAccountsTab = defineAsyncComponent(
        () => import('~/components/features/ecommerce/settings/tabs/BankAccountsTab.vue')
    )

    const CertificatesTab = defineAsyncComponent(
        () => import('~/components/features/ecommerce/settings/tabs/CertificatesTab.vue')
    )

    const localePath = useLocalePath()
    const { t } = useI18n()
    const router = useRouter()
    const route = useRoute()
    const { success, error: showError } = useToastNotification()
    const userStore = useUserStore()

    // Get role from path param
    const pathRole = computed(() => {
        const user = route.params.user as string
        return user === 'supplier' || user === 'buyer' ? user : 'buyer'
    })

    // Access user role
    const isSupplier = computed(() => userStore.isSupplier)

    const isLoading = ref(false)
    const isSaving = ref(false)
    const isSavingBeforeSwitch = ref(false)
    const tabsRef = ref()
    const activeTabIndex = ref(0)
    const previousTabIndex = ref(0)
    const dynamicTabRefs = ref<Record<string, any>>({})

    const componentMap: Record<string, any> = {
        'company-profile': CompanyProfileTab,
        'company-details': CompanyDetailsTab,
        'delivery-address': DeliveryTab,
        'bank-accounts': BankAccountsTab,
        certificates: CertificatesTab,
        currencies: CurrenciesTab,
        production: ProductionTab,
        export: ExportTab,
        'notification-settings': NotificationSettingsTab,
        subscription: SubscriptionTab,
        'account-settings': AccountSettingsTab,
    }

    const setTabRef = (el: any, key: string) => {
        if (el) {
            dynamicTabRefs.value[key] = el
        }
    }

    const hasTabBeenSelected = ref<Record<string, boolean>>({
        'company-profile': false,
        'company-details': false,
        'delivery-address': false,
        'bank-accounts': false,
        certificates: false,
        currencies: false,
        production: false,
        export: false,
        'notification-settings': false,
        subscription: false,
    })
    const isLoadingCounts = ref(false)

    // Exit modal state
    const showExitModal = ref(false)
    const pendingTabIndex = ref<number | null>(null)
    const pendingTabRef = ref<any>(null)
    const isClosingDueToValidationError = ref(false)

    // Base tab configuration - all tabs
    const baseTabConfig = [
        { key: 'company-profile', labelKey: t('company.profile'), requiresSupplier: false },
        {
            key: 'company-details',
            labelKey: t('settings.companyDetails', 'Company Details'),
            requiresSupplier: false,
        },
        { key: 'account-settings', labelKey: t('settings.account.title'), requiresSupplier: false },
        { key: 'delivery-address', labelKey: t('product.delivery'), requiresSupplier: false },
        {
            key: 'bank-accounts',
            labelKey: t('bank.bankAccounts', 'Bank Accounts'),
            requiresSupplier: false,
        },
        {
            key: 'certificates',
            labelKey: t('certificates.certificates', 'Certificates'),
            requiresSupplier: false,
        },
        { key: 'currencies', labelKey: t('currency', 0), requiresSupplier: true },
        {
            key: 'production',
            labelKey: t('register.production', 'Production'),
            requiresSupplier: true,
        },
        { key: 'export', labelKey: t('company.exportDetails', 'Export'), requiresSupplier: true },
        {
            key: 'notification-settings',
            labelKey: t('notifications.settings', 'Notification Settings'),
            requiresSupplier: false,
        },
        {
            key: 'subscription',
            labelKey: `${t('subscription.title')} ${t('settings')}`,
            requiresSupplier: false,
        },
    ]

    // Filtered tab configuration based on user role
    const tabConfig = computed(() => {
        return baseTabConfig.filter((tab) => {
            if (tab.requiresSupplier) {
                return isSupplier.value
            }
            return true
        })
    })

    definePageMeta({
        middleware: ['role'],
        layout: 'app',
    })

    const tabs = computed(() =>
        tabConfig.value.map((config) => ({
            id: config.key,
            label: config.labelKey,
        }))
    )

    const getTabIndexByKey = (tabKey: string): number => {
        return tabConfig.value.findIndex((config) => config.key === tabKey)
    }

    const getTabKeyByIndex = (index: number): string | null => {
        return tabConfig.value[index]?.key || null
    }

    const getCurrentTabRef = () => {
        const tabKey = getTabKeyByIndex(activeTabIndex.value)
        if (!tabKey) return null
        return dynamicTabRefs.value[tabKey]
    }

    const getPreviousTabRef = () => {
        const tabKey = getTabKeyByIndex(previousTabIndex.value)
        if (!tabKey) return null
        return dynamicTabRefs.value[tabKey]
    }

    const handleTabChange = (index: number) => {
        if (index === previousTabIndex.value) {
            return
        }

        const previousTabRef = getPreviousTabRef()
        const shouldCheckUnsaved = previousTabRef && typeof previousTabRef.isDirty !== 'undefined'

        if (shouldCheckUnsaved) {
            let hasChanges = false
            const isDirtyValue = previousTabRef.isDirty

            if (isDirtyValue && typeof isDirtyValue === 'object' && 'value' in isDirtyValue) {
                hasChanges = isDirtyValue.value ?? false
            } else {
                hasChanges = isDirtyValue ?? false
            }

            if (hasChanges) {
                activeTabIndex.value = previousTabIndex.value

                nextTick(() => {
                    if (tabsRef.value?.selectTab) {
                        tabsRef.value.selectTab(previousTabIndex.value)
                    }
                })

                pendingTabIndex.value = index
                pendingTabRef.value = previousTabRef
                showExitModal.value = true

                return
            }
        }

        previousTabIndex.value = activeTabIndex.value
        activeTabIndex.value = index
        switchToTab(index)
    }

    const switchToTab = (index: number) => {
        previousTabIndex.value = activeTabIndex.value

        const tabKey = getTabKeyByIndex(index)

        if (tabKey) {
            hasTabBeenSelected.value[tabKey] = true
            activeTabIndex.value = index

            const newQuery = { ...route.query }

            if (tabKey === 'company-profile') {
                delete newQuery.tab
            } else {
                newQuery.tab = tabKey
            }

            router.replace({
                path: route.path,
                query: newQuery,
            })
        }
    }

    const handleSaveAndContinue = async () => {
        if (pendingTabIndex.value === null) {
            return
        }

        try {
            isSavingBeforeSwitch.value = true

            const currentTabRef = pendingTabRef.value

            if (!currentTabRef) {
                showExitModal.value = false
                previousTabIndex.value = activeTabIndex.value
                activeTabIndex.value = pendingTabIndex.value
                switchToTab(pendingTabIndex.value)
                pendingTabIndex.value = null
                return
            }

            const validation = currentTabRef.validate()

            if (!validation.isValid) {
                showError(t('validation.pleaseFixErrors', 'Please fix the errors before saving'))
                isClosingDueToValidationError.value = true
                showExitModal.value = false
                return
            }

            const saveSuccess = await currentTabRef.save()

            if (saveSuccess) {
                success(t('settings.changesSaved'))
                showExitModal.value = false
                previousTabIndex.value = activeTabIndex.value
                activeTabIndex.value = pendingTabIndex.value
                switchToTab(pendingTabIndex.value)
                pendingTabIndex.value = null
                pendingTabRef.value = null
            } else {
                showError(t('settings.errorSavingChanges'))
            }
        } catch (error) {
            console.error('Error in handleSaveAndContinue:', error)
            showError(t('settings.errorSavingChanges'))
        } finally {
            isSavingBeforeSwitch.value = false
        }
    }

    const handleDiscardAndLeave = () => {
        if (pendingTabIndex.value === null) return

        const currentTabRef = pendingTabRef.value
        if (currentTabRef?.reset) {
            currentTabRef.reset()
        }

        showExitModal.value = false
        previousTabIndex.value = activeTabIndex.value
        activeTabIndex.value = pendingTabIndex.value
        switchToTab(pendingTabIndex.value)
        pendingTabIndex.value = null
        pendingTabRef.value = null
    }

    const handleCancelExit = () => {
        if (isClosingDueToValidationError.value) {
            isClosingDueToValidationError.value = false
            showExitModal.value = false
            pendingTabIndex.value = null
            pendingTabRef.value = null
            return
        }

        activeTabIndex.value = previousTabIndex.value
        showExitModal.value = false
        pendingTabIndex.value = null
        pendingTabRef.value = null
        nextTick(() => {})
    }

    const handleSaveChanges = async () => {
        try {
            isSaving.value = true

            const tabRef = getCurrentTabRef()
            if (!tabRef) {
                return
            }

            const validation = tabRef.validate()

            if (!validation.isValid) {
                return
            }

            const saveSuccess = await tabRef.save()

            if (saveSuccess) {
                success(t('settings.changesSaved'))
            } else {
                showError(t('settings.errorSavingChanges'))
            }
        } catch (error) {
            console.error('Error saving changes:', error)
            showError(t('settings.errorSavingChanges'))
        } finally {
            isSaving.value = false
        }
    }

    const handleCancel = () => {
        Object.values(dynamicTabRefs.value).forEach((tabRef: any) => {
            if (tabRef?.isDirty?.value && typeof tabRef.reset === 'function') {
                tabRef.reset()
            }
        })
        router.push(localePath(`/${pathRole.value}/dashboard`))
    }

    const initializeFromRoute = () => {
        const tabFromQuery = route.query.tab as string

        if (tabFromQuery) {
            const tabIndex = getTabIndexByKey(tabFromQuery)
            if (tabIndex !== -1) {
                activeTabIndex.value = tabIndex
                previousTabIndex.value = tabIndex
                hasTabBeenSelected.value[tabFromQuery] = true
            }
        } else {
            activeTabIndex.value = 0
            previousTabIndex.value = 0
            const firstTabKey = getTabKeyByIndex(0)
            if (firstTabKey) {
                hasTabBeenSelected.value[firstTabKey] = true
            }
        }
    }

    useHead({
        title: t('navigation.settings'),
    })

    const breadcrumbs = computed(() => [
        { label: t('home'), to: localePath(`/${pathRole.value}/dashboard`) },
        { label: t('navigation.settings'), current: true },
    ])

    onMounted(async () => {
        isLoading.value = false
        initializeFromRoute()

        await nextTick()

        const currentTabKey = getTabKeyByIndex(activeTabIndex.value)
        if (currentTabKey && !hasTabBeenSelected.value[currentTabKey]) {
            hasTabBeenSelected.value[currentTabKey] = true
        }
    })
</script>

<style scoped>
    .settings-page {
        @apply pb-20;
    }
</style>
