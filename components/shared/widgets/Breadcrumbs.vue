<template>
    <nav
        v-if="!loading && items.length"
        class="breadcrumbs"
        aria-label="Breadcrumb navigation"
        itemscope
        itemtype="https://schema.org/BreadcrumbList"
    >
        <ol class="breadcrumbs__list flex items-center gap-2 text-body">
            <li
                v-for="(item, index) in items"
                :key="item.label"
                class="breadcrumbs__item flex items-center gap-2"
                itemprop="itemListElement"
                itemscope
                itemtype="https://schema.org/ListItem"
            >
                <NuxtLink
                    v-if="index < items.length - 1"
                    :to="localPath(item.to)"
                    class="breadcrumbs__link text-gray-800 hover:text-gray-950 transition-colors active:scale-95"
                    itemprop="item"
                >
                    <template v-if="item.label === 'Home'">
                        <svg
                            class="w-6 h-4 text-red-500 hover:*:text-red-600 transition-colors active:scale-95"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 14 13"
                            fill="none"
                        >
                            <use xlink:href="/sprite.svg#logo_sm"></use>
                        </svg>
                    </template>
                    <template v-else>
                        <span itemprop="name">{{ item.label }}</span>
                    </template>
                    <meta itemprop="position" :content="index + 1" />
                    <meta itemprop="url" :content="`${domain}${item.to}`" />
                </NuxtLink>

                <span v-else class="breadcrumbs__current text-gray-800" itemprop="name">
                    {{ item.label }}
                    <meta itemprop="position" :content="index + 1" />
                </span>

                <span
                    v-if="index < items.length - 1"
                    class="breadcrumbs__separator text-gray-400"
                    aria-hidden="true"
                >
                    /
                </span>
            </li>
        </ol>
    </nav>

    <nav
        v-else-if="loading"
        class="breadcrumbs breadcrumbs--loading"
        aria-label="Loading breadcrumb navigation"
    >
        <div class="breadcrumbs__skeleton flex items-center gap-2">
            <div class="breadcrumbs__skeleton-item flex items-center gap-2">
                <div class="w-6 h-4 bg-gray-300 rounded animate-pulse"></div>
            </div>

            <div class="breadcrumbs__skeleton-separator">
                <div class="w-1 h-3 bg-gray-300 rounded animate-pulse"></div>
            </div>

            <div
                v-for="index in skeletonItemsCount"
                :key="`skeleton-${index}`"
                class="breadcrumbs__skeleton-item flex items-center gap-2"
            >
                <div
                    class="bg-gray-300 rounded animate-pulse"
                    :class="skeletonItemClasses(index)"
                ></div>

                <div v-if="index < skeletonItemsCount" class="breadcrumbs__skeleton-separator">
                    <div class="w-1 h-3 bg-gray-300 rounded animate-pulse"></div>
                </div>
            </div>
        </div>
    </nav>
</template>

<script setup lang="ts">
    const localPath = useLocalePath()
    const config = useRuntimeConfig()
    const domain = config.public?.domain ?? ''

    interface BreadcrumbItem {
        label: string
        to?: string
    }

    interface BreadcrumbsProps {
        items: BreadcrumbItem[]
        loading?: boolean
        skeletonItems?: number
    }

    const props = withDefaults(defineProps<BreadcrumbsProps>(), {
        loading: false,
        skeletonItems: 2,
    })

    const skeletonItemsCount = computed(() => {
        return Math.max(1, Math.min(props.skeletonItems, 4))
    })

    const skeletonItemClasses = (index: number) => {
        const widths = [
            'w-16 h-4', // Short item ~64px
            'w-20 h-4', // Medium item ~80px
            'w-24 h-4', // Long item ~96px
            'w-12 h-4', // Very short item ~48px
        ]

        return widths[(index - 1) % widths.length]
    }
</script>

<style scoped>
    .breadcrumbs--loading {
        @apply select-none pointer-events-none;
    }

    .breadcrumbs__skeleton-item {
        @apply flex-shrink-0;
    }

    .breadcrumbs__skeleton-separator {
        @apply flex-shrink-0 flex items-center justify-center px-1;
    }

    @media (max-width: 640px) {
        .breadcrumbs__skeleton-item:nth-child(n + 6) {
            @apply hidden;
        }

        .breadcrumbs__skeleton-separator:nth-child(n + 6) {
            @apply hidden;
        }
    }

    @media (max-width: 480px) {
        .breadcrumbs__skeleton-item:nth-child(n + 4) {
            @apply hidden;
        }

        .breadcrumbs__skeleton-separator:nth-child(n + 4) {
            @apply hidden;
        }
    }
</style>
