<template>
    <div
        v-if="company && company.companyDetails && company.social"
        class="company-card bg-white border-b border-gray-300 p-2"
    >
        <!-- Desktop Layout -->
        <div class="hidden lg:grid lg:grid-cols-[140px_1fr_auto] gap-4 items-stretch">
            <NuxtLink
                :to="localePath(`/profile/${company.companyDetails.username}`)"
                class="h-full"
            >
                <div
                    class="w-full h-full rounded-sm border border-gray-400 bg-gray-50 flex items-center justify-center overflow-hidden hover:border-blue-500 transition-colors"
                >
                    <img
                        v-if="company.picture"
                        :src="company.picture"
                        :alt="company.companyDetails.legalName"
                        class="w-full h-full object-cover aspect-square"
                        @error="handleImageError"
                    />
                    <span v-else class="text-gray-800 font-bold text-subtitle3">{{
                        getInitials(company.companyDetails.legalName)
                    }}</span>
                </div>
            </NuxtLink>

            <div class="flex flex-col p-3 gap-3 min-w-0 rounded-sm border border-gray-400">
                <div class="flex items-center justify-between gap-4 flex-wrap">
                    <div class="flex items-center gap-2 flex-1">
                        <span class="text-subtitle4 text-gray-800">{{ t('supplier') }}:</span>
                        <NuxtLink
                            :to="localePath(`/profile/${company.companyDetails.username}`)"
                            class="text-body text-blue-600 hover:underline font-medium"
                            >{{ company.companyDetails.legalName }}</NuxtLink
                        >
                        <svg v-if="isVerified" class="w-4 h-4 text-blue-500">
                            <use xlink:href="/sprite.svg#verified" />
                        </svg>
                        <svg v-if="isConnected" class="w-4 h-4 text-red-500">
                            <use xlink:href="/sprite.svg#connected" />
                        </svg>
                    </div>

                    <div class="flex items-center gap-4 shrink-0 flex-wrap">
                        <div class="flex items-center gap-3 text-subtitle4">
                            <div class="flex items-center gap-1">
                                <span class="font-bold text-gray-950">{{ rating }}</span>
                                <svg class="w-4 h-4 text-yellow-500">
                                    <use xlink:href="/sprite.svg#star-full" />
                                </svg>
                            </div>
                            <span class="w-px h-4 bg-gray-400"></span>
                            <div class="flex items-center gap-1">
                                <span class="font-bold text-gray-950">{{
                                    company.social.productsCount
                                }}</span>
                                <span class="text-gray-800">{{
                                    t('products', company.social.productsCount)
                                }}</span>
                            </div>
                            <span class="w-px h-4 bg-gray-400"></span>
                            <div class="flex items-center gap-1">
                                <span class="font-bold text-gray-950">{{ postsCount }}</span>
                                <span class="text-gray-800">{{ t('posts', postsCount) }}</span>
                            </div>
                            <span class="w-px h-4 bg-gray-400"></span>
                            <div class="flex items-center gap-1">
                                <span class="font-bold text-gray-950">{{
                                    formatCount(company.social.followersCount)
                                }}</span>
                                <span class="text-gray-800">{{ t('profile.followers') }}</span>
                            </div>
                            <span class="w-px h-4 bg-gray-400"></span>
                            <div class="flex items-center gap-1">
                                <span class="font-bold text-gray-950">{{
                                    company.social.connectionsCount
                                }}</span>
                                <span class="text-gray-800">{{ t('profile.connections') }}</span>
                            </div>
                        </div>

                        <div class="flex items-center gap-2">
                            <Button
                                variant="filled"
                                color="gray"
                                size="sm"
                                container-classes="flex-1 md:flex-initial"
                                :loading="isFollowLoading"
                                @click="handleFollowToggle"
                            >
                                {{
                                    company.social.isFollowing
                                        ? t('connections.unfollow')
                                        : t('connections.follow')
                                }}
                            </Button>
                            <Button
                                variant="filled"
                                :color="isConnected ? 'gray' : 'red'"
                                size="sm"
                                container-classes="flex-1 md:flex-initial"
                                :loading="isConnectLoading"
                                @click="handleConnectToggle"
                            >
                                <span class="flex items-center gap-1">
                                    <svg v-if="!isConnected && !isPending" class="w-3 h-3">
                                        <use xlink:href="/sprite.svg#connected"></use>
                                    </svg>
                                    <svg v-if="isConnected" class="w-3 h-3">
                                        <use xlink:href="/sprite.svg#disconnect"></use>
                                    </svg>
                                    {{ connectionButtonText }}
                                </span>
                            </Button>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-5 gap-x-4 gap-y-1 pt-3 border-t border-gray-400">
                    <div class="text-subtitle4 text-gray-800">{{ t('company.lagalName') }}</div>
                    <div class="text-subtitle4 text-gray-800">{{ t('username') }}</div>
                    <div class="text-subtitle4 text-gray-800">{{ t('company.website') }}</div>
                    <div class="text-subtitle4 text-gray-800">{{ t('email') }}</div>
                    <div class="text-subtitle4 text-gray-800">{{ t('contact.phoneNumbers') }}</div>

                    <div class="text-subtitle4 text-gray-950">{{
                        company.companyDetails.legalName
                    }}</div>
                    <div class="text-subtitle4 text-gray-950"
                        >@{{ company.companyDetails.username }}</div
                    >
                    <div class="text-subtitle4 text-gray-950">
                        <a
                            v-if="company.companyDetails.websiteUrl"
                            :href="formatWebsiteUrl(company.companyDetails.websiteUrl)"
                            target="_blank"
                            class="text-blue-600 hover:underline"
                            >{{ company.companyDetails.websiteUrl }}</a
                        >
                    </div>
                    <div class="text-subtitle4 text-gray-950">
                        <a
                            v-if="company.email"
                            :href="`mailto:${company.email}`"
                            class="text-blue-600 hover:underline"
                            >{{ company.email }}</a
                        >
                    </div>
                    <div
                        v-if="company.phoneNumbers.length"
                        class="text-subtitle4 text-gray-950 flex flex-col gap-1"
                    >
                        <span v-for="(phone, index) in company.phoneNumbers" :key="index">{{
                            formatFullPhoneNumber(phone.countryCode, phone.phoneNumber)
                        }}</span>
                    </div>
                </div>
            </div>

            <div
                class="flex flex-col gap-2 shrink-0 bg-gray-200 border border-gray-400 p-2 rounded-sm"
            >
                <Button
                    color="gray"
                    variant="ghost"
                    square
                    size="md"
                    font-weight="normal"
                    container-classes="base-btn"
                    :disabled="isChatLoading"
                    :loading="isChatLoading"
                    @click="handleChatClick"
                >
                    <svg class="w-4 h-4">
                        <use xlink:href="/sprite.svg#message" />
                    </svg>
                </Button>
                <VDropdown
                    v-if="company.phoneNumbers.length > 0"
                    :triggers="['click']"
                    :auto-hide="true"
                    placement="bottom-start"
                    :distance="6"
                    theme="phone-dropdown"
                >
                    <Button
                        color="gray"
                        variant="ghost"
                        square
                        size="md"
                        font-weight="normal"
                        container-classes="base-btn"
                    >
                        <svg class="w-4 h-4">
                            <use xlink:href="/sprite.svg#calling" />
                        </svg>
                    </Button>
                    <template #popper>
                        <div
                            class="bg-white rounded-md shadow border border-gray-200 overflow-hidden min-w-[100px] max-w-[280px]"
                        >
                            <div class="py-1 max-h-[300px] overflow-y-auto">
                                <button
                                    v-for="(phone, index) in company.phoneNumbers"
                                    :key="`phone-${index}`"
                                    type="button"
                                    class="w-full flex items-center gap-3 px-2 py-3 hover:bg-red-50 transition-all duration-200 cursor-pointer group"
                                    @click="handlePhoneCall(phone)"
                                >
                                    <div
                                        class="flex-1 min-w-0 flex flex-col text-body text-gray-950 group-hover:text-red-500 transition-colors duration-200"
                                    >
                                        <span>+{{ formatPhoneNumber(phone.phoneNumber) }}</span>
                                        <span
                                            v-if="phone.type"
                                            class="capitalize mt-0.5 text-caption1"
                                        >
                                            {{ getPhoneTypeLabel(phone.type) }}
                                        </span>
                                    </div>

                                    <svg
                                        class="w-4 h-4 text-gray-600 group-hover:opacity-100 group-hover:text-red-500 transition-all duration-200 flex-shrink-0"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path
                                            fill-rule="evenodd"
                                            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                            clip-rule="evenodd"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </template>
                </VDropdown>
                <Button
                    color="gray"
                    variant="ghost"
                    square
                    size="md"
                    font-weight="normal"
                    container-classes="base-btn"
                    @click="handleShare"
                >
                    <svg class="w-4 h-4"><use xlink:href="/sprite.svg#share" /></svg>
                </Button>
            </div>
        </div>

        <!-- Mobile Layout -->
        <div class="lg:hidden flex flex-col gap-4">
            <div class="flex items-start gap-3">
                <NuxtLink
                    :to="localePath(`/profile/${company.companyDetails.username}`)"
                    class="shrink-0"
                >
                    <div
                        class="w-20 h-20 rounded border border-gray-400 bg-gray-50 flex items-center justify-center overflow-hidden hover:border-blue-500 transition-colors"
                    >
                        <img
                            v-if="company.picture"
                            :src="company.picture"
                            :alt="company.companyDetails.legalName"
                            class="w-full h-full object-cover"
                            @error="handleImageError"
                        />
                        <span v-else class="text-red-600 font-bold text-subtitle3">{{
                            getInitials(company.companyDetails.legalName)
                        }}</span>
                    </div>
                </NuxtLink>

                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap mb-1">
                        <span class="text-body text-gray-800">{{ t('supplier') }}:</span>

                        <Link
                            :to="localePath(`/profile/${company.companyDetails.username}`)"
                            :title="company.companyDetails.username"
                            :wrap="false"
                            container-class="lg:text-nowrap"
                            size="sm"
                        />

                        <svg v-if="isVerified" class="w-3 h-3 text-blue-500">
                            <use xlink:href="/sprite.svg#verified" />
                        </svg>
                        <svg v-if="isConnected" class="w-3 h-3 text-red-500">
                            <use xlink:href="/sprite.svg#connected" />
                        </svg>
                    </div>

                    <div class="flex flex-wrap items-center gap-2 text-caption1">
                        <div class="flex items-center gap-1">
                            <span class="font-bold text-gray-950">{{ rating }}</span>
                            <svg class="w-3 h-3 text-yellow-500">
                                <use xlink:href="/sprite.svg#star-full" />
                            </svg>
                        </div>
                        <span class="w-px h-3 bg-gray-400"></span>
                        <div class="flex items-center gap-1">
                            <span class="font-bold text-gray-950">{{
                                company.social.productsCount
                            }}</span>
                            <span class="text-gray-800">{{
                                t('products', company.social.productsCount)
                            }}</span>
                        </div>
                        <span class="w-px h-3 bg-gray-400"></span>
                        <div class="flex items-center gap-1">
                            <span class="font-bold text-gray-950">{{ postsCount }}</span>
                            <span class="text-gray-800">{{ t('posts', postsCount) }}</span>
                        </div>
                        <span class="w-px h-3 bg-gray-400"></span>
                        <div class="flex items-center gap-1">
                            <span class="font-bold text-gray-950">{{
                                formatCount(company.social.followersCount)
                            }}</span>
                            <span class="text-gray-800">{{ t('profile.followers') }}</span>
                        </div>
                        <span class="w-px h-3 bg-gray-400"></span>
                        <div class="flex items-center gap-1">
                            <span class="font-bold text-gray-950">{{
                                company.social.connectionsCount
                            }}</span>
                            <span class="text-gray-800">{{ t('profile.connections') }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-x-4 gap-y-2">
                <div class="space-y-1">
                    <div class="text-subtitle4 text-gray-800">{{ t('company.lagalName') }}</div>
                    <div class="text-subtitle4 text-gray-950 break-words">{{
                        company.companyDetails.legalName
                    }}</div>
                </div>
                <div class="space-y-1">
                    <div class="text-subtitle4 text-gray-800">{{ t('username') }}</div>
                    <div class="text-subtitle4 text-gray-950 break-words"
                        >@{{ company.companyDetails.username }}</div
                    >
                </div>
                <div v-if="company.companyDetails.websiteUrl" class="space-y-1">
                    <div class="text-subtitle4 text-gray-800">{{ t('company.website') }}</div>
                    <a
                        :href="formatWebsiteUrl(company.companyDetails.websiteUrl)"
                        target="_blank"
                        class="text-subtitle4 text-blue-600 hover:underline break-all"
                        >{{ company.companyDetails.websiteUrl }}</a
                    >
                </div>
                <div v-if="company.email" class="space-y-1">
                    <div class="text-subtitle4 text-gray-800">{{ t('email') }}</div>
                    <a
                        :href="`mailto:${company.email}`"
                        class="text-subtitle4 text-blue-600 hover:underline break-all"
                        >{{ company.email }}</a
                    >
                </div>
                <div v-if="company.phoneNumbers.length" class="space-y-1 col-span-2">
                    <div class="text-subtitle4 text-gray-800">{{ t('contact.phoneNumbers') }}</div>
                    <div class="flex flex-col gap-1 text-subtitle4 text-gray-950">
                        <span v-for="(phone, index) in company.phoneNumbers" :key="index">{{
                            formatFullPhoneNumber(phone.countryCode, phone.phoneNumber)
                        }}</span>
                    </div>
                </div>
            </div>

            <div class="flex flex-col md:flex-row gap-2 flex-1">
                <div class="flex gap-2">
                    <Button
                        variant="filled"
                        color="gray"
                        size="sm"
                        container-classes="flex-1 md:flex-initial"
                        :loading="isFollowLoading"
                        @click="handleFollowToggle"
                    >
                        {{
                            company.social.isFollowing
                                ? t('connections.unfollow')
                                : t('connections.follow')
                        }}
                    </Button>
                    <Button
                        variant="filled"
                        :color="isConnected ? 'gray' : 'red'"
                        size="sm"
                        container-classes="flex-1 md:flex-initial"
                        :loading="isConnectLoading"
                        @click="handleConnectToggle"
                    >
                        <span class="flex items-center gap-1">
                            <svg v-if="!isConnected && !isPending" class="w-3 h-3">
                                <use xlink:href="/sprite.svg#connected"></use>
                            </svg>
                            <svg v-if="isConnected" class="w-3 h-3">
                                <use xlink:href="/sprite.svg#disconnect"></use>
                            </svg>
                            {{ connectionButtonText }}
                        </span>
                    </Button>
                </div>

                <div
                    class="flex justify-around gap-2 bg-gray-200 border border-gray-400 p-2 rounded-sm shrink-0 flex-1"
                >
                    <!-- <Button
                        color="gray"
                        variant="ghost"
                        square
                        size="md"
                        font-weight="normal"
                        container-classes="base-btn"
                        :disabled="isChatLoading"
                        :loading="isChatLoading"
                        @click="handleChatClick"
                    >
                        <svg class="w-4 h-4">
                            <use xlink:href="/sprite.svg#message" />
                        </svg>
                    </Button> -->
                    <VDropdown
                        v-if="company.phoneNumbers.length > 0"
                        :triggers="['click']"
                        :auto-hide="true"
                        placement="bottom-start"
                        :distance="6"
                        theme="phone-dropdown"
                    >
                        <Button
                            color="gray"
                            variant="ghost"
                            square
                            size="md"
                            font-weight="normal"
                            container-classes="base-btn"
                        >
                            <svg class="w-4 h-4">
                                <use xlink:href="/sprite.svg#calling" />
                            </svg>
                        </Button>
                        <template #popper>
                            <div
                                class="bg-white rounded-md shadow border border-gray-200 overflow-hidden min-w-[100px] max-w-[280px]"
                            >
                                <div class="py-1 max-h-[300px] overflow-y-auto">
                                    <button
                                        v-for="(phone, index) in company.phoneNumbers"
                                        :key="`phone-${index}`"
                                        type="button"
                                        class="w-full flex items-center gap-3 px-2 py-3 hover:bg-red-50 transition-all duration-200 cursor-pointer group"
                                        @click="handlePhoneCall(phone)"
                                    >
                                        <div
                                            class="flex-1 min-w-0 flex flex-col text-body text-gray-950 group-hover:text-red-500 transition-colors duration-200"
                                        >
                                            <span>+{{ formatPhoneNumber(phone.phoneNumber) }}</span>
                                            <span
                                                v-if="phone.type"
                                                class="capitalize mt-0.5 text-caption1"
                                            >
                                                {{ getPhoneTypeLabel(phone.type) }}
                                            </span>
                                        </div>

                                        <svg
                                            class="w-4 h-4 text-gray-600 group-hover:opacity-100 group-hover:text-red-500 transition-all duration-200 flex-shrink-0"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path
                                                fill-rule="evenodd"
                                                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                                clip-rule="evenodd"
                                            />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </template>
                    </VDropdown>
                    <!-- <Button
                        color="gray"
                        variant="ghost"
                        square
                        size="md"
                        font-weight="normal"
                        container-classes="base-btn"
                        @click="handleShare"
                    >
                        <svg class="w-4 h-4 flex-shrink-0">
                            <use xlink:href="/sprite.svg#connected"></use>
                        </svg>
                    </Button>
                    <Button
                        color="gray"
                        variant="ghost"
                        square
                        size="md"
                        font-weight="normal"
                        container-classes="base-btn"
                        :disabled="isChatLoading"
                        :loading="isChatLoading"
                        @click="handleChatClick"
                    >
                        <svg class="w-4 h-4">
                            <use xlink:href="/sprite.svg#message" />
                        </svg>
                    </Button> -->
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { computed, ref } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { useLocalePath } from '#imports'
    import { useUserStore } from '~/stores/user'
    import { useConnections } from '~/composables/useConnections'
    import { useChat } from '~/composables/socket/useChat'
    import type { CompanyUser } from '~/types/connections'
    import Link from '~/components/ui/Link.vue'
    import { useToastNotification } from '~/composables/useToastNotification'

    interface Props {
        company: CompanyUser
    }

    const props = defineProps<Props>()
    const emit = defineEmits<{
        (e: 'follow-toggle', companyId: number, newState: boolean): void
        (e: 'connect-toggle', companyId: number): void
    }>()

    const { t } = useI18n()
    const localePath = useLocalePath()
    const userStore = useUserStore()
    const { showRemoveConnectionConfirmation } = useConnections()
    const { handleStartChat } = useChat()
    const { showSuccess, showError } = useToast()

    const isFollowLoading = ref(false)
    const isConnectLoading = ref(false)
    const isChatLoading = ref(false)

    const isVerified = computed(() => props.company?.verificationStatus === 'verified')
    const isPending = computed(() => props.company?.social?.connection?.status === 'pending')
    const isConnected = computed(() => props.company?.social?.connection?.status === 'accepted')
    const rating = computed(() => props.company?.rating || 4.8)
    const postsCount = computed(() => props.company?.postsCount || 0)

    const connectionButtonText = computed(() => {
        if (!props.company?.social?.connection) return t('connections.connect')
        if (isPending.value || isConnected.value) return t('connections.disconnect')
        return t('connections.connect')
    })

    const getInitials = (name: string) =>
        name
            .split(' ')
            .map((w) => w[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()
    const formatCount = (count: number): string =>
        count >= 1000 ? `${(count / 1000).toFixed(1)}K` : count.toString()
    const formatWebsiteUrl = (url: string): string =>
        !url ? '' : url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`
    const handleImageError = (event: Event) => {
        ;(event.target as HTMLImageElement).style.display = 'none'
    }

    const handleFollowToggle = () =>
        emit('follow-toggle', props.company.id, !props.company.social.isFollowing)

    const handleConnectToggle = async () => {
        if (!props.company?.social?.connection) {
            emit('connect-toggle', props.company.id)
            return
        }

        try {
            if (isPending.value || isConnected.value) {
                if (!props.company.social.connection.id) return error(t('connections.error'))
                await showRemoveConnectionConfirmation(
                    props.company.companyDetails.legalName,
                    props.company.social.connection.id,
                    props.company.id,
                    isPending.value
                )
            } else {
                emit('connect-toggle', props.company.id)
            }
        } catch (error: any) {
            if (error.statusCode !== 409) error(error.message || t('connections.error'))
        }
    }

    const handleChatClick = async () => {
        try {
            isChatLoading.value = true
            const module =
                userStore.primaryRole === 'supplier'
                    ? 'supplier'
                    : userStore.primaryRole === 'buyer'
                      ? 'buyer'
                      : 'ecom'
            await handleStartChat(props.company.id, module)
        } catch (error) {
            error(t('chat.failedToStartChat'))
        } finally {
            isChatLoading.value = false
        }
    }

    const formatPhoneNumber = (phoneNumber: string): string => {
        if (!phoneNumber) return ''

        const cleaned = phoneNumber.replace(/\D/g, '')

        if (cleaned.length <= 6) {
            return cleaned
        } else if (cleaned.length <= 9) {
            return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`
        } else {
            return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`
        }
    }

    const formatFullPhoneNumber = (countryCode: string, phoneNumber: string): string => {
        if (!phoneNumber) return ''

        // Remove any non-digit characters from country code for comparison
        const cleanedCountryCode = countryCode.replace(/\D/g, '')

        // Check if phoneNumber already starts with the country code (with or without +)
        const phoneWithoutPlus = phoneNumber.replace(/^\+/, '')

        if (phoneWithoutPlus.startsWith(cleanedCountryCode)) {
            // Phone number already contains country code, just return it with + prefix
            return phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`
        }

        // Phone number doesn't contain country code, combine them
        return `${countryCode} ${phoneNumber}`
    }

    const getPhoneTypeLabel = (type: string): string => {
        const typeMap: Record<string, string> = {
            mobile: t('phone.mobile'),
            office: t('phone.office'),
            home: t('phone.home'),
            fax: t('phone.fax'),
        }
        return typeMap[type.toLowerCase()] || type
    }

    const handlePhoneCall = (phone: { countryCode: string; phoneNumber: string }) => {
        window.location.href = `tel:${phone.countryCode}${phone.phoneNumber}`
    }

    const handleShare = async () => {
        const url = `${window.location.origin}${localePath(`/profile/${props.company.companyDetails.username}`)}`
        if (navigator.share) {
            try {
                await navigator.share({ title: props.company.companyDetails.legalName, url })
            } catch (err) {}
        } else {
            await navigator.clipboard.writeText(url)
            showSuccess(t('linkCopied'))
        }
    }
</script>

<style lang="css" scoped>
    .base-btn {
        @apply text-gray-950 w-fit !p-0;
        @apply hover:bg-blue-50 hover:!text-blue-500;
        @apply active:bg-blue-100 active:!text-blue-600;
    }
</style>
