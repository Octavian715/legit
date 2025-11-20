<template>
    <article class="grouped-company-item overflow-hidden">
        <Collapse :when="isExpanded" arrow-position="right" inner-padding="p-2">
            <template #title>
                <div class="flex items-center justify-between gap-2 w-full" @click="toggleExpanded">
                    <div class="flex items-center gap-2 flex-1 min-w-0">
                        <div class="relative w-8 h-8 rounded-full overflow-hidden shrink-0">
                            <img
                                v-if="companyProfilePicture"
                                v-tooltip="group.company.legal_name"
                                :src="companyProfilePicture"
                                :alt="group.company.legal_name"
                                class="w-full h-full object-cover cursor-pointer"
                                loading="lazy"
                                width="40"
                                height="40"
                                @error="handleImageError"
                                @click.stop="handleProfileClick"
                            />
                            <div
                                v-else
                                v-tooltip="group.company.legal_name"
                                class="w-full h-full bg-gray-300 flex items-center justify-center text-gray-800 font-bold text-subtitle3"
                            >
                                {{ getInitials(group.company.legal_name) }}
                            </div>
                        </div>

                        <div class="flex-1 min-w-0">
                            <h3
                                class="text-subtitle1 font-medium text-gray-950 w-fit line-clamp-1"
                                @click.stop="handleProfileClick"
                            >
                                {{ group.company.legal_name }}
                            </h3>
                        </div>
                    </div>

                    <div class="flex items-center gap-1 shrink-0">
                        <Button
                            v-if="showActionButtons"
                            v-tooltip="followTooltip"
                            type="button"
                            color="gray"
                            size="sm"
                            variant="filled"
                            font-weight="bold"
                            rounded
                            :loading="isProcessingFollow"
                            :disabled="isProcessingFollow"
                            @click.stop="handleToggleFollow"
                        >
                            {{ followButtonText }}
                        </Button>

                        <Button
                            v-if="showActionButtons"
                            v-tooltip="connectionTooltip"
                            type="button"
                            :color="connectionButtonColor"
                            size="sm"
                            variant="filled"
                            rounded
                            :loading="isProcessingConnect"
                            :disabled="isProcessingConnect"
                            @click.stop="handleToggleConnection"
                        >
                            <span class="flex items-center gap-1">
                                <svg v-if="!isConnected && !isPending" class="w-3 h-3">
                                    <use xlink:href="/sprite.svg#connected"></use>
                                </svg>
                                <svg v-if="isConnected" class="w-3 h-3">
                                    <use xlink:href="/sprite.svg#disconnect"></use>
                                </svg>
                                {{ connectionButtonText }}
                            </span>
                        </Button>
                    </div>
                </div>
            </template>

            <div>
                <template v-if="isExtendedMode">
                    <TransitionGroup name="product-list" tag="div">
                        <ProductCard
                            v-for="product in transformedProducts"
                            :key="`product-${product.id}`"
                            :product="product"
                            :mode="'search-all'"
                        />
                    </TransitionGroup>
                </template>
                <template v-else>
                    <TransitionGroup name="product-list" tag="div" class="space-y-2">
                        <ProductCardItem
                            v-for="product in transformedProducts"
                            :key="`product-${product.id}`"
                            :item="product"
                            :show-supplier="false"
                            @click="handleProductClick"
                            @category-click="handleCategoryClick"
                            @supplier-click="handleProfileClick"
                        />
                    </TransitionGroup>
                </template>

                <Button
                    type="button"
                    color="blue"
                    size="md"
                    variant="filled"
                    class="mx-auto my-2"
                    @click="handleViewAll"
                >
                    {{ t('viewAll') }}
                </Button>
            </div>
        </Collapse>
    </article>
</template>

<script setup lang="ts">
    import { computed, ref } from 'vue'
    import type { GroupedCompanyProducts } from '~/types/search'
    import { useUserStore } from '~/stores/user'
    import { useSearchStore } from '~/stores/search'
    import { useConnections } from '~/composables/useConnections'
    import { ProfileService } from '~/services/profile'
    import type { ProfileSocialData } from '~/types/profile'
    import ProductCard from '~/components/features/ecommerce/products/ProductCard/index.vue'
    import { useSearchProduct } from '~/composables/useSearchProduct'

    interface Props {
        group: GroupedCompanyProducts
        mode?: 'compact' | 'extended'
    }

    const props = defineProps<Props>()

    const emit = defineEmits<{
        click: [item: any]
        'category-click': [categorySlug: string]
        'supplier-click': [supplierUsername: string]
        'profile-click': [companyUsername: string]
        'view-all': [companyUsername: string]
    }>()

    const { t } = useI18n()
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

    const isExpanded = ref(false)
    const isProcessingFollow = ref(false)
    const isProcessingConnect = ref(false)
    const maxVisibleProducts = 2

    const isExtendedMode = computed(() => props.mode === 'extended')
    const isCompactMode = computed(() => props.mode === 'compact')

    const currentUser = computed(() => userStore.user)
    const companyId = computed(() => props.group.company.id)

    const storeArrayKey = computed(() => {
        return isCompactMode.value ? 'quickSearchGroupedResults' : 'groupedResults'
    })

    const companyFromStore = computed(() => {
        const targetArray =
            storeArrayKey.value === 'quickSearchGroupedResults'
                ? searchStore.quickSearchGroupedResults
                : searchStore.groupedResults

        const groupIndex = targetArray.findIndex((g) => g.company.id === companyId.value)
        return groupIndex !== -1 ? targetArray[groupIndex].company : null
    })

    const showActionButtons = computed(() => {
        return currentUser.value && companyId.value !== currentUser.value.id
    })

    const isFollowing = computed(() => {
        const storeCompany = companyFromStore.value
        if (storeCompany?.social?.is_following !== undefined) {
            return storeCompany.social.is_following
        }
        return props.group.company.social?.is_following || false
    })

    const companyProfilePicture = computed(
        () => props.group.company.profile_media?.[0]?.url || null
    )

    const isConnected = computed(() => {
        const storeCompany = companyFromStore.value
        if (storeCompany?.social?.connection) {
            return storeCompany.social.connection.status === 'accepted'
        }

        const connection = props.group.company.social?.connection
        if (connection && typeof connection === 'object') {
            return connection.status === 'accepted'
        }
        return false
    })

    const isPending = computed(() => {
        const storeCompany = companyFromStore.value
        if (storeCompany?.social?.connection) {
            return storeCompany.social.connection.status === 'pending'
        }

        const connection = props.group.company.social?.connection
        if (connection && typeof connection === 'object') {
            return connection.status === 'pending'
        }
        return false
    })

    const connectionId = computed(() => {
        const storeCompany = companyFromStore.value
        if (storeCompany?.social?.connection) {
            return storeCompany.social.connection.id
        }

        const connection = props.group.company.social?.connection
        if (connection && typeof connection === 'object') {
            return connection.id
        }
        return undefined
    })

    const followButtonText = computed(() =>
        isFollowing.value ? t('connections.unfollow') : t('connections.follow')
    )

    const followTooltip = computed(() =>
        isFollowing.value
            ? `${t('connections.unfollow')} ${props.group.company.legal_name}`
            : `${t('connections.follow')} ${props.group.company.legal_name}`
    )

    const connectionButtonColor = computed(() =>
        !isConnected.value && !isPending.value ? 'red' : 'gray'
    )

    const connectionButtonText = computed(() => {
        if (isPending.value) return t('connections.cancel')
        if (isConnected.value) return t('connections.disconnect')
        return t('connections.connect')
    })

    const connectionTooltip = computed(() => {
        if (isPending.value) return t('connections.cancel')
        if (isConnected.value)
            return `${t('connections.disconnect')} ${props.group.company.legal_name}`
        return `${t('connections.connect')} ${props.group.company.legal_name}`
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

    const transformedProducts = computed(() => {
        if (!props.group.products || props.group.products.length === 0) return []

        const slicedProducts = props.group.products.slice(0, maxVisibleProducts)

        // Transform each product to ProductCardItem format
        return slicedProducts.map((product) => {
            const { transformedProduct } = useSearchProduct(product)
            return transformedProduct.value
        })
    })

    const handleImageError = (event: Event): void => {
        const img = event.target as HTMLImageElement
        img.style.display = 'none'
    }

    const toggleExpanded = (): void => {
        isExpanded.value = !isExpanded.value
    }

    const handleProductClick = (item: any): void => {
        emit('click', item)
    }

    const handleCategoryClick = (categorySlug: string): void => {
        emit('category-click', categorySlug)
    }

    const handleProfileClick = (): void => {
        emit('profile-click', props.group.company.username)
    }

    const handleViewAll = (): void => {
        emit('view-all', props.group.company.username)
    }

    const updateStoreCompany = (updates: {
        is_following?: boolean
        connection?: {
            exists: boolean
            status: 'pending' | 'accepted' | null
            id?: number
        }
    }): void => {
        const targetArray =
            storeArrayKey.value === 'quickSearchGroupedResults'
                ? searchStore.quickSearchGroupedResults
                : searchStore.groupedResults

        const groupIndex = targetArray.findIndex((g) => g.company.id === companyId.value)

        if (groupIndex !== -1) {
            if (!targetArray[groupIndex].company.social) {
                targetArray[groupIndex].company.social = {
                    is_following: false,
                    followers_count: 0,
                    connection: { exists: false, status: null },
                }
            }

            if (updates.is_following !== undefined) {
                targetArray[groupIndex].company.social.is_following = updates.is_following
            }

            if (updates.connection !== undefined) {
                targetArray[groupIndex].company.social.connection = updates.connection
            }
        }
    }

    const refreshSocialState = async (): Promise<boolean> => {
        if (!companyId.value) return false

        try {
            const freshSocialData: ProfileSocialData = await profileService.getSocialState(
                companyId.value
            )

            if (!freshSocialData) return false

            updateStoreCompany({
                is_following: freshSocialData.is_following,
                connection:
                    freshSocialData.connection && typeof freshSocialData.connection === 'object'
                        ? {
                              exists: true,
                              status: freshSocialData.connection.status as
                                  | 'pending'
                                  | 'accepted'
                                  | null,
                              id: freshSocialData.connection.id,
                          }
                        : { exists: false, status: null },
            })

            return true
        } catch (error) {
            console.error('[GroupedCompanyItem] Failed to refresh social state:', error)
            return false
        }
    }

    const handleToggleFollow = async (): Promise<void> => {
        if (isProcessingFollow.value || !companyId.value || !currentUser.value) return

        const previousFollowState = isFollowing.value
        isProcessingFollow.value = true

        try {
            if (previousFollowState) {
                const confirmed = await showUnfollowConfirmation(
                    props.group.company.legal_name,
                    companyId.value
                )

                if (confirmed) {
                    updateStoreCompany({ is_following: false })

                    setTimeout(async () => {
                        await refreshSocialState()
                    }, 500)
                }
            } else {
                updateStoreCompany({ is_following: true })

                const success = await followUser(companyId.value, props.group.company.legal_name)

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
        if (isProcessingConnect.value || !companyId.value || !currentUser.value) return

        const wasConnected = isConnected.value
        const wasPending = isPending.value
        const currentConnectionId = connectionId.value

        isProcessingConnect.value = true

        try {
            if ((wasConnected || wasPending) && currentConnectionId) {
                const confirmed = await showRemoveConnectionConfirmation(
                    props.group.company.legal_name,
                    currentConnectionId,
                    companyId.value,
                    wasPending
                )

                if (confirmed) {
                    updateStoreCompany({
                        connection: { exists: false, status: null, id: undefined },
                    })

                    setTimeout(async () => {
                        await refreshSocialState()
                    }, 500)
                }
            } else {
                updateStoreCompany({
                    connection: { exists: true, status: 'pending' },
                })

                const success = await sendConnectionRequest(companyId.value)

                if (success) {
                    setTimeout(async () => {
                        await refreshSocialState()
                    }, 500)
                } else {
                    updateStoreCompany({
                        connection: { exists: false, status: null, id: undefined },
                    })
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

<style scoped>
    .product-list-enter-active,
    .product-list-leave-active {
        transition: all 0.2s ease;
    }

    .product-list-enter-from {
        opacity: 0;
        transform: translateX(-10px);
    }

    .product-list-leave-to {
        opacity: 0;
        transform: translateX(10px);
    }
</style>
