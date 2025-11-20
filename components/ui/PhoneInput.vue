<!-- components/ui/PhoneInput.vue -->
<template>
    <div class="phone-input-wrapper w-full flex flex-col gap-1">
        <div
            class="relative border rounded transition-colors duration-300 flex border-gray-600 hover:border-gray-800"
            :class="[
                sizeClasses[size],
                background,
                {
                    'border-red-500': !!error || validationState.state === 'invalid',
                    'border-yellow-500':
                        validationState.state === 'incomplete' && showValidationState,
                    'border-gray-600 hover:border-gray-800':
                        !error && validationState.state === 'empty',
                    'bg-gray-100 cursor-not-allowed': disabled,
                },
            ]"
        >
            <div class="flex items-center justify-center relative bg-blue-50">
                <button
                    type="button"
                    class="flex items-center cursor-pointer h-full text-gray-600 hover:text-gray-800 border-r border-gray-600 hover:border-gray-800 transition-all duration-200 w-20"
                    :class="[inputPaddingClass]"
                    :disabled="disabled"
                    @click="toggleDropdown"
                >
                    <div class="flex items-center gap-4">
                        <img
                            v-if="selectedCountry?.flagUrl"
                            :src="selectedCountry.flagUrl"
                            :alt="selectedCountry.displayName"
                            class="w-4 h-4 object-cover"
                        />
                        <span v-else class="text-lg h-4 w-4">🌍</span>
                        <svg
                            class="w-3 h-3 transition-all duration-200"
                            :class="isDropdownOpen ? 'rotate-180' : ''"
                        >
                            <use xlink:href="/sprite.svg#a_down"></use>
                        </svg>
                    </div>
                </button>

                <Transition
                    name="dropdown"
                    enter-active-class="transition duration-300 ease-out"
                    enter-from-class="opacity-0 scale-95"
                    enter-to-class="opacity-100 scale-100"
                    leave-active-class="transition duration-200 ease-in"
                    leave-from-class="opacity-100 scale-100"
                    leave-to-class="opacity-0 scale-95"
                >
                    <div
                        v-if="isDropdownOpen"
                        ref="dropdownRef"
                        class="absolute left-0 top-full mt-1 bg-white border border-gray-300 rounded shadow-lg z-50 max-h-60 overflow-hidden w-80"
                    >
                        <div class="p-2 border-b">
                            <input
                                v-model="searchQuery"
                                type="text"
                                :placeholder="
                                    $t('phone.searchCountry', 'Search country or code...')
                                "
                                class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                                @click.stop
                            />
                        </div>

                        <div class="max-h-48 overflow-y-auto border border-gray-600">
                            <div
                                v-for="country in filteredCountries"
                                :key="country.value"
                                class="p-3 hover:bg-red-50 hover:text-red-500 cursor-pointer transition-all duration-150 flex items-center gap-2 justify-between w-full"
                                @click="selectCountry(country)"
                            >
                                <div class="flex items-center space-x-4 text-subtitle2">
                                    <img
                                        v-if="country.flagUrl"
                                        :src="country.flagUrl"
                                        :alt="country.displayName"
                                        class="w-4 h-4 object-cover"
                                    />
                                    <span v-else class="w-4 h-4">🌍</span>
                                    <span class="min-w-[50px]">{{ country.displayName }}</span>
                                </div>
                                <span class="w-fit">{{ country.phoneCode }}</span>
                            </div>

                            <div
                                v-if="filteredCountries.length === 0"
                                class="p-3 text-gray-500 text-sm text-center"
                            >
                                {{ $t('phone.noCountriesFound', 'No countries found') }}
                            </div>
                        </div>
                    </div>
                </Transition>
            </div>

            <input
                :id="inputId"
                ref="phoneInputRef"
                v-model="internalValue"
                v-maska:[maskOptions]
                :name="name"
                type="tel"
                inputmode="numeric"
                :disabled="disabled"
                :maxlength="maxPhoneLength"
                :aria-invalid="!!error || validationState.state === 'invalid'"
                :aria-required="required"
                :aria-describedby="getAriaDescribedBy()"
                autocomplete="tel"
                :placeholder="getPlaceholderText()"
                class="flex-1 border-none bg-transparent focus:outline-none"
                :class="[
                    inputPaddingClass,
                    'text-gray-950',
                    {
                        'text-red-500': !!error || validationState.state === 'invalid',
                        'text-green-600': validationState.value === 'valid' && showValidationState,
                        'cursor-not-allowed': disabled,
                    },
                ]"
                @focus="handleFocus"
                @blur="handleBlur"
                @input="handleInput"
                @maska="handleMaska"
                @keydown="handleKeydown"
            />

            <div
                v-if="showProgress && validationState.progress > 0"
                class="absolute bottom-0 left-0 h-0.5 bg-green-500 transition-all duration-300"
                :style="{ width: `${validationState.progress}%` }"
            />
        </div>

        <div
            v-if="error || helperText || (showValidationState && validationState.message)"
            class="flex gap-1 items-center text-caption1 mx-1"
        >
            <svg class="w-3 h-3 mt-0.5" :class="getIconClass()">
                <use :xlink:href="getIconHref()"></use>
            </svg>
            <span :id="getErrorHelperId()" :class="getMessageClass()">
                {{ getDisplayMessage() }}
            </span>
        </div>

        <div
            v-if="showMetadata && phoneMetadata.countryName"
            class="flex justify-between text-caption1 mx-1 text-gray-600"
        >
            <span>{{ phoneMetadata.countryName }}</span>
            <span v-if="phoneMetadata.type !== 'unknown'">
                {{ $t(`phone.type.${phoneMetadata.type}`, phoneMetadata.type) }}
            </span>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, onMounted, watch, nextTick } from 'vue'
    import { onClickOutside } from '@vueuse/core'
    import { vMaska } from 'maska/vue'
    import { useI18n } from 'vue-i18n'
    import { useStaticData } from '@/composables/useStaticData'
    import { usePhoneValidation } from '@/composables/usePhoneValidation'

    interface Props {
        modelValue?: string | null
        name?: string
        size?: 'sm' | 'md' | 'lg'
        background?: string
        required?: boolean
        disabled?: boolean
        error?: string
        helperText?: string
        maxlength?: number
        placeholder?: string
        countryCode?: string
        showValidationState?: boolean
        showProgress?: boolean
        showMetadata?: boolean
        showCharacterCount?: boolean
        showSuggestions?: boolean
        validateOnType?: boolean
    }

    const props = withDefaults(defineProps<Props>(), {
        modelValue: '',
        name: 'phone',
        size: 'lg',
        background: 'bg-white',
        required: false,
        disabled: false,
        error: '',
        helperText: '',
        maxlength: undefined,
        placeholder: 'Phone number',
        countryCode: 'MD',
        showValidationState: true,
        showProgress: false,
        showMetadata: false,
        showCharacterCount: false,
        showSuggestions: false,
        validateOnType: true,
    })

    const emit = defineEmits<{
        'update:modelValue': [value: string]
        'update:isValid': [isValid: boolean]
        'update:selectedCountry': [country: any]
        'update:metadata': [metadata: any]
        focus: [event: FocusEvent]
        blur: [event: FocusEvent]
        input: [value: string]
        'country-changed': [country: any]
        'validation-changed': [validation: any]
    }>()

    const { t } = useI18n()
    const { countries, isLoaded: staticDataLoaded } = useStaticData()

    const {
        validatePhoneNumber,
        getValidationState,
        getPhoneMetadata,
        detectCountryCode,
        extractPhoneNumberOnly,
        getPhonePattern,
        getMaskPattern,
        generatePhoneSuggestion,
        validateWithDetails,
    } = usePhoneValidation()

    const inputId = ref(props.name || `phone-input-${Math.random().toString(36).substr(2, 9)}`)
    const phoneInputRef = ref<HTMLInputElement | null>(null)
    const dropdownRef = ref<HTMLElement | null>(null)
    const isFocused = ref(false)
    const isDropdownOpen = ref(false)
    const searchQuery = ref('')
    const internalValue = ref('')
    const selectedCountry = ref<any>(null)
    const suggestions = ref<string[]>([])
    const isSelectingCountry = ref(false)

    const sizeClasses = {
        sm: 'h-8 text-subtitle3',
        md: 'h-10 text-subtitle2',
        lg: 'h-12 text-subtitle2',
    }

    const inputPaddingClass = computed(() => 'px-3 py-4')

    const hasValue = computed(() => {
        return !!(
            internalValue.value &&
            internalValue.value.trim() &&
            internalValue.value.length > 0
        )
    })

    const maxPhoneLength = computed(() => {
        if (props.maxlength !== undefined) return props.maxlength

        if (selectedCountry.value) {
            const phoneCode = selectedCountry.value.phoneCode
            const pattern = getPhonePattern(phoneCode)
            if (pattern) {
                return phoneCode.length + 1 + pattern.maxLength + 5
            }
        }
        return 25
    })

    const phoneCodeOptions = computed(() => {
        if (!staticDataLoaded.value || !countries.value) return []

        return countries.value.map((country) => ({
            code: country.code,
            phoneCode: country.phone_code,
            label: country.phone_code,
            value: country.id,
            displayName: country.name,
            nativeName: country.native_name,
            flagUrl: country.flag_url,
            continent: country.continent,
            currency: country.default_currency,
        }))
    })

    const filteredCountries = computed(() => {
        if (!phoneCodeOptions.value.length) return []

        const query = searchQuery.value.trim().toLowerCase()
        if (!query) return phoneCodeOptions.value

        return phoneCodeOptions.value.filter((country) => {
            return (
                country.phoneCode.toLowerCase().includes(query) ||
                country.code?.toLowerCase().includes(query) ||
                country.displayName?.toLowerCase().includes(query) ||
                country.nativeName?.toLowerCase().includes(query)
            )
        })
    })

    const currentMask = computed(() => {
        if (!selectedCountry.value) return '## ### ####'
        return getMaskPattern(selectedCountry.value.phoneCode)
    })

    const maskOptions = computed(() => ({
        mask: currentMask.value,
        eager: true,
        reversed: false,
    }))

    const getPlaceholderText = (): string => {
        if (props.placeholder) return props.placeholder

        let placeholder = 'Phone number'
        if (props.required) {
            placeholder += ' *'
        }

        if (selectedCountry.value) {
            const pattern = getPhonePattern(selectedCountry.value.phoneCode)
            if (pattern) {
                placeholder += ` (${t('phone.example', 'e.g.')} ${pattern.example})`
            }
        }

        return placeholder
    }

    const validationState = computed(() => {
        if (!props.validateOnType) {
            return { state: 'empty', message: '', progress: 0 }
        }

        return getValidationState(internalValue.value, selectedCountry.value?.phoneCode)
    })

    const phoneMetadata = computed(() => {
        return getPhoneMetadata(internalValue.value, selectedCountry.value?.phoneCode)
    })

    const detailedValidation = computed(() => {
        return validateWithDetails(internalValue.value, selectedCountry.value?.phoneCode)
    })

    const getAriaDescribedBy = (): string | null => {
        const parts = []
        if (props.error) parts.push(`${inputId.value}-error`)
        if (props.helperText) parts.push(`${inputId.value}-helper`)
        if (props.showValidationState && validationState.value.message) {
            parts.push(`${inputId.value}-validation`)
        }
        return parts.length > 0 ? parts.join(' ') : null
    }

    const getIconClass = (): string => {
        if (props.error) return 'text-red-500'
        if (validationState.value.state === 'valid' && props.showValidationState)
            return 'text-green-500'
        if (validationState.value.state === 'invalid' && props.showValidationState)
            return 'text-red-500'
        if (validationState.value.state === 'incomplete' && props.showValidationState)
            return 'text-yellow-500'
        return 'text-gray-600'
    }

    const getIconHref = (): string => {
        if (props.error || validationState.value.state === 'invalid') return '/sprite.svg#alert'
        if (validationState.value.state === 'valid') return '/sprite.svg#check'
        if (validationState.value.state === 'invalid') return '/sprite.svg#clock'
        return '/sprite.svg#info'
    }

    const getMessageClass = (): string => {
        if (props.error) return 'text-red-500'
        if (validationState.value.state === 'valid' && props.showValidationState)
            return 'text-green-600'
        if (validationState.value.state === 'invalid' && props.showValidationState)
            return 'text-red-500'
        if (validationState.value.state === 'incomplete' && props.showValidationState)
            return 'text-yellow-600'
        return 'text-gray-600'
    }

    const getDisplayMessage = (): string => {
        if (props.error) return props.error
        if (props.showValidationState && validationState.value.message)
            return validationState.value.message
        if (props.helperText) return props.helperText
        return ''
    }

    const getErrorHelperId = (): string => {
        if (props.error) return `${inputId.value}-error`
        if (props.showValidationState && validationState.value.message)
            return `${inputId.value}-validation`
        if (props.helperText) return `${inputId.value}-helper`
        return ''
    }

    const toggleDropdown = () => {
        if (!props.disabled) {
            isDropdownOpen.value = !isDropdownOpen.value
        }
    }

    const selectCountry = (country: any) => {
        isSelectingCountry.value = true

        const previousCountry = selectedCountry.value
        selectedCountry.value = country
        isDropdownOpen.value = false
        searchQuery.value = ''

        emit('update:selectedCountry', country)
        emit('country-changed', country)

        let phoneOnlyDigits = ''

        const currentValue = internalValue.value || ''

        if (currentValue.trim() && previousCountry) {
            const oldCode = previousCountry.phoneCode
            phoneOnlyDigits = extractPhoneNumberOnly(currentValue, oldCode)
        } else if (currentValue.trim()) {
            const detectedCode = detectCountryCode(currentValue)
            if (detectedCode) {
                phoneOnlyDigits = extractPhoneNumberOnly(currentValue, detectedCode)
            } else {
                phoneOnlyDigits = currentValue.replace(/\D/g, '')
            }
        }

        const newValue = phoneOnlyDigits
            ? `${country.phoneCode} ${phoneOnlyDigits}`
            : `${country.phoneCode} `

        internalValue.value = newValue
        emit('update:modelValue', newValue)

        updateSuggestions()

        nextTick(() => {
            phoneInputRef.value?.focus()
            isSelectingCountry.value = false
        })
    }

    const updateSuggestions = () => {
        if (!props.showSuggestions || !selectedCountry.value) {
            suggestions.value = []
            return
        }

        const suggestion = generatePhoneSuggestion(
            internalValue.value,
            selectedCountry.value.phoneCode
        )
        if (suggestion && suggestion !== internalValue.value) {
            suggestions.value = [suggestion]
        } else {
            suggestions.value = []
        }
    }

    const updateValidation = () => {
        const validation = validatePhoneNumber(
            internalValue.value,
            selectedCountry.value?.phoneCode
        )

        emit('update:isValid', validation.isValid)
        emit('update:metadata', phoneMetadata.value)
        emit('validation-changed', detailedValidation.value)

        if (props.showSuggestions) {
            updateSuggestions()
        }
    }

    const handleFocus = (event: FocusEvent) => {
        isFocused.value = true
        emit('focus', event)
    }

    const handleBlur = (event: FocusEvent) => {
        isFocused.value = false
        updateValidation()
        emit('blur', event)
    }

    const handleInput = (event: Event) => {
        if (isSelectingCountry.value) return

        const target = event.target as HTMLInputElement
        let newValue = target.value

        // Remove all non-digit characters except spaces (for formatting)
        const cleanedValue = newValue.replace(/[^\d+\s]/g, '')

        // If value changed after cleaning, update it
        if (cleanedValue !== newValue) {
            newValue = cleanedValue
            target.value = cleanedValue
            internalValue.value = cleanedValue
        }

        if (!newValue || newValue.trim() === '') {
            selectedCountry.value = null
            internalValue.value = ''
            emit('update:selectedCountry', null)
            emit('country-changed', null)
            emit('update:modelValue', '')
            return
        }

        if (!selectedCountry.value) {
            const detectedCode = detectCountryCode(newValue)
            if (detectedCode && staticDataLoaded.value) {
                const country = phoneCodeOptions.value.find((c) => c.phoneCode === detectedCode)
                if (country) {
                    selectCountry(country)
                    return
                }
            }
        }

        internalValue.value = newValue
        emit('update:modelValue', newValue)

        if (props.validateOnType) {
            updateValidation()
        }

        emit('input', newValue)
    }
    const handleMaska = (event: CustomEvent) => {
        if (isSelectingCountry.value) return

        const detail = event.detail
        if (detail && detail.completed) {
            const formattedValue = detail.completed
            emit('update:modelValue', formattedValue)

            if (props.validateOnType) {
                updateValidation()
            }
        } else {
            emit('update:modelValue', internalValue.value)
        }
    }

    const handleKeydown = (event: KeyboardEvent) => {
        if (event.key === 'Tab' && isDropdownOpen.value) {
            isDropdownOpen.value = false
            return
        }

        // Allow: backspace, delete, tab, escape, enter, arrows, home, end
        const allowedKeys = [
            'Backspace',
            'Delete',
            'Tab',
            'Escape',
            'Enter',
            'ArrowLeft',
            'ArrowRight',
            'ArrowUp',
            'ArrowDown',
            'Home',
            'End',
        ]

        // Allow Ctrl/Cmd shortcuts (copy, paste, cut, select all)
        if (event.ctrlKey || event.metaKey) {
            if (['a', 'c', 'v', 'x', 'z'].includes(event.key.toLowerCase())) {
                return
            }
        }

        if (allowedKeys.includes(event.key)) {
            return
        }

        // Block any non-digit characters
        if (!/^\d$/.test(event.key)) {
            event.preventDefault()
        }
    }
    const initializeCountry = () => {
        if (!staticDataLoaded.value || !phoneCodeOptions.value.length) return

        let countryToSelect = null

        if (props.modelValue) {
            const detectedCode = detectCountryCode(props.modelValue)
            if (detectedCode) {
                countryToSelect = phoneCodeOptions.value.find((c) => c.phoneCode === detectedCode)
                if (countryToSelect) {
                    internalValue.value = props.modelValue
                }
            }
        }

        if (!countryToSelect && props.countryCode) {
            countryToSelect = phoneCodeOptions.value.find((c) => c.code === props.countryCode)
        }

        if (!countryToSelect) {
            countryToSelect = phoneCodeOptions.value.find((c) => c.code === 'MD')
        }

        if (countryToSelect) {
            selectedCountry.value = countryToSelect
            emit('update:selectedCountry', countryToSelect)

            if (!internalValue.value && !props.modelValue) {
                internalValue.value = `${countryToSelect.phoneCode} `
            }

            if (props.modelValue && props.validateOnType) {
                nextTick(() => {
                    updateValidation()
                })
            }
        }
    }

    watch(
        staticDataLoaded,
        (loaded) => {
            if (loaded) {
                initializeCountry()
            }
        },
        { immediate: true }
    )

    watch(
        () => props.modelValue,
        (newValue) => {
            if (isSelectingCountry.value) return

            if (newValue !== internalValue.value) {
                internalValue.value = newValue || ''

                if (newValue && !selectedCountry.value && staticDataLoaded.value) {
                    const detectedCode = detectCountryCode(newValue)
                    if (detectedCode) {
                        const country = phoneCodeOptions.value.find(
                            (c) => c.phoneCode === detectedCode
                        )
                        if (country) {
                            selectedCountry.value = country
                            emit('update:selectedCountry', country)
                        }
                    }
                }

                if (props.validateOnType) {
                    updateValidation()
                }
            }
        },
        { immediate: true }
    )

    watch(internalValue, () => {
        if (isSelectingCountry.value) return

        if (props.validateOnType) {
            updateValidation()
        }
    })

    onClickOutside(dropdownRef, () => {
        isDropdownOpen.value = false
    })

    onMounted(() => {
        if (process.client) {
            if (staticDataLoaded.value) {
                initializeCountry()
            }
        }
    })
</script>

<style scoped>
    .phone-input-wrapper {
        position: relative;
    }

    .dropdown-enter-active,
    .dropdown-leave-active {
        transition: all 0.3s ease;
    }

    .dropdown-enter-from,
    .dropdown-leave-to {
        opacity: 0;
        transform: translateY(-10px) scale(0.95);
    }

    .dropdown-enter-to,
    .dropdown-leave-from {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
</style>
