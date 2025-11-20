<template>
    <div class="followers-page min-h-screen px-4 md:px-0">
        <Breadcrumbs :items="breadcrumbs" :loading="isLoading" class="mb-4" />

        <PageHeader :title="pageTitle" :subtitle="pageSubtitle" :loading="isLoading">
            <template #right>
                <div class="flex items-center gap-3">
                    <label for="sort" class="hidden md:flex text-body text-gray-950">
                        {{ t('sorting.sortBy') }}
                    </label>
                    <Dropdown
                        id="sort"
                        :items="sortOptions"
                        :label="currentSortLabel"
                        trigger="click"
                        size="sm"
                        menu-alignment="right"
                        @select="handleSortSelect"
                    />
                    <span class="md:w-px h-6 mx-1 bg-gray-600"></span>
                    <Button
                        variant="ghost"
                        color="gray"
                        size="lg"
                        square
                        container-classes="!p-1"
                        :class="{ relative: hasFiltersApplied }"
                        @click="showFilters = true"
                    >
                        <svg class="w-4 h-4 flex-1"><use xlink:href="/sprite.svg#filter" /></svg>
                        <span
                            v-if="hasFiltersApplied"
                            class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"
                        ></span>
                    </Button>
                </div>
            </template>
        </PageHeader>

        <!-- Error State -->
        <div v-if="errorMsg" class="bg-white rounded-sm shadow-sm">
            <NoDataPage
                image="/images/error.svg"
                image-width="300px"
                image-height="250px"
                :title="t('error.title', 'Something went wrong')"
                :description="errorMsg"
                button-color="red"
                :button-label="t('error.tryAgain', 'Try Again')"
                @action="fetchData"
            />
        </div>

        <!-- Empty State -->
        <NoDataPage
            v-else-if="!isLoading && companies.length === 0"
            image="/images/content/no-companies.svg"
            image-width="300px"
            image-height="250px"
            :title="
                currentType === 'followers'
                    ? t('followers.empty.title', 'No followers yet')
                    : t('following.empty.title', 'Not following anyone yet')
            "
            :description="
                currentType === 'followers'
                    ? t(
                          'followers.empty.description',
                          'When users follow this profile, they will appear here'
                      )
                    : t(
                          'following.empty.description',
                          'When this profile follows other users, they will appear here'
                      )
            "
        />

        <!-- Content -->
        <div v-else class="space-y-0 bg-white">
            <CompanyCard
                v-for="company in companies || []"
                :key="company.id"
                :company="company"
                @follow-toggle="handleFollowToggle"
                @connect-toggle="handleConnectToggle"
            />
        </div>

        <Pagination
            v-if="meta"
            :current-page="currentPage"
            :total-pages="meta.lastPage"
            :total-items="meta.total"
            :items-per-page="itemsPerPage"
            @update:current-page="handlePageChange"
            @update:items-per-page="handleItemsPerPageChange"
        />

        <ClientOnly>
            <CompanyFiltersDrawer
                v-if="showFilters"
                :is-open="showFilters"
                :filters="currentFilters"
                @update:is-open="showFilters = $event"
                @apply="handleApplyFilters"
                @reset="handleResetFilters"
            />
        </ClientOnly>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, onMounted } from 'vue'
    import { useRoute, useRouter, useLocalePath } from '#imports'
    import { useI18n } from 'vue-i18n'
    import type { CompanyUser, PaginationMeta } from '~/types/connections'

    const route = useRoute()
    const router = useRouter()
    const localePath = useLocalePath()
    const { t } = useI18n()
    const userStore = useUserStore()

    definePageMeta({ layout: 'default' })

    const profileId = computed(() => route.params.profileId as string)

    // State
    const companies = ref<CompanyUser[]>([])
    const meta = ref<PaginationMeta | null>(null)
    const isLoading = ref(false)
    const errorMsg = ref('')
    const showFilters = ref(false)
    const validationErrors = ref<Record<string, string[]>>({})
    const currentType = ref<'followers' | 'following'>('followers')

    // Filters
    const currentPage = ref(1)
    const itemsPerPage = ref(20)
    const searchQuery = ref('')
    const companyNameFilter = ref('')
    const emailFilter = ref('')
    const usernameFilter = ref('')
    const sortBy = ref<'company_name' | 'followers_count'>('company_name')
    const sortOrder = ref<'asc' | 'desc'>('asc')

    // Computed
    const hasFiltersApplied = computed(
        () =>
            !!(
                searchQuery.value ||
                companyNameFilter.value ||
                emailFilter.value ||
                usernameFilter.value
            )
    )

    const pageTitle = computed(() =>
        currentType.value === 'followers' ? t('profile.followers') : t('following')
    )

    const pageSubtitle = computed(() => (meta.value?.total ? `${meta.value.total} Results` : ''))

    const breadcrumbs = computed(() => [
        { label: t('home'), to: localePath('/') },
        { label: t('profile.title'), to: localePath(`/profile/${profileId.value}`) },
        { label: pageTitle.value },
    ])

    const sortOptions = computed(() => [
        { label: t('sorting.byAlphabetAZ'), value: 'company_name:asc' },
        { label: t('sorting.byAlphabetZA'), value: 'company_name:desc' },
        { label: t('sorting.followersDesc'), value: 'followers_count:desc' },
        { label: t('sorting.followersAsc'), value: 'followers_count:asc' },
    ])

    const currentSortLabel = computed(() => {
        const value = `${sortBy.value}:${sortOrder.value}`
        return sortOptions.value.find((o) => o.value === value)?.label || sortOptions.value[0].label
    })

    const currentFilters = computed(() => ({
        search: searchQuery.value,
        companyName: companyNameFilter.value,
        email: emailFilter.value,
        username: usernameFilter.value,
    }))

    // Parse URL params
    const parseUrlParams = () => {
        if (route.query.type) currentType.value = route.query.type as any
        if (route.query.page) currentPage.value = Number(route.query.page)
        if (route.query.per_page) itemsPerPage.value = Number(route.query.per_page)
        if (route.query.search) searchQuery.value = String(route.query.search)
        if (route.query.company_name) companyNameFilter.value = String(route.query.company_name)
        if (route.query.email) emailFilter.value = String(route.query.email)
        if (route.query.username) usernameFilter.value = String(route.query.username)
        if (route.query.sort_by) sortBy.value = route.query.sort_by as any
        if (route.query.sort_order) sortOrder.value = route.query.sort_order as any
    }

    // Update URL
    const updateUrl = () => {
        const query: Record<string, any> = { type: currentType.value }
        if (currentPage.value > 1) query.page = currentPage.value
        if (itemsPerPage.value !== 20) query.per_page = itemsPerPage.value
        if (searchQuery.value) query.search = searchQuery.value
        if (companyNameFilter.value) query.company_name = companyNameFilter.value
        if (emailFilter.value) query.email = emailFilter.value
        if (usernameFilter.value) query.username = usernameFilter.value
        if (sortBy.value !== 'company_name') query.sort_by = sortBy.value
        if (sortOrder.value !== 'asc') query.sort_order = sortOrder.value
        router.replace({ query })
    }

    // Fetch followers/following
    const fetchData = async () => {
        try {
            isLoading.value = true
            errorMsg.value = ''

            const response = await userStore.fetchFollowers(profileId.value, {
                type: currentType.value,
                page: currentPage.value,
                perPage: itemsPerPage.value,
                sortBy: sortBy.value,
                sortOrder: sortOrder.value,
                search: searchQuery.value || undefined,
                companyName: companyNameFilter.value || undefined,
                email: emailFilter.value || undefined,
                username: usernameFilter.value || undefined,
            })

            if (response) {
                companies.value = response.data
                meta.value = response.meta
            }
        } catch (err: any) {
            console.error('[followers] Fetch failed:', err)
            errorMsg.value = err.message || 'Failed to load data'
            companies.value = []
            meta.value = null
        } finally {
            isLoading.value = false
        }
    }

    // Event handlers
    const handleTypeChange = async (type: 'followers' | 'following') => {
        if (currentType.value === type) return

        currentType.value = type
        currentPage.value = 1
        updateUrl()
        await fetchData()
    }

    const handlePageChange = async (page: number) => {
        currentPage.value = page
        updateUrl()
        await fetchData()
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleItemsPerPageChange = async (perPage: number) => {
        itemsPerPage.value = perPage
        currentPage.value = 1
        updateUrl()
        await fetchData()
    }

    const handleSortSelect = async (value: string) => {
        const [field, order] = value.split(':')
        sortBy.value = field as any
        sortOrder.value = order as any
        currentPage.value = 1
        updateUrl()
        await fetchData()
    }

    const handleApplyFilters = async (filters: Record<string, any>) => {
        validationErrors.value = {}
        searchQuery.value = filters.search || ''
        companyNameFilter.value = filters.companyName || ''
        emailFilter.value = filters.email || ''
        usernameFilter.value = filters.username || ''
        currentPage.value = 1
        updateUrl()
        await fetchData()
        showFilters.value = false
    }

    const handleResetFilters = async () => {
        searchQuery.value = ''
        companyNameFilter.value = ''
        emailFilter.value = ''
        usernameFilter.value = ''
        currentPage.value = 1
        const query = { type: currentType.value }
        router.replace({ query })
        await fetchData()
        showFilters.value = false
    }

    const handleFollowToggle = async () => {
        await fetchData()
    }

    const handleConnectToggle = async () => {
        await fetchData()
    }

    // Initialize
    onMounted(async () => {
        parseUrlParams()
        await fetchData()
    })

    // SEO
    useSeoMeta({
        title: () => `${pageTitle.value} | ${profileId.value} | LeMarkt`,
        description: () => `View ${currentType.value} for ${profileId.value}`,
    })
</script>
