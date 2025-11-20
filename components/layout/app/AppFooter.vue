<template>
    <footer class="bg-gray-50 text-gray-700 pt-10">
        <div class="container mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
            <!-- Logo & Company Info -->
            <div class="col-span-1">
                <NuxtLink :to="localePath('/marketplace')" class="flex w-fit">
                    <svg class="w-auto h-6" aria-hidden="true">
                        <use :xlink:href="iconLink('logo_full')"></use>
                    </svg>
                </NuxtLink>

                <p class="py-4">{{ $t(companyDescription) }}</p>

                <div class="flex gap-3 mb-6">
                    <a
                        v-for="(icon, index) in socialIcons"
                        :key="index"
                        :href="icon.link"
                        target="_blank"
                    >
                        <svg
                            class="w-8 h-8 text-gray-600 hover:text-gray-900 transition"
                            aria-hidden="true"
                        >
                            <use :xlink:href="iconLink(icon.icon)"></use>
                        </svg>
                    </a>
                </div>

                <div class="mt-4">
                    <select v-model="$i18n.locale" class="px-2 py-1 border rounded-md bg-white">
                        <option v-for="locale in locales" :key="locale.code" :value="locale.code">
                            {{ locale.name }}
                        </option>
                    </select>
                </div>
            </div>

            <!-- Footer Navigation -->
            <div class="col-span-3 grid grid-cols-2 lg:grid-cols-6 gap-6">
                <div v-for="(section, index) in menu" :key="index" class="space-y-3">
                    <h3 class="font-bold text-subtitle2 text-gray-950">
                        {{ $t(section.titleKey) }}
                    </h3>
                    <ul class="space-y-2">
                        <li v-for="(item, i) in section.items" :key="i" class="w-fit">
                            <NuxtLink
                                :to="localePath(item.link)"
                                class="text-body text-gray-800 hover:text-gray-950 active:scale-95 transition duration-300"
                            >
                                {{ $t(item.labelKey) }}
                            </NuxtLink>
                        </li>
                    </ul>
                </div>
            </div>
        </div>

        <!-- Bottom Bar -->
        <div class="mx-auto py-6 px-6 flex items-center justify-between bg-gray-800 text-white">
            <p>
                {{ $t('copyright', { year: new Date().getFullYear() }) }}
            </p>
            <div class="flex gap-4 w-fit">
                <svg
                    v-for="icon in comercialLogos"
                    :key="icon.src"
                    v-tooltip="{ content: icon.alt }"
                    class="w-auto h-6"
                    aria-hidden="true"
                >
                    <use :xlink:href="iconLink(icon.src)"></use>
                </svg>
            </div>
        </div>
    </footer>
</template>

<script setup lang="ts">
    import { useI18n } from 'vue-i18n'

    // i18n setup
    const { locale } = useI18n()
    const localePath = useLocalePath()

    const locales = [
        { code: 'en', name: 'English' },
        { code: 'fr', name: 'Français' },
        { code: 'de', name: 'Deutsch' },
    ]

    defineProps({
        companyDescription: {
            type: String,
            default: 'footerDescription',
        },
        socialIcons: {
            type: Array,
            default: () => [
                { icon: 'facebook3', link: '#' },
                { icon: 'twitter3', link: '#' },
                { icon: 'linkedin3', link: '#' },
                { icon: 'instagram3', link: '#' },
                { icon: 'youtube3', link: '#' },
            ],
        },
        menu: {
            type: Array,
            required: true,
        },
    })

    const iconLink = (icon: string) => `/sprite.svg#${icon}`

    const comercialLogos = [
        { src: 'gdpr', alt: 'GDPR' },
        { src: 'visa', alt: 'Visa' },
        { src: 'mastercard', alt: 'Mastercard' },
    ]
</script>
