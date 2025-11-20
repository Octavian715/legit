<template>
    <div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-0 px-14 py-6">
            <div
                v-for="option in partnerTypes"
                :key="option.id"
                class="relative flex flex-col justify-start items-center p-4 cursor-pointer overflow-hidden transition-all duration-300 ease-in-out hover:bg-white hover:rounded-sm hover:shadow-account group"
                :class="{
                    'bg-white rounded-sm shadow-account': selectedType === option.type,
                }"
                @click="selectType(option.type)"
            >
                <!-- Image Container with Enhanced Fallback -->
                <div class="relative mb-2.5">
                    <!-- <NuxtImg
                        v-if="!imageLoadErrors.includes(option.type)"
                        :src="getImgPath(option.type, selectedType === option.type)"
                        width="140"
                        height="140"
                        :alt="option.label"
                        class="max-w-[100px] sm:max-w-[140px] transition-transform duration-200 group-hover:scale-105"
                        @error="handleImageError($event, option.type)"
                        @load="handleImageLoad($event, option.type)"
                    /> -->
                    <img
                        v-if="!imageLoadErrors.includes(option.type)"
                        :src="getImgPath(option.type, selectedType === option.type)"
                        width="140px"
                        height="140px"
                        :alt="option.label"
                        class="max-w-[100px] sm:max-w-[140px] transition-transform duration-200 group-hover:scale-105"
                        @error="handleImageError($event, option.type)"
                        @load="handleImageLoad($event, option.type)"
                    />

                    <!-- Enhanced Fallback with Role-Specific Icons -->
                    <div
                        v-if="imageLoadErrors.includes(option.type)"
                        class="max-w-[100px] sm:max-w-[140px] w-[100px] sm:w-[140px] h-[100px] sm:h-[140px] flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-300 transition-all duration-200 group-hover:border-red-300 group-hover:bg-gradient-to-br group-hover:from-red-50 group-hover:to-red-100"
                        :class="{
                            'bg-white': selectedType === option.type,
                        }"
                    >
                        <svg
                            class="w-12 h-12 sm:w-16 sm:h-16 transition-colors duration-200"
                            :class="{
                                'text-red-500': selectedType === option.type,
                                'text-gray-400 group-hover:text-red-400':
                                    selectedType !== option.type,
                            }"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                :d="getIconPath(option.type)"
                            />
                        </svg>
                    </div>
                </div>

                <!-- Radio Button with Enhanced Styling -->
                <Radiobox
                    name="partnerType"
                    :model-value="selectedType"
                    :value="option.type"
                    :label="option.label"
                    class="mb-2"
                    @update:model-value="selectType"
                >
                    <span class="text-subtitle1 font-medium">
                        {{ option.label }}
                    </span>
                </Radiobox>

                <!-- Description with Better Typography -->
                <p class="text-subtitle3 text-gray-700 text-center p-1">
                    {{ option.description }}
                </p>

                <!-- Hover Effect Overlay -->
                <div class="absolute inset-0 pointer-events-none"></div>
            </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex pt-5 border-t border-gray-400">
            <Button
                type="button"
                variant="filled"
                color="red"
                size="lg"
                container-classes="mx-auto"
                :disabled="!selectedType"
                @click="handleContinue"
            >
                {{ t('continue') }}
            </Button>
        </div>
    </div>
</template>
<script setup lang="ts">
    import { ref, computed, onMounted, nextTick } from 'vue'
    import { useModalStore } from '~/stores/modal'

    type PartnerType = 'supplier' | 'buyer' | 'serviceProvider'
    interface AccountTypeOption {
        id: number
        type: PartnerType
        label: string
        description: string
    }

    const { t } = useI18n()
    const modalStore = useModalStore()

    const selectedType = ref<string>('supplier')
    const imageLoadErrors = ref<string[]>([])

    // Account Type Options Configuration
    const partnerTypes = computed<AccountTypeOption[]>(() => [
        {
            id: 1,
            type: 'supplier',
            label: t('register.asUser', { user: t('supplier') }, 'As a supplier'),
            description: t(
                'register.supplierAccountDescription',
                {},
                'For manufacturers and suppliers'
            ),
        },
        {
            id: 2,
            type: 'buyer',
            label: t('register.asUser', { user: t('buyer') }, 'As a buyer'),
            description: t(
                'register.buyerAccountDescription',
                {},
                'For retailers, restaurants, cafes and hotels'
            ),
        },
    ])
    const selectType = (type: string) => {
        selectedType.value = type
    }
    const handleContinue = () => {
        if (selectedType.value) {
            // Close current modal and open the form modal with selected type
            const InvitePartnerFormModal = defineAsyncComponent(
                () => import('~/components/shared/modals/InvitePartnerFormModal.vue')
            )

            modalStore.openModal(
                InvitePartnerFormModal,
                'invite-partner-form',
                { partnerType: selectedType.value },
                {
                    title: t('navigation.invitePartener'),
                    hideFooter: true,
                    contentWidth: 'max-w-sm sm:max-w-lg',
                    onClose: () => modalStore.closeModal(),
                }
            )
        }
    }

    const getImgPath = (imageName: string, isActive: boolean): string => {
        const suffix = isActive ? '-active' : ''
        return `/images/register/${imageName}${suffix}.webp`
    }

    const handleImageError = (event: Event, type: string) => {
        if (!imageLoadErrors.value.includes(type)) {
            imageLoadErrors.value.push(type)
        }
    }

    const handleImageLoad = (event: Event, type: string) => {
        const index = imageLoadErrors.value.indexOf(type)
        if (index > -1) {
            imageLoadErrors.value.splice(index, 1)
        }
    }

    // SVG icon paths for fallback icons
    const getIconPath = (type: PartnerType): string => {
        const iconPaths: Record<PartnerType, string> = {
            supplier: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4m0-10v10',
            buyer: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z',
            serviceProvider:
                'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 0h4m-4 0H8m8 0a2 2 0 012 2v6a2 2 0 01-2 2H10a2 2 0 01-2-2V6a2 2 0 012-2',
        }
        return iconPaths[type] || iconPaths.buyer
    }

    onMounted(() => {
        nextTick(() => {
            const firstCard = document.querySelector('[role="button"]') as HTMLElement
            if (firstCard) {
                firstCard.focus()
            }
        })
    })
</script>
<style scoped>
    .shadow-account {
        box-shadow:
            0 4px 5px 0 rgba(90, 93, 101, 0.12),
            0 2px 4px 0 rgba(90, 93, 101, 0.14);
    }
</style>
