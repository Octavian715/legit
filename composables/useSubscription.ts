// ~/composables/useSubscription.ts
import { computed, ref } from 'vue'
import { useUserStore } from '@/stores/user'
import { useStaticData } from '@/composables/useStaticData'
import type { PaymentMethod, Invoice } from '@/types/auth'

export const useSubscription = () => {
    const userStore = useUserStore()
    const { userPlans } = useStaticData()

    const isLoading = ref(false)
    const error = ref<string | null>(null)

    // Get current subscription from user.plan_maps[0]
    const currentSubscription = computed(() => {
        const user = userStore.user
        if (!user || !user.plan_maps || user.plan_maps.length === 0) return null
        return user.plan_maps[0]
    })

    // Get current plan details from static data
    const currentPlan = computed(() => {
        if (!currentSubscription.value?.plan_code) return null
        return userPlans.value.find((p) => p.code === currentSubscription.value?.plan_code) || null
    })

    const hasActiveSubscription = computed(() => !!currentSubscription.value)

    // Mock payment methods - in production, fetch from API
    const paymentMethods = computed<PaymentMethod[]>(() => [
        {
            id: 'pm_1',
            type: 'card',
            brand: 'visa',
            last_four: '3648',
            expiry_month: 12,
            expiry_year: 2026,
            is_default: true,
            billing_email: 'cookiekiller.design@gmail.com',
            billing_address: {
                street: 'Veronica Micle str. 15',
                city: 'Chisinau',
                postal_code: '2001',
                country: 'Moldova',
            },
        },
        {
            id: 'pm_2',
            type: 'card',
            brand: 'mastercard',
            last_four: '5542',
            is_default: false,
            billing_email: 'cookiekiller.design@gmail.com',
            billing_address: {
                street: 'Veronica Micle str. 15',
                city: 'Chisinau',
                postal_code: '2001',
                country: 'Moldova',
            },
        },
        {
            id: 'pm_3',
            type: 'card',
            brand: 'discover',
            last_four: '2468',
            is_default: false,
            billing_email: 'cookiekiller.design@gmail.com',
            billing_address: {
                street: 'Veronica Micle str. 15',
                city: 'Chisinau',
                postal_code: '2001',
                country: 'Moldova',
            },
        },
        {
            id: 'pm_4',
            type: 'card',
            brand: 'amex',
            last_four: '3282',
            is_default: false,
            billing_email: 'cookiekiller.design@gmail.com',
            billing_address: {
                street: 'Veronica Micle str. 15',
                city: 'Chisinau',
                postal_code: '2001',
                country: 'Moldova',
            },
        },
    ])

    const defaultPaymentMethod = computed(
        () => paymentMethods.value.find((pm) => pm.is_default) || paymentMethods.value[0]
    )

    // Mock billing history - in production, fetch from API
    const billingHistory = computed<Invoice[]>(() => [
        {
            id: '1',
            invoice_number: 'LE-98781246',
            date: '2025-02-12T08:00:00Z',
            subscription_name: 'Buyer Premium',
            status: 'paid',
            total_amount: 99.99,
            currency: '€',
            pdf_url: '/invoices/LE-98781246.pdf',
        },
        {
            id: '2',
            invoice_number: 'LE-98781246',
            date: '2025-02-12T08:00:00Z',
            subscription_name: 'Buyer Premium',
            status: 'paid',
            total_amount: 99.99,
            currency: '€',
            pdf_url: '/invoices/LE-98781246.pdf',
        },
        {
            id: '3',
            invoice_number: 'LE-98781246',
            date: '2025-02-12T08:00:00Z',
            subscription_name: 'Buyer Premium',
            status: 'paid',
            total_amount: 99.99,
            currency: '€',
            pdf_url: '/invoices/LE-98781246.pdf',
        },
        {
            id: '4',
            invoice_number: 'LE-98781246',
            date: '2025-02-12T08:00:00Z',
            subscription_name: 'Buyer Premium',
            status: 'paid',
            total_amount: 99.99,
            currency: '€',
            pdf_url: '/invoices/LE-98781246.pdf',
        },
        {
            id: '5',
            invoice_number: 'LE-98781246',
            date: '2025-02-12T08:00:00Z',
            subscription_name: 'Buyer Premium',
            status: 'paid',
            total_amount: 99.99,
            currency: '€',
            pdf_url: '/invoices/LE-98781246.pdf',
        },
    ])

    // Actions
    const cancelSubscription = async (reason?: string): Promise<boolean> => {
        try {
            isLoading.value = true
            error.value = null

            // TODO: Replace with actual API call
            // const config = useRuntimeConfig()
            // await $fetch(`${config.public.apiBaseURL}/subscription/cancel`, {
            //     method: 'POST',
            //     body: { reason }
            // })

            // Mock API call
            await new Promise((resolve) => setTimeout(resolve, 1000))

            // Refresh user data
            await userStore.fetchUser(true)
            return true
        } catch (err: any) {
            error.value = err.message || 'Failed to cancel subscription'
            return false
        } finally {
            isLoading.value = false
        }
    }

    const upgradeSubscription = async (targetPlanId: number): Promise<boolean> => {
        try {
            isLoading.value = true
            error.value = null

            // TODO: Replace with actual API call
            // const config = useRuntimeConfig()
            // await $fetch(`${config.public.apiBaseURL}/subscription/upgrade`, {
            //     method: 'POST',
            //     body: { target_plan_id: targetPlanId }
            // })

            // Mock API call
            await new Promise((resolve) => setTimeout(resolve, 1000))

            // Refresh user data
            await userStore.fetchUser(true)
            return true
        } catch (err: any) {
            error.value = err.message || 'Failed to upgrade subscription'
            return false
        } finally {
            isLoading.value = false
        }
    }

    const downloadInvoice = async (invoiceId: string): Promise<void> => {
        try {
            // TODO: Replace with actual API call
            // const config = useRuntimeConfig()
            // const blob = await $fetch(`${config.public.apiBaseURL}/invoices/${invoiceId}/download`, {
            //     responseType: 'blob'
            // })
            // Create download link
            console.log('Downloading invoice:', invoiceId)
        } catch (err: any) {
            error.value = err.message || 'Failed to download invoice'
        }
    }

    return {
        // State
        isLoading,
        error,

        // Computed
        currentSubscription,
        currentPlan,
        hasActiveSubscription,
        paymentMethods,
        defaultPaymentMethod,
        billingHistory,

        // Actions
        cancelSubscription,
        upgradeSubscription,
        downloadInvoice,
    }
}
