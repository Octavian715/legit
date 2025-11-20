<template>
    <div class="products-section rounded-md">
        <h2 v-if="title" class="text-subtitle2 font-medium mb-3">{{ title }}</h2>
        <transition-group
            name="fade-list"
            tag="div"
            class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3"
        >
            <NuxtLink
                v-for="(product, index) in products"
                :key="product.slug"
                class="product-card group rounded-md p-4 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-white relative overflow-hidden border border-gray-600 hover:border-blue-300 opacity-0 animate-fade-in"
                :style="{ animationDelay: `${index * 50}ms` }"
                :to="localePath(`/marketplace/category/${product.slug}`)"
            >
                <div class="flex items-center justify-between gap-3">
                    <!-- Icon with SVG -->
                    <div
                        v-if="product.icon"
                        class="product w-[72px] h-[72px] bg-blue-50 text-blue-500 rounded-sm flex items-center justify-center flex-shrink-0 ml-2 transition-all duration-300 group-hover:bg-blue-100 group-hover:scale-110 group-hover:rotate-6"
                        v-html="product.icon"
                    />

                    <!-- Or Image fallback -->
                    <div
                        v-else-if="product.image"
                        class="product w-12 h-12 bg-blue-50 rounded-sm overflow-hidden flex-shrink-0 ml-2 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6"
                    >
                        <img
                            :src="product.image"
                            :alt="product.name"
                            class="w-full h-full object-cover"
                        />
                    </div>

                    <div class="flex-1">
                        <h4
                            class="text-subtitle2 text-gray-800 line-clamp-2 group-hover:text-blue-600 transition-colors duration-300"
                        >
                            {{ product.name }}
                        </h4>
                        <p
                            class="text-h2 font-medium text-gray-950 group-hover:text-blue-700 transition-colors duration-300"
                        >
                            {{ product.productCount }}
                        </p>
                    </div>

                    <!-- SVG Redirect with animation -->
                    <div class="relative flex-shrink-0">
                        <svg
                            class="h-9 w-9 text-gray-800 transition-all duration-300 group-hover:text-blue-600 group-hover:translate-x-2 group-hover:-translate-y-2 group-hover:scale-125 relative z-10"
                        >
                            <use :xlink:href="`/sprite.svg#redirect`"></use>
                        </svg>
                    </div>
                </div>

                <!-- Animated gradient background -->
                <div
                    class="absolute inset-0 bg-gradient-to-br from-blue-50/0 via-blue-50/30 to-red-50/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md -z-10"
                />

                <!-- Border shine effect -->
                <div
                    class="absolute inset-0 border border-transparent group-hover:border-blue-300 rounded-md transition-all duration-300"
                />
            </NuxtLink>
        </transition-group>
    </div>
</template>

<script setup lang="ts">
    interface Product {
        name: string
        slug: string
        image?: string
        icon?: string
        productCount: number
    }

    interface Props {
        title?: string
        products: Product[]
    }

    defineProps<Props>()

    const localePath = useLocalePath()
</script>

<style scoped>
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .animate-fade-in {
        animation: fadeIn 0.5s ease-out forwards;
    }
    .fade-list-enter-active,
    .fade-list-leave-active {
        transition: all 0.5s ease;
    }
    .fade-list-enter-from,
    .fade-list-leave-to {
        opacity: 0;
        transform: translateY(10px);
    }
</style>
