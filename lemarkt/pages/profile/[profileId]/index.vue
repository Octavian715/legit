<template>
    <div class="profile-page min-h-screen px-4 md:px-0">
        <Breadcrumbs :items="breadcrumbs" :loading="pending" class="mb-4" />

        <!-- Loading State -->
        <div v-if="pending" class="animate-fade-in">
            <ProfileSkeleton />
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="container mx-auto">
            <div class="bg-white rounded-sm shadow-sm p-8 text-center">
                <img
                    src="/images/error.svg"
                    width="300"
                    height="250"
                    class="mb-6 mx-auto"
                    loading="lazy"
                />
                <h2 class="text-title2 font-bold text-gray-900 mt-4 mb-2">
                    {{ $t('profile.profileNotFound') }}
                </h2>
                <p class="text-gray-600 mb-6">{{ error.message }}</p>
                <Button color="red" container-classes="mx-auto" @click="refresh()">
                    {{ $t('profile.tryAgain') }}
                </Button>
            </div>
        </div>

        <!-- Profile Content -->
        <div v-else-if="profileData" class="profile-content">
            <!-- Cover Image Section -->
            <div
                class="relative w-full h-40 bg-gradient-to-br from-blue-600 via-purple-600 to-red-600 overflow-hidden rounded-t-md"
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
                    v-if="profileData.cover_image_url"
                    :src="profileData.cover_image_url"
                    :alt="`${profileData.display_name} cover`"
                    class="w-full h-full object-cover"
                    @error="handleCoverError"
                />
            </div>

            <!-- Profile Header -->
            <div class="bg-white shadow-sm mb-2">
                <div class="container mx-auto px-4 py-4">
                    <div class="flex flex-col lg:flex-row gap-4">
                        <div
                            class="flex flex-col lg:flex-row lg:items-start items-center gap-3 flex-1"
                        >
                            <!-- Avatar -->
                            <div class="relative -mt-36 lg:-mt-16 flex-shrink-0">
                                <div
                                    class="w-40 h-40 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-white overflow-hidden"
                                >
                                    <img
                                        v-if="profileData.avatar_url"
                                        :src="profileData.avatar_url"
                                        :alt="profileData.display_name"
                                        class="w-full h-full object-cover"
                                        @error="handleAvatarError"
                                    />
                                    <span v-else class="text-red-600 font-bold text-3xl">
                                        {{ getCompanyInitials() }}
                                    </span>
                                </div>
                            </div>

                            <!-- Profile Info -->
                            <div class="flex-1 min-w-0 pt-2">
                                <div
                                    class="flex justify-center lg:justify-start items-center gap-2 mb-1"
                                >
                                    <h1 class="text-title1 font-bold text-gray-950">
                                        {{ profileData.display_name }}
                                    </h1>
                                    <svg
                                        v-if="profileData.is_verified"
                                        class="w-4 h-4 text-blue-500"
                                    >
                                        <use xlink:href="/sprite.svg#verified" />
                                    </svg>
                                </div>

                                <p
                                    class="flex justify-center lg:justify-start items-center mb-2 text-gray-800 text-body"
                                >
                                    @{{ profileData.username }}
                                </p>

                                <div class="flex items-center gap-3">
                                    <NuxtLink
                                        :to="
                                            localePath(
                                                `/profile/${profileData.username}?tab=products`
                                            )
                                        "
                                        class="flex flex-col sm:flex-row items-center gap-1 hover:opacity-80 transition-opacity"
                                    >
                                        <div class="text-subtitle1 font-bold text-gray-950">
                                            {{ profileData.products_count || 0 }}
                                        </div>
                                        <div class="text-subtitle1 text-gray-800">
                                            {{ $t('profile.tabs.products') }}
                                        </div>
                                    </NuxtLink>

                                    <div class="w-px h-5 mx-1 bg-gray-400" />

                                    <NuxtLink
                                        :to="
                                            localePath(
                                                `/profile/${profileData.username}/connections`
                                            )
                                        "
                                        class="flex flex-col sm:flex-row items-center gap-1 hover:opacity-80 transition-opacity"
                                    >
                                        <div class="text-subtitle1 font-bold text-gray-950">
                                            {{ profileData.connections_count || 0 }}
                                        </div>
                                        <div class="text-subtitle1 text-gray-800">
                                            {{ $t('profile.connections') }}
                                        </div>
                                    </NuxtLink>

                                    <div class="w-px h-5 mx-1 bg-gray-400" />

                                    <NuxtLink
                                        :to="
                                            localePath(`/profile/${profileData.username}/followers`)
                                        "
                                        class="flex flex-col sm:flex-row items-center gap-1 hover:opacity-80 transition-opacity"
                                    >
                                        <div class="text-subtitle1 font-bold text-gray-950">
                                            {{ formatCount(profileData.followers_count || 0) }}
                                        </div>
                                        <div class="text-subtitle1 text-gray-800">
                                            {{ $t('profile.followers') }}
                                        </div>
                                    </NuxtLink>
                                </div>
                            </div>
                        </div>

                        <div class="flex flex-col lg:ml-auto justify-center lg:justify-end gap-3">
                            <!-- <div
                                class="flex flex-col justify-center lg:justify-end gap-2 mb-2 lg:ml-auto select-none lg:w-fit"
                            >
                                <div
                                    class="flex justify-center lg:justify-start items-center gap-2"
                                >
                                    <span class="text-title1 font-bold text-gray-950">
                                        {{ profileData.rating || 4.8 }}
                                    </span>
                                    <StarRating
                                        v-model:rating="displayRating"
                                        :max-stars="5"
                                        size="lg"
                                        :view-reviews="false"
                                        disabled
                                    />
                                </div>

                                <span
                                    class="text-subtitle4 mx-auto lg:mx-0 text-blue-400 cursor-pointer"
                                >
                                    {{ t('viewReviews') }}
                                </span>
                            </div> -->

                            <div
                                v-if="isNotCurrentUser"
                                class="flex flex-col gap-2 lg:items-end lg:justify-center"
                            >
                                <ProfileActions
                                    :user-id="profileData.id"
                                    :user-name="profileData.display_name"
                                    :social-state="socialState"
                                    :connection-state="connectionState"
                                    :connection-button-color="connectionButtonColor"
                                    :connection-button-text="connectionButtonText"
                                    :is-follow-loading="isFollowLoading"
                                    :is-connect-loading="isConnectLoading"
                                    :is-chat-loading="isChatLoading"
                                    :phones="profilePhones"
                                    @follow-toggle="handleFollowToggle"
                                    @connect-toggle="handleConnectToggle"
                                    @chat-click="handleChat"
                                    @phone-call="handlePhoneCall"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tabs Section -->
            <div class="container mx-auto py-3">
                <Tabs2
                    v-model="activeTabIndex"
                    :tabs="profileTabs"
                    variant="underline"
                    size="md"
                    header-classes="bg-white rounded-md tabs-profile"
                    classes="border-0"
                >
                    <!-- Company Profile Tab -->
                    <template #tab-0>
                        <div class="space-y-4">
                            <!-- BLOC 1: Company Description -->
                            <div class="bg-white rounded-md p-4">
                                <h2 class="text-title2 font-bold text-gray-950 mb-3">
                                    {{ $t('profile.sections.companyDescription') }}
                                </h2>
                                <p class="text-body text-gray-950">
                                    {{ profileData.business_description }}
                                </p>
                            </div>

                            <!-- BLOC 2: Gallery -->
                            <div
                                v-if="profileData.gallery_images?.length"
                                class="bg-white rounded-md p-4"
                            >
                                <h2 class="text-title2 font-bold text-gray-950 mb-3">
                                    {{ $t('profile.sections.gallery') }}
                                </h2>
                                <div class="relative">
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

                                    <div
                                        ref="galleryContainer"
                                        class="overflow-x-auto scrollbar-hide scroll-smooth"
                                        @scroll="updateGalleryScrollVisibility"
                                    >
                                        <div class="flex gap-3 pb-2">
                                            <div
                                                v-for="(image, index) in profileData.gallery_images"
                                                :key="image.id"
                                                class="flex-shrink-0 w-48 h-48 rounded-md overflow-hidden border border-gray-300 cursor-pointer hover:border-blue-500 hover:shadow-lg transition-all duration-200 group"
                                                @click="openGalleryModal(index)"
                                            >
                                                <img
                                                    :src="image.url"
                                                    :alt="`${profileData.display_name} gallery ${index + 1}`"
                                                    class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    @error="handleGalleryImageError"
                                                />
                                            </div>
                                        </div>
                                    </div>

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

                            <!-- BLOC 3: Company Information -->
                            <CompanyInfoCard
                                :title="$t('profile.sections.companyInformation')"
                                :items="companyInformation"
                                :delay="200"
                            />
                        </div>
                    </template>

                    <!-- News Feed Tab -->
                    <template #tab-1>
                        <div class="bg-white rounded-sm p-6">
                            <h2 class="text-title2 font-semibold mb-4">
                                {{ $t('profile.tabs.newsFeed') }}
                            </h2>
                            <div class="text-center py-12 text-gray-500">
                                <Icon icon="news" size="xl" color="gray" />
                                <p class="mt-4">{{ $t('profile.emptyStates.noNewsAvailable') }}</p>
                            </div>
                        </div>
                    </template>

                    <!-- Brands Tab -->
                    <template #tab-2>
                        <div class="bg-white rounded-sm p-6">
                            <h2 class="text-title2 font-semibold mb-4">
                                {{ $t('profile.tabs.brands') }}
                            </h2>
                            <div class="text-center py-12 text-gray-500">
                                <Icon icon="label" size="xl" color="gray" />
                                <p class="mt-4">
                                    {{ $t('profile.emptyStates.noBrandsAvailable') }}
                                </p>
                            </div>
                        </div>
                    </template>

                    <!-- Products Tab -->
                    <template #tab-3>
                        <div class="bg-white rounded-sm p-6">
                            <h3 class="text-title2 font-semibold mb-4">
                                {{ $t('profile.tabs.products') }}
                            </h3>

                            <!-- Loading -->
                            <div
                                v-if="isLoadingUserProducts"
                                class="grid grid-cols-2 lg:grid-cols-3 gap-3"
                            >
                                <div
                                    v-for="i in 6"
                                    :key="i"
                                    class="bg-gray-200 animate-pulse rounded-md h-24"
                                />
                            </div>

                            <!-- Categories -->
                            <CompanyProducts
                                v-else-if="productCategories.length > 0"
                                :products="productCategories"
                            />

                            <!-- Empty -->
                            <NoDataPage
                                v-else
                                :title="t('marketplace.empty.title')"
                                :description="t('marketplace.empty.description')"
                                :button-label="t('marketplace.empty.buttonAction')"
                                image="/images/content/empty-products.svg"
                                image-height="300px"
                                image-width="350px"
                                @action="router.push(localePath('/marketplace'))"
                            />
                        </div>
                    </template>

                    <!-- Exporting & Logistics Tab -->
                    <template #tab-4>
                        <div class="bg-white rounded-sm p-6">
                            <h2 class="text-title2 font-semibold mb-4">
                                {{ $t('profile.tabs.exportingLogistics') }}
                            </h2>
                            <div v-if="profileData.export_experience" class="space-y-4">
                                <div class="bg-green-50 border border-green-200 rounded-sm p-4">
                                    <h3 class="font-medium text-green-800 mb-2">
                                        {{ $t('profile.export.exportExperience') }}
                                    </h3>
                                    <p class="text-green-700">
                                        {{ $t('profile.export.exportSince') }}
                                        {{ profileData.export_since_year }}
                                    </p>
                                </div>
                                <div v-if="profileData.export_countries?.length" class="space-y-2">
                                    <h4 class="font-medium text-gray-900">
                                        {{ $t('profile.export.exportCountries') }}:
                                    </h4>
                                    <div class="flex flex-wrap gap-2">
                                        <span
                                            v-for="country in exportCountryNames"
                                            :key="country"
                                            class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                                        >
                                            {{ country }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div v-else class="text-center py-12 text-gray-500">
                                <Icon icon="export" size="xl" color="gray" />
                                <p class="mt-4">{{ $t('profile.export.noExportInfo') }}</p>
                            </div>
                        </div>
                    </template>

                    <!-- Certificates Tab -->
                    <template #tab-5>
                        <div class="bg-white rounded-sm p-6">
                            <h2 class="text-title2 font-semibold mb-4">
                                {{ $t('profile.tabs.certificates') }}
                            </h2>
                            <div class="text-center py-12 text-gray-500">
                                <Icon icon="certificate" size="xl" color="gray" />
                                <p class="mt-4">
                                    {{ $t('profile.emptyStates.noCertificatesAvailable') }}
                                </p>
                            </div>
                        </div>
                    </template>
                </Tabs2>
            </div>
        </div>

        <!-- Gallery Modal -->
        <Teleport to="body">
            <Transition name="modal-fade">
                <div
                    v-if="isGalleryModalOpen && currentGalleryImage"
                    class="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                >
                    <div
                        class="absolute inset-0 bg-gray-100/80 backdrop-blur-sm"
                        @click="closeGalleryModal"
                    ></div>

                    <div
                        class="relative bg-white rounded-sm shadow-2xl w-full max-w-2xl z-[9999]"
                        @click.stop
                    >
                        <button
                            v-if="
                                profileData.gallery_images && profileData.gallery_images.length > 1
                            "
                            class="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-sm transition-all duration-300 bg-white text-gray-600 hover:bg-red-50 hover:text-red-600 active:bg-red-500 active:text-white disabled:opacity-70 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:text-white border border-gray-600 hover:border-red-50 active:border-red-500"
                            :disabled="currentGalleryIndex === 0"
                            @click="previousGalleryImage"
                        >
                            <svg
                                class="w-6 h-6"
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

                        <button
                            v-if="
                                profileData.gallery_images && profileData.gallery_images.length > 1
                            "
                            class="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-sm transition-all duration-300 bg-white text-gray-600 hover:bg-red-50 hover:text-red-600 active:bg-red-500 active:text-white disabled:opacity-70 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:text-white border border-gray-600 hover:border-red-50 active:border-red-500"
                            :disabled="
                                currentGalleryIndex === profileData.gallery_images.length - 1
                            "
                            @click="nextGalleryImage"
                        >
                            <svg
                                class="w-6 h-6"
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

                        <div class="absolute top-3 right-3 z-10">
                            <ButtonClose size="lg" @click="closeGalleryModal" />
                        </div>

                        <div class="aspect-auto w-full flex items-center justify-center py-14 px-3">
                            <img
                                :src="currentGalleryImage.url"
                                :alt="currentGalleryImage.file_name"
                                class="max-w-full max-h-full object-contain"
                            />
                        </div>

                        <div
                            v-if="
                                profileData.gallery_images && profileData.gallery_images.length > 1
                            "
                            class="absolute bottom-4 left-1/2 -translate-x-1/2 text-gray-600 text-sm font-medium"
                        >
                            {{ currentGalleryIndex + 1 }}/{{ profileData.gallery_images.length }}
                        </div>
                    </div>
                </div>
            </Transition>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
    import type {
        ApiProfileUser,
        ProfileUser,
        ProfileTabItem,
        ProfileSocialData,
    } from '~/types/profile'
    import { ProfileService } from '~/services/profile'
    import { useStaticData } from '~/composables/useStaticData'
    import { storeToRefs } from 'pinia'
    import { useDashboardProductStore } from '~/stores/dashboardProduct'
    import { useToastNotification } from '~/composables/useToastNotification'
    import { useUserStore } from '~/stores/user'
    import { useI18n } from 'vue-i18n'
    import { useLocalePath } from '#imports'
    import { useChat } from '~/composables/socket/useChat'
    import { useNotificationEventBus } from '~/composables/notifications/handlers/useNotificationEventBus'

    definePageMeta({
        layout: 'default',
    })

    const route = useRoute()
    const router = useRouter()
    const { t } = useI18n()
    const localePath = useLocalePath()
    const toast = useToastNotification()
    const userStore = useUserStore()
    const { user } = storeToRefs(userStore)
    const dashboardProductStore = useDashboardProductStore()
    const { findCountryByCode, findBusinessTypeByCode, revenueRanges, employeeRanges } =
        useStaticData()
    const { handleStartChat } = useChat()
    const eventBus = useNotificationEventBus()

    const profileId = computed(() => route.params.profileId as string)
    const profileService = new ProfileService()

    const {
        sendConnectionRequest,
        showRemoveConnectionConfirmation,
        followUser,
        unfollowUser,
        showUnfollowConfirmation,
    } = useConnections()

    const activeTabIndex = ref(0)
    const displayRating = ref(0.0)
    const isFollowLoading = ref(false)
    const isConnectLoading = ref(false)
    const isChatLoading = ref(false)

    // User Products State
    const userProducts = ref<any[]>([])
    const userProductsMeta = ref<any>(null)
    const isLoadingUserProducts = ref(false)
    const hasLoadedUserProducts = ref(false)

    const socialState = ref<ProfileSocialData>({
        is_following: false,
        connection: {
            exists: false,
            status: null,
            id: undefined,
        },
    })

    const galleryContainer = ref<HTMLElement | null>(null)
    const showScrollLeft = ref(false)
    const showScrollRight = ref(false)
    const isGalleryModalOpen = ref(false)
    const currentGalleryIndex = ref(0)
    const SCROLL_AMOUNT = 250

    const isNotCurrentUser = computed(() => {
        return user.value?.id !== profileData.value?.id
    })

    const connectionState = computed(() => {
        if (!socialState.value?.connection) {
            return {
                isConnected: false,
                isPending: false,
                connectionId: undefined,
            }
        }

        return {
            isConnected:
                socialState.value.connection.exists &&
                socialState.value.connection.status === 'accepted',
            isPending:
                socialState.value.connection.exists &&
                socialState.value.connection.status === 'pending',
            connectionId: socialState.value.connection.id,
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

    const profilePhones = computed(() => {
        return profileData.value?.primary_contact?.phones || []
    })

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
            roles: apiData.roles || [],

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

    const { data, pending, error, refresh } = await useAsyncData(
        `profile-${profileId.value}`,
        async () => {
            if (!profileId.value) {
                throw createError({ statusCode: 404, statusMessage: 'Profile ID is required' })
            }
            try {
                const profileService = new ProfileService()
                const apiData = await profileService.getUserProfile(profileId.value)
                const transformedData = transformApiData(apiData)
                if (transformedData.social) {
                    socialState.value = { ...transformedData.social }
                }
                return transformedData
            } catch (err: any) {
                throw createError({
                    statusCode: err.statusCode || 500,
                    statusMessage: err?.details?.response?.message || 'Failed to load profile',
                })
            }
        },
        { watch: [profileId], key: `profile-${profileId.value}`, server: false }
    )

    const profileData = computed(() => data.value)

    const profileTabs = computed<ProfileTabItem[]>(() => [
        { key: 'tab-0', label: t('profile.tabs.companyProfile'), active: true },
        { key: 'tab-1', label: t('profile.tabs.newsFeed'), active: false },
        { key: 'tab-2', label: t('profile.tabs.brands'), active: false },
        {
            key: 'tab-3',
            label: t('profile.tabs.products'),
            count: profileData.value?.products_count || 0,
        },
        { key: 'tab-4', label: t('profile.tabs.exportingLogistics'), active: false },
        { key: 'tab-5', label: t('profile.tabs.certificates'), count: 12, active: false },
    ])

    const exportCountryNames = computed(() => {
        if (!profileData.value?.export_countries?.length) return []
        return profileData.value.export_countries
            .map((code) => {
                const country = findCountryByCode(code)
                return country?.name || code
            })
            .filter(Boolean)
    })

    const currentGalleryImage = computed(() => {
        if (!profileData.value?.gallery_images?.length) return null
        return profileData.value.gallery_images[currentGalleryIndex.value]
    })

    const productCategories = computed(() => {
        if (!userProducts.value || !Array.isArray(userProducts.value)) return []

        return userProducts.value.map((cat: any) => ({
            name: cat.category_name,
            slug: cat.category_slug,
            icon: cat.category_icon_raw_svg,
            productCount: cat.total,
        }))
    })

    const companyInformation = computed(() => {
        if (!profileData.value) return []

        const items = []

        if (profileData.value.legal_name) {
            items.push({
                label: t('company.lagalName'),
                value: profileData.value.legal_name,
            })
        }

        if (profileData.value.registration_number) {
            items.push({
                label: t('company.registerNumber'),
                value: profileData.value.registration_number,
            })
        }

        if (profileData.value.vat_number) {
            items.push({
                label: t('company.vatNumber'),
                value: profileData.value.vat_number,
            })
        }

        if (profileData.value.business_type) {
            items.push({
                label: t('company.businessType'),
                value: getBusinessTypeLabel(profileData.value.business_type),
            })
        }

        if (profileData.value.registration_year) {
            items.push({
                label: t('company.yearOfRegistration'),
                value: profileData.value.registration_year.toString(),
            })
        }

        if (profileData.value.website_url) {
            items.push({
                label: t('company.website'),
                value: profileData.value.website_url,
            })
        }

        if (profileData.value.revenue_range) {
            items.push({
                label: t('company.revenue'),
                value: getRevenueLabel(profileData.value.revenue_range),
            })
        }

        if (profileData.value.employee_count_range) {
            items.push({
                label: t('company.numberOfEmployees'),
                value: getEmployeeLabel(profileData.value.employee_count_range),
            })
        }

        if (profileData.value.address?.street) {
            items.push({
                label: t('company.street'),
                value: profileData.value.address.street,
            })
        }

        if (profileData.value.address?.city) {
            items.push({
                label: t('company.city'),
                value: profileData.value.address.city,
            })
        }

        if (profileData.value.address?.postal_code) {
            items.push({
                label: t('company.postalCode'),
                value: profileData.value.address.postal_code,
            })
        }

        if (profileData.value.address?.country_code) {
            items.push({
                label: t('company.location'),
                value:
                    findCountryByCode(profileData.value.address.country_code)?.name ||
                    profileData.value.address.country_code,
            })
        }

        if (profileData.value.primary_contact?.name) {
            items.push({
                label: t('profile.fields.contactPerson'),
                value: profileData.value.primary_contact.name,
            })
        }

        if (profileData.value.primary_contact?.email) {
            items.push({
                label: t('company.email'),
                value: profileData.value.primary_contact.email,
            })
        }

        if (profileData.value.primary_contact?.phones?.length) {
            items.push({
                label: t('company.phoneNumber'),
                value: profileData.value.primary_contact.phones.join(', '),
            })
        }

        if (profileData.value.primary_contact?.fax) {
            items.push({
                label: t('company.fax'),
                value: profileData.value.primary_contact.fax,
            })
        }

        return items
    })

    const isSupplier = computed(() => {
        if (!profileData.value?.roles?.length) return false
        return profileData.value.roles.some((role) => role.code === 'supplier')
    })

    const breadcrumbs = computed(() => {
        const items = [
            { label: t('home'), to: localePath('/marketplace') },
            { label: t('navigation.marketplace'), to: localePath('/marketplace'), current: true },
        ]
        if (profileData.value) {
            items.push({
                label: profileData.value.display_name,
                current: true,
            })
        }
        return items
    })

    const getRevenueLabel = (code: string) =>
        revenueRanges.value.find((r) => r.code === code)?.name || '--'
    const getEmployeeLabel = (code: string) =>
        employeeRanges.value.find((r) => r.code === code)?.name || '--'
    const getBusinessTypeLabel = (code: string) => findBusinessTypeByCode(code)?.name || code
    const getCompanyInitials = () =>
        profileData.value?.display_name
            ?.split(' ')
            .map((word) => word[0])
            .join('')
            .slice(0, 2)
            .toUpperCase() || 'CO'
    const formatCount = (count: number): string =>
        count >= 1000 ? `${(count / 1000).toFixed(1)}K` : count.toString()

    const updateGalleryScrollVisibility = () => {
        const el = galleryContainer.value
        if (!el) return
        showScrollLeft.value = el.scrollLeft > 10
        showScrollRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 10
    }

    const scrollGalleryLeft = () =>
        galleryContainer.value?.scrollBy({ left: -SCROLL_AMOUNT, behavior: 'smooth' })
    const scrollGalleryRight = () =>
        galleryContainer.value?.scrollBy({ left: SCROLL_AMOUNT, behavior: 'smooth' })

    const openGalleryModal = (index: number) => {
        currentGalleryIndex.value = index
        isGalleryModalOpen.value = true
        document.body.style.overflow = 'hidden'
    }

    const closeGalleryModal = () => {
        isGalleryModalOpen.value = false
        document.body.style.overflow = ''
    }

    const nextGalleryImage = () => {
        if (
            profileData.value?.gallery_images &&
            currentGalleryIndex.value < profileData.value.gallery_images.length - 1
        ) {
            currentGalleryIndex.value++
        }
    }

    const previousGalleryImage = () => {
        if (currentGalleryIndex.value > 0) currentGalleryIndex.value--
    }

    const handleAvatarError = (event: Event) =>
        ((event.target as HTMLImageElement).style.display = 'none')
    const handleCoverError = (event: Event) =>
        ((event.target as HTMLImageElement).style.display = 'none')
    const handleGalleryImageError = (event: Event) =>
        ((event.target as HTMLImageElement).src = '/images/content/placeholder-image.svg')

    const handleConnectToggle = async (): Promise<void> => {
        if (isConnectLoading.value || !profileData.value) return

        isConnectLoading.value = true

        try {
            const { isConnected, isPending, connectionId } = connectionState.value

            if ((isPending || isConnected) && connectionId) {
                const success = await showRemoveConnectionConfirmation(
                    profileData.value.display_name,
                    connectionId,
                    profileData.value.id,
                    isPending
                )

                if (success) {
                    // ✅ Optimistic update FIRST
                    socialState.value.connection = {
                        exists: false,
                        status: null,
                        id: undefined,
                    }

                    // ✅ Delayed refresh
                    setTimeout(async () => {
                        await refreshSocialState()
                    }, 500)
                }
            } else {
                // ✅ Check if already connected
                if (socialState.value.connection?.exists) {
                    toast.warning(t('connections.alreadyConnected'))
                    return
                }

                const success = await sendConnectionRequest(profileData.value.id)

                if (success) {
                    // ✅ Optimistic update FIRST
                    socialState.value.connection = {
                        exists: true,
                        status: 'pending',
                        id: undefined,
                    }

                    // ✅ Delayed refresh
                    setTimeout(async () => {
                        await refreshSocialState()
                    }, 500)
                }
            }
        } catch (error: any) {
            if (error.statusCode === 409) {
                toast.warning(error.message || t('connections.alreadyConnected'))
                // ✅ Refresh immediately on conflict
                await refreshSocialState()
            } else {
                toast.error(error.message || t('connections.error'))
            }
        } finally {
            isConnectLoading.value = false
        }
    }

    const handleFollowToggle = async (newFollowState: boolean): Promise<void> => {
        if (isFollowLoading.value || !profileData.value) return

        isFollowLoading.value = true
        const previousState = socialState.value.is_following

        try {
            if (newFollowState) {
                // ✅ Check current state before attempting follow
                if (socialState.value.is_following) {
                    toast.warning(t('connections.alreadyFollowing'))
                    isFollowLoading.value = false
                    return
                }

                // ✅ Optimistic update FIRST
                socialState.value.is_following = true

                const success = await followUser(profileData.value.id)

                if (success) {
                    // ✅ Delayed refresh to allow backend to update
                    setTimeout(async () => {
                        await refreshSocialState()
                    }, 500)
                } else {
                    // ❌ Revert on failure
                    socialState.value.is_following = previousState
                }
            } else {
                // ✅ Check current state before attempting unfollow
                if (!socialState.value.is_following) {
                    isFollowLoading.value = false
                    return
                }

                const success = await showUnfollowConfirmation(
                    profileData.value.display_name,
                    profileData.value.id
                )

                if (success) {
                    // ✅ Optimistic update FIRST
                    socialState.value.is_following = false

                    // ✅ Delayed refresh to allow backend to update
                    setTimeout(async () => {
                        await refreshSocialState()
                    }, 500)
                } else {
                    // User cancelled
                    socialState.value.is_following = previousState
                }
            }
        } catch (error: any) {
            // ❌ Revert on error
            socialState.value.is_following = previousState

            if (error.statusCode === 409) {
                toast.warning(error.message || t('connections.alreadyFollowing'))
                // ✅ Refresh immediately on conflict
                await refreshSocialState()
            } else {
                toast.error(error.message || t('connections.error'))
            }
        } finally {
            isFollowLoading.value = false
        }
    }
    const refreshSocialState = async (): Promise<boolean> => {
        if (!profileData.value?.id) return false

        try {
            const updatedSocial = await profileService.getSocialState(profileData.value.id)

            if (updatedSocial) {
                socialState.value = { ...updatedSocial }

                if (profileData.value.social) {
                    profileData.value.social = { ...updatedSocial }
                }

                return true
            }

            return false
        } catch (error) {
            console.error('[Profile] Failed to refresh social state:', error)
            return false
        }
    }

    const handleUserFollow = async (notification: Notification): Promise<void> => {
        try {
            const targetUserId = notification.target_user_id || notification.userId

            if (!targetUserId || !profileData.value) return

            // Only update if notification is about current profile
            if (Number(targetUserId) !== Number(profileData.value.id)) {
                return
            }

            await refreshSocialState()

            toast.info(
                notification.body ||
                    `${notification.userName || 'A user'} started following ${profileData.value.display_name}`,
                notification.title || 'New Follower'
            )
        } catch (error) {
            console.error('[Profile] Error handling user follow notification:', error)
        }
    }

    const handleUserUnfollow = async (notification: Notification): Promise<void> => {
        try {
            const targetUserId = notification.target_user_id || notification.userId

            if (!targetUserId || !profileData.value) return

            if (Number(targetUserId) !== Number(profileData.value.id)) {
                return
            }

            await refreshSocialState()
        } catch (error) {
            console.error('[Profile] Error handling user unfollow notification:', error)
        }
    }

    const handleConnectionRequestReceived = async (notification: Notification): Promise<void> => {
        try {
            const targetUserId = notification.target_user_id || notification.companyId

            if (!targetUserId || !profileData.value) return

            if (Number(targetUserId) !== Number(profileData.value.id)) {
                return
            }

            await refreshSocialState()

            toast.info(
                notification.body ||
                    `${notification.companyName || 'A company'} sent a connection request`,
                notification.title || 'Connection Request'
            )
        } catch (error) {
            console.error('[Profile] Error handling connection request:', error)
        }
    }

    const handleConnectionRequestAccepted = async (notification: Notification): Promise<void> => {
        try {
            const targetUserId = notification.target_user_id || notification.companyId

            if (!targetUserId || !profileData.value) return

            if (Number(targetUserId) !== Number(profileData.value.id)) {
                return
            }

            await refreshSocialState()

            toast.success(
                notification.body ||
                    `${notification.companyName || 'Company'} accepted your connection request`,
                notification.title || 'Connection Accepted'
            )
        } catch (error) {
            console.error('[Profile] Error handling connection accepted:', error)
        }
    }

    const handleConnectionRequestRejected = async (notification: Notification): Promise<void> => {
        try {
            const targetUserId = notification.target_user_id || notification.companyId

            if (!targetUserId || !profileData.value) return

            if (Number(targetUserId) !== Number(profileData.value.id)) {
                return
            }

            await refreshSocialState()

            toast.info(
                notification.body ||
                    `${notification.companyName || 'Company'} declined your connection request`,
                notification.title || 'Connection Declined'
            )
        } catch (error) {
            console.error('[Profile] Error handling connection rejected:', error)
        }
    }

    const handleConnectionRemoved = async (notification: Notification): Promise<void> => {
        try {
            const targetUserId = notification.target_user_id || notification.companyId

            if (!targetUserId || !profileData.value) return

            if (Number(targetUserId) !== Number(profileData.value.id)) {
                return
            }

            await refreshSocialState()

            toast.info(
                notification.body ||
                    `Connection with ${notification.companyName || 'company'} removed`,
                notification.title || 'Connection Removed'
            )
        } catch (error) {
            console.error('[Profile] Error handling connection removed:', error)
        }
    }

    const fetchUserProducts = async (): Promise<void> => {
        if (!profileData.value) return

        try {
            isLoadingUserProducts.value = true

            const response = await profileService.getUserProducts(profileData.value.id)

            // Response is direct array: [{ category_id, category_name, ... }]
            userProducts.value = response || []
            hasLoadedUserProducts.value = true
        } catch (error: any) {
            console.error('[Profile] Error fetching user products:', error)
            userProducts.value = []
            toast.error(t('profile.errors.failedToLoadProducts'))
        } finally {
            isLoadingUserProducts.value = false
        }
    }

    const handleChat = async (): Promise<void> => {
        if (!profileData.value) return

        try {
            const module =
                userStore.primaryRole === 'supplier'
                    ? 'supplier'
                    : userStore.primaryRole === 'buyer'
                      ? 'buyer'
                      : 'ecom'

            await handleStartChat(profileData.value.id, module)
        } catch (err) {
            console.error('Failed to start chat:', err)
            toast.error(t('chat.failedToStartChat'))
        }
    }

    const handlePhoneCall = (phone: string): void => {}

    const handleGalleryKeydown = (e: KeyboardEvent) => {
        if (!isGalleryModalOpen.value) return
        if (e.key === 'Escape') closeGalleryModal()
        else if (e.key === 'ArrowLeft') previousGalleryImage()
        else if (e.key === 'ArrowRight') nextGalleryImage()
    }

    watch(
        () => profileData.value?.gallery_images,
        (newImages) => {
            if (newImages && newImages.length > 0) {
                nextTick(() => {
                    setTimeout(() => {
                        updateGalleryScrollVisibility()
                    }, 100)
                })
            }
        },
        { immediate: true }
    )

    // Watch for active tab changes
    watch(
        () => activeTabIndex.value,
        (newTabIndex) => {
            // Tab 3 is Products tab
            if (newTabIndex === 3 && !hasLoadedUserProducts.value) {
                fetchUserProducts()
            }

            // Update query param when tab changes
            const tabMap: Record<number, string> = {
                0: 'profile',
                1: 'news',
                2: 'brands',
                3: 'products',
                4: 'logistics',
                5: 'certificates',
            }

            const tabName = tabMap[newTabIndex]
            if (tabName && route.query.tab !== tabName) {
                router.replace({
                    query: { ...route.query, tab: tabName },
                })
            }
        }
    )

    // Watch for query param changes
    watch(
        () => route.query.tab,
        (newTab) => {
            if (!newTab) return

            const tabIndexMap: Record<string, number> = {
                profile: 0,
                news: 1,
                brands: 2,
                products: 3,
                logistics: 4,
                certificates: 5,
            }

            const targetIndex = tabIndexMap[newTab as string]
            if (targetIndex !== undefined && activeTabIndex.value !== targetIndex) {
                activeTabIndex.value = targetIndex

                // Fetch products if switching to products tab AND profileData is loaded
                if (targetIndex === 3 && !hasLoadedUserProducts.value && profileData.value) {
                    fetchUserProducts()
                }
            }
        },
        { immediate: true }
    )

    // Watch profileData to handle initial load with ?tab=products
    watch(
        () => profileData.value,
        (newProfile) => {
            if (!newProfile) return

            // Check if we need to load products for initial tab
            const currentTab = route.query.tab
            if (currentTab === 'products' && !hasLoadedUserProducts.value) {
                fetchUserProducts()
            }
        },
        { immediate: true }
    )

    onMounted(async () => {
        window.addEventListener('keydown', handleGalleryKeydown)
        window.addEventListener('resize', updateGalleryScrollVisibility)

        nextTick(() => {
            if (galleryContainer.value) {
                updateGalleryScrollVisibility()
                galleryContainer.value.addEventListener('scroll', updateGalleryScrollVisibility)
            }
        })

        if (process.client && isNotCurrentUser.value) {
            registerNotificationHandlers()
        }
    })

    onBeforeUnmount(() => {
        window.removeEventListener('keydown', handleGalleryKeydown)
        if (galleryContainer.value) {
            galleryContainer.value.removeEventListener('scroll', updateGalleryScrollVisibility)
        }
        document.body.style.overflow = ''

        if (process.client && isNotCurrentUser.value) {
            unregisterNotificationHandlers()
        }
    })

    const registerNotificationHandlers = (): void => {
        eventBus.register('user_follow', handleUserFollow)
        eventBus.register('user_unfollow', handleUserUnfollow)
        eventBus.register('connection_request_received', handleConnectionRequestReceived)
        eventBus.register('connection_request_accepted', handleConnectionRequestAccepted)
        eventBus.register('connection_request_rejected', handleConnectionRequestRejected)
        eventBus.register('connection_removed', handleConnectionRemoved)
    }
    const unregisterNotificationHandlers = (): void => {
        eventBus.unregister('user_follow', handleUserFollow)
        eventBus.unregister('user_unfollow', handleUserUnfollow)
        eventBus.unregister('connection_request_received', handleConnectionRequestReceived)
        eventBus.unregister('connection_request_accepted', handleConnectionRequestAccepted)
        eventBus.unregister('connection_request_rejected', handleConnectionRequestRejected)
        eventBus.unregister('connection_removed', handleConnectionRemoved)
    }
    useSeoMeta({
        title: () =>
            profileData.value ? `${profileData.value.display_name} | LeMarkt` : 'Profile | LeMarkt',
        description: () => profileData.value?.business_description || 'Company profile on LeMarkt',
    })
</script>

<style scoped lang="scss">
    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    .animate-fade-in {
        animation: fadeIn 0.6s ease-out;
    }

    .scrollbar-hide::-webkit-scrollbar {
        display: none;
    }

    .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }

    .modal-fade-enter-active,
    .modal-fade-leave-active {
        transition: opacity 0.3s ease;
    }

    .modal-fade-enter-from,
    .modal-fade-leave-to {
        opacity: 0;
    }
</style>
