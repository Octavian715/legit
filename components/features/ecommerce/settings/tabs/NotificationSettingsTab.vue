<!-- ~/components/features/ecommerce/settings/tabs/NotificationSettingsTab.vue -->
<template>
    <div class="w-full space-y-3">
        <!-- Notifications Title -->
        <h2 class="text-subtitle3 text-gray-800">
            {{ $t('settings.notifications.title', 'Notifications') }}
        </h2>

        <!-- Section 1: How would you like to receive notifications? -->
        <section class="rounded border border-gray-600 p-3 space-y-3">
            <h3 class="text-body1 font-medium text-gray-950">
                {{
                    $t(
                        'settings.notifications.howToReceive',
                        'How would you like to receive notifications?'
                    )
                }}
            </h3>

            <div class="grid grid-rows-2 gap-3">
                <!-- Email notifications toggle -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <span class="text-subtitle3 text-gray-950">
                        {{
                            $t('settings.notifications.emailNotifications', 'Email notifications:')
                        }}
                    </span>
                    <Switch
                        v-model="globalEmailEnabled"
                        @update:model-value="handleGlobalEmailToggle"
                    />
                </div>

                <!-- In-app notifications toggle -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <span class="text-subtitle3 text-gray-950">
                        {{
                            $t('settings.notifications.inAppNotifications', 'In-app notifications:')
                        }}
                    </span>
                    <Switch
                        v-model="globalInAppEnabled"
                        @update:model-value="handleGlobalInAppToggle"
                    />
                </div>
            </div>
        </section>

        <!-- Loading State -->
        <div v-if="isLoading" class="flex justify-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>

        <!-- Dynamic Preferences List -->
        <template v-else>
            <section
                v-if="preferences.length > 0"
                class="rounded-md border border-gray-600 p-3 space-y-3"
            >
                <h3 class="text-subtitle3 font-bold text-gray-950">
                    {{ $t('settings.notifications.preferences', 'Notification Preferences') }}
                </h3>

                <div class="space-y-3">
                    <!-- Render fiecare preferință dinamic -->
                    <NotificationRow
                        v-for="(pref, index) in preferences"
                        :key="pref.type"
                        v-model:email="preferences[index].email_enabled"
                        v-model:in-app="preferences[index].platform_enabled"
                        :label="pref.display_name"
                        :name="pref.type"
                        :email-disabled="!pref.email_editable"
                        :platform-disabled="!pref.platform_editable"
                        @change="handlePreferenceChange"
                    />
                </div>
            </section>

            <!-- Empty state -->
            <section v-else class="rounded-md border border-gray-600 p-3 text-center text-gray-500">
                {{
                    $t('settings.notifications.noPreferences', 'No notification preferences found')
                }}
            </section>
        </template>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, watch, onMounted, nextTick } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { useToastNotification } from '~/composables/useToastNotification'
    import { NotificationService } from '~/services/notificationService'

    interface NotificationPreferenceItem {
        type: string
        display_name: string
        email_enabled: boolean
        platform_enabled: boolean
        email_editable: boolean
        platform_editable: boolean
        default_channels: string[]
    }

    const { t } = useI18n()
    const notificationService = new NotificationService()
    const { error: showError } = useToastNotification()

    // Loading state
    const isLoading = ref(false)
    const isInitializing = ref(false)

    // Global toggles
    const globalEmailEnabled = ref(true)
    const globalInAppEnabled = ref(true)

    // Preferences data - exact format from API
    const preferences = ref<NotificationPreferenceItem[]>([])

    // Original data for change detection
    const originalData = ref<NotificationPreferenceItem[]>([])

    // Session storage keys
    const PREFERENCES_STORAGE_KEY = 'notificationTab_preferences'
    const ORIGINAL_STORAGE_KEY = 'notificationTab_originalPreferences'

    // Computed: Check if form is dirty
    const isDirty = computed(() => {
        if (preferences.value.length === 0 || originalData.value.length === 0) {
            return false
        }
        return JSON.stringify(preferences.value) !== JSON.stringify(originalData.value)
    })

    /**
     * Restore preferences from sessionStorage
     */
    const restorePreferencesFromSession = (): boolean => {
        try {
            const savedPreferences = sessionStorage.getItem(PREFERENCES_STORAGE_KEY)
            const savedOriginal = sessionStorage.getItem(ORIGINAL_STORAGE_KEY)

            if (savedPreferences && savedOriginal) {
                isInitializing.value = true

                preferences.value = JSON.parse(savedPreferences)
                originalData.value = JSON.parse(savedOriginal)

                nextTick(() => {
                    isInitializing.value = false
                })

                return true
            }
        } catch (error) {
            isInitializing.value = false
            // Silent fail
        }
        return false
    }

    /**
     * Save preferences to sessionStorage
     */
    const savePreferencesToSession = () => {
        try {
            sessionStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences.value))
            if (originalData.value) {
                sessionStorage.setItem(ORIGINAL_STORAGE_KEY, JSON.stringify(originalData.value))
            }
        } catch (error) {
            // Silent fail
        }
    }

    /**
     * Clear preferences from sessionStorage
     */
    const clearPreferencesFromSession = () => {
        try {
            sessionStorage.removeItem(PREFERENCES_STORAGE_KEY)
            sessionStorage.removeItem(ORIGINAL_STORAGE_KEY)
        } catch (error) {
            // Silent fail
        }
    }

    /**
     * Load notification preferences from API
     */
    const loadPreferences = async () => {
        // Check if we have cached data
        if (restorePreferencesFromSession()) {
            updateGlobalToggles()
            return
        }

        try {
            isLoading.value = true
            isInitializing.value = true

            // GET API Call - ia EXACT ce returnează backend-ul
            const apiPreferences = await notificationService.getNotificationPreferences()

            // Salvează DIRECT array-ul - fără transformări!
            preferences.value = apiPreferences

            // Save original data for dirty detection
            originalData.value = JSON.parse(JSON.stringify(apiPreferences))

            // Save to session and update toggles on next tick
            nextTick(() => {
                savePreferencesToSession()
                updateGlobalToggles()
                isInitializing.value = false
            })
        } catch (error: any) {
            isInitializing.value = false
            showError(
                error.message ||
                    t('settings.notifications.errorLoading', 'Error loading preferences'),
                t('error', 'Error')
            )
        } finally {
            isLoading.value = false
        }
    }

    /**
     * Handle global email toggle
     */
    const handleGlobalEmailToggle = (enabled: boolean) => {
        // Enable/disable only editable email notifications
        preferences.value.forEach((pref) => {
            if (pref.email_editable) {
                pref.email_enabled = enabled
            }
        })
        savePreferencesToSession()
    }

    /**
     * Handle global in-app toggle
     */
    const handleGlobalInAppToggle = (enabled: boolean) => {
        // Enable/disable only editable in-app notifications
        preferences.value.forEach((pref) => {
            if (pref.platform_editable) {
                pref.platform_enabled = enabled
            }
        })
        savePreferencesToSession()
    }

    /**
     * Handle individual preference change
     */
    const handlePreferenceChange = () => {
        // Update global toggles based on individual preferences
        updateGlobalToggles()
        savePreferencesToSession()
    }

    /**
     * Update global toggles based on current preferences (only editable ones)
     */
    const updateGlobalToggles = () => {
        const editableEmailPrefs = preferences.value.filter((p) => p.email_editable)
        const editablePlatformPrefs = preferences.value.filter((p) => p.platform_editable)

        const allEmailEnabled =
            editableEmailPrefs.length > 0 && editableEmailPrefs.every((p) => p.email_enabled)
        const allInAppEnabled =
            editablePlatformPrefs.length > 0 && editablePlatformPrefs.every((p) => p.platform_enabled)

        globalEmailEnabled.value = allEmailEnabled
        globalInAppEnabled.value = allInAppEnabled
    }

    /**
     * Validate form
     */
    const validate = () => {
        return { isValid: true, errors: [] }
    }

    /**
     * Save notification preferences
     */
    const save = async (): Promise<boolean> => {
        try {
            // Build payload - exact format așteptat de backend
            const payload = {
                email_enabled: globalEmailEnabled.value,
                platform_enabled: globalInAppEnabled.value,
                preferences: preferences.value.map((pref) => ({
                    type: pref.type,
                    email_enabled: pref.email_enabled,
                    platform_enabled: pref.platform_enabled,
                })),
            }

            // Call API
            const updatedPreferences =
                await notificationService.updateNotificationPreferences(payload)

            // Update with response from API
            preferences.value = updatedPreferences
            originalData.value = JSON.parse(JSON.stringify(updatedPreferences))

            // Clear session storage
            clearPreferencesFromSession()

            return true
        } catch (error: any) {
            showError(
                error.message || t('settings.errorSavingChanges', 'Error saving changes'),
                t('error', 'Error')
            )
            return false
        }
    }

    /**
     * Reset form to original data
     */
    const reset = () => {
        if (originalData.value) {
            preferences.value = JSON.parse(JSON.stringify(originalData.value))
            updateGlobalToggles()
        }

        // Clear session storage
        clearPreferencesFromSession()
    }

    // Watch preferences changes to auto-save to sessionStorage
    watch(
        preferences,
        () => {
            // Skip if initializing
            if (isInitializing.value) {
                return
            }

            if (isDirty.value) {
                savePreferencesToSession()
            }
        },
        { deep: true }
    )

    // Load preferences on mount
    onMounted(() => {
        loadPreferences()
    })

    // Expose methods to parent
    defineExpose({
        validate,
        save,
        reset,
        isDirty,
    })
</script>
