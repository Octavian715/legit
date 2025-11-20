<template>
    <span v-tooltip="languageFullEnumeration" class="text-body text-gray-950 line-clamp-2 truncate">
        {{ languageEnumeration }}
    </span>
</template>

<script setup lang="ts">
    import { computed } from 'vue'

    interface Language {
        code: string
        name?: string
        proficiency?: 'native' | 'fluent' | 'conversational' | 'basic'
        flag?: string
    }

    const props = withDefaults(
        defineProps<{
            cellOptions?: object
            cellValue?: (Language | string)[] | string
        }>(),
        {
            cellOptions: () => ({}),
            cellValue: () => [],
        }
    )

    const languageList = computed((): Language[] => {
        let value = props.cellValue

        if (!value) return []

        if (typeof value === 'string') {
            return value
                .split(',')
                .map((lang) => ({
                    code: lang.trim(),
                    name: lang.trim(),
                }))
                .filter((lang) => lang.code)
        }

        if (Array.isArray(value)) {
            const processedLanguages = value
                .map((lang, index) => {
                    if (typeof lang === 'string') {
                        return { code: lang, name: lang }
                    }
                    return lang as Language
                })
                .filter(Boolean)

            return processedLanguages
        }

        return []
    })

    const languageEnumeration = computed((): string => {
        if (!languageList.value.length) return '-'

        const languageNames = languageList.value.map((lang) => {
            const code = lang.code
            return code.charAt(0).toUpperCase() + code.slice(1).toLowerCase()
        })

        return languageNames.join(', ')
    })

    const languageFullEnumeration = computed((): string => {
        if (!languageList.value.length) return '-'

        const languageNames = languageList.value.map((lang) => lang.name)

        return languageNames.join(', ')
    })
</script>
