<template>
    <div class="settings-page relative px-4 md:px-0">
        <Breadcrumbs :items="breadcrumbs" />

        <PageHeader :title="t('navigation.settings')" />

        <div class="relative bg-white px-4 py-5 rounded-b-sm">
            <!-- <Tabs2
                ref="tabsRef"
                :model-value="activeTabIndex"
                :tabs="tabs"
                variant="underline"
                :loading="isLoadingCounts"
                size="md"
                :lazy="true"
                @update:model-value="handleTabChange"
            >
                <template #tab-0>
                    <CompanyProfileTab
                        v-if="hasTabBeenSelected['company-profile']"
                        ref="companyProfileTabRef"
                    />
                </template>
                <template #tab-1>
                    <DeliveryTab
                        v-if="
                            getTabKeyByIndex(1) === 'delivery-address' &&
                            hasTabBeenSelected['delivery-address']
                        "
                        ref="deliveryTabRef"
                    />
                    <CurrenciesTab
                        v-else-if="
                            getTabKeyByIndex(1) === 'currencies' && hasTabBeenSelected['currencies']
                        "
                        ref="currenciesTabRef"
                    />
                    <SubscriptionTab
                        v-else-if="
                            getTabKeyByIndex(1) === 'subscription' &&
                            hasTabBeenSelected['subscription']
                        "
                        ref="subscriptionTabRef"
                    />
                    <CompanyDetailsTab
                        v-else-if="
                            getTabKeyByIndex(1) === 'company-details' &&
                            hasTabBeenSelected['company-details']
                        "
                        ref="companyDetailsTabRef"
                    />
                    <CompanyDetailsTab
                        v-else-if="
                            getTabKeyByIndex(1) === 'account-settings' &&
                            hasTabBeenSelected['account-settings']
                        "
                        ref="accountSettingsTabRef"
                    />
                </template>
                <template #tab-2>
                    <CurrenciesTab
                        v-if="
                            getTabKeyByIndex(2) === 'currencies' && hasTabBeenSelected['currencies']
                        "
                        ref="currenciesTabRef"
                    />
                    <ProductionTab
                        v-else-if="
                            getTabKeyByIndex(2) === 'production' && hasTabBeenSelected['production']
                        "
                        ref="productionTabRef"
                    />
                    <ExportTab
                        v-else-if="getTabKeyByIndex(2) === 'export' && hasTabBeenSelected['export']"
                        ref="exportTabRef"
                    />
                    <NotificationSettingsTab
                        v-else-if="
                            getTabKeyByIndex(2) === 'notification-settings' &&
                            hasTabBeenSelected['notification-settings']
                        "
                        ref="notificationSettingsTabRef"
                    />
                    <SubscriptionTab
                        v-else-if="
                            getTabKeyByIndex(2) === 'subscription' &&
                            hasTabBeenSelected['subscription']
                        "
                        ref="subscriptionTabRef"
                    />
                </template>
                <template #tab-3>
                    <ProductionTab
                        v-if="
                            getTabKeyByIndex(3) === 'production' && hasTabBeenSelected['production']
                        "
                        ref="productionTabRef"
                    />
                    <ExportTab
                        v-else-if="getTabKeyByIndex(3) === 'export' && hasTabBeenSelected['export']"
                        ref="exportTabRef"
                    />
                    <NotificationSettingsTab
                        v-else-if="
                            getTabKeyByIndex(3) === 'notification-settings' &&
                            hasTabBeenSelected['notification-settings']
                        "
                        ref="notificationSettingsTabRef"
                    />
                    <SubscriptionTab
                        v-else-if="
                            getTabKeyByIndex(3) === 'subscription' &&
                            hasTabBeenSelected['subscription']
                        "
                        ref="subscriptionTabRef"
                    />
                </template>
                <template #tab-4>
                    <ExportTab
                        v-if="getTabKeyByIndex(4) === 'export' && hasTabBeenSelected['export']"
                        ref="exportTabRef"
                    />
                    <NotificationSettingsTab
                        v-else-if="
                            getTabKeyByIndex(4) === 'notification-settings' &&
                            hasTabBeenSelected['notification-settings']
                        "
                        ref="notificationSettingsTabRef"
                    />
                    <SubscriptionTab
                        v-else-if="
                            getTabKeyByIndex(4) === 'subscription' &&
                            hasTabBeenSelected['subscription']
                        "
                        ref="subscriptionTabRef"
                    />
                </template>
                <template #tab-5>
                    <NotificationSettingsTab
                        v-if="
                            getTabKeyByIndex(5) === 'notification-settings' &&
                            hasTabBeenSelected['notification-settings']
                        "
                        ref="notificationSettingsTabRef"
                    />
                    <SubscriptionTab
                        v-else-if="
                            getTabKeyByIndex(5) === 'subscription' &&
                            hasTabBeenSelected['subscription']
                        "
                        ref="subscriptionTabRef"
                    />
                </template>
                <template #tab-6>
                    <SubscriptionTab
                        v-if="
                            getTabKeyByIndex(6) === 'subscription' &&
                            hasTabBeenSelected['subscription']
                        "
                        ref="subscriptionTabRef"
                    />
                </template>
            </Tabs2> -->

            <Tabs2
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
            <div class="flex gap-5 container mx-auto py-4">
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

    // Access user role
    const isSupplier = computed(() => userStore.isSupplier)

    // Base tab configuration - all tabs (must be defined before getInitialTabIndex)
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

    const isLoading = ref(false)
    const isSaving = ref(false)
    const isSavingBeforeSwitch = ref(false)
    const tabsRef = ref()

    // Initialize activeTabIndex and previousTabIndex based on route BEFORE rendering
    const getInitialTabIndex = () => {
        const tabFromQuery = route.query.tab as string
        if (tabFromQuery) {
            const tabIndex = baseTabConfig
                .filter((tab) => !tab.requiresSupplier || userStore.isSupplier)
                .findIndex((config) => config.key === tabFromQuery)
            return tabIndex !== -1 ? tabIndex : 0
        }
        return 0
    }

    const activeTabIndex = ref(getInitialTabIndex())
    const previousTabIndex = ref(getInitialTabIndex()) // Track previous index
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

    // Initialize hasTabBeenSelected with the initial tab already marked as selected
    const getInitialTabSelection = () => {
        const initialSelection: Record<string, boolean> = {
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
            'account-settings': false,
        }

        // Mark the initial tab as selected
        const tabFromQuery = route.query.tab as string
        if (tabFromQuery && tabFromQuery in initialSelection) {
            initialSelection[tabFromQuery] = true
        } else {
            initialSelection['company-profile'] = true // Default first tab
        }

        return initialSelection
    }

    const hasTabBeenSelected = ref<Record<string, boolean>>(getInitialTabSelection())
    const isLoadingCounts = ref(false)

    // Exit modal state
    const showExitModal = ref(false)
    const pendingTabIndex = ref<number | null>(null)
    const pendingTabRef = ref<any>(null) // Store the tab ref when we detect unsaved changes
    const isClosingDueToValidationError = ref(false) // Flag to prevent reset on validation error

    const deliveryTabRef = ref()
    const currenciesTabRef = ref()
    const companyProfileTabRef = ref()
    const subscriptionTabRef = ref()
    const exportTabRef = ref()
    const productionTabRef = ref()
    const notificationSettingsTabRef = ref()
    const companyDetailsTabRef = ref()
    const accountSettingsTabRef = ref()

    // Filtered tab configuration based on user role
    const tabConfig = computed(() => {
        return baseTabConfig.filter((tab) => {
            // If tab requires supplier role, check if user is supplier
            if (tab.requiresSupplier) {
                return isSupplier.value
            }
            return true
        })
    })

    definePageMeta({
        layout: 'default',
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

    /**
     * Get the tab key by index
     */
    const getTabKeyByIndex = (index: number): string | null => {
        return tabConfig.value[index]?.key || null
    }

    /**
     * Get the current active tab reference based on tab key
     */
    // const getCurrentTabRef = () => {
    //     const tabKey = getTabKeyByIndex(activeTabIndex.value)
    //     if (!tabKey) return null

    //     switch (tabKey) {
    //         case 'company-profile':
    //             return companyProfileTabRef.value
    //         case 'company-details':
    //             return companyDetailsTabRef.value
    //         case 'account-settings':
    //             return accountSettingsTabRef.value
    //         case 'delivery-address':
    //             return deliveryTabRef.value
    //         case 'currencies':
    //             return currenciesTabRef.value
    //         case 'production':
    //             return productionTabRef.value
    //         case 'export':
    //             return exportTabRef.value
    //         case 'notification-settings':
    //             return notificationSettingsTabRef.value
    //         case 'subscription':
    //             return subscriptionTabRef.value
    //         default:
    //             return null
    //     }
    // }
    const getCurrentTabRef = () => {
        const tabKey = getTabKeyByIndex(activeTabIndex.value)
        if (!tabKey) return null

        // Access from the unified ref object
        return dynamicTabRefs.value[tabKey]
    }

    // Same logic for getPreviousTabRef

    /**
     * Get the previous tab reference based on tab key
     */
    const getPreviousTabRef = () => {
        const tabKey = getTabKeyByIndex(previousTabIndex.value)
        if (!tabKey) return null

        switch (tabKey) {
            case 'company-profile':
                return companyProfileTabRef.value
            case 'company-details':
                return companyDetailsTabRef.value
            case 'account-settings':
                return accountSettingsTabRef.value
            case 'delivery-address':
                return deliveryTabRef.value
            case 'currencies':
                return currenciesTabRef.value
            case 'production':
                return productionTabRef.value
            case 'export':
                return exportTabRef.value
            case 'notification-settings':
                return notificationSettingsTabRef.value
            case 'subscription':
                return subscriptionTabRef.value
            default:
                return null
        }
    }

    /**
     * Handle tab change with unsaved changes check
     * NOTE: Now using :model-value + @update:model-value instead of v-model
     * This gives us FULL control over tab switching
     */
    const handleTabChange = (index: number) => {
        console.log(index)
        // If trying to switch to the same tab, do nothing
        if (index === previousTabIndex.value) {
            return
        }

        // Check if PREVIOUS tab has unsaved changes
        // We need to check the tab we're LEAVING, not the one we're going to
        const previousTabRef = getPreviousTabRef()
        const shouldCheckUnsaved = previousTabRef && typeof previousTabRef.isDirty !== 'undefined'

        if (shouldCheckUnsaved) {
            // Check isDirty - handle both ref and plain value
            let hasChanges = false
            const isDirtyValue = previousTabRef.isDirty

            // Check if it's a ref (has .value property)
            if (isDirtyValue && typeof isDirtyValue === 'object' && 'value' in isDirtyValue) {
                hasChanges = isDirtyValue.value ?? false
            } else {
                // It's a plain boolean
                hasChanges = isDirtyValue ?? false
            }

            console.log(hasChanges)

            if (hasChanges) {
                // We have unsaved changes - BLOCK the tab switch and show modal

                // CRITICAL: v-model already changed activeTabIndex AND Tabs2 internal state!
                // We need to revert BOTH
                activeTabIndex.value = previousTabIndex.value

                // Force Tabs2 to sync its internal state back to previous tab
                // This fixes the visual tab being wrong
                nextTick(() => {
                    if (tabsRef.value?.selectTab) {
                        tabsRef.value.selectTab(previousTabIndex.value)
                    }
                })

                // Store BOTH the intended tab index AND the tab ref we need to save
                pendingTabIndex.value = index
                pendingTabRef.value = previousTabRef // ← CRITICAL: Save the tab ref NOW!
                showExitModal.value = true

                return // ← CRITICAL: Stop here, don't switch tabs!
            }
        }

        // No unsaved changes (or tab not ready), proceed with tab switch

        // Update previousTabIndex for next change
        previousTabIndex.value = activeTabIndex.value

        // NOW we can update activeTabIndex (tab will switch)
        activeTabIndex.value = index

        // Call switchToTab to update the route
        switchToTab(index)
    }

    /**
     * Actually switch to a different tab (with original routing logic)
     */
    const switchToTab = (index: number) => {
        // Save previous index before changing
        previousTabIndex.value = activeTabIndex.value

        const tabKey = getTabKeyByIndex(index)

        if (tabKey) {
            hasTabBeenSelected.value[tabKey] = true
            activeTabIndex.value = index

            const newQuery = { ...route.query }

            // Original logic: Remove tab param for company-profile (clean URL)
            if (tabKey === 'company-profile') {
                delete newQuery.tab
            } else {
                newQuery.tab = tabKey
            }

            router.replace({
                path: route.path,
                query: newQuery,
            })
        } else {
            console.warn('⚠️ No tab key found for index:', index)
        }
    }

    /**
     * Handle save and continue to new tab
     */
    const handleSaveAndContinue = async () => {
        if (pendingTabIndex.value === null) {
            return
        }

        try {
            isSavingBeforeSwitch.value = true

            // Use the tab ref we stored when we detected unsaved changes
            const currentTabRef = pendingTabRef.value

            if (!currentTabRef) {
                showExitModal.value = false
                previousTabIndex.value = activeTabIndex.value
                activeTabIndex.value = pendingTabIndex.value
                switchToTab(pendingTabIndex.value)
                pendingTabIndex.value = null
                return
            }

            // Validate current tab
            const validation = currentTabRef.validate()

            if (!validation.isValid) {
                // ✅ Afișăm UN toast general când încerci să părăsești pagina cu erori
                showError(t('validation.pleaseFixErrors', 'Please fix the errors before saving'))

                // ✅ Setăm flag pentru a preveni reset-ul form-ului
                isClosingDueToValidationError.value = true

                // ✅ Închidem modal-ul ca și cum ai dat Cancel
                // Acest lucru va trigger handleCancelExit(), dar flag-ul va preveni reset-ul
                showExitModal.value = false

                // Cleanup va fi făcut de handleCancelExit()
                return
            }

            // Save current tab
            const saveSuccess = await currentTabRef.save()

            if (saveSuccess) {
                success(t('settings.changesSaved'))

                showExitModal.value = false

                // NOW switch to the pending tab
                previousTabIndex.value = activeTabIndex.value
                activeTabIndex.value = pendingTabIndex.value

                switchToTab(pendingTabIndex.value)

                pendingTabIndex.value = null
                pendingTabRef.value = null // Clear the stored ref
            } else {
                // Eroare la salvare (server error) - afișăm toast
                showError(t('settings.errorSavingChanges'))
            }
        } catch (error) {
            console.error('💥 Error in handleSaveAndContinue:', error)
            showError(t('settings.errorSavingChanges'))
        } finally {
            isSavingBeforeSwitch.value = false
        }
    }

    /**
     * Handle discard changes and leave
     */
    const handleDiscardAndLeave = () => {
        if (pendingTabIndex.value === null) return

        // Reset CURRENT tab to discard changes (use stored ref)
        const currentTabRef = pendingTabRef.value
        if (currentTabRef?.reset) {
            currentTabRef.reset()
        }

        showExitModal.value = false

        // NOW switch to the pending tab
        previousTabIndex.value = activeTabIndex.value
        activeTabIndex.value = pendingTabIndex.value
        switchToTab(pendingTabIndex.value)
        pendingTabIndex.value = null
        pendingTabRef.value = null // Clear the stored ref
    }

    /**
     * Handle cancel exit (stay on current tab)
     */
    const handleCancelExit = () => {
        // ✅ Verificăm dacă modal-ul se închide din cauza erorilor de validare
        if (isClosingDueToValidationError.value) {
            // Modal se închide din cauza erorilor - NU resetăm nimic
            // Doar resetăm flag-ul și facem cleanup minimal
            isClosingDueToValidationError.value = false
            showExitModal.value = false
            pendingTabIndex.value = null
            pendingTabRef.value = null
            console.log('[Settings] Modal closed due to validation errors - form preserved')
            return
        }

        // User a dat Cancel normal - comportament standard
        // Revert activeTabIndex back to previous since we're staying
        // (v-model already changed it, but we want to stay on old tab)
        activeTabIndex.value = previousTabIndex.value

        showExitModal.value = false
        pendingTabIndex.value = null
        pendingTabRef.value = null // Clear the stored ref

        // Force reactivity update
        nextTick(() => {})
    }

    /**
     * Handle save changes from bottom bar
     */
    const handleSaveChanges = async () => {
        try {
            isSaving.value = true

            const tabRef = getCurrentTabRef()
            if (!tabRef) {
                return
            }

            const validation = tabRef.validate()

            if (!validation.isValid) {
                // ❌ NU afișăm toast-uri pentru erori de validare
                // Erorile sunt deja vizibile inline sub câmpuri
                console.log('[Settings] Validation failed - errors visible inline in form')
                return
            }

            const saveSuccess = await tabRef.save()

            if (saveSuccess) {
                success(t('settings.changesSaved'))
            } else {
                // Eroare la salvare (server error) - afișăm toast
                console.log('[Settings] Save failed (server error)')
                showError(t('settings.errorSavingChanges'))
            }
        } catch (error) {
            console.error('Error saving changes:', error)
            showError(t('settings.errorSavingChanges'))
        } finally {
            isSaving.value = false
        }
    }

    /**
     * Handle cancel from bottom bar
     */
    // const handleCancel = () => {
    //     // Reset all tabs if they have unsaved changes
    //     if (companyProfileTabRef.value?.isDirty?.value) {
    //         companyProfileTabRef.value.reset()
    //     }
    //     if (deliveryTabRef.value?.isDirty?.value) {
    //         deliveryTabRef.value.reset()
    //     }
    //     if (currenciesTabRef.value?.isDirty?.value) {
    //         currenciesTabRef.value.reset()
    //     }
    //     if (exportTabRef.value?.isDirty?.value) {
    //         exportTabRef.value.reset()
    //     }
    //     if (subscriptionTabRef.value?.isDirty?.value) {
    //         subscriptionTabRef.value.reset()
    //     }
    //     if (companyDetailsTabRef.value?.isDirty?.value) {
    //         companyDetailsTabRef.value.reset()
    //     }
    //     if (accountSettingsTabRef.value?.isDirty?.value) {
    //         accountSettingsTabRef.value.reset()
    //     }
    //     router.push(localePath('/marketplace'))
    // }

    const handleCancel = () => {
        // Reset all dirty tabs
        Object.values(dynamicTabRefs.value).forEach((tabRef: any) => {
            if (tabRef?.isDirty?.value && typeof tabRef.reset === 'function') {
                tabRef.reset()
            }
        })
        router.push(localePath('/marketplace'))
    }

    const initializeFromRoute = () => {
        const tabFromQuery = route.query.tab as string

        if (tabFromQuery) {
            const tabIndex = getTabIndexByKey(tabFromQuery)
            if (tabIndex !== -1) {
                activeTabIndex.value = tabIndex
                previousTabIndex.value = tabIndex // Initialize previous
                hasTabBeenSelected.value[tabFromQuery] = true
            }
        } else {
            // No tab param = first tab (original behavior: keep URL clean)
            activeTabIndex.value = 0
            previousTabIndex.value = 0 // Initialize previous
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
        { label: t('home'), to: localePath('/marketplace') },
        { label: t('navigation.settings'), current: true },
    ])

    onMounted(async () => {
        isLoading.value = false

        await nextTick()

        // Ensure the current tab is marked as selected (should already be done in setup)
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
