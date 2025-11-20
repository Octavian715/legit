import { ConnectionsService } from '~/services/connections'
import { useSearchStore } from '~/stores/search'
import { storeToRefs } from 'pinia'
import { ProfileService } from '~/services/profile'

export const useConnections = () => {
    const connectionsService = new ConnectionsService()
    const profileService = new ProfileService()
    const modalStore = useModalStore()
    const searchStore = useSearchStore()

    const {
        hasQuickSearchResults,
        quickSearchCompanies,
        hasProductResults,
        hasGroupedResults,
        hasCompanyResults,
    } = storeToRefs(searchStore)

    const toast = useToastNotification()
    const { t } = useI18n()
    const route = useRoute()

    const isLoading = ref(false)
    const error = ref<string | null>(null)

    const isOnMarketplacePage = computed(() => route.path.startsWith('/marketplace'))
    const isOnConnectionPage = computed(
        () => route.path.includes('/connections') || route.path.includes('/network')
    )

    // Should we update search results?
    const shouldUpdateSearch = computed(
        () =>
            hasQuickSearchResults.value ||
            hasProductResults.value ||
            hasGroupedResults.value ||
            hasCompanyResults.value ||
            quickSearchCompanies.value.length > 0 ||
            route.path.startsWith('/search')
    )

    const resetError = () => {
        error.value = null
    }

    const handleError = (e: any) => {
        const errorMessage = e.data?.message || e.message || 'An error occurred'
        error.value = errorMessage
        console.error('Connection error:', e)
        return errorMessage
    }

    const sendConnectionRequest = async (userId: number): Promise<boolean> => {
        resetError()
        isLoading.value = true

        try {
            const response = await connectionsService.sendConnectionRequest(userId)

            if (response.success) {
                toast.success(t('connections.requestSent'))

                if (isOnMarketplacePage.value) {
                    const productsStore = useProductsStore()
                    productsStore.checkAndUpdateUserProducts(userId)
                }

                if (shouldUpdateSearch.value) {
                    profileService.getUserProfile(userId).then((userProfile) => {
                        if (userProfile.social) {
                            searchStore.updateConnection(userId, userProfile.social)
                        }
                    })
                    //
                }
                return true
            }

            throw new Error(response.message || 'Request failed')
        } catch (e: any) {
            const message = handleError(e)

            toast.error(message || t('connections.errors.requestFailed'))
            return false
        } finally {
            isLoading.value = false
        }
    }

    const respondToConnectionRequest = async (
        connectionId: number,
        action: 'accept' | 'reject',
        userId?: number,
        userName?: string
    ): Promise<boolean> => {
        resetError()
        isLoading.value = true

        try {
            const response = await connectionsService.respondToConnectionRequest(
                connectionId,
                action
            )

            if (response.status_type || response.success) {
                const message =
                    action === 'accept'
                        ? t('connections.requestAccepted')
                        : t('connections.requestRejected')
                toast.success(message)

                if (action === 'accept' && userId && isOnMarketplacePage.value) {
                    const productsStore = useProductsStore()
                    await productsStore.checkAndUpdateUserProducts(userId, userName)
                }

                if (shouldUpdateSearch.value) {
                    profileService.getUserProfile(userId!).then((userProfile) => {
                        if (userProfile.social) {
                            searchStore.updateConnection(userId!, userProfile.social)
                        }
                    })
                }

                return true
            }

            throw new Error(response.message || 'Response failed')
        } catch (e: any) {
            const message = handleError(e)

            toast.error(message || t('connections.errors.responseFailed'))
            return false
        } finally {
            isLoading.value = false
        }
    }

    const removeConnection = async (
        connectionId: number,
        userId?: number,
        userName?: string
    ): Promise<boolean> => {
        resetError()
        isLoading.value = true

        try {
            const response = await connectionsService.removeConnection(connectionId)
            if (response.success) {
                if (userId && isOnMarketplacePage.value) {
                    const productsStore = useProductsStore()
                    await productsStore.checkAndUpdateUserProducts(userId, userName)
                }

                if (shouldUpdateSearch.value) {
                    profileService.getUserProfile(connectionId).then((userProfile) => {
                        if (userProfile.social) {
                            searchStore.updateConnection(connectionId, userProfile.social)
                        }
                    })
                }

                return true
            }

            throw new Error(response.message || 'Remove failed')
        } catch (e: any) {
            const message = handleError(e)

            toast.error(message || t('connections.errors.removeFailed'))
            return false
        } finally {
            isLoading.value = false
        }
    }

    const followUser = async (userId: number, userName?: string): Promise<boolean> => {
        resetError()
        isLoading.value = true

        try {
            const response = await connectionsService.followUser(userId)

            if (response.success) {
                toast.success(t('connections.followingUser'))

                if (isOnMarketplacePage.value) {
                    const productsStore = useProductsStore()
                    await productsStore.checkAndUpdateUserProducts(userId, userName)
                }

                if (shouldUpdateSearch.value) {
                    profileService.getUserProfile(userId).then((userProfile) => {
                        if (userProfile.social) {
                            searchStore.updateConnection(userId, userProfile.social)
                        }
                    })
                }

                return true
            }

            throw new Error(response.message || 'Follow failed')
        } catch (e: any) {
            const message = handleError(e)

            if (e.statusCode === 409) {
                console.warn('Already following user:', userId)
                return false
            } else {
                toast.error(message || t('connections.errors.followFailed'))
                return false
            }
        } finally {
            isLoading.value = false
        }
    }

    const unfollowUser = async (userId: number, userName?: string): Promise<boolean> => {
        resetError()
        isLoading.value = true

        try {
            const response = await connectionsService.unfollowUser(userId)

            if (response.success) {
                toast.success(t('connections.unfollowedUser'))

                if (isOnMarketplacePage.value) {
                    const productsStore = useProductsStore()
                    await productsStore.checkAndUpdateUserProducts(userId, userName)
                }

                if (shouldUpdateSearch.value) {
                    profileService.getUserProfile(userId).then((userProfile) => {
                        if (userProfile.social) {
                            searchStore.updateConnection(userId, userProfile.social)
                        }
                    })
                }

                return true
            }

            throw new Error(response.message || 'Unfollow failed')
        } catch (e: any) {
            const message = handleError(e)

            toast.error(message || t('connections.errors.unfollowFailed'))
            return false
        } finally {
            isLoading.value = false
        }
    }

    const sendReferralInvitation = async (payload: any): Promise<boolean> => {
        resetError()
        isLoading.value = true

        try {
            const response = await connectionsService.sendRefferalInvitaton(payload)

            if (response) {
                toast.success(t('connections.invitationSent'))
                return true
            }

            throw new Error('Invitation failed')
        } catch (e: any) {
            const message = handleError(e)
            toast.error(message || t('connections.errors.invitationFailed'))
            return false
        } finally {
            isLoading.value = false
        }
    }

    const cancelReferralInvitation = async (invitationId: number): Promise<boolean> => {
        resetError()
        isLoading.value = true

        try {
            const response = await connectionsService.cancelRefferalInvitation(invitationId)

            if (response) {
                toast.success(t('connections.invitationCanceled'))
                return true
            }

            throw new Error('Cancel invitation failed')
        } catch (e: any) {
            const message = handleError(e)
            toast.error(message || t('connections.errors.cancelInvitationFailed'))
            return false
        } finally {
            isLoading.value = false
        }
    }

    const showRemoveConnectionConfirmation = async (
        userName: string,
        connectionId: number,
        userId?: number,
        isPending: boolean = false
    ): Promise<boolean> => {
        return new Promise(async (resolve) => {
            try {
                const moduleImport = await import(
                    '~/components/features/ecommerce/connections/modals/ConnectionConfirmationModal.vue'
                )
                const ConnectionConfirmationModal = moduleImport.default

                let isProcessing = false

                modalStore.openModal(
                    ConnectionConfirmationModal,
                    isPending ? 'cancelInvitationConfirmation' : 'disconnectConfirmation',
                    {
                        userName,
                        userId: connectionId,
                        action: isPending ? 'cancelInvitation' : 'disconnect',
                        isLoading: isProcessing,
                    },
                    {
                        title: isPending
                            ? t('connections.confirmCancelInvitation')
                            : t('connections.confirmDisconnect'),
                        contentWidth: 'max-w-sm sm:max-w-md',
                        hideFooter: true,
                        persistent: isProcessing,
                        onOk: async () => {
                            if (isProcessing) return
                            isProcessing = true

                            try {
                                const result = await removeConnection(
                                    connectionId,
                                    userId,
                                    userName
                                )
                                if (result) {
                                    toast.success(
                                        isPending
                                            ? t('connections.requestCanceled')
                                            : t('connections.disconnected')
                                    )
                                }
                                resolve(result)
                            } catch (error) {
                                resolve(false)
                            } finally {
                                isProcessing = false
                                modalStore.closeModal()
                            }
                        },
                        onClose: () => {
                            if (!isProcessing) {
                                resolve(false)
                            }
                        },
                    }
                )
            } catch (error) {
                toast.error('Failed to load confirmation dialog')
                resolve(false)
            }
        })
    }

    const showUnfollowConfirmation = async (userName: string, userId: number): Promise<boolean> => {
        return new Promise(async (resolve) => {
            try {
                const moduleImport = await import(
                    '~/components/features/ecommerce/connections/modals/FollowConfirmationModal.vue'
                )
                const FollowConfirmationModal = moduleImport.default

                let isProcessing = false

                modalStore.openModal(
                    FollowConfirmationModal,
                    'unfollowConfirmation',
                    {
                        userName,
                        userId,
                        action: 'unfollow',
                        isLoading: isProcessing,
                    },
                    {
                        title: t('connections.confirmUnfollow'),
                        contentWidth: 'max-w-sm sm:max-w-md',
                        hideFooter: true,
                        persistent: isProcessing,
                        onOk: async () => {
                            if (isProcessing) return

                            isProcessing = true

                            try {
                                const result = await unfollowUser(userId, userName)
                                resolve(result)
                            } catch (error) {
                                resolve(false)
                            } finally {
                                isProcessing = false
                                modalStore.closeModal()
                            }
                        },
                        onClose: () => {
                            if (!isProcessing) {
                                resolve(false)
                            }
                        },
                    }
                )
            } catch (error) {
                toast.error('Failed to load confirmation dialog')
                resolve(false)
            }
        })
    }

    const showCancelReferralInvitationConfirmation = async (
        invitationData: any
    ): Promise<boolean> => {
        return new Promise(async (resolve) => {
            try {
                const moduleImport = await import(
                    '~/components/features/ecommerce/connections/modals/ConnectionConfirmationModal.vue'
                )
                const ConnectionConfirmationModal = moduleImport.default

                let isProcessing = false

                modalStore.openModal(
                    ConnectionConfirmationModal,
                    'cancelReferralInvitationConfirmation',
                    {
                        userName: invitationData.company_name || invitationData.email,
                        userId: invitationData.id,
                        action: 'cancelInvitation',
                        isLoading: isProcessing,
                    },
                    {
                        title: t('connections.confirmCancelInvitation'),
                        contentWidth: 'max-w-sm sm:max-w-md',
                        hideFooter: true,
                        persistent: isProcessing,
                        onOk: async () => {
                            if (isProcessing) return

                            isProcessing = true

                            try {
                                const result = await cancelReferralInvitation(invitationData.id)
                                resolve(result)
                            } catch (error: any) {
                                toast.error(
                                    error.message || t('connections.errors.cancelInvitationFailed')
                                )
                                resolve(false)
                            } finally {
                                isProcessing = false
                                modalStore.closeModal()
                            }
                        },
                        onClose: () => {
                            if (!isProcessing) {
                                resolve(false)
                            }
                        },
                    }
                )
            } catch (error) {
                toast.error('Failed to load confirmation dialog')
                resolve(false)
            }
        })
    }

    const handleFollowAction = async (
        userName: string,
        userId: number,
        currentFollowState: boolean
    ): Promise<boolean> => {
        try {
            if (currentFollowState) {
                return await showUnfollowConfirmation(userName, userId)
            } else {
                return await followUser(userId, userName)
            }
        } catch (error: any) {
            toast.error(error.message || t('connections.errors.followFailed'))
            return false
        }
    }

    // Wrapper methods for connections.vue compatibility
    const acceptConnectionRequest = async (
        connectionId: number,
        userName?: string
    ): Promise<boolean> => {
        return await respondToConnectionRequest(connectionId, 'accept', undefined, userName)
    }

    const cancelConnectionRequest = async (
        connectionId: number,
        userName?: string
    ): Promise<boolean> => {
        // Use showRemoveConnectionConfirmation with isPending=true
        return await showRemoveConnectionConfirmation(userName || '', connectionId, undefined, true)
    }

    // Notification action handlers (no modals)
    const handleNotificationAcceptConnection = async (
        connectionId: number,
        userId?: number,
        userName?: string
    ): Promise<boolean> => {
        return await respondToConnectionRequest(connectionId, 'accept', userId, userName)
    }

    const handleNotificationRejectConnection = async (
        connectionId: number,
        userId?: number,
        userName?: string
    ): Promise<boolean> => {
        return await respondToConnectionRequest(connectionId, 'reject', userId, userName)
    }

    return {
        isLoading: readonly(isLoading),
        error: readonly(error),

        sendConnectionRequest,
        respondToConnectionRequest,
        removeConnection,
        followUser,
        unfollowUser,
        sendReferralInvitation,
        cancelReferralInvitation,

        // Wrapper methods
        acceptConnectionRequest,
        cancelConnectionRequest,

        // Notification handlers
        handleNotificationAcceptConnection,
        handleNotificationRejectConnection,

        showRemoveConnectionConfirmation,
        showCancelReferralInvitationConfirmation,
        handleFollowAction,
        showUnfollowConfirmation,

        resetError,
    }
}
