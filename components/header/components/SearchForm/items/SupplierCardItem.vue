<template>
    <article
        class="flex items-center justify-between gap-1 p-2 bg-white border border-gray-400 hover:border-gray-600 rounded-sm transition-all duration-200 cursor-pointer"
        :class="{
            'p-3 gap-3': isExtendedMode,
        }"
        role="article"
        :aria-label="`${t('suppliers', { n: 0 })}: ${item.legal_name}`"
        @click.stop
    >
        <!-- Left Section: Avatar + Name -->
        <button
            type="button"
            class="flex items-center gap-3 flex-1 min-w-0 text-left hover:opacity-80 transition-opacity w-fit"
            :aria-label="`${t('visitUser', { user: item.legal_name })}`"
            @click="handleProfileClick"
        >
            <!-- Avatar -->
            <div
                class="relative rounded-full overflow-hidden shrink-0"
                :class="{
                    'w-8 h-8': !isExtendedMode,
                    'w-12 h-12': isExtendedMode,
                }"
            >
                <img
                    v-if="item.profile_picture"
                    :src="item.profile_picture"
                    :alt="item.profile_picture"
                    class="w-full h-full rounded-full object-contain object-center"
                    loading="lazy"
                    width="48"
                    height="48"
                    @error="handleImageError"
                />
                <div
                    v-else
                    class="w-full h-full rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold text-subtitle3"
                    @click="handleProfileClick"
                >
                    {{ getInitials(item.legal_name) }}
                </div>
            </div>

            <!-- Name -->
            <div class="flex-1 min-w-0">
                <h2 class="text-subtitle1 font-medium text-gray-950 line-clamp-1 w-fit">
                    {{ item.legal_name }}
                </h2>
            </div>
        </button>

        <template v-if="isExtendedMode">
            <div class="flex items-center gap-3">
                <div class="flex flex-col sm:flex-row items-center gap-1">
                    <div class="text-subtitle1 font-bold text-gray-950">
                        {{ item.products_count || 0 }}
                    </div>
                    <div class="text-subtitle1 text-gray-800">
                        {{ $t('profile.tabs.products') }}
                    </div>
                </div>

                <div class="w-px h-5 mx-1 bg-gray-400" />

                <div class="flex flex-col sm:flex-row items-center gap-1">
                    <div class="text-subtitle1 font-bold text-gray-950">
                        {{ item.connections_count || 0 }}
                    </div>
                    <div class="text-subtitle1 text-gray-800">
                        {{ $t('profile.connections') }}
                    </div>
                </div>

                <div class="w-px h-5 mx-1 bg-gray-400" />

                <div class="flex flex-col sm:flex-row items-center gap-1">
                    <div class="text-subtitle1 font-bold text-gray-950">
                        {{ item.followers_count || 0 }}
                    </div>
                    <div class="text-subtitle1 text-gray-800">
                        {{ $t('profile.followers') }}
                    </div>
                </div>
            </div>
        </template>

        <!-- Right Section: Action Buttons -->
        <div v-if="showActionButtons" class="flex justify-end items-center gap-1 shrink-0 min-w-48">
            <!-- Follow Button -->
            <Button
                v-tooltip="followTooltip"
                type="button"
                color="gray"
                size="sm"
                variant="filled"
                font-weight="bold"
                rounded
                :loading="isProcessingFollow"
                :disabled="isProcessingFollow"
                :aria-label="followAriaLabel"
                @click.stop="handleToggleFollow"
            >
                {{ followButtonText }}
            </Button>

            <!-- Connect Button -->
            <Button
                v-tooltip="connectionTooltip"
                type="button"
                :color="connectionButtonColor"
                size="sm"
                variant="filled"
                rounded
                :loading="isProcessingConnect"
                :disabled="isProcessingConnect"
                :aria-label="connectionAriaLabel"
                @click.stop="handleToggleConnection"
            >
                <span class="flex items-center gap-1">
                    <!-- Connect Icon - Only when NOT connected AND NOT pending -->
                    <svg v-if="!isConnected && !isPending" class="w-3 h-3">
                        <use xlink:href="/sprite.svg#connected"></use>
                    </svg>

                    <!-- Disconnect Icon - Only when connected -->
                    <svg v-if="isConnected" class="w-3 h-3">
                        <use xlink:href="/sprite.svg#disconnect"></use>
                    </svg>

                    {{ connectionButtonText }}
                </span>
            </Button>
        </div>
    </article>
</template>

<script setup lang="ts">
    import { computed, ref } from 'vue'
    import { useUserStore } from '~/stores/user'
    import { useSearchStore } from '~/stores/search'
    import { useConnections } from '~/composables/useConnections'
    import { ProfileService } from '~/services/profile'
    import type { ProfileSocialData } from '~/types/profile'

    interface SupplierItem {
        id: number
        legal_name: string
        username: string
        profile_picture: string | null

        // API returns these at ROOT level
        is_following: boolean
        connection:
            | {
                  id: number
                  status: 'pending' | 'accepted' | 'rejected'
                  requester_id: number
                  requested_at: string
                  accepted_at: string | null
                  rejected_at: string | null
                  is_requester: boolean
              }
            | false

        followers_count?: number
        connections_count?: number
        products_count?: number

        // Store adds social wrapper when updating
        social?: {
            is_following?: boolean
            followers_count?: number
            connection?:
                | {
                      exists: boolean
                      status: 'pending' | 'accepted' | null
                      id?: number
                  }
                | false
        }

        // Legacy/Optional fields
        company?: string
        typeSupplier?: string
        followed?: boolean
        connected?: boolean
        connectionStatus?: 'pending' | 'accepted' | null
        connectionId?: number
        originalCompany?: any
    }

    interface Props {
        item: SupplierItem
        showSupplier?: boolean
        mode?: 'compact' | 'extended'
        context?: 'quick-search' | 'search'
    }

    const props = withDefaults(defineProps<Props>(), {
        showSupplier: true,
        mode: 'compact',
        context: 'search',
    })

    const { t } = useI18n()
    const localePath = useLocalePath()
    const router = useRouter()
    const toast = useToastNotification()
    const userStore = useUserStore()
    const searchStore = useSearchStore()
    const profileService = new ProfileService()

    const {
        followUser,
        sendConnectionRequest,
        showUnfollowConfirmation,
        showRemoveConnectionConfirmation,
    } = useConnections()

    const isProcessingFollow = ref(false)
    const isProcessingConnect = ref(false)

    const currentUser = computed(() => userStore.user)
    const supplierId = computed(() => props.item.id)

    const isExtendedMode = computed(() => props.mode === 'extended')
    const isQuickSearch = computed(() => props.context === 'quick-search')

    const storeArrayKey = computed(() => {
        return isQuickSearch.value ? 'quickSearchCompanies' : 'companyResults'
    })

    const companyFromStore = computed(() => {
        const targetArray =
            storeArrayKey.value === 'quickSearchCompanies'
                ? searchStore.quickSearchCompanies
                : searchStore.companyResults

        return targetArray.find((c) => c.id === supplierId.value)
    })

    const showActionButtons = computed(() => {
        return currentUser.value && supplierId.value !== currentUser.value.id
    })

    // ✅ FIXED: Check BOTH store path (.social.is_following) AND props path (.is_following at root)
    const isFollowing = computed(() => {
        const storeCompany = companyFromStore.value

        // Priority 1: Check store (nested in .social)
        if (storeCompany?.social?.is_following !== undefined) {
            return storeCompany.social.is_following
        }

        // Priority 2: Check props at ROOT level (API returns is_following at root)
        if (props.item.is_following !== undefined) {
            return props.item.is_following
        }

        return false
    })

    // ✅ FIXED: Check BOTH store path (.social.connection) AND props path (.connection at root)
    const isConnected = computed(() => {
        const storeCompany = companyFromStore.value

        // Priority 1: Check store (nested in .social)
        if (
            storeCompany?.social?.connection &&
            typeof storeCompany.social.connection === 'object'
        ) {
            return storeCompany.social.connection.status === 'accepted'
        }

        if (props.item.connection && typeof props.item.connection === 'object') {
            return props.item.connection.status === 'accepted'
        }

        return false
    })

    // ✅ FIXED: Check BOTH store path (.social.connection) AND props path (.connection at root)
    const isPending = computed(() => {
        const storeCompany = companyFromStore.value

        // Priority 1: Check store (we nest in .social when updating)
        if (
            storeCompany?.social?.connection &&
            typeof storeCompany.social.connection === 'object'
        ) {
            return storeCompany.social.connection.status === 'pending'
        }

        // Priority 2: Check props at ROOT level (API returns connection at root)
        if (props.item.connection && typeof props.item.connection === 'object') {
            return props.item.connection.status === 'pending'
        }

        // Priority 3: Legacy fallback
        if (props.item.connectionStatus === 'pending') {
            return true
        }

        return false
    })

    // ✅ FIXED: Check BOTH store path (.social.connection) AND props path (.connection at root)
    const connectionId = computed(() => {
        const storeCompany = companyFromStore.value

        // Priority 1: Check store (nested in .social)
        if (
            storeCompany?.social?.connection &&
            typeof storeCompany.social.connection === 'object'
        ) {
            return storeCompany.social.connection.id
        }

        // Priority 2: Check props at ROOT level (API returns connection at root)
        if (props.item.connection && typeof props.item.connection === 'object') {
            return props.item.connection.id
        }

        return props.item.connectionId
    })

    const followButtonText = computed(() => {
        return isFollowing.value ? t('connections.unfollow') : t('connections.follow')
    })

    const followTooltip = computed(() => {
        return isFollowing.value
            ? `${t('connections.unfollow')} ${props.item.name || props.item.legal_name}`
            : `${t('connections.follow')}  ${props.item.name || props.item.legal_name}`
    })

    const followAriaLabel = computed(() => {
        return isFollowing.value
            ? `${t('connections.unfollow')}  ${props.item.name || props.item.legal_name}`
            : `${t('connections.follow')}  ${props.item.name || props.item.legal_name}`
    })

    const connectionButtonColor = computed(() => {
        const result = !isConnected.value && !isPending.value ? 'red' : 'gray'
        return result
    })

    const connectionButtonText = computed(() => {
        if (isPending.value) return t('connections.cancel')
        if (isConnected.value) return t('connections.disconnect')
        return t('connections.connect')
    })

    const connectionTooltip = computed(() => {
        if (isPending.value) return t('connections.cancel')
        if (isConnected.value)
            return `${t('connections.disconnect')}  ${props.item.name || props.item.legal_name}`
        return `${t('connections.connect')}  ${props.item.name || props.item.legal_name}`
    })

    const connectionAriaLabel = computed(() => {
        if (isConnected.value) {
            return `${t('connections.disconnect')}  ${props.item.name || props.item.legal_name}`
        }
        if (isPending.value) {
            return `${t('connections.cancel')} -  ${props.item.name || props.item.legal_name}`
        }
        return `${t('connections.connect')}  ${props.item.name || props.item.legal_name}`
    })

    const getInitials = (name: string): string => {
        if (!name) return '??'
        return name
            .split(' ')
            .map((word) => word[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()
    }

    const handleImageError = (event: Event): void => {
        const img = event.target as HTMLImageElement
        img.style.display = 'none'
    }

    const handleProfileClick = (): void => {
        if (props.item.username) {
            const profilePath = localePath(`/profile/${props.item.username}`)
            router.push(profilePath)
        }
    }

    // ✅ FIXED: Update social.is_following and social.connection
    const updateStoreCompany = (updates: {
        is_following?: boolean
        connection?:
            | false
            | {
                  id?: number
                  status: 'pending' | 'accepted'
                  exists: boolean
              }
    }): void => {
        const targetArray =
            storeArrayKey.value === 'quickSearchCompanies'
                ? searchStore.quickSearchCompanies
                : searchStore.companyResults

        const companyIndex = targetArray.findIndex((c) => c.id === supplierId.value)

        if (companyIndex !== -1) {
            // Initialize social object if it doesn't exist
            if (!targetArray[companyIndex].social) {
                targetArray[companyIndex].social = {
                    is_following: false,
                    followers_count: 0,
                    connection: { exists: false, status: null },
                }
            }

            // Update is_following in social object
            if (updates.is_following !== undefined) {
                targetArray[companyIndex].social!.is_following = updates.is_following

                if (updates.is_following) {
                    targetArray[companyIndex].social!.followers_count =
                        (targetArray[companyIndex].social!.followers_count || 0) + 1
                } else {
                    targetArray[companyIndex].social!.followers_count = Math.max(
                        0,
                        (targetArray[companyIndex].social!.followers_count || 1) - 1
                    )
                }
            }

            // Update connection in social object
            if (updates.connection !== undefined) {
                if (updates.connection === false) {
                    targetArray[companyIndex].social!.connection = {
                        exists: false,
                        status: null,
                    }
                } else {
                    targetArray[companyIndex].social!.connection = updates.connection
                }
            }
        }
    }

    const refreshSocialState = async (): Promise<boolean> => {
        if (!supplierId.value) {
            return false
        }

        try {
            const freshSocialData: ProfileSocialData = await profileService.getSocialState(
                supplierId.value
            )

            if (!freshSocialData) {
                return false
            }

            updateStoreCompany({
                is_following: freshSocialData.is_following,
                connection:
                    freshSocialData.connection && typeof freshSocialData.connection === 'object'
                        ? {
                              id: freshSocialData.connection.id,
                              status: freshSocialData.connection.status as 'pending' | 'accepted',
                              exists: true,
                          }
                        : false,
            })

            return true
        } catch (error) {
            console.error('[SupplierCardItem] Failed to refresh social state:', error)
            return false
        }
    }

    const handleToggleFollow = async (): Promise<void> => {
        if (isProcessingFollow.value || !supplierId.value || !currentUser.value) {
            return
        }

        const previousFollowState = isFollowing.value
        isProcessingFollow.value = true

        try {
            let success = false

            if (previousFollowState) {
                const confirmed = await showUnfollowConfirmation(
                    props.item.name || props.item.legal_name,
                    supplierId.value
                )

                if (confirmed) {
                    updateStoreCompany({ is_following: false })

                    success = true

                    setTimeout(async () => {
                        await refreshSocialState()
                    }, 500)
                }
            } else {
                updateStoreCompany({ is_following: true })

                success = await followUser(
                    supplierId.value,
                    props.item.name || props.item.legal_name
                )

                if (success) {
                    setTimeout(async () => {
                        await refreshSocialState()
                    }, 500)
                } else {
                    updateStoreCompany({ is_following: false })
                }
            }
        } catch (error: any) {
            if (error.statusCode === 409) {
                toast.warning(error.message || t('connections.alreadyFollowing'))
                await refreshSocialState()
            } else {
                toast.error(error.message || t('connections.error'))
            }
        } finally {
            isProcessingFollow.value = false
        }
    }

    const handleToggleConnection = async (): Promise<void> => {
        if (isProcessingConnect.value || !supplierId.value || !currentUser.value) {
            return
        }

        const wasConnected = isConnected.value
        const wasPending = isPending.value
        const currentConnectionId = connectionId.value

        isProcessingConnect.value = true

        try {
            let success = false

            if ((wasConnected || wasPending) && currentConnectionId) {
                const confirmed = await showRemoveConnectionConfirmation(
                    props.item.name,
                    currentConnectionId,
                    supplierId.value,
                    wasPending
                )

                if (confirmed) {
                    updateStoreCompany({ connection: false })

                    success = true

                    setTimeout(async () => {
                        await refreshSocialState()
                    }, 500)
                }
            } else {
                updateStoreCompany({
                    connection: {
                        exists: true,
                        status: 'pending',
                    },
                })

                success = await sendConnectionRequest(supplierId.value)

                if (success) {
                    setTimeout(async () => {
                        await refreshSocialState()
                    }, 500)
                } else {
                    updateStoreCompany({ connection: false })
                }
            }
        } catch (error: any) {
            if (error.statusCode === 409) {
                toast.warning(error.message || t('connections.alreadyConnected'))
                await refreshSocialState()
            } else {
                toast.error(error.message || t('connections.error'))
            }
        } finally {
            isProcessingConnect.value = false
        }
    }
</script>
