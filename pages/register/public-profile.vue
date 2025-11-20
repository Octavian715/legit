<template>
    <div class="flex flex-col h-full">
        <div class="flex-1 overflow-y-auto scrollbar-hide">
            <AuthContainer
                class="bg-gray-150 p-4 sm:p-10"
                :full-height="false"
                content-class=""
                class-container="w-full "
            >
                <div v-if="isLoading" class="relative rounded-md animate-pulse">
                    <!-- Cover Image Skeleton -->
                    <div class="w-full h-40 bg-gray-300 rounded-t-md"></div>

                    <!-- Profile Header Skeleton -->
                    <div class="bg-white shadow-sm rounded-b-md">
                        <div class="p-4">
                            <div class="flex flex-col lg:flex-row gap-4">
                                <!-- Left Side: Avatar + Info -->
                                <div
                                    class="flex flex-col lg:flex-row lg:items-start items-center gap-3 flex-1"
                                >
                                    <!-- Avatar Skeleton -->
                                    <div class="relative -mt-36 lg:-mt-16 flex-shrink-0">
                                        <div
                                            class="w-40 h-40 bg-gray-300 border-4 border-white rounded-full"
                                        ></div>
                                    </div>

                                    <!-- Profile Info Skeleton -->
                                    <div class="flex-1 min-w-0 pt-2 w-full">
                                        <div class="flex justify-center lg:justify-start mb-2">
                                            <div class="h-8 bg-gray-300 rounded w-48"></div>
                                        </div>
                                        <div class="flex justify-center lg:justify-start mb-3">
                                            <div class="h-5 bg-gray-300 rounded w-32"></div>
                                        </div>
                                        <div class="flex justify-center lg:justify-start gap-4">
                                            <div class="h-5 bg-gray-300 rounded w-20"></div>
                                            <div class="h-5 bg-gray-300 rounded w-24"></div>
                                            <div class="h-5 bg-gray-300 rounded w-20"></div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Right Side: Buttons Skeleton -->
                                <div class="flex flex-col lg:ml-auto gap-2 w-full lg:w-auto">
                                    <div class="flex flex-col sm:flex-row gap-2">
                                        <div class="h-10 bg-gray-300 rounded flex-1 lg:w-24"></div>
                                        <div class="h-10 bg-gray-300 rounded flex-1 lg:w-24"></div>
                                        <div class="h-10 bg-gray-300 rounded flex-1 lg:w-28"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-if="isLoading" class="bg-gray-300 h-12 my-3 rounded-md animate-pulse"></div>

                <div v-if="isLoading" class="grid grid-cols-1 gap-3 animate-pulse">
                    <div class="flex flex-col bg-white p-3 gap-3 rounded-md">
                        <div class="h-6 bg-gray-300 rounded w-40"></div>
                        <div class="space-y-2">
                            <div class="h-4 bg-gray-300 rounded"></div>
                            <div class="h-4 bg-gray-300 rounded w-3/4"></div>
                        </div>
                        <div class="mt-4">
                            <div class="h-5 bg-gray-300 rounded w-32 mb-2"></div>
                            <div class="flex gap-4">
                                <div class="w-44 h-44 bg-gray-300 rounded"></div>
                                <div class="w-44 h-44 bg-gray-300 rounded"></div>
                                <div class="w-44 h-44 bg-gray-300 rounded"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-if="!isLoading">
                    <!-- Cover Image Section -->
                    <div class="relative rounded-md">
                        <div
                            :class="[
                                'relative w-full h-40 rounded-t-md flex bg-gray-300 items-center justify-center cursor-pointer hover:bg-blue-50 transition-all duration-300',
                                { 'upload-pulse-animation': !headerImage },
                            ]"
                            @dragover.prevent
                            @drop.prevent="handleHeaderDrop"
                            @click="triggerHeaderInput"
                        >
                            <input
                                ref="headerInput"
                                type="file"
                                class="hidden"
                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                @change="handleHeaderUpload"
                            />
                            <div
                                v-if="!headerImage"
                                :class="[
                                    'text-center text-blue-400 transition-transform duration-300',
                                    { 'upload-icon-bounce': !headerImage },
                                ]"
                            >
                                <svg class="mx-auto w-8 h-8 text-blue-400">
                                    <use xlink:href="/sprite.svg#image-add" />
                                </svg>
                                <div class="text-body mt-2">
                                    {{ $t('register.uploadYourHeader') }}<br />
                                    {{ $t('register.headerImageRequirements') }}
                                </div>
                            </div>
                            <img
                                v-if="headerImage"
                                :src="headerImage"
                                class="absolute top-0 left-0 w-full h-full object-cover rounded-t-md"
                            />

                            <ButtonIcon
                                v-if="headerImage"
                                color="white"
                                variant="filled"
                                icon="edit2"
                                size="lg"
                                icon-size="md"
                                container-classes="!text-blue-500 absolute right-1 top-1 rounded-full"
                                @click="triggerHeaderInput"
                            />
                        </div>

                        <!-- Profile Header Section -->
                        <div class="bg-white shadow-sm rounded-b-md">
                            <div class="p-4">
                                <div class="flex flex-col lg:flex-row gap-4">
                                    <!-- Left Side: Avatar + Info -->
                                    <div
                                        class="flex flex-col lg:flex-row lg:items-start items-center gap-3 flex-1"
                                    >
                                        <!-- Avatar with responsive overlap -->
                                        <div class="relative -mt-36 lg:-mt-16 flex-shrink-0">
                                            <div
                                                :class="[
                                                    'avatar w-40 h-40 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-white cursor-pointer hover:bg-blue-50 transition-all duration-300',
                                                    { 'upload-pulse-animation': !logoImage },
                                                ]"
                                                @dragover.prevent
                                                @drop.prevent="handleLogoDrop"
                                                @click="triggerLogoInput"
                                            >
                                                <input
                                                    ref="logoInput"
                                                    type="file"
                                                    class="hidden"
                                                    accept="image/jpeg,image/jpg,image/png,image/webp"
                                                    @change="handleLogoUpload"
                                                />
                                                <svg
                                                    v-if="!logoImage"
                                                    v-tooltip="
                                                        `${$t('register.uploadLogoTooltip')}`
                                                    "
                                                    :class="[
                                                        'w-8 h-8 text-blue-400 transition-transform duration-300',
                                                        { 'upload-icon-bounce': !logoImage },
                                                    ]"
                                                >
                                                    <use xlink:href="/sprite.svg#image-add" />
                                                </svg>
                                                <img
                                                    v-if="logoImage"
                                                    v-tooltip="
                                                        `${$t('register.uploadLogoTooltip')}`
                                                    "
                                                    :src="logoImage"
                                                    class="w-full h-full object-cover rounded-full"
                                                />
                                                <ButtonIcon
                                                    v-if="logoImage"
                                                    color="white"
                                                    variant="filled"
                                                    icon="edit2"
                                                    size="md"
                                                    icon-size="sm"
                                                    container-classes="!text-blue-500 rounded-full absolute right-1 bottom-0 z-10"
                                                    @click.stop="triggerLogoInput"
                                                />
                                            </div>
                                        </div>

                                        <!-- Profile Info -->
                                        <div class="flex-1 min-w-0 pt-2">
                                            <div
                                                class="flex justify-center lg:justify-start items-center gap-2 mb-1"
                                            >
                                                <h2 class="text-title1 font-bold text-gray-950">
                                                    {{ companyName }}
                                                </h2>
                                                <span v-if="isVerified">
                                                    <svg class="w-5 h-5 text-blue-500">
                                                        <use xlink:href="/sprite.svg#verified" />
                                                    </svg>
                                                </span>
                                                <span
                                                    v-if="isTopSeller"
                                                    class="text-caption1 font-semibold bg-purple-400 text-white px-1.5 py-1 rounded"
                                                >
                                                    {{ $t('company.topSeller') }}
                                                </span>
                                            </div>

                                            <p
                                                class="flex justify-center lg:justify-start items-center mb-2 text-gray-800 text-body"
                                            >
                                                @{{ companyUsername }}
                                            </p>

                                            <!-- Stats with responsive layout -->
                                            <div
                                                class="flex items-center gap-3 justify-center lg:justify-start"
                                            >
                                                <div
                                                    class="flex flex-col sm:flex-row items-center gap-1"
                                                >
                                                    <div
                                                        class="text-subtitle3 sm:text-subtitle1 font-bold text-gray-950"
                                                    >
                                                        0
                                                    </div>
                                                    <div
                                                        class="text-subtitle3 sm:text-subtitle1 text-gray-800"
                                                    >
                                                        {{ $t('company.products') }}
                                                    </div>
                                                </div>

                                                <div class="w-px h-5 mx-1 bg-gray-400" />

                                                <div
                                                    class="flex flex-col sm:flex-row items-center gap-1"
                                                >
                                                    <div
                                                        class="text-subtitle3 sm:text-subtitle1 font-bold text-gray-950"
                                                    >
                                                        0
                                                    </div>
                                                    <div
                                                        class="text-subtitle3 sm:text-subtitle1 text-gray-800"
                                                    >
                                                        {{ $t('company.connections') }}
                                                    </div>
                                                </div>

                                                <div class="w-px h-5 mx-1 bg-gray-400" />

                                                <div
                                                    class="flex flex-col sm:flex-row items-center gap-1"
                                                >
                                                    <div
                                                        class="text-subtitle3 sm:text-subtitle1 font-bold text-gray-950"
                                                    >
                                                        0
                                                    </div>
                                                    <div
                                                        class="text-subtitle3 sm:text-subtitle1 text-gray-800"
                                                    >
                                                        {{ $t('company.followers') }}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Right Side: Action Buttons -->
                                    <div
                                        class="flex flex-col lg:ml-auto justify-center lg:justify-end gap-3"
                                    >
                                        <!-- Action Buttons with responsive layout -->
                                        <div
                                            class="flex flex-col gap-2 lg:items-end lg:justify-center"
                                        >
                                            <div class="flex flex-col sm:flex-row gap-2">
                                                <Button
                                                    color="gray"
                                                    variant="filled"
                                                    size="md"
                                                    disabled
                                                    container-classes="flex-1"
                                                    font-weight="normal"
                                                >
                                                    <div class="flex items-center gap-1">
                                                        <svg class="w-4 h-4 flex-shrink-0">
                                                            <use xlink:href="/sprite.svg#message" />
                                                        </svg>
                                                        {{ $t('profile.chat', 'Chat') }}
                                                    </div>
                                                </Button>

                                                <Button
                                                    color="gray"
                                                    variant="filled"
                                                    size="md"
                                                    disabled
                                                    container-classes="flex-1"
                                                    font-weight="normal"
                                                >
                                                    {{ $t('follow') }}
                                                </Button>

                                                <Button
                                                    color="red"
                                                    variant="filled"
                                                    size="md"
                                                    disabled
                                                    container-classes="flex-1 connect-btn"
                                                    font-weight="bold"
                                                >
                                                    <div class="flex items-center gap-1">
                                                        <svg class="w-4 h-4 flex-shrink-0">
                                                            <use
                                                                xlink:href="/sprite.svg#connect-check"
                                                            />
                                                        </svg>
                                                        {{ $t('connect') }}
                                                    </div>
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="py-3">
                        <Tabs2
                            :tabs="profileTabs"
                            :default-active="0"
                            disabled
                            variant="underline"
                            size="md"
                            classes="border-0"
                            header-classes="bg-white rounded-md tabs-profile"
                        >
                            <template #tab-0>
                                <div class="grid grid-cols-1 gap-3">
                                    <div class="flex flex-col gap-3 min-w-0">
                                        <div
                                            class="flex flex-col p-3 gap-3 min-w-0 bg-white rounded-md"
                                        >
                                            <h2 class="text-title2 font-bold text-gray-950 mb-3">
                                                {{ $t('company.companyDescription') }}
                                            </h2>

                                            <p
                                                class="text-body text-gray-950"
                                                v-text="companyDescription"
                                            />
                                        </div>
                                        <div
                                            class="flex flex-col p-3 gap-3 min-w-0 bg-white rounded-md"
                                        >
                                            <label class="text-title2 font-bold text-gray-950 mb-3">
                                                {{ $t('register.galleryImages') }}
                                            </label>

                                            <input
                                                ref="galleryInput"
                                                type="file"
                                                class="hidden"
                                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                                multiple
                                                @change="handleGalleryUpload"
                                            />

                                            <div
                                                class="relative w-full cursor-pointer"
                                                @click="triggerGalleryInput"
                                                @dragover.prevent
                                                @drop.prevent="handleGalleryDrop"
                                            >
                                                <div
                                                    ref="scrollContainer"
                                                    class="flex overflow-x-auto gap-4 scrollbar-hide scroll-smooth p-2"
                                                    style="min-height: 176px"
                                                    @scroll="updateScrollVisibility"
                                                >
                                                    <div
                                                        v-for="(image, index) in form.gallery"
                                                        :key="index"
                                                        class="relative flex-shrink-0 w-44 aspect-square bg-gray-200 rounded"
                                                    >
                                                        <img
                                                            :src="image.preview"
                                                            alt="gallery"
                                                            class="w-full h-full object-cover rounded"
                                                        />

                                                        <button
                                                            v-tooltip="`${$t('removeImageLabel')}`"
                                                            class="absolute -top-1 -right-1 p-1 w-5 h-5 rounded bg-white text-gray-700 hover:text-red-600 active:scale-95 shadow flex items-center justify-center"
                                                            :aria-label="$t('removeImageLabel')"
                                                            @click.stop="removeGalleryImage(index)"
                                                        >
                                                            <svg class="w-4 h-4">
                                                                <use
                                                                    xlink:href="/sprite.svg#close"
                                                                />
                                                            </svg>
                                                        </button>
                                                    </div>

                                                    <div
                                                        :class="[
                                                            'relative flex-shrink-0 w-44 h-auto aspect-square bg-gray-150 rounded flex flex-col items-center justify-center text-gray-400 hover:bg-blue-50 hover:text-blue-500 transition-all duration-300',
                                                            {
                                                                'gallery-upload-pulse':
                                                                    form.gallery.length === 0,
                                                            },
                                                        ]"
                                                    >
                                                        <svg
                                                            :class="[
                                                                'w-9 h-9 transition-transform duration-300',
                                                                {
                                                                    'upload-icon-bounce':
                                                                        form.gallery.length === 0,
                                                                },
                                                            ]"
                                                        >
                                                            <use
                                                                xlink:href="/sprite.svg#image-add"
                                                            />
                                                        </svg>
                                                        <span
                                                            class="text-body mt-2 text-center px-5"
                                                        >
                                                            {{ $t('register.uploadGalleryLabel') }}
                                                        </span>
                                                    </div>
                                                </div>

                                                <Button
                                                    v-if="showScrollLeft"
                                                    color="mix"
                                                    variant="filled"
                                                    size="md"
                                                    square
                                                    container-classes="absolute max-w-8  left-3 top-1/2 -translate-y-1/2 z-10 !p-2"
                                                    @click.stop="scrollLeft"
                                                >
                                                    <svg class="w-5 h-5">
                                                        <use xlink:href="/sprite.svg#arrow2" />
                                                    </svg>
                                                </Button>

                                                <Button
                                                    v-if="showScrollRight"
                                                    color="mix"
                                                    variant="filled"
                                                    size="md"
                                                    container-classes="absolute max-w-8 !p-2 right-3 top-1/2 -translate-y-1/2 z-10 !p-2"
                                                    @click.stop="scrollRight"
                                                >
                                                    <svg class="w-5 h-5 rotate-180">
                                                        <use xlink:href="/sprite.svg#arrow2" />
                                                    </svg>
                                                </Button>
                                            </div>

                                            <p class="text-caption1 text-gray-600 mt-2">
                                                {{ $t('register.galleryImagesHelper') }}
                                            </p>
                                        </div>
                                        <p
                                            v-if="errors.profilePicture"
                                            class="text-caption1 text-red-500"
                                            role="alert"
                                        >
                                            {{ errors.profilePicture }}
                                        </p>
                                        <p
                                            v-if="errors.companyCover"
                                            class="text-caption1 text-red-500"
                                            role="alert"
                                        >
                                            {{ errors.companyCover }}
                                        </p></div
                                    >
                                </div>
                            </template>
                        </Tabs2>
                    </div>
                </div>
            </AuthContainer>
        </div>

        <!-- Sticky Footer with Buttons -->
        <div class="flex-shrink-0 bg-white py-4">
            <div
                v-if="isLoading"
                class="flex justify-center flex-grow mx-auto md:w-1/2 max-w-2xl gap-3 animate-pulse px-4"
            >
                <div class="h-12 bg-gray-300 rounded w-full"></div>
                <div class="h-12 bg-gray-300 rounded w-full"></div>
            </div>

            <div
                v-if="!isLoading"
                class="flex justify-center flex-grow mx-auto md:w-1/2 max-w-2xl gap-3 px-4"
            >
                <Button
                    color="gray"
                    variant="filled"
                    :label="$t('prevStep')"
                    font-weight="normal"
                    class="w-full"
                    size="lg"
                    :loading="isNavigating"
                    :disabled="isNavigating"
                    @click="handlePrevStep"
                />
                <Button
                    color="red"
                    variant="filled"
                    :label="$t('nextStep')"
                    class="w-full"
                    size="lg"
                    font-weight="bold"
                    :loading="isSubmitting"
                    :disabled="!canSubmit"
                    @click="handleSubmit"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, reactive, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
    import { useRegistrationNavigation } from '~/useRegistrationNavigation'
    import { useToastNotification } from '~/composables/useToastNotification'
    import { useStaticData } from '~/composables/useStaticData'

    definePageMeta({ middleware: ['registration'], layout: 'empty' })

    interface ProfileMedia {
        id: number
        type: 'gallery' | 'picture' | 'banner'
        file_path: string
        file_name: string
        file_size: number
        url: string
    }

    interface GalleryImage {
        file?: File
        preview: string
        id?: number
        url?: string
    }

    interface PublicProfileFormData {
        profilePicture: File | string | null
        companyCover: File | string | null
        gallery: GalleryImage[]
    }

    const { t } = useI18n({ useScope: 'global' })
    const localePath = useLocalePath()
    const router = useRouter()
    const toast = useToastNotification()
    const { languages } = useStaticData()

    const {
        formData: storeFormData,
        isLastStep,
        completePublicProfile,
        getStepData,
        updateStepData,
        initializeStep,
        getError,
        clearError,
        isSubmitting,
        store,
        userStore,
    } = useRegistrationNavigation()

    const logoInput = ref<HTMLInputElement | null>(null)
    const headerInput = ref<HTMLInputElement | null>(null)
    const galleryInput = ref<HTMLInputElement | null>(null)
    const scrollContainer = ref<HTMLElement | null>(null)

    const logoImage = ref<string | null>(null)
    const headerImage = ref<string | null>(null)

    const showScrollLeft = ref(false)
    const showScrollRight = ref(false)
    const isLoading = ref(true)
    const isNavigating = ref(false)

    const SCROLL_AMOUNT = 200

    const form = reactive<PublicProfileFormData>({
        profilePicture: null,
        companyCover: null,
        gallery: [],
    })

    const errors = reactive({
        profilePicture: '',
        companyCover: '',
        gallery: '',
    })

    const companyDetails = computed(() => storeFormData.value.companyDetails || {})
    const accountType = computed(() => storeFormData.value.accountType?.type)

    const companyName = computed(() => companyDetails.value?.profile?.legalName || 'Company Name')

    const companyUsername = computed(
        () => companyDetails.value?.profile?.username || 'companyusername'
    )

    const companyDescription = computed(
        () => companyDetails.value?.detailed?.description || t('company.defaultDescription')
    )

    const isVerified = ref(false)
    const isTopSeller = ref(false)

    const profileTabs = [
        { label: t('profile.tabs.companyProfile', 'Company Profile'), count: 0 },
        { label: t('profile.tabs.newsFeed', 'News Feed'), count: 0, active: false },
        { label: t('profile.tabs.brands', 'Brands'), count: 0, active: false },
        { label: t('profile.tabs.products', 'Products'), count: 0, active: false },
        {
            label: t('profile.tabs.exportingLogistics', 'Exporting & Logistics'),
            count: 0,
            active: false,
        },
        { label: t('profile.tabs.certificates', 'Certificates'), count: 0, active: false },
    ]

    const getLanguageNameById = (id: number): string => {
        const language = languages.value.find((lang) => lang.id === id)
        return language?.native_name || language?.name || `Language ${id}`
    }

    const companyData = computed(() => {
        const result = []
        const details = companyDetails.value

        if (details?.detailed?.revenueRangeId) {
            result.push({
                label: t('company.revenue'),
                value: `$${details.detailed.revenueRangeId}M - $${details.detailed.revenueRangeId * 2}M`,
                type: 'revenue',
            })
        }

        if (details?.address) {
            const { streetName, streetNumber, postalCode, cityName } = details.address
            if (streetName || cityName) {
                result.push({
                    label: t('company.locationOfRegistration'),
                    value: `${streetName || ''} ${streetNumber || ''}, ${postalCode || ''}, ${cityName || ''}`.trim(),
                    type: 'text',
                })
            }
        }

        if (details?.contacts?.phones?.length > 0) {
            result.push({
                label: t('company.phoneNumber', details.contacts.phones.length),
                value: details.contacts.phones.map((p: any) => p.phone_number),
                type: 'phone',
            })
        }

        if (details?.contacts?.email) {
            result.push({
                label: t('company.email'),
                value: details.contacts.email,
                type: 'email',
            })
        }

        if (details?.detailed?.spokenLanguages?.length) {
            const languageNames = details.detailed.spokenLanguages.map((langId: number) =>
                getLanguageNameById(langId)
            )
            result.push({
                label: t('company.spokenLanguages', details.detailed.spokenLanguages.length),
                value: languageNames.join(', '),
                type: 'text',
            })
        }

        if (details?.detailed?.employeeCountRangeId) {
            result.push({
                label: t('company.numberOfEmployees'),
                value: `${details.detailed.employeeCountRangeId * 10} - ${details.detailed.employeeCountRangeId * 20}`,
                type: 'text',
            })
        }

        if (details?.detailed?.websiteUrl) {
            result.push({
                label: t('company.website'),
                value: details.detailed.websiteUrl,
                type: 'website',
            })
        }

        return result
    })

    const canSubmit = computed(() => {
        const hasProfilePicture = form.profilePicture !== null
        const hasCompanyCover = form.companyCover !== null

        return (
            hasProfilePicture &&
            hasCompanyCover &&
            !errors.profilePicture &&
            !errors.companyCover &&
            !isSubmitting.value
        )
    })

    const fieldMapping: Record<string, keyof typeof errors> = {
        profile_picture: 'profilePicture',
        company_cover: 'companyCover',
        gallery: 'gallery',
    }

    const mapBackendErrorsToFields = (backendErrors: Record<string, string | string[]>) => {
        Object.entries(backendErrors).forEach(([backendField, messages]) => {
            const message = Array.isArray(messages) ? messages[0] : messages
            const frontendField = fieldMapping[backendField]

            if (frontendField && frontendField in errors) {
                errors[frontendField] = message as string
            }
        })
    }

    const syncStoreErrorsToFields = () => {
        const storeError = getError()

        if (storeError?.response?.status === 422 && storeError.response?.data?.errors) {
            mapBackendErrorsToFields(storeError.response.data.errors)
        } else if (storeError?.response?.status === 413) {
            toast.error(t('error.fileTooLarge', 'File size is too large'), t('error', 'Error'))
        } else if (storeError) {
            const errorMessage =
                storeError.response?.data?.message ||
                storeError.message ||
                t('errors.generalSubmit', 'Upload failed. Please try again.')
            toast.error(errorMessage, t('error', 'Error'))
        }
    }

    const clearFieldError = (field: keyof typeof errors) => {
        if (errors[field]) {
            errors[field] = ''
        }
        clearError()
        updateStepData('publicProfile', { ...form })
    }

    const clearAllErrors = () => {
        Object.keys(errors).forEach((key) => {
            errors[key as keyof typeof errors] = ''
        })
        clearError()
    }

    const loadExistingImagesFromUserStore = async (): Promise<boolean> => {
        try {
            const profileMedia = userStore.user?.profile_media || []

            if (!Array.isArray(profileMedia) || profileMedia.length === 0) {
                return false
            }

            let hasLoadedAny = false

            const pictureMedia = profileMedia.find(
                (media: ProfileMedia) => media.type === 'picture'
            )
            if (pictureMedia?.url) {
                logoImage.value = pictureMedia.url
                form.profilePicture = pictureMedia.url
                hasLoadedAny = true
            }

            const bannerMedia = profileMedia.find((media: ProfileMedia) => media.type === 'banner')
            if (bannerMedia?.url) {
                headerImage.value = bannerMedia.url
                form.companyCover = bannerMedia.url
                hasLoadedAny = true
            }

            const galleryMedia = profileMedia.filter(
                (media: ProfileMedia) => media.type === 'gallery'
            )
            if (galleryMedia.length > 0) {
                form.gallery = galleryMedia.map((media: ProfileMedia) => ({
                    preview: media.url,
                    id: media.id,
                    url: media.url,
                }))
                hasLoadedAny = true
            }

            if (hasLoadedAny) {
                updateStepData('publicProfile', { ...form })
            }

            return hasLoadedAny
        } catch (error) {
            return false
        }
    }

    const loadSavedStepData = (): boolean => {
        try {
            const savedData = getStepData('publicProfile') as PublicProfileFormData

            if (!savedData) {
                return false
            }

            let hasLoadedAny = false

            if (savedData.profilePicture) {
                form.profilePicture = savedData.profilePicture
                if (typeof savedData.profilePicture === 'string') {
                    logoImage.value = savedData.profilePicture
                    hasLoadedAny = true
                } else if (savedData.profilePicture instanceof File) {
                    const reader = new FileReader()
                    reader.onload = (e) => {
                        logoImage.value = e.target?.result as string
                    }
                    reader.readAsDataURL(savedData.profilePicture)
                    hasLoadedAny = true
                }
            }

            if (savedData.companyCover) {
                form.companyCover = savedData.companyCover
                if (typeof savedData.companyCover === 'string') {
                    headerImage.value = savedData.companyCover
                    hasLoadedAny = true
                } else if (savedData.companyCover instanceof File) {
                    const reader = new FileReader()
                    reader.onload = (e) => {
                        headerImage.value = e.target?.result as string
                    }
                    reader.readAsDataURL(savedData.companyCover)
                    hasLoadedAny = true
                }
            }

            if (savedData.gallery?.length) {
                form.gallery = [...savedData.gallery]
                hasLoadedAny = true
            }

            return hasLoadedAny
        } catch (error) {
            return false
        }
    }

    const initializeImageData = async () => {
        let hasLoadedImages = false

        hasLoadedImages = await loadExistingImagesFromUserStore()

        if (!hasLoadedImages) {
            hasLoadedImages = loadSavedStepData()
        }

        return hasLoadedImages
    }

    const triggerLogoInput = () => {
        logoInput.value?.click()
    }

    const triggerHeaderInput = () => {
        headerInput.value?.click()
    }

    const triggerGalleryInput = () => {
        galleryInput.value?.click()
    }

    const validateImageFile = (file: File): boolean => {
        const maxSize = 5 * 1024 * 1024
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

        if (!allowedTypes.includes(file.type)) {
            toast.error(
                t('errors.invalidImageType', 'Please upload JPG, PNG or WebP images only'),
                t('error', 'Error')
            )
            return false
        }

        if (file.size > maxSize) {
            toast.error(
                t('errors.imageTooLarge', 'Image must be less than 5MB'),
                t('error', 'Error')
            )
            return false
        }

        return true
    }

    const handleLogoUpload = (e: Event) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (file && validateImageFile(file)) {
            form.profilePicture = file
            readImage(file, (src) => (logoImage.value = src))
            clearFieldError('profilePicture')
        }
    }

    const handleHeaderUpload = (e: Event) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (file && validateImageFile(file)) {
            form.companyCover = file
            readImage(file, (src) => (headerImage.value = src))
            clearFieldError('companyCover')
        }
    }

    const handleLogoDrop = (e: DragEvent) => {
        const file = e.dataTransfer?.files?.[0]
        if (file && validateImageFile(file)) {
            form.profilePicture = file
            readImage(file, (src) => (logoImage.value = src))
            clearFieldError('profilePicture')
        }
    }

    const handleHeaderDrop = (e: DragEvent) => {
        const file = e.dataTransfer?.files?.[0]
        if (file && validateImageFile(file)) {
            form.companyCover = file
            readImage(file, (src) => (headerImage.value = src))
            clearFieldError('companyCover')
        }
    }

    const handleGalleryUpload = (e: Event) => {
        const files = (e.target as HTMLInputElement).files
        if (files) addGalleryImages(Array.from(files))
    }

    const handleGalleryDrop = (e: DragEvent) => {
        const files = e.dataTransfer?.files
        if (files) addGalleryImages(Array.from(files))
    }

    const readImage = (file: File, callback: (src: string) => void) => {
        const reader = new FileReader()
        reader.onload = (e) => callback(e.target?.result as string)
        reader.readAsDataURL(file)
    }

    const removeGalleryImage = (index: number) => {
        form.gallery = form.gallery.filter((_, i) => i !== index)
        nextTick(updateScrollVisibility)
    }

    const updateScrollVisibility = () => {
        const el = scrollContainer.value
        if (!el) return

        showScrollLeft.value = el.scrollLeft > 10
        showScrollRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 10
    }

    const scrollLeft = () => {
        if (!scrollContainer.value) return
        scrollContainer.value.scrollBy({ left: -SCROLL_AMOUNT, behavior: 'smooth' })
    }

    const scrollRight = () => {
        if (!scrollContainer.value) return
        scrollContainer.value.scrollBy({ left: SCROLL_AMOUNT, behavior: 'smooth' })
    }

    const scrollToLastImage = () => {
        const el = scrollContainer.value
        if (!el) return
        el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' })
    }

    const addGalleryImages = (files: File[]) => {
        const validFiles = files.filter(validateImageFile)

        const promises = validFiles.map((file) => {
            return new Promise<GalleryImage>((resolve) => {
                const reader = new FileReader()
                reader.onload = (e) => {
                    const result = e.target?.result
                    if (typeof result === 'string') {
                        resolve({ file, preview: result })
                    }
                }
                reader.readAsDataURL(file)
            })
        })

        Promise.all(promises).then((results) => {
            form.gallery = [...form.gallery, ...results]
            updateScrollVisibility()
            nextTick(scrollToLastImage)
        })
    }

    const validateForm = (): boolean => {
        clearAllErrors()

        if (!form.profilePicture) {
            errors.profilePicture = t(
                'errors.profilePictureRequired',
                'Profile picture is required'
            )
        }

        if (!form.companyCover) {
            errors.companyCover = t('errors.companyCoverRequired', 'Company cover is required')
        }

        return !errors.profilePicture && !errors.companyCover
    }

    const handlePrevStep = async () => {
        isNavigating.value = true
        try {
            await router.push(localePath('/register/business-certificates'))
        } finally {
            isNavigating.value = false
        }
    }

    const handleSubmit = async () => {
        clearAllErrors()

        if (!validateForm()) {
            return
        }

        try {
            const profileData = {
                picture: form.profilePicture instanceof File ? [{ file: form.profilePicture }] : [],
                banner: form.companyCover instanceof File ? [{ file: form.companyCover }] : [],
                gallery: form.gallery.filter((img) => img.file).map((img) => ({ file: img.file! })),
            }

            const result = await completePublicProfile(1, profileData)

            if (result.success) {
                toast.success(
                    t('register.profileImagesUploaded', 'Profile images uploaded successfully!'),
                    t('success', 'Success')
                )

                await router.push(localePath('/register/subscription'))
            }
        } catch (error) {
            toast.error(
                t('errors.generalSubmit', 'Upload failed. Please try again later.'),
                t('error', 'Error')
            )
        }
    }

    watch(
        () => getError(),
        (newError) => {
            if (newError) {
                syncStoreErrorsToFields()
            }
        },
        { immediate: true }
    )

    watch(
        () => ({ ...form }),
        (newForm) => {
            updateStepData('publicProfile', newForm)
        },
        { deep: true }
    )

    onMounted(async () => {
        initializeStep('publicProfile')

        await initializeImageData()
        syncStoreErrorsToFields()

        setTimeout(() => {
            isLoading.value = false
        }, 800)

        nextTick(() => {
            updateScrollVisibility()
        })
    })

    onBeforeUnmount(() => {
        window.removeEventListener('resize', updateScrollVisibility)
    })
</script>

<style scoped lang="scss">
    .avatar {
        filter: drop-shadow(0px 0px 1.88px rgba(90, 93, 101, 0.14))
            drop-shadow(0px 1.88px 1.88px rgba(90, 93, 101, 0.12));
    }

    .connect-btn {
        box-shadow: 0px 4px 4px 0px rgba(0, 0, 0, 0.25);
    }

    .scrollbar-hide::-webkit-scrollbar {
        display: none;
    }

    .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }

    @keyframes subtle-pulse {
        0%,
        100% {
            box-shadow: 0 0 0 0 #0057ff;
        }
        50% {
            box-shadow: 0 0 0 8px rgba(59, 130, 246, 0);
        }
    }

    @keyframes icon-bounce {
        0%,
        100% {
            transform: translateY(0) scale(1);
        }
        50% {
            transform: translateY(-2px) scale(1.05);
        }
    }

    .upload-pulse-animation {
        animation: subtle-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    .upload-icon-bounce {
        animation: icon-bounce 1.5s ease-in-out infinite;
    }

    .gallery-upload-pulse {
        animation: subtle-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
</style>
