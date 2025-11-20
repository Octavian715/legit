// ~/composables/useProfile.ts
import { ref, computed } from 'vue'
import type { ProfileContactInfo, ProfileTabItem } from '~/types/profile'

export const useProfile = () => {
    // Profile interaction states
    const isFollowing = ref(false)
    const isConnected = ref(false)
    const connectionStatus = ref<'none' | 'pending' | 'accepted' | 'rejected'>('none')
    const isFollowLoading = ref(false)
    const isConnectLoading = ref(false)
    const isChatLoading = ref(false)

    // Active tab state
    const activeTab = ref('company-profile')

    // Profile tabs configuration
    const profileTabs = computed<ProfileTabItem[]>(() => [
        {
            key: 'company-profile',
            label: 'Company Profile',
            active: true,
        },
        {
            key: 'products',
            label: 'Products',
            count: 0,
            active: true,
        },
        {
            key: 'certificates',
            label: 'Certificates',
            count: 0,
            active: true,
        },
        {
            key: 'news',
            label: 'News',
            active: true,
        },
    ])

    // Mock data generators for computed properties
    const profileLocation = computed(() => 'Moldova, Chisinau')

    const companyInformation = computed<ProfileContactInfo[]>(() => [
        {
            label: 'Legal Name',
            value: 'Sample Company SRL',
            type: 'text',
        },
        {
            label: 'Business Type',
            value: 'Manufacturer',
            type: 'text',
        },
    ])

    const operationalAddress = computed<ProfileContactInfo[]>(() => [
        {
            label: 'Street Address',
            value: 'Bd. Stefan cel Mare 123',
            type: 'text',
        },
        {
            label: 'City',
            value: 'Chisinau',
            type: 'text',
        },
    ])

    const contactDetails = computed<ProfileContactInfo[]>(() => [
        {
            label: 'Languages',
            value: 'Romanian, English',
            type: 'text',
        },
    ])

    const businessStats = computed(() => ({
        revenue: '€1M - €5M',
        employees: '50-100',
        founded: '2015',
        location: 'Moldova, Chisinau',
    }))

    // Profile interaction handlers
    const handleFollow = async () => {
        if (isFollowLoading.value) return

        isFollowLoading.value = true
        try {
            await new Promise((resolve) => setTimeout(resolve, 1000))
            isFollowing.value = !isFollowing.value
        } catch (err) {
            console.error('Failed to toggle follow:', err)
        } finally {
            isFollowLoading.value = false
        }
    }

    const handleConnect = async () => {
        if (isConnectLoading.value || connectionStatus.value === 'pending') return

        isConnectLoading.value = true
        try {
            await new Promise((resolve) => setTimeout(resolve, 1000))
            connectionStatus.value = 'pending'
        } catch (err) {
            console.error('Failed to send connection request:', err)
        } finally {
            isConnectLoading.value = false
        }
    }

    const handleChat = async () => {
        if (isChatLoading.value) return

        isChatLoading.value = true
        try {
            await navigateTo('/chat')
        } catch (err) {
            console.error('Failed to start chat:', err)
        } finally {
            isChatLoading.value = false
        }
    }

    // Tab management
    const setActiveTab = (tab: string) => {
        activeTab.value = tab
    }

    return {
        // Computed data
        profileTabs,
        profileLocation,
        companyInformation,
        operationalAddress,
        contactDetails,
        businessStats,

        // Interaction states
        activeTab: readonly(activeTab),
        isFollowing: readonly(isFollowing),
        isConnected: readonly(isConnected),
        connectionStatus: readonly(connectionStatus),
        isFollowLoading: readonly(isFollowLoading),
        isConnectLoading: readonly(isConnectLoading),
        isChatLoading: readonly(isChatLoading),

        // Methods
        handleFollow,
        handleConnect,
        handleChat,
        setActiveTab,
    }
}
