<template>
    <div
        class="w-full max-w-7xl bg-gray-200 rounded-lg overflow-hidden scrollbar-hide max-h-[85vh] overflow-y-auto shadow-2xl p-6 relative"
    >
        <!-- Close Button -->
        <ButtonClose class="fixed top-4 right-4 z-50" @click="$emit('cancel')" />

        <!-- Cover Image Section - EXACT from _profileId_.vue -->
        <div
            class="relative w-full rounded-t-md h-40 bg-gradient-to-br from-blue-600 via-purple-600 to-red-600 overflow-hidden"
        >
            <div class="absolute inset-0 opacity-20">
                <div
                    class="absolute inset-0"
                    style="
                        background-image: url('data:image/svg+xml,<svg width=&quot;60&quot; height=&quot;60&quot; viewBox=&quot;0 0 60 60&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;><g fill=&quot;none&quot; fill-rule=&quot;evenodd&quot;><g fill=&quot;%23ffffff&quot; fill-opacity=&quot;0.1&quot;><circle cx=&quot;30&quot; cy=&quot;30&quot; r=&quot;2&quot;/></g></g></svg>');
                    "
                ></div>
            </div>

            <div class="absolute inset-0 bg-white bg-opacity-10"></div>

            <img
                v-if="headerImage"
                :src="headerImage"
                :alt="`${companyName} cover`"
                class="w-full h-full object-cover"
            />
        </div>

        <!-- Profile Header - EXACT from _profileId_.vue -->
        <div class="bg-white shadow-sm mb-2">
            <div class="p-4">
                <div class="flex flex-col lg:flex-row gap-4">
                    <!-- Left Side: Avatar + Info -->
                    <div class="flex flex-col lg:flex-row lg:items-start items-center gap-3 flex-1">
                        <!-- Avatar with overlap -->
                        <div class="relative -mt-36 lg:-mt-16 flex-shrink-0">
                            <div
                                class="w-40 h-40 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-white overflow-hidden"
                            >
                                <img
                                    v-if="logoImage"
                                    :src="logoImage"
                                    :alt="companyName"
                                    class="w-full h-full object-cover"
                                />
                                <span v-else class="text-red-600 font-bold text-3xl">
                                    {{ getInitials(companyName) }}
                                </span>
                            </div>
                        </div>

                        <!-- Profile Info -->
                        <div class="flex-1 min-w-0 pt-2">
                            <div
                                class="flex justify-center lg:justify-start items-center gap-2 mb-1"
                            >
                                <h1 class="text-title1 font-bold text-gray-950">
                                    {{ companyName }}
                                </h1>
                                <svg v-if="true" class="w-4 h-4 text-blue-500">
                                    <use xlink:href="/sprite.svg#verified" />
                                </svg>
                            </div>

                            <p
                                class="flex justify-center lg:justify-start items-center mb-2 text-gray-800 text-body"
                            >
                                @{{ username }}
                            </p>

                            <div class="flex items-center gap-3">
                                <div class="flex flex-col sm:flex-row items-center gap-1">
                                    <div
                                        class="text-subtitle3 sm:text-subtitle1 font-bold text-gray-950"
                                    >
                                        {{ productsCount }}
                                    </div>
                                    <div class="text-subtitle3 sm:text-subtitle1 text-gray-800">
                                        {{ $t('profile.tabs.products', 'Products') }}
                                    </div>
                                </div>

                                <div class="w-px h-5 mx-1 bg-gray-400" />

                                <div class="flex flex-col sm:flex-row items-center gap-1">
                                    <div
                                        class="text-subtitle3 sm:text-subtitle1 font-bold text-gray-950"
                                    >
                                        {{ connectionsCount }}
                                    </div>
                                    <div class="text-subtitle3 sm:text-subtitle1 text-gray-800">
                                        {{ $t('profile.connections', 'connections') }}
                                    </div>
                                </div>

                                <div class="w-px h-5 mx-1 bg-gray-400" />

                                <div class="flex flex-col sm:flex-row items-center gap-1">
                                    <div
                                        class="text-subtitle3 sm:text-subtitle1 font-bold text-gray-950"
                                    >
                                        {{ followersCount }}
                                    </div>
                                    <div class="text-subtitle3 sm:text-subtitle1 text-gray-800">
                                        {{ $t('profile.followers', 'Followers') }}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Right Side: Rating + Buttons -->
                    <div class="flex flex-col lg:ml-auto justify-center lg:justify-end gap-3">
                        <!-- Rating -->
                        <!-- <div
                            class="flex flex-col justify-center lg:justify-end gap-2 mb-2 lg:ml-auto select-none lg:w-fit"
                        >
                            <div class="flex justify-center lg:justify-start items-center gap-2">
                                <span class="text-title1 font-bold text-gray-950">
                                    {{ rating }}
                                </span>
                                <div class="flex text-yellow-400 text-lg">
                                    <span v-for="i in Math.floor(rating)" :key="`full-${i}`"
                                        >★</span
                                    >
                                    <span v-if="rating % 1 !== 0">★</span>
                                    <span
                                        v-for="i in 5 - Math.ceil(rating)"
                                        :key="`empty-${i}`"
                                        class="text-gray-300"
                                    >
                                        ★
                                    </span>
                                </div>
                            </div>

                            <span
                                class="text-subtitle4 mx-auto lg:mx-0 text-blue-400 cursor-not-allowed"
                            >
                                {{ $t('viewReviews', 'View Reviews') }}
                            </span>
                        </div> -->

                        <!-- Action Buttons -->
                        <div class="flex flex-col gap-2 lg:items-end lg:justify-center">
                            <div class="flex flex-col sm:flex-row gap-2">
                                <!-- Chat Button -->
                                <Button
                                    color="gray"
                                    variant="filled"
                                    size="md"
                                    disabled
                                    container-classes="flex-1"
                                    font-weight="normal"
                                    @click="handleChat"
                                >
                                    <div class="flex items-center gap-1">
                                        <svg class="w-4 h-4 flex-shrink-0">
                                            <use xlink:href="/sprite.svg#message" />
                                        </svg>
                                        {{ $t('profile.chat', 'Chat') }}
                                    </div>
                                </Button>

                                <!-- Follow Button -->
                                <Button
                                    color="gray"
                                    variant="filled"
                                    size="md"
                                    disabled
                                    container-classes="flex-1"
                                    font-weight="normal"
                                    @click="handleFollow"
                                >
                                    {{ $t('profile.follow', 'Follow') }}
                                </Button>

                                <!-- Connect Button -->
                                <Button
                                    color="red"
                                    variant="filled"
                                    disabled
                                    size="md"
                                    container-classes="flex-1"
                                    font-weight="normal"
                                    @click="handleConnect"
                                >
                                    <div class="flex items-center gap-1">
                                        <svg class="w-4 h-4 flex-shrink-0">
                                            <use xlink:href="/sprite.svg#connect-check" />
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

        <div class="py-3">
            <Tabs2
                v-model="activeTabIndex"
                :tabs="profileTabs"
                variant="underline"
                size="md"
                header-classes="bg-white tabs-profile rounded-md"
                classes="border-0"
            >
                <!-- Company Profile Tab -->
                <template #tab-0>
                    <div class="space-y-4">
                        <!-- Company Description -->
                        <div class="bg-white rounded-md p-4 shadow-sm">
                            <h2 class="text-title2 font-bold text-gray-950 mb-3">
                                {{
                                    $t('profile.sections.companyDescription', 'Company description')
                                }}
                            </h2>
                            <p class="text-body text-gray-950">
                                {{ description || 'No description available' }}
                            </p>
                        </div>

                        <!-- Gallery - EXACT from _profileId_.vue -->
                        <div v-if="galleryImages.length" class="bg-white rounded-md p-4 shadow-sm">
                            <h2 class="text-title2 font-bold text-gray-950 mb-3">
                                {{ $t('profile.sections.gallery', 'Gallery') }}
                            </h2>
                            <div class="relative">
                                <!-- Left Arrow Button -->
                                <button
                                    v-if="showScrollLeft"
                                    class="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-400 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-50 active:bg-red-500 active:text-white active:border-red-500 p-2 rounded-sm shadow-lg transition-all duration-300"
                                    @click="scrollGalleryLeft"
                                >
                                    <svg
                                        class="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M15 19l-7-7 7-7"
                                        />
                                    </svg>
                                </button>

                                <!-- Gallery Container -->
                                <div
                                    ref="galleryContainer"
                                    class="overflow-x-auto scrollbar-hide scroll-smooth"
                                    @scroll="updateGalleryScrollVisibility"
                                >
                                    <div class="flex gap-3 pb-2">
                                        <div
                                            v-for="(image, index) in galleryImages"
                                            :key="index"
                                            class="flex-shrink-0 w-48 h-48 rounded-md overflow-hidden border border-gray-300 cursor-pointer hover:border-blue-500 hover:shadow-lg transition-all duration-200 group"
                                        >
                                            <img
                                                :src="image.preview || image.url"
                                                :alt="`Gallery ${index + 1}`"
                                                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <!-- Right Arrow Button -->
                                <button
                                    v-if="showScrollRight"
                                    class="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-400 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-50 active:bg-red-500 active:text-white active:border-red-500 p-2 rounded-sm shadow-lg transition-all duration-300"
                                    @click="scrollGalleryRight"
                                >
                                    <svg
                                        class="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M9 5l7 7-7 7"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <!-- Company Information -->
                        <div class="bg-white rounded-md p-4 shadow-sm">
                            <h2 class="text-title2 font-bold text-gray-950 mb-3">
                                {{
                                    $t('profile.sections.companyInformation', 'Company information')
                                }}
                            </h2>
                            <div class="grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-4">
                                <!-- Company Legal Name -->
                                <div>
                                    <div class="text-caption1 text-gray-600 mb-1">
                                        {{ $t('company.legalName', 'Company legal name') }}
                                    </div>
                                    <div class="text-body font-medium text-gray-950">
                                        {{ companyLegalName || '-' }}
                                    </div>
                                </div>

                                <!-- Registration Number -->
                                <div>
                                    <div class="text-caption1 text-gray-600 mb-1">
                                        {{
                                            $t('company.registrationNumber', 'Registration number')
                                        }}
                                    </div>
                                    <div class="text-body font-medium text-gray-950">
                                        {{ registrationNumber || '-' }}
                                    </div>
                                </div>

                                <!-- VAT Number -->
                                <div>
                                    <div class="text-caption1 text-gray-600 mb-1">
                                        {{ $t('company.vatNumber', 'VAT number') }}
                                    </div>
                                    <div class="text-body font-medium text-blue-600">
                                        {{ vatNumber || '-' }}
                                    </div>
                                </div>

                                <!-- Business Type -->
                                <div>
                                    <div class="text-caption1 text-gray-600 mb-1">
                                        {{ $t('company.businessType', 'Business type') }}
                                    </div>
                                    <div class="text-body font-medium text-gray-950">
                                        {{ businessType || '-' }}
                                    </div>
                                </div>

                                <!-- Additional fields... -->
                                <div>
                                    <div class="text-caption1 text-gray-600 mb-1">
                                        {{ $t('company.email', 'E-Mail address') }}
                                    </div>
                                    <div class="text-body font-medium text-blue-600">
                                        {{ email || '-' }}
                                    </div>
                                </div>

                                <div>
                                    <div class="text-caption1 text-gray-600 mb-1">
                                        {{ $t('company.website', 'Website URL') }}
                                    </div>
                                    <div class="text-body font-medium text-blue-600">
                                        {{ websiteUrl || '-' }}
                                    </div>
                                </div>

                                <div>
                                    <div class="text-caption1 text-gray-600 mb-1">
                                        {{ $t('company.phoneNumber', 'Phone number') }}
                                    </div>
                                    <div class="text-body font-medium text-blue-600">
                                        {{ phoneNumber || '-' }}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </template>
            </Tabs2>
        </div>
        <!-- <Button
            color="blue"
            variant="filled"
            :label="t('close')"
            class="fixed bottom-0 z-[999] right-1/2"
            @click="$emit('cancel')"
        /> -->
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, onMounted, nextTick } from 'vue'
    import { useI18n } from 'vue-i18n'

    interface Props {
        formData: {
            legal_name: string
            username: string
            description: string
            email: string
            website_url: string
        }
        headerImage?: string | null
        logoImage?: string | null
        galleryImages: Array<{ preview?: string; url?: string }>
        user?: any
    }

    const props = defineProps<Props>()
    defineEmits(['cancel'])

    const { t } = useI18n()

    const activeTabIndex = ref(0)
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

    const galleryContainer = ref<HTMLElement | null>(null)
    const showScrollLeft = ref(false)
    const showScrollRight = ref(false)

    const companyName = computed(() => props.formData.legal_name || 'Company Name')
    const username = computed(() => props.formData.username || 'username')
    const description = computed(() => props.formData.description || '')
    const email = computed(() => props.formData.email || '')
    const websiteUrl = computed(() => props.formData.website_url || '')

    const productsCount = computed(() => props.user?.products_count || 0)
    const connectionsCount = computed(() => props.user?.social?.connections_count || 0)
    const followersCount = computed(() => props.user?.social?.followers_count || 0)
    const rating = computed(() => props.user?.rating || 4.8)

    const companyLegalName = computed(() => props.formData.legal_name || '')
    const registrationNumber = computed(
        () => props.user?.company_details?.registration_number || ''
    )
    const vatNumber = computed(() => props.user?.company_details?.vat_number || '')
    const businessType = computed(() => {
        const bt = props.user?.company_details?.business_type
        if (!bt) return ''

        // If it's an object with code property, return formatted code
        if (typeof bt === 'object' && bt.code) {
            return bt.code.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
        }

        // If it's a string, return formatted string
        if (typeof bt === 'string') {
            return bt.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
        }

        return ''
    })
    const phoneNumber = computed(() => {
        const phones = props.user?.contacts?.[0]?.phones
        return phones && phones.length > 0 ? phones[0].phone_number : ''
    })

    const getInitials = (name: string): string => {
        if (!name) return '?'
        return name
            .split(' ')
            .map((w) => w[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

    const updateGalleryScrollVisibility = () => {
        const el = galleryContainer.value
        if (!el) return
        showScrollLeft.value = el.scrollLeft > 10
        showScrollRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 10
    }

    const scrollGalleryLeft = () => {
        galleryContainer.value?.scrollBy({ left: -300, behavior: 'smooth' })
    }

    const scrollGalleryRight = () => {
        galleryContainer.value?.scrollBy({ left: 300, behavior: 'smooth' })
    }

    // Social Actions
    const handleChat = () => {
        console.log('Chat clicked')
        // TODO: Implement chat functionality
    }

    const handleFollow = () => {
        console.log('Follow clicked')
        // TODO: Implement follow functionality
    }

    const handleConnect = () => {
        console.log('Connect clicked')
        // TODO: Implement connect functionality
    }

    onMounted(() => {
        nextTick(updateGalleryScrollVisibility)
    })
</script>

<style scoped>
    .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }

    .scrollbar-hide::-webkit-scrollbar {
        display: none;
    }
</style>
