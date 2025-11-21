<template>
    <div
        class="supplier-info flex flex-col xl:flex-row xl:items-center sm:border-b border-gray-400 gap-2 w-full sm:pb-2"
    >
        <div class="flex items-start xl:items-center gap-1">
            <span class="text-subtitle3 text-gray-800">{{ t('suppliers', { n: 0 }) }}:</span>

            <Link
                v-tooltip="`${t('visitUser', { user: supplier })}`"
                :to="localePath(`/profile/${supplierUrl}`)"
                :title="supplier"
                :wrap="false"
                container-class="xl:text-nowrap"
                size="sm"
            />

            <span v-if="verified" v-tooltip="`${t('verified')}`" class="text-blue-500">
                <svg class="w-3 h-3">
                    <use xlink:href="/sprite.svg#verified"></use>
                </svg>
            </span>

            <span v-if="connectionState.isConnected" v-tooltip="`${t('connections.connected')}`">
                <svg class="w-3 h-3 text-red-500">
                    <use xlink:href="/sprite.svg#connected"></use>
                </svg>
            </span>
        </div>

        <div class="flex flex-col md:flex-row md:items-center justify-between gap-2 w-full">
            <div class="flex flex-wrap gap-1">
                <Button
                    v-if="isNotCurrentUser"
                    v-tooltip="`${t('chatWithUser', { user: t('suppliers', { n: 0 }) })}`"
                    type="button"
                    color="gray"
                    size="sm"
                    square
                    variant="filled"
                    container-classes="!p-1 text-gray-800 border-gray-400"
                    rounded
                    :loading="isInitiatingChat"
                    :disabled="isInitiatingChat"
                    @click="handleStartChat(props.supplierId, 'ecom')"
                >
                    <svg class="w-4 h-4">
                        <use xlink:href="/sprite.svg#message"></use>
                    </svg>
                </Button>

                <VDropdown
                    v-if="isNotCurrentUser && props.phones?.length > 0"
                    :triggers="['click']"
                    :auto-hide="true"
                    placement="bottom-start"
                    :distance="6"
                    theme="phone-dropdown"
                >
                    <Button
                        v-tooltip="`${t('callUser', { user: supplier })}`"
                        type="button"
                        color="gray"
                        size="sm"
                        variant="filled"
                        container-classes="!p-1 !text-gray-800 !border-gray-400"
                        rounded
                    >
                        <span class="flex items-center gap-1.5">
                            <svg class="w-4 h-4 flex-shrink-0">
                                <use xlink:href="/sprite.svg#calling"></use>
                            </svg>
                        </span>
                    </Button>

                    <template #popper>
                        <div
                            class="bg-white rounded-md shadow border border-gray-200 overflow-hidden min-w-[100px] max-w-[280px]"
                        >
                            <div class="py-1 max-h-[300px] overflow-y-auto">
                                <button
                                    v-for="(phone, index) in props.phones"
                                    :key="`phone-${index}`"
                                    type="button"
                                    class="w-full flex items-center gap-3 px-2 py-3 hover:bg-red-50 transition-all duration-200 cursor-pointer group"
                                    @click="handlePhoneCall(phone)"
                                >
                                    <div
                                        class="flex-1 min-w-0 flex flex-col text-body text-gray-950 group-hover:text-red-500 transition-colors duration-200"
                                    >
                                        <span class="">
                                            +{{ formatPhoneNumber(phone.phone_number) }}
                                        </span>
                                        <span v-if="phone.type" class="capitalize mt-0.5">
                                            {{ getPhoneTypeLabel(phone.type) }}
                                        </span>
                                    </div>

                                    <svg
                                        class="w-4 h-4 text-gray-600 group-hover:opacity-100 group-hover:text-red-500 transition-all duration-200 flex-shrink-0"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path
                                            fill-rule="evenodd"
                                            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                            clip-rule="evenodd"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </template>
                </VDropdown>

                <Button
                    v-else-if="isNotCurrentUser && (!props.phones || props.phones.length === 0)"
                    v-tooltip="`${t('callUser', { user: supplier })}`"
                    type="button"
                    color="gray"
                    size="sm"
                    square
                    variant="filled"
                    container-classes="!p-1"
                    rounded
                    @click="$emit('call')"
                >
                    <svg class="w-4 h-4">
                        <use xlink:href="/sprite.svg#calling"></use>
                    </svg>
                </Button>
            </div>

            <div v-if="showSocial" class="flex gap-1">
                <FollowButton
                    v-if="isNotCurrentUser"
                    classes="flex-1 md:flex-initial"
                    :user-id="supplierId"
                    :loading="isProcessingFollow"
                    :supplier-name="supplier"
                    font-width="bold"
                    :is-follow="connectionState.isFollowing"
                    @set-follow="handleFollow"
                />
                <Button
                    v-if="isNotCurrentUser"
                    type="button"
                    :color="connectionButtonColor"
                    size="sm"
                    variant="filled"
                    :loading="isProcessingConnect"
                    container-classes="flex-1 md:flex-initial"
                    :disabled="isProcessingConnect || !supplierId"
                    @click="handleToggleConnection"
                >
                    <span class="flex items-center gap-1">
                        <svg
                            v-if="!connectionState.isConnected && !connectionState.isPending"
                            class="w-3 h-3"
                        >
                            <use xlink:href="/sprite.svg#connected"></use>
                        </svg>
                        <svg v-if="connectionState.isConnected" class="w-3 h-3">
                            <use xlink:href="/sprite.svg#disconnect"></use>
                        </svg>

                        {{ connectionButtonText }}
                    </span>
                </Button>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
    import { ref, computed, watch } from 'vue'
    import { useLocalePath } from '#imports'
    import { Dropdown as VDropdown } from 'floating-vue'
    import 'floating-vue/dist/style.css'
    import Link from '~/components/ui/Link.vue'
    import type { ProductListing } from '@/types/products'
    import type { Phone } from '~/types/auth'
    import { storeToRefs } from 'pinia'
    import { useChatStore } from '~/stores/chat'
    import { useChat } from '~/composables/socket/useChat'
    import { useSearchStore } from '~/stores/search'
    import { ProfileService } from '~/services/profile'
    import type { ProfileSocialData } from '~/types/profile'

    const localePath = useLocalePath()
    const { t } = useI18n()
    const toast = useToastNotification()
    const userStore = useUserStore()
    const chatStore = useChatStore()
    const searchStore = useSearchStore()
    const profileService = new ProfileService()
    const { user } = storeToRefs(userStore)

    interface SocialData {
        is_following: boolean
        connection: {
            exists: boolean
            status: 'pending' | 'accepted' | 'rejected' | null
            id?: number
        }
    }

    interface Props {
        product: ProductListing
        supplier: string
        supplierUrl?: string
        supplierId?: number
        social: SocialData
        verified?: boolean
        phones?: Phone[]
        mode?: string
        showSocial?: boolean
        enableStoreSync?: boolean
    }

    const props = withDefaults(defineProps<Props>(), {
        supplierUrl: '#',
        verified: false,
        phones: () => [],
        social: () => ({
            is_following: false,
            connection: {
                exists: false,
                status: null,
                id: null,
            },
        }),
        showSocial: true,
        mode: 'products',
        enableStoreSync: false,
    })

    const emit = defineEmits<{
        (e: 'chat'): void
        (e: 'call', phone?: Phone): void
        (e: 'rate'): void
        (e: 'social-update', value: SocialData): void
    }>()

    const { sendConnectionRequest, showRemoveConnectionConfirmation } = useConnections()
    const { loadingNewChat: isInitiatingChat, handleStartChat } = useChat()

    const isProcessingConnect = ref(false)
    const isProcessingFollow = ref(false)
    const localSocialState = ref<SocialData>({ ...props.social })

    const productId = computed(() => props.product.id)

    const isNotCurrentUser = computed(() => props.supplierId !== user.value?.id)

    const connectionState = computed(() => {
        const social = localSocialState.value
        const connection = social.connection

        return {
            isConnected: connection.exists && connection.status === 'accepted',
            isFollowing: social.is_following,
            isPending: connection.exists && connection.status === 'pending',
            connectionId: connection.id,
        }
    })

    const connectionButtonColor = computed(() => {
        if (!connectionState.value.isConnected && !connectionState.value.isPending) return 'red'
        if (connectionState.value.isConnected || connectionState.value.isPending) return 'gray'
        return 'red'
    })

    const connectionButtonText = computed(() => {
        if (connectionState.value.isPending) return t('connections.cancel')
        if (connectionState.value.isConnected) return t('connections.disconnect')
        return t('connections.connect')
    })

    const updateLocalSocialState = (updates: Partial<SocialData>): void => {
        localSocialState.value = {
            ...localSocialState.value,
            ...updates,
            connection: {
                ...localSocialState.value.connection,
                ...updates.connection,
            },
        }

        emit('social-update', localSocialState.value)

        if (props.enableStoreSync) {
            updateProductInStore(localSocialState.value)
        }
    }

    const updateProductInStore = (socialData: SocialData): void => {
        if (!props.supplierId || !productId.value || !props.enableStoreSync) return

        const productIndex = searchStore.productResults.findIndex((p) => p.id === productId.value)

        if (productIndex !== -1) {
            if (!searchStore.productResults[productIndex].user?.social) {
                if (!searchStore.productResults[productIndex].user) {
                    return
                }
                searchStore.productResults[productIndex].user.social = {
                    is_following: false,
                    connection: { exists: false, status: null },
                }
            }
            searchStore.productResults[productIndex].user.social = socialData
        }
    }

    const refreshSocialState = async (): Promise<boolean> => {
        if (!props.supplierId) {
            return false
        }

        try {
            const freshSocialData: ProfileSocialData = await profileService.getSocialState(
                props.supplierId
            )

            if (!freshSocialData) {
                return false
            }

            const updatedSocial: SocialData = {
                is_following: freshSocialData.is_following,
                connection: {
                    exists: freshSocialData.connection !== false,
                    status:
                        freshSocialData.connection && typeof freshSocialData.connection === 'object'
                            ? (freshSocialData.connection.status as
                                  | 'pending'
                                  | 'accepted'
                                  | 'rejected'
                                  | null)
                            : null,
                    id:
                        freshSocialData.connection && typeof freshSocialData.connection === 'object'
                            ? freshSocialData.connection.id
                            : undefined,
                },
            }

            updateLocalSocialState(updatedSocial)

            return true
        } catch (error) {
            console.error('[SupplierInfo] Failed to refresh social state:', error)
            return false
        }
    }

    const formatPhoneNumber = (phoneNumber: string): string => {
        if (!phoneNumber) return ''

        const cleaned = phoneNumber.replace(/\D/g, '')

        if (cleaned.length <= 6) {
            return cleaned
        } else if (cleaned.length <= 9) {
            return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`
        } else {
            return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`
        }
    }

    const getPhoneTypeLabel = (type: string): string => {
        const typeMap: Record<string, string> = {
            mobile: t('phone.mobile'),
            office: t('phone.office'),
            home: t('phone.home'),
            fax: t('phone.fax'),
        }
        return typeMap[type.toLowerCase()] || type
    }

    const initiatePhoneCall = (phoneNumber: string): void => {
        if (!phoneNumber) return

        const cleanedNumber = phoneNumber.replace(/\D/g, '')
        const telLink = `tel:+${cleanedNumber}`

        window.location.href = telLink
    }

    const handlePhoneCall = (phone: Phone): void => {
        if (phone?.phone_number) {
            initiatePhoneCall(phone.phone_number)
        }

        emit('call', phone)
    }

    const handleToggleConnection = async (): Promise<void> => {
        if (!props.supplierId || isProcessingConnect.value) return

        isProcessingConnect.value = true

        try {
            const { isConnected, isPending, connectionId } = connectionState.value

            if (isPending || isConnected) {
                if (!connectionId) {
                    toast.error(t('connections.error'))
                    return
                }

                const success = await showRemoveConnectionConfirmation(
                    props.supplier,
                    connectionId,
                    props.supplierId,
                    isPending
                )

                if (success) {
                    updateLocalSocialState({
                        connection: {
                            exists: false,
                            status: null,
                            id: undefined,
                        },
                    })

                    setTimeout(async () => {
                        await refreshSocialState()
                    }, 500)
                }
            } else {
                updateLocalSocialState({
                    connection: {
                        exists: true,
                        status: 'pending',
                    },
                })

                const success = await sendConnectionRequest(props.supplierId)

                if (success) {
                    setTimeout(async () => {
                        await refreshSocialState()
                    }, 500)
                } else {
                    updateLocalSocialState({
                        connection: {
                            exists: false,
                            status: null,
                            id: undefined,
                        },
                    })
                }
            }
        } catch (error: any) {
            if (error.statusCode === 409) {
                toast.warning(error.message || t('connections.alreadyConnected'))
                await refreshSocialState()
            } else {
                toast.error(error?.message || t('connections.error'))
            }
        } finally {
            isProcessingConnect.value = false
        }
    }

    const handleFollow = async (value: boolean): Promise<void> => {
        isProcessingFollow.value = true
        try {
            updateLocalSocialState({
                is_following: value,
            })

            setTimeout(async () => {
                await refreshSocialState()
            }, 500)
        } catch (error: any) {
            toast.error(error?.message || t('connections.error'))
            updateLocalSocialState({
                is_following: !value,
            })
        } finally {
            isProcessingFollow.value = false
        }
    }

    watch(
        () => props.social,
        (newSocial) => {
            localSocialState.value = { ...newSocial }
        },
        { deep: true, immediate: true }
    )
</script>
