<template>
    <div class="space-y-6 bg-white p-6 pt-9">
        <!-- Document Type Cards Grid -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <button
                v-for="docType in documentTypes"
                :key="docType.value"
                type="button"
                class="shadow relative p-3 text-center border rounded-sm transition-all"
                :class="[
                    internalSelectedType === docType.value
                        ? ' border-blue-500 bg-blue-50 text-blue-500'
                        : 'border-transparent hover:border-gray-400',
                    loading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
                ]"
                :disabled="loading"
                :aria-label="t(docType.labelKey)"
                :aria-pressed="internalSelectedType === docType.value"
                @click="handleSelect(docType.value)"
            >
                <div class="flex flex-col items-center space-y-3">
                    <!-- Icon -->
                    <div
                        class="flex items-center justify-center w-16 h-16 rounded transition-colors"
                        :class="[
                            internalSelectedType === docType.value
                                ? ' text-blue-500'
                                : ' text-gray-600',
                        ]"
                    >
                        <svg
                            v-if="docType.icon === 'handshake'"
                            xmlns="http://www.w3.org/2000/svg"
                            width="61"
                            height="60"
                            viewBox="0 0 61 60"
                            fill="none"
                        >
                            <path
                                d="M57.2891 28.5467L51.5 31.4295L44 17.0857L49.8594 14.1561C50.2948 13.9341 50.8004 13.8933 51.2658 14.0426C51.7312 14.1919 52.1187 14.5191 52.3438 14.9529L58.1094 25.992C58.2263 26.213 58.2978 26.4551 58.3198 26.7041C58.3418 26.9532 58.3137 27.2041 58.2373 27.4421C58.1608 27.6801 58.0376 27.9005 57.8747 28.0902C57.7119 28.2799 57.5128 28.4351 57.2891 28.5467Z"
                                stroke="currentColor"
                                stroke-width="2.5"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                            <path
                                d="M10.2496 31.1952L4.46054 28.2889C4.23764 28.1797 4.03898 28.0267 3.87637 27.8392C3.71377 27.6516 3.59054 27.4333 3.51401 27.1971C3.43749 26.961 3.40922 26.7119 3.4309 26.4646C3.45259 26.2173 3.52377 25.9769 3.64023 25.7577L9.40585 14.7186C9.6314 14.2851 10.0173 13.9568 10.4813 13.8035C10.9454 13.6503 11.4509 13.6843 11.8902 13.8983L17.7496 16.828L10.2496 31.1952Z"
                                stroke="currentColor"
                                stroke-width="2.5"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                            <path
                                d="M51.5 31.4297L47.75 35.8359L39.125 44.4609C38.8899 44.6808 38.6051 44.8403 38.2949 44.9261C37.9847 45.0118 37.6583 45.0211 37.3438 44.9531L23.75 41.5547C23.5017 41.4855 23.2703 41.3658 23.0703 41.2031L10.25 31.1953"
                                stroke="currentColor"
                                stroke-width="2.5"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                            <path
                                d="M47.7495 35.8359L37.437 28.3359L34.437 30.5859C33.1372 31.556 31.5588 32.0801 29.937 32.0801C28.3151 32.0801 26.7367 31.556 25.437 30.5859L24.1714 29.625C23.9573 29.4623 23.7803 29.256 23.652 29.0197C23.5237 28.7835 23.447 28.5227 23.4271 28.2546C23.4072 27.9864 23.4444 27.7172 23.5363 27.4645C23.6283 27.2119 23.7728 26.9817 23.9604 26.7891L33.1479 17.625C33.3205 17.4533 33.5253 17.3173 33.7505 17.2248C33.9757 17.1323 34.2169 17.0851 34.4604 17.0859H43.9995"
                                stroke="currentColor"
                                stroke-width="2.5"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                            <path
                                d="M17.8906 16.828L29.9141 13.3124C30.3413 13.1899 30.7981 13.2231 31.2031 13.4061L39.3125 17.0858"
                                stroke="currentColor"
                                stroke-width="2.5"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                            <path
                                d="M27.125 49.8984L20.0703 48.1172C19.7828 48.0522 19.5166 47.9151 19.2969 47.7188L14 43.125"
                                stroke="currentColor"
                                stroke-width="2.5"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                        </svg>

                        <svg
                            v-else-if="docType.icon === 'truck'"
                            xmlns="http://www.w3.org/2000/svg"
                            width="61"
                            height="60"
                            viewBox="0 0 61 60"
                            fill="none"
                        >
                            <path
                                d="M41.875 18.75H51.8594C52.2329 18.7476 52.5985 18.8582 52.908 19.0674C53.2176 19.2765 53.4566 19.5744 53.5938 19.9219L56.875 28.125"
                                stroke="currentColor"
                                stroke-width="2.5"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                            <path
                                d="M4.375 33.75H41.875"
                                stroke="currentColor"
                                stroke-width="2.5"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                            <path
                                d="M44.6875 50.625C47.7941 50.625 50.3125 48.1066 50.3125 45C50.3125 41.8934 47.7941 39.375 44.6875 39.375C41.5809 39.375 39.0625 41.8934 39.0625 45C39.0625 48.1066 41.5809 50.625 44.6875 50.625Z"
                                stroke="currentColor"
                                stroke-width="2.5"
                                stroke-miterlimit="10"
                            />
                            <path
                                d="M16.5625 50.625C19.6691 50.625 22.1875 48.1066 22.1875 45C22.1875 41.8934 19.6691 39.375 16.5625 39.375C13.4559 39.375 10.9375 41.8934 10.9375 45C10.9375 48.1066 13.4559 50.625 16.5625 50.625Z"
                                stroke="currentColor"
                                stroke-width="2.5"
                                stroke-miterlimit="10"
                            />
                            <path
                                d="M39.0625 45H22.1875"
                                stroke="currentColor"
                                stroke-width="2.5"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                            <path
                                d="M10.9375 45H6.25C5.75272 45 5.27581 44.8025 4.92417 44.4508C4.57254 44.0992 4.375 43.6223 4.375 43.125V16.875C4.375 16.3777 4.57254 15.9008 4.92417 15.5492C5.27581 15.1975 5.75272 15 6.25 15H41.875V40.125"
                                stroke="currentColor"
                                stroke-width="2.5"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                            <path
                                d="M41.875 28.125H56.875V43.125C56.875 43.6223 56.6775 44.0992 56.3258 44.4508C55.9742 44.8025 55.4973 45 55 45H50.3125"
                                stroke="currentColor"
                                stroke-width="2.5"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                        </svg>
                        <svg
                            v-else-if="docType.icon === 'file-text'"
                            xmlns="http://www.w3.org/2000/svg"
                            width="61"
                            height="60"
                            viewBox="0 0 61 60"
                            fill="none"
                        >
                            <path
                                d="M22.875 22.5H37.875"
                                stroke="currentColor"
                                stroke-width="2.5"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                            <path
                                d="M22.875 30H37.875"
                                stroke="currentColor"
                                stroke-width="2.5"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                            <path
                                d="M22.875 37.5H30.375"
                                stroke="currentColor"
                                stroke-width="2.5"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                            <path
                                d="M37.1016 50.625H11.625C11.1277 50.625 10.6508 50.4275 10.2992 50.0758C9.94754 49.7242 9.75 49.2473 9.75 48.75V11.25C9.75 10.7527 9.94754 10.2758 10.2992 9.92418C10.6508 9.57254 11.1277 9.375 11.625 9.375H49.125C49.6223 9.375 50.0992 9.57254 50.4508 9.92418C50.8025 10.2758 51 10.7527 51 11.25V36.7266C51.0009 36.97 50.9537 37.2113 50.8612 37.4365C50.7687 37.6617 50.6327 37.8665 50.4609 38.0391L38.4141 50.0859C38.2415 50.2577 38.0367 50.3937 37.8115 50.4862C37.5863 50.5787 37.345 50.6259 37.1016 50.625Z"
                                stroke="currentColor"
                                stroke-width="2.5"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                            <path
                                d="M50.8359 37.5H37.875V50.4609"
                                stroke="currentColor"
                                stroke-width="2.5"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                        </svg>

                        <svg
                            v-else-if="docType.icon === 'edit'"
                            xmlns="http://www.w3.org/2000/svg"
                            width="61"
                            height="60"
                            viewBox="0 0 61 60"
                            fill="none"
                        >
                            <path
                                d="M36.8516 50.625H11.375C10.8777 50.625 10.4008 50.4275 10.0492 50.0758C9.69754 49.7242 9.5 49.2473 9.5 48.75V11.25C9.5 10.7527 9.69754 10.2758 10.0492 9.92418C10.4008 9.57254 10.8777 9.375 11.375 9.375H48.875C49.3723 9.375 49.8492 9.57254 50.2008 9.92418C50.5525 10.2758 50.75 10.7527 50.75 11.25V36.7266C50.7509 36.97 50.7037 37.2113 50.6112 37.4365C50.5187 37.6617 50.3827 37.8665 50.2109 38.0391L38.1641 50.0859C37.9915 50.2577 37.7867 50.3937 37.5615 50.4862C37.3363 50.5787 37.095 50.6259 36.8516 50.625Z"
                                stroke="currentColor"
                                stroke-width="2.5"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                            <path
                                d="M50.5859 37.5H37.625V50.4609"
                                stroke="currentColor"
                                stroke-width="2.5"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                            <path
                                d="M24.25 40H18.25V34L36.25 16L42.25 22L24.25 40Z"
                                stroke="currentColor"
                                stroke-width="2.5"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                            <path
                                d="M31.75 20.5L37.75 26.5"
                                stroke="currentColor"
                                stroke-width="2.5"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                        </svg>
                    </div>

                    <!-- Radio & Label -->
                    <div class="flex flex-col items-center space-y-2">
                        <div class="flex items-center gap-2">
                            <input
                                :id="`doc-type-${docType.value}`"
                                type="radio"
                                :name="'document-type'"
                                :checked="internalSelectedType === docType.value"
                                :disabled="loading"
                                class="w-4 h-4 text-blue-600 border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <label
                                :for="`doc-type-${docType.value}`"
                                class="text-subtitle2 text-gray-950"
                            >
                                {{ t(docType.labelKey) }}
                            </label>
                        </div>
                        <p class="text-subtitle3 text-gray-800">
                            {{ t(docType.descriptionKey) }}
                        </p>
                    </div>
                </div>
            </button>
        </div>

        <!-- Continue Button -->
        <div class="flex justify-center pt-4">
            <Button
                :label="loading ? t('orders.processing') : t('orders.continue')"
                size="lg"
                color="red"
                variant="filled"
                :disabled="!internalSelectedType || loading"
                :loading="loading"
                @click="handleContinue"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
    import type { DocumentType } from '~/types/documents'

    interface Props {
        selectedType?: DocumentType | null
        loading?: boolean
    }

    const props = withDefaults(defineProps<Props>(), {
        selectedType: null,
        loading: false,
    })

    const emit = defineEmits<{
        select: [type: DocumentType]
    }>()

    const { t } = useI18n()
    const { documentTypes } = useDocumentTypes()

    const internalSelectedType = ref<DocumentType | null>(props.selectedType)

    watch(
        () => props.selectedType,
        (newVal) => {
            internalSelectedType.value = newVal
        }
    )

    const handleSelect = (type: DocumentType) => {
        if (props.loading) return
        internalSelectedType.value = type
    }

    const handleContinue = () => {
        if (internalSelectedType.value && !props.loading) {
            emit('select', internalSelectedType.value)
        }
    }
</script>

<style>
    .shadow {
        box-shadow:
            0 4px 5px 0 rgba(90, 93, 101, 0.12),
            0 2px 4px 0 rgba(90, 93, 101, 0.14);
    }
</style>
>
