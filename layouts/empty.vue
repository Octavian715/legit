<!-- layouts/auth.vue -->
<template>
    <div class="flex flex-col w-full h-screen bg-white container mx-auto max-w-5xl py-16">
        <header class="flex justify-between items-center pt-6 flex-shrink-0 mb-4">
            <ButtonIcon
                v-tooltip="t('auth.back')"
                :aria-labelledby="'back'"
                icon="a_left"
                size="lg"
                icon-size="lg"
                color="black"
                variant="ghost"
                @click="router.go(-1)"
            />
            <div v-if="route.path.includes('/public-profile')" class="text-center">
                <h2 class="text-subtitle1 font-bold text-gray-950">
                    {{ $t('register.completeYourCompanyProfile') }}
                </h2>
                <p class="text-body text-gray-600 mt-1">
                    {{ userStore.isSupplier ? $t('register.asSupplier') : $t('register.asBuyer') }}
                </p>
            </div>
            <div v-if="route.path.includes('/subscription')" class="text-center">
                <h2 class="text-title1 font-bold text-gray-950">
                    {{ $t('chooseYourPlan') }}
                </h2>
                <p class="text-subtitle2 text-gray-800 mt-1">
                    {{
                        `${t('register.asUser', { user: isSupplier ? t('supplier') : t('buyer') })} ` +
                        `${t('planSubtitle')}`
                    }}
                </p>
            </div>

            <ButtonClose
                v-tooltip="t('close')"
                :aria-labelledby="'close'"
                size="lg"
                icon-size="lg"
                @click="handleClose"
            />
        </header>

        <main class="flex-1 min-h-0">
            <NuxtPage />
        </main>

        <!-- Exit Confirmation Modal -->
        <ExitConfirmationModal
            v-model:is-open="showExitModal"
            :modal-title="modalConfiguration.title"
            :modal-message="modalConfiguration.message"
            :ok-text="modalConfiguration.okText"
            @update:is-open="showExitModal = $event"
            @confirm="handleModalConfirm"
            @cancel="handleExitCancel"
        />
    </div>
</template>

<script setup lang="ts">
    import { useRoute, useRouter } from 'vue-router'
    import { useUserStore } from '@/stores/user'
    import { useLocalePath } from '#imports'

    const route = useRoute()
    const router = useRouter()
    const userStore = useUserStore()
    const { t } = useI18n()
    const localePath = useLocalePath()
    const { isSupplier } = storeToRefs(userStore)

    const showExitModal = ref(false)

    const handleClose = () => {
        showExitModal.value = true
    }
    const modalConfiguration = computed(() => {
        return {
            title: t('modal.exitRegistration.title', 'Exit Registration?'),
            message: t(
                'modal.exitRegistration.messagePhase2',
                'You can continue your registration later. Your progress will be saved.'
            ),
            okText: t('auth.logout', 'Logout'),
            isLogout: true,
        }
    })

    const handleModalConfirm = async () => {
        try {
            showExitModal.value = false

            await userStore.logout()

            await router.push(localePath('/login'))
        } catch (error) {
            console.error('[Layout] Logout error:', error)
            if (process.client) {
                window.location.href = '/login'
            }
        }
    }

    const handleExitCancel = () => {
        if (showExitModal.value) {
            showExitModal.value = false
        }
    }

    watch(
        () => route.path,
        async () => {
            if (process.client) {
                await nextTick()
                window.scrollTo({ top: 0, left: 0 })
            }
        },
        { flush: 'post' }
    )
</script>

<style scoped></style>
