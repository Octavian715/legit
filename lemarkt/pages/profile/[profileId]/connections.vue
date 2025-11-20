<template>
    <div class="connections-page min-h-screen px-4 md:px-0">
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

        <!-- Loading State -->
        <div v-if="isLoading" class="space-y-0 bg-white">
            <CompanyCardSkeleton v-for="n in 5" :key="`skeleton-${n}`" />
        </div>

        <!-- Empty State -->
        <NoDataPage
            v-else-if="!isLoading && companies.length === 0"
            image="/images/content/no-found-products.svg"
            image-width="300px"
            image-height="250px"
            :title="t('connections.empty.title', 'No connections yet')"
            :description="
                t(
                    'connections.empty.description',
                    'When you connect with other businesses, they will appear here'
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
                :errors="validationErrors"
                @update:is-open="showFilters = $event"
                @apply="handleApplyFilters"
                @reset="handleResetFilters"
            />
        </ClientOnly>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
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

    // Lifecycle tracking
    const isMounted = ref(false)
    let abortController: AbortController | null = null

    // State
    const companies = ref<CompanyUser[]>([])
    const meta = ref<PaginationMeta | null>(null)
    const isLoading = ref(true) // Start with true to show skeleton on initial load
    const errorMsg = ref('')
    const showFilters = ref(false)
    const validationErrors = ref<Record<string, string[]>>({})
    // Filters for drawer
    const currentFilters = computed(() => ({
        search: searchQuery.value,
        companyName: companyNameFilter.value,
        email: emailFilter.value,
        username: usernameFilter.value,
    }))

    // Filters
    const currentPage = ref(1)
    const itemsPerPage = ref(20)
    const searchQuery = ref('')
    const companyNameFilter = ref('')
    const emailFilter = ref('')
    const usernameFilter = ref('')
    const sortBy = ref<'company_name' | 'products_count' | 'followers_count' | 'connections_count'>(
        'company_name'
    )
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
    const pageTitle = computed(() => t('connections.title'))
    const pageSubtitle = computed(() => (meta.value?.total ? `${meta.value.total} Results` : ''))

    const breadcrumbs = computed(() => [
        { label: t('home'), to: localePath('/') },
        { label: t('profile.title'), to: localePath(`/profile/${profileId.value}`) },
        { label: t('connections.title') },
    ])

    const sortOptions = computed(() => [
        { label: t('sorting.byAlphabetAZ'), value: 'company_name:asc' },
        { label: t('sorting.byAlphabetZA'), value: 'company_name:desc' },
        { label: t('sorting.productsMost'), value: 'products_count:desc' },
        { label: t('sorting.productsLeast'), value: 'products_count:asc' },
        { label: t('sorting.followersDesc'), value: 'followers_count:desc' },
        { label: t('sorting.followersAsc'), value: 'followers_count:asc' },
        { label: t('sorting.connectionsMost'), value: 'connections_count:desc' },
        { label: t('sorting.connectionsLeast'), value: 'connections_count:asc' },
    ])

    const currentSortLabel = computed(() => {
        const value = `${sortBy.value}:${sortOrder.value}`
        return sortOptions.value.find((o) => o.value === value)?.label || sortOptions.value[0].label
    })

    // Parse URL params
    const parseUrlParams = () => {
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
        const query: Record<string, any> = {}
        // Page 1 = default, nu apare în URL
        if (currentPage.value > 1) query.page = currentPage.value
        // 20 = default, nu apare în URL
        if (itemsPerPage.value !== 20) query.per_page = itemsPerPage.value
        if (searchQuery.value) query.search = searchQuery.value
        if (companyNameFilter.value) query.company_name = companyNameFilter.value
        if (emailFilter.value) query.email = emailFilter.value
        if (usernameFilter.value) query.username = usernameFilter.value
        if (sortBy.value !== 'company_name') query.sort_by = sortBy.value
        if (sortOrder.value !== 'asc') query.sort_order = sortOrder.value
        router.replace({ query })
    }

    // Fetch connections
    const fetchData = async () => {
        if (!isMounted.value) return

        try {
            abortController = new AbortController()
            isLoading.value = true
            errorMsg.value = ''

            const response = await userStore.fetchConnections(profileId.value, {
                page: currentPage.value,
                perPage: itemsPerPage.value,
                sortBy: sortBy.value,
                sortOrder: sortOrder.value,
                search: searchQuery.value || undefined,
                companyName: companyNameFilter.value || undefined,
                email: emailFilter.value || undefined,
                username: usernameFilter.value || undefined,
            })

            if (!isMounted.value) return

            if (response) {
                companies.value = response.data
                meta.value = response.meta
            }
        } catch (err: any) {
            if (err.name === 'AbortError') return
            if (!isMounted.value) return

            console.error('[connections] Fetch failed:', err)
            errorMsg.value = err.message || 'Failed to load connections'
            companies.value = []
            meta.value = null
        } finally {
            if (isMounted.value) {
                isLoading.value = false
            }
        }
    }

    // Event handlers
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

    const handleFollowToggle = async (companyId: number, newState: boolean) => {
        const company = companies.value.find((item) => item.id === companyId)

        if (!company) return

        company.social.isFollowing = newState
        company.social.followersCount = newState
            ? (company.social.followersCount || 0) + 1
            : Math.max(0, (company.social.followersCount || 0) - 1)
    }

    const handleConnectToggle = async (
        companyId: number,
        action: 'request' | 'rejected' | 'disconnect'
    ) => {
        const company = companies.value.find((item) => item.id === companyId)

        if (!company) return

        switch (action) {
            case 'request':
                // New connection request sent
                company.social.connection = {
                    id: null,
                    exists: true,
                    status: 'pending',
                }
                break

            case 'rejected':
                // Connection request cancelled
                company.social.connection = {
                    id: null,
                    exists: false,
                    status: null,
                }
                break

            case 'disconnect':
                // Connection removed
                company.social.connection = {
                    id: null,
                    exists: false,
                    status: null,
                }
                company.social.connectionsCount = Math.max(
                    0,
                    (company.social.connectionsCount || 0) - 1
                )
                break
        }
    }

    // Initialize
    onMounted(() => {
        isMounted.value = true
        parseUrlParams()
        fetchData()
    })

    onBeforeUnmount(() => {
        isMounted.value = false
        abortController?.abort()
    })

    // SEO
    useSeoMeta({
        title: () => `${t('connections.title')} | ${profileId.value} | LeMarkt`,
        description: () => t('connections.description'),
    })
</script>
