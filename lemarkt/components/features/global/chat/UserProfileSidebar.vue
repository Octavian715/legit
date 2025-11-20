<template>
    <div class="bg-white !rounded-lg flex flex-col h-full w-full md:w-80">
        <!-- Loading State - Skeleton matching Profile Content structure -->
        <template v-if="loadingProfile">
            <!-- Header Section Skeleton - FIXED -->
            <div
                class="flex-shrink-0 text-center space-y-3 m-3 bg-gray-100 border border-gray-600 px-4 py-2 rounded-md"
            >
                <div class="flex items-start justify-center space-x-2 relative">
                    <!-- Avatar Skeleton -->
                    <div class="w-16 h-16 bg-gray-300 rounded-full animate-pulse"></div>
                </div>

                <!-- Name and Location Skeleton -->
                <div class="space-y-2">
                    <div class="h-5 bg-gray-300 rounded w-32 mx-auto animate-pulse"></div>
                    <div class="h-4 bg-gray-300 rounded w-24 mx-auto animate-pulse"></div>
                    <div class="h-3 bg-gray-300 rounded w-28 mx-auto animate-pulse"></div>
                </div>

                <!-- Profile Button Skeleton -->
                <div class="h-10 bg-gray-300 rounded animate-pulse"></div>
            </div>

            <!-- Tabs Structure Skeleton -->
            <div class="flex-1 flex flex-col min-h-0">
                <!-- Tab Navigation Skeleton - FIXED -->
                <div
                    class="flex-shrink-0 flex justify-between overflow-x-auto scrollbar-hide scroll-smooth px-4 border-b border-gray-600"
                >
                    <div
                        v-for="i in 3"
                        :key="i"
                        class="relative group flex items-center justify-center px-2 py-2.5 mb-1"
                    >
                        <div class="h-4 w-20 bg-gray-300 rounded animate-pulse"></div>
                    </div>
                </div>

                <!-- Tab Content Skeleton - SCROLLABLE -->
                <div class="flex-1 min-h-0 overflow-y-auto bg-white">
                    <div class="p-3 space-y-3">
                        <!-- Total Amount Card Skeleton -->
                        <div class="bg-white border border-gray-600 rounded-md p-3 space-y-2">
                            <div class="flex items-center gap-2">
                                <div class="w-4 h-4 bg-gray-300 rounded animate-pulse"></div>
                                <div class="h-3 w-24 bg-gray-300 rounded animate-pulse"></div>
                            </div>
                            <div class="h-5 w-20 bg-gray-300 rounded animate-pulse"></div>
                        </div>

                        <!-- Total Orders Card Skeleton -->
                        <div class="bg-white border border-gray-600 rounded-md p-3 space-y-2">
                            <div class="flex items-center gap-2">
                                <div class="w-4 h-4 bg-gray-300 rounded animate-pulse"></div>
                                <div class="h-3 w-24 bg-gray-300 rounded animate-pulse"></div>
                            </div>
                            <div class="h-5 w-16 bg-gray-300 rounded animate-pulse"></div>
                        </div>

                        <!-- Personal Info Collapse Skeleton -->
                        <div class="space-y-3">
                            <!-- Collapse Header -->
                            <div class="flex items-center justify-between">
                                <div class="h-4 w-36 bg-gray-300 rounded animate-pulse"></div>
                                <div class="w-4 h-4 bg-gray-300 rounded animate-pulse"></div>
                            </div>

                            <!-- Collapse Content -->
                            <div class="space-y-3">
                                <!-- Field 1 -->
                                <div class="space-y-1">
                                    <div class="h-3 w-32 bg-gray-300 rounded animate-pulse"></div>
                                    <div class="h-4 w-28 bg-gray-300 rounded animate-pulse"></div>
                                </div>
                                <!-- Field 2 -->
                                <div class="space-y-1">
                                    <div class="h-3 w-28 bg-gray-300 rounded animate-pulse"></div>
                                    <div class="h-4 w-40 bg-gray-300 rounded animate-pulse"></div>
                                </div>
                                <!-- Field 3 -->
                                <div class="space-y-1">
                                    <div class="h-3 w-24 bg-gray-300 rounded animate-pulse"></div>
                                    <div class="h-4 w-32 bg-gray-300 rounded animate-pulse"></div>
                                </div>
                                <!-- Field 4 -->
                                <div class="space-y-1">
                                    <div class="h-3 w-20 bg-gray-300 rounded animate-pulse"></div>
                                    <div class="h-4 w-36 bg-gray-300 rounded animate-pulse"></div>
                                </div>
                            </div>
                        </div>

                        <!-- Recent Orders Collapse Skeleton -->
                        <div class="space-y-3">
                            <!-- Collapse Header -->
                            <div class="flex items-center justify-between">
                                <div class="h-4 w-28 bg-gray-300 rounded animate-pulse"></div>
                                <div class="w-4 h-4 bg-gray-300 rounded animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </template>

        <!-- Error State -->
        <div
            v-else-if="errorMessage"
            class="flex-1 flex items-center justify-center p-4 text-center"
        >
            <div class="space-y-2">
                <div class="text-subtitle2 text-gray-600">{{ errorMessage }}</div>
                <Button size="sm" color="blue" @click="retryLoad">
                    {{ $t('retry') }}
                </Button>
            </div>
        </div>

        <!-- Profile Content -->
        <template v-else-if="profileData">
            <!-- Header Section - FIXED -->
            <div
                class="flex-shrink-0 text-center space-y-3 m-3 bg-gray-100 border border-gray-600 px-4 py-2 rounded-md"
            >
                <div class="flex items-start justify-center space-x-2 relative">
                    <Avatar
                        :image-url="profileData.avatar_url"
                        :initials="getInitials()"
                        size="lg"
                        :color="getAvatarColor()"
                    />

                    <ButtonClose
                        v-if="!mobileMode"
                        size="mg"
                        icon-size="lg"
                        class="absolute top-0 right-0"
                        @click="closeProfile"
                    />
                </div>

                <div>
                    <div class="text-title3 font-bold text-gray-950">
                        {{ profileData.display_name }}
                    </div>
                    <div v-if="profileData.company_name" class="text-subtitle3 text-gray-800">
                        {{ profileData.company_name }}
                    </div>
                    <div v-if="locationText" class="text-subtitle4 text-gray-800 mt-1">
                        {{ locationText }}
                    </div>
                </div>

                <Button
                    variant="filled"
                    color="blue"
                    size="md"
                    class="w-full"
                    font-weight="normal"
                    @click="viewFullProfile"
                >
                    <div class="flex items-center gap-2">
                        <svg class="w-5 h-5">
                            <use xlink:href="/sprite.svg#info" />
                        </svg>
                        {{ $t('profile.title') }}
                    </div>
                </Button>
            </div>

            <!-- Custom Tabs with Tabs2 EXACT Underline Styles -->
            <div class="flex-1 flex flex-col min-h-0">
                <div
                    class="flex-shrink-0 flex justify-between overflow-x-auto scrollbar-hide scroll-smooth px-4 border-b border-gray-600"
                >
                    <button
                        v-for="(tab, index) in tabs"
                        :key="index"
                        type="button"
                        role="tab"
                        :aria-selected="selectedTabIndex === index"
                        :class="[
                            'relative group flex items-center vorder-0 justify-center transition-all duration-200 outline-none cursor-pointer',
                            'px-2 py-2.5 mb-1 text-subtitle2',
                            selectedTabIndex === index
                                ? 'text-blue-400 hover:text-blue-700'
                                : 'text-gray-950 hover:text-gray-800',
                        ]"
                        @click="selectedTabIndex = index"
                    >
                        <span
                            class="whitespace-nowrap group-active:scale-95 transition-transform duration-300 delay-150"
                        >
                            {{ tab.label }}
                        </span>

                        <!-- Underline indicator (EXACT Tabs2 style) -->
                        <div
                            v-if="selectedTabIndex === index"
                            class="absolute inset-0 top-full rounded-t-lg h-1 bg-blue-400 transition-all duration-300 ease-out delay-150"
                        />
                    </button>
                </div>

                <!-- Tab Content - SCROLLABLE -->
                <div class="flex-1 min-h-0 overflow-y-auto bg-white">
                    <!-- Information Tab -->
                    <div v-show="selectedTabIndex === 0" class="p-3 space-y-3">
                        <!-- Order Stats Cards - DATE REALE DIN API -->
                        <div
                            v-if="
                                orderStats &&
                                (orderStats.total_amount !== undefined ||
                                    orderStats.total_orders !== undefined)
                            "
                            class="space-y-3"
                        >
                            <!-- Total Amount Card -->
                            <div
                                v-if="orderStats.total_amount !== undefined"
                                class="bg-white border border-gray-600 rounded-md p-3 space-y-2"
                            >
                                <div class="flex items-center gap-2">
                                    <svg class="w-4 h-4 text-green-600">
                                        <use xlink:href="/sprite.svg#euro" />
                                    </svg>
                                    <span class="text-body text-gray-600">{{
                                        $t('table.totalAmount')
                                    }}</span>
                                </div>
                                <div class="text-subtitle2 font-medium text-gray-950">
                                    {{ formatAmount(orderStats.total_amount) }}
                                </div>
                            </div>

                            <!-- Total Orders Card -->
                            <div
                                v-if="orderStats.total_orders !== undefined"
                                class="bg-white border border-gray-600 rounded-md p-3 space-y-2"
                            >
                                <div class="flex items-center gap-2">
                                    <svg class="w-4 h-4 text-green-600">
                                        <use xlink:href="/sprite.svg#shopping-cart2" />
                                    </svg>
                                    <span class="text-body text-gray-600">{{
                                        $t('table.totalOrders')
                                    }}</span>
                                </div>
                                <div class="text-subtitle2 font-medium text-gray-950">
                                    {{ orderStats.total_orders || 0 }}
                                </div>
                            </div>
                        </div>

                        <!-- Personal Info Collapse -->
                        <Collapse v-if="hasPersonalInfo">
                            <template #title>
                                <span class="text-subtitle2 font-medium text-gray-950">{{
                                    $t('chat.personalInfo')
                                }}</span>
                            </template>

                            <div class="space-y-3">
                                <!-- Country -->
                                <div v-if="profileData.address?.country_code" class="space-y-1">
                                    <div class="text-subtitle4 text-gray-800">
                                        {{ $t('company.location') }}
                                    </div>
                                    <div class="text-subtitle3 text-gray-950">
                                        {{ getCountryName(profileData.address.country_code) }}
                                    </div>
                                </div>

                                <!-- Address -->
                                <div
                                    v-if="profileData.address?.street || profileData.address?.city"
                                    class="space-y-1"
                                >
                                    <div class="text-subtitle4 text-gray-800">
                                        {{ $t('company.address') }}
                                    </div>
                                    <div
                                        v-if="profileData.address.street"
                                        class="text-subtitle3 text-gray-950"
                                    >
                                        {{ profileData.address.street }}
                                        <span v-if="profileData.address.postal_code">
                                            , {{ profileData.address.postal_code }}
                                        </span>
                                    </div>
                                    <div
                                        v-if="profileData.address.city"
                                        class="text-subtitle3 text-gray-950"
                                    >
                                        {{ profileData.address.city }}
                                    </div>
                                </div>

                                <!-- Phone Number -->
                                <div
                                    v-if="profileData.primary_contact?.phones?.length"
                                    class="space-y-1"
                                >
                                    <div class="text-subtitle4 text-gray-800">
                                        {{ $t('company.phoneNumber') }}
                                    </div>
                                    <div
                                        v-for="(phone, index) in profileData.primary_contact.phones"
                                        :key="index"
                                        class="text-subtitle3 text-gray-950"
                                    >
                                        {{ phone }}
                                    </div>
                                </div>

                                <!-- Fax -->
                                <div v-if="profileData.primary_contact?.fax" class="space-y-1">
                                    <div class="text-subtitle4 text-gray-800">
                                        {{ $t('company.fax') }}
                                    </div>
                                    <div class="text-subtitle3 text-gray-950">
                                        {{ profileData.primary_contact.fax }}
                                    </div>
                                </div>

                                <!-- Email -->
                                <div v-if="profileData.primary_contact?.email" class="space-y-1">
                                    <div class="text-subtitle4 text-gray-800">
                                        {{ $t('company.email') }}
                                    </div>
                                    <div class="text-subtitle3 text-blue-500">
                                        <a
                                            :href="`mailto:${profileData.primary_contact.email}`"
                                            class="hover:underline"
                                        >
                                            {{ profileData.primary_contact.email }}
                                        </a>
                                    </div>
                                </div>

                                <!-- Spoken Languages -->
                                <div v-if="profileData.spoken_languages?.length" class="space-y-1">
                                    <div class="text-subtitle4 text-gray-800">
                                        {{ $t('profile.fields.spokenLanguages') }}
                                    </div>
                                    <div class="text-subtitle3 text-gray-950">
                                        {{ profileData.spoken_languages.join(', ') }}
                                    </div>
                                </div>

                                <!-- Website -->
                                <div v-if="profileData.website_url" class="space-y-1">
                                    <div class="text-subtitle4 text-gray-800">
                                        {{ $t('company.website') }}
                                    </div>
                                    <a
                                        :href="profileData.website_url"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        class="text-subtitle3 text-blue-500 hover:underline block truncate"
                                    >
                                        {{ profileData.website_url }}
                                    </a>
                                </div>

                                <!-- Number of Employees -->
                                <div v-if="employeeCount" class="space-y-1">
                                    <div class="text-subtitle4 text-gray-800">
                                        {{ $t('company.numberOfEmployees') }}
                                    </div>
                                    <div class="text-subtitle3 text-gray-950">
                                        {{ employeeCount }}
                                    </div>
                                </div>
                            </div>
                        </Collapse>

                        <!-- Recent Orders Collapse -->
                        <Collapse v-if="orderStats?.recent_orders?.length" :default-open="false">
                            <template #title>
                                <span class="text-subtitle2 font-medium text-gray-950"
                                    >Recent Orders</span
                                >
                            </template>

                            <div class="space-y-3">
                                <div
                                    v-for="order in orderStats.recent_orders"
                                    :key="order.id"
                                    class="bg-white rounded-lg border border-gray-200 overflow-hidden"
                                >
                                    <!-- Order Header -->
                                    <div
                                        class="px-3 py-2 border-b border-gray-200 flex items-center justify-between"
                                    >
                                        <div class="flex-1 min-w-0">
                                            <div class="text-subtitle4 text-gray-800">
                                                {{ formatDate(order.date) }}
                                            </div>
                                            <div class="text-subtitle3 font-semibold text-gray-950">
                                                #{{ order.order_number }}
                                            </div>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <div class="text-subtitle2 font-bold text-gray-950">
                                                €{{ formatAmount(order.total) }}
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Order Products -->
                                    <div class="divide-y divide-gray-200">
                                        <div
                                            v-for="product in order.products"
                                            :key="product.id"
                                            class="p-3 flex items-center gap-3"
                                        >
                                            <!-- Product Image -->
                                            <div
                                                class="w-12 h-12 flex-shrink-0 rounded overflow-hidden bg-gray-100"
                                            >
                                                <img
                                                    v-if="product.image"
                                                    :src="product.image"
                                                    :alt="product.name"
                                                    class="w-full h-full object-cover"
                                                    @error="handleImageError"
                                                />
                                                <div
                                                    v-else
                                                    class="w-full h-full flex items-center justify-center bg-gray-200"
                                                >
                                                    <svg
                                                        class="w-6 h-6 text-gray-400"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            stroke-linecap="round"
                                                            stroke-linejoin="round"
                                                            stroke-width="2"
                                                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                        />
                                                    </svg>
                                                </div>
                                            </div>

                                            <!-- Product Details -->
                                            <div class="flex-1 min-w-0">
                                                <div
                                                    class="text-subtitle3 font-medium text-gray-950 truncate"
                                                >
                                                    {{ product.name }}
                                                </div>
                                                <div class="text-subtitle4 text-gray-800">
                                                    {{ product.code }} • €{{
                                                        product.price_per_unit
                                                    }}
                                                    / unit
                                                </div>
                                                <div class="text-caption1 text-gray-800">
                                                    {{ product.quantity }} Units
                                                </div>
                                            </div>

                                            <!-- Product Total -->
                                            <div class="text-right flex-shrink-0">
                                                <div class="text-subtitle3 font-bold text-gray-950">
                                                    €{{ formatAmount(product.total) }}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Collapse>
                    </div>

                    <!-- Media Tab -->
                    <div v-show="selectedTabIndex === 1" class="p-3">
                        <div
                            v-if="profileData.gallery_images?.length"
                            class="grid grid-cols-3 gap-1"
                        >
                            <div
                                v-for="image in profileData.gallery_images"
                                :key="image.id"
                                class="aspect-square rounded overflow-hidden border border-gray-300"
                            >
                                <img
                                    :src="image.url"
                                    :alt="image.file_name || 'Gallery image'"
                                    class="w-full h-full object-cover"
                                    @error="handleImageError"
                                />
                            </div>
                        </div>
                        <div v-else class="text-center text-gray-500 py-8 bg-white rounded-lg">
                            <div class="text-subtitle2">
                                {{ $t('profile.emptyStates.noContent') }}
                            </div>
                        </div>
                    </div>

                    <!-- Links Tab -->
                    <div v-show="selectedTabIndex === 2" class="p-3">
                        <div v-if="profileData.website_url" class="bg-white rounded-lg p-3">
                            <a
                                :href="profileData.website_url"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="text-subtitle3 text-blue-500 hover:underline block truncate"
                            >
                                {{ profileData.website_url }}
                            </a>
                        </div>
                        <div v-else class="text-center text-gray-500 py-8 bg-white rounded-lg">
                            <div class="text-subtitle2">
                                {{ $t('profile.emptyStates.noContent') }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, onMounted, watch } from 'vue'
    import { storeToRefs } from 'pinia'
    import { useChatStore } from '~/stores/chat'
    import { ProfileService } from '~/services/profile'
    import type { ApiProfileUser, ProfileUser } from '~/types/profile'
    import { useStaticData } from '~/composables/useStaticData'
    import { useLocalePath } from '#imports'

    const props = defineProps<{
        mobileMode?: boolean
    }>()

    const chatStore = useChatStore()
    const { selectedUser } = storeToRefs(chatStore)
    const { findCountryByCode, employeeRanges } = useStaticData()
    const localePath = useLocalePath()

    const loadingProfile = ref(false)
    const errorMessage = ref<string | null>(null)
    const selectedTabIndex = ref(0) // 0 = Information, 1 = Media, 2 = Links
    const profileData = ref<ProfileUser | null>(null)
    const orderStats = ref<any>(null)

    const tabs = [{ label: 'Information' }, { label: 'Media' }, { label: 'Links' }]

    const transformApiData = (apiData: ApiProfileUser): ProfileUser => {
        const companyDetails = apiData.company_details
        const primaryContact = apiData.contacts?.[0]
        const avatarMedia = apiData.profile_media?.find((media) => media.type === 'picture')
        const coverMedia = apiData.profile_media?.find((media) => media.type === 'banner')
        const galleryMedia =
            apiData.profile_media?.filter((media) => media.type === 'gallery') || []

        return {
            id: apiData.id,
            email: apiData.email,
            display_name: companyDetails?.legal_name || 'Unknown Company',
            company_name: companyDetails?.legal_name || 'Unknown Company',
            legal_name: companyDetails?.legal_name || '',
            username: companyDetails?.username || '',
            is_verified: apiData.verification_status === 'verified',
            is_registration_complete: apiData.is_registration_complete,
            business_description: companyDetails?.description || '',
            website_url: companyDetails?.website_url || '',
            registration_number: companyDetails?.registration_number || '',
            vat_number: companyDetails?.vat_number || '',
            registration_year: companyDetails?.registration_year || 0,
            business_type: companyDetails?.business_type?.code || '',

            primary_contact: primaryContact
                ? {
                      name: primaryContact.name,
                      email: primaryContact.email,
                      position: primaryContact.position?.code || '',
                      custom_position: primaryContact.custom_position || undefined,
                      phones: primaryContact.phones?.map((p) => p.phone_number) || [],
                      fax: primaryContact.fax_number || undefined,
                  }
                : undefined,

            address: {
                street: `${companyDetails?.street_name || ''} ${companyDetails?.street_number || ''}`.trim(),
                city: companyDetails?.city_name || '',
                postal_code: companyDetails?.postal_code || '',
                country_code: companyDetails?.country?.code || '',
                state: companyDetails?.state_name || undefined,
            },

            employee_count_range: companyDetails?.employee_count_range?.code || '',
            revenue_range: companyDetails?.revenue_range?.code || '',
            min_order_amount: companyDetails?.min_order?.amount || '',
            min_order_currency: companyDetails?.min_order?.currency?.code || '',

            export_experience: !!apiData.export_details,
            export_since_year: apiData.export_details?.export_since_year,
            export_percentage: apiData.export_details?.export_percentage?.code,
            export_countries: apiData.export_countries?.map((c) => c.code) || [],
            export_ports: apiData.export_ports || [],

            spoken_languages: apiData.spoken_languages?.map((l) => l.native_name) || [],
            interesting_categories: apiData.interesting_categories?.map((c) => c.slug) || [],

            followers_count: apiData.social?.followers_count || 0,
            connections_count: apiData.social?.connections_count || 0,
            products_count: apiData.social?.products_count || 0,

            social: {
                is_following: apiData.social?.is_following || false,
                followers_count: apiData.social?.followers_count || 0,
                connections_count: apiData.social?.connections_count || 0,
                connection: {
                    exists: apiData.social?.connection?.exists || false,
                    status: apiData.social?.connection?.status || null,
                    id: apiData.social?.connection?.id || undefined,
                },
            },

            factories:
                apiData.factory_details?.map((factory) => ({
                    name: factory.name,
                    size: factory.size?.code || '',
                    location: `${factory.city_name}, ${factory.country?.code || ''}`,
                })) || [],

            bank_accounts:
                apiData.bank_accounts?.map((account) => ({
                    bank_name: account.bank_name,
                    account_holder: account.account_holder_name,
                    iban: account.iban,
                    currency: account.currency?.code || '',
                    location: `${account.city_name}, ${account.country?.code || ''}`,
                })) || [],

            rating: 4.8,
            rating_count: 25,

            avatar_url: avatarMedia?.url || undefined,
            cover_image_url: coverMedia?.url || undefined,
            gallery_images: galleryMedia.map((media) => ({
                id: media.id,
                url: media.url,
                file_name: media.file_name,
            })),

            achievements: [],
            product_categories: [],
            certificates: [],
        }
    }

    const hasPersonalInfo = computed(() => {
        if (!profileData.value) return false

        return !!(
            profileData.value.address?.country_code ||
            profileData.value.address?.street ||
            profileData.value.address?.city ||
            profileData.value.primary_contact?.phones?.length ||
            profileData.value.primary_contact?.fax ||
            profileData.value.primary_contact?.email ||
            profileData.value.spoken_languages?.length ||
            profileData.value.website_url ||
            profileData.value.employee_count_range
        )
    })

    const locationText = computed(() => {
        if (!profileData.value?.address) return null

        const parts = []
        if (profileData.value.address.city) parts.push(profileData.value.address.city)
        if (profileData.value.address.country_code) {
            const country = getCountryName(profileData.value.address.country_code)
            if (country) parts.push(country)
        }

        return parts.length > 0 ? parts.join(', ') : null
    })

    const employeeCount = computed(() => {
        if (!profileData.value?.employee_count_range) return null
        const range = employeeRanges.value.find(
            (r) => r.code === profileData.value?.employee_count_range
        )
        return range?.name || null
    })

    const getCountryName = (code: string): string => {
        const country = findCountryByCode(code)
        return country?.name || code
    }

    const formatAmount = (amount: number | string | undefined | null): string => {
        if (amount === undefined || amount === null) return '0.00'
        const num = typeof amount === 'string' ? parseFloat(amount) : amount
        if (isNaN(num)) return '0.00'
        return num.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })
    }

    const formatDate = (dateString: string): string => {
        try {
            const date = new Date(dateString)
            const day = date.getDate().toString().padStart(2, '0')
            const month = (date.getMonth() + 1).toString().padStart(2, '0')
            const year = date.getFullYear()
            const hours = date.getHours().toString().padStart(2, '0')
            const minutes = date.getMinutes().toString().padStart(2, '0')
            return `${day}.${month}.${year}, ${hours}:${minutes}`
        } catch {
            return dateString
        }
    }

    const closeProfile = () => {
        chatStore.toggleProfile()
        chatStore.setSelectedUser(null)
    }

    const viewFullProfile = async () => {
        if (profileData.value) {
            await navigateTo(localePath(`/profile/${profileData.value.id}`))
        }
    }

    const getInitials = () => {
        if (!profileData.value?.display_name) return 'CO'
        const name = profileData.value.display_name
        const words = name.split(' ')
        if (words.length >= 2) {
            return `${words[0][0]}${words[1][0]}`.toUpperCase()
        }
        return name.slice(0, 2).toUpperCase()
    }

    const getAvatarColor = () => {
        const colors = [
            'bg-blue-400',
            'bg-green-400',
            'bg-yellow-400',
            'bg-red-400',
            'bg-purple-400',
        ]
        if (!profileData.value?.display_name) return colors[0]
        const name = profileData.value.display_name
        const index = name.charCodeAt(0) % colors.length
        return colors[index]
    }

    const handleImageError = (event: Event) => {
        const img = event.target as HTMLImageElement
        img.style.display = 'none'
    }

    const loadProfileData = async () => {
        if (!selectedUser.value?.id) return

        loadingProfile.value = true
        errorMessage.value = null
        profileData.value = null
        orderStats.value = null

        try {
            const profileService = new ProfileService()

            const apiData = await profileService.getUserProfile(selectedUser.value.id)
            profileData.value = transformApiData(apiData)

            try {
                // const stats = await profileService.getUserProducts(selectedUser.value.id)
                orderStats.value = stats || []
            } catch (statsError) {
                console.warn('[UserProfileSidebar] Order stats not available:', statsError)
                orderStats.value = null
            }
        } catch (error: any) {
            console.error('Failed to load profile:', error)
            errorMessage.value = error.message || 'Failed to load profile'
        } finally {
            loadingProfile.value = false
        }
    }

    const retryLoad = () => {
        loadProfileData()
    }

    watch(
        () => selectedUser.value?.id,
        (newUserId, oldUserId) => {
            if (newUserId && newUserId !== oldUserId) {
                selectedTabIndex.value = 0
                profileData.value = null
                orderStats.value = null
                loadProfileData()
            }
        },
        { immediate: true }
    )

    onMounted(() => {
        if (selectedUser.value?.id) {
            loadProfileData()
        }
    })
</script>
