<template>
    <div class="flex flex-col space-y-5">
        <h3 class="text-gray-950 font-bold text-title3">{{ t('deliveryAvailability') }}</h3>

        <div class="flex flex-col gap-6">
            <div class="flex flex-col gap-4">
                <h4 class="text-gray-800 text-subtitle2">{{ t('product.productAvability') }}</h4>

                <div class="flex flex-col md:flex-row md:space-x-2 space-y-2 md:space-y-0">
                    <div class="flex flex-1 flex-col md:flex-row gap-4 md:gap-2">
                        <MultiSelect
                            :model-value="selectedContinents"
                            :label="t('product.chooseContinents')"
                            name="continents"
                            size="lg"
                            background="bg-white"
                            class="flex-1"
                            :options="continentOptions"
                            :placeholder="t('multiSelect.placeholder')"
                            :search-placeholder="t('multiSelect.searchPlaceholder')"
                            :no-results-text="t('multiSelect.noResultsText')"
                            @update:model-value="handleContinentChange"
                        />
                    </div>
                    <div class="flex-1 flex items-start pt-4">
                        <Checkbox
                            v-model="isWorldwide"
                            :label="t('product.worldWide')"
                            name="worldwide"
                            size="md"
                            @update:model-value="handleWorldwideChange"
                        />
                    </div>
                </div>

                <div
                    v-for="continent in availableContinents"
                    :key="continent.id"
                    class="flex flex-col md:flex-row md:space-x-2 space-y-2 md:space-y-0"
                >
                    <MultiSelect
                        :model-value="selectedCountriesByContinent[continent.id] || []"
                        :label="continent.name"
                        :name="`continent-${continent.id}`"
                        size="lg"
                        background="bg-white"
                        class="flex-1"
                        :options="getCountriesByContinent(continent.id)"
                        :placeholder="t('multiSelect.placeholder')"
                        :search-placeholder="t('multiSelect.searchPlaceholder')"
                        :no-results-text="t('multiSelect.noResultsText')"
                        @update:model-value="
                            (value) => handleContinentCountriesChange(continent.id, value)
                        "
                    />
                    <div class="flex-1 flex items-start pt-4">
                        <Checkbox
                            :model-value="selectAllByContinent[continent.id] || false"
                            :label="t('selectAll')"
                            :name="`selectAll${continent.id}`"
                            size="md"
                            @update:model-value="toggleAllContinent(continent.id, $event)"
                        />
                    </div>
                </div>

                <div v-if="fieldErrors.availabilityCountryIds" class="mt-2">
                    <p class="text-caption1 text-red-500 flex items-center gap-1" role="alert">
                        <svg class="w-3 h-3 flex-shrink-0">
                            <use :xlink:href="`/sprite.svg#info`"></use>
                        </svg>
                        {{ fieldErrors.availabilityCountryIds }}
                    </p>
                </div>

                <h4 class="text-gray-800 text-subtitle2">{{ t('product.incoterms') }}</h4>

                <div
                    v-for="(row, rowIndex) in incotermRows"
                    :key="rowIndex"
                    class="flex flex-col md:flex-row md:space-x-2 space-y-2 md:space-y-0"
                >
                    <div class="flex flex-col md:flex-row flex-1 md:gap-3 gap-3">
                        <div
                            v-for="incoterm in row"
                            :key="incoterm.code"
                            class="border border-gray-600 flex-1 rounded px-3 py-3.5 bg-white"
                        >
                            <Checkbox
                                :model-value="incotermSelections[incoterm.code] || false"
                                :label="incoterm.code"
                                :name="incoterm.code"
                                size="md"
                                @update:model-value="handleIncotermChange(incoterm.code, $event)"
                            />
                        </div>
                        <div
                            v-if="row.length === 1"
                            class="px-3 py-3.5 bg-white flex-1 hidden md:flex"
                        ></div>
                    </div>
                    <div v-if="rowIndex === 0" class="flex flex-1 items-center">
                        <Checkbox
                            v-model="selectAllIncoterms"
                            :label="t('selectAll')"
                            name="selectAllIncoterms"
                            size="md"
                            @update:model-value="toggleAllIncoterms"
                        />
                    </div>
                    <div v-else class="flex-1 hidden md:block" />
                </div>

                <div v-if="fieldErrors.incotermIds" class="mt-2">
                    <p class="text-caption1 text-red-500 flex items-center gap-1" role="alert">
                        <svg class="w-3 h-3 flex-shrink-0">
                            <use :xlink:href="`/sprite.svg#info`"></use>
                        </svg>
                        {{ fieldErrors.incotermIds }}
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { validateData } from '~/utils/validator'
    import {
        productDeliverySchema,
        type ProductDeliveryFormData,
    } from '~/utils/validator/schemas/products/product'
    import { useStaticData } from '~/composables/useStaticData'
    import { useProductStaticData } from '~/composables/useProductStaticData'

    interface Props {
        stepData?: Partial<ProductDeliveryFormData>
        fieldErrors?: Record<string, string>
    }

    const props = withDefaults(defineProps<Props>(), {
        stepData: () => ({}),
        fieldErrors: () => ({}),
    })

    const emit = defineEmits<{
        update: [data: Partial<ProductDeliveryFormData>]
    }>()

    const { countries, continents, continentOptions } = useStaticData()
    const { incotermOptions } = useProductStaticData()
    const { t } = useI18n()

    const selectedContinents = ref<number[]>([])
    const isWorldwide = ref(false)
    const selectAllIncoterms = ref(false)
    const selectedCountriesByContinent = ref<Record<number, number[]>>({})
    const selectAllByContinent = ref<Record<number, boolean>>({})
    const incotermSelections = ref<Record<string, boolean>>({})
    const isInternalUpdate = ref(false)

    const getDefaultFormData = (): ProductDeliveryFormData => {
        return {
            availabilityCountryIds: [],
            incotermIds: [],
        }
    }

    const formData = ref<ProductDeliveryFormData>(getDefaultFormData())

    const availableContinents = computed(() => {
        if (!selectedContinents.value || selectedContinents.value.length === 0) {
            return []
        }
        return continents.value.filter((c) => selectedContinents.value.includes(c.id))
    })

    const getCountriesByContinent = (continentId: number) => {
        return countries.value
            .filter((country) => country.continent.id === continentId)
            .map((country) => ({
                value: country.id,
                label: country.name,
                code: country.code,
            }))
    }

    const incotermRows = computed(() => {
        const incoterms = incotermOptions.value
        const rows = []
        const itemsPerRow = 2

        for (let i = 0; i < incoterms.length; i += itemsPerRow) {
            rows.push(incoterms.slice(i, i + itemsPerRow))
        }

        return rows
    })

    const handleContinentChange = (value: number[]) => {
        const previousContinents = selectedContinents.value || []
        selectedContinents.value = value || []

        // Find newly added continents
        const addedContinents = selectedContinents.value.filter(
            (id) => !previousContinents.includes(id)
        )

        // Auto-select all countries for newly added continents
        addedContinents.forEach((id) => {
            const countriesInContinent = getCountriesByContinent(id)
            selectedCountriesByContinent.value[id] = countriesInContinent.map((c) => c.value)
            selectAllByContinent.value[id] = true
        })

        // Remove countries from continents that are no longer selected
        const removedContinents = previousContinents.filter(
            (id) => !selectedContinents.value.includes(id)
        )
        removedContinents.forEach((id) => {
            selectedCountriesByContinent.value[id] = []
            selectAllByContinent.value[id] = false
        })

        updateAvailabilityCountries()
    }

    const handleWorldwideChange = (value: boolean) => {
        if (value) {
            // Select all continents
            selectedContinents.value = continents.value.map((c) => c.id)

            // Select all countries for each continent
            continents.value.forEach((continent) => {
                const countriesInContinent = getCountriesByContinent(continent.id)
                selectedCountriesByContinent.value[continent.id] = countriesInContinent.map(
                    (c) => c.value
                )
                selectAllByContinent.value[continent.id] = true
            })
        } else {
            // Clear all selections
            selectedContinents.value = []
            continents.value.forEach((continent) => {
                selectedCountriesByContinent.value[continent.id] = []
                selectAllByContinent.value[continent.id] = false
            })
        }
        updateAvailabilityCountries()
    }

    const handleContinentCountriesChange = (continentId: number, value: number[]) => {
        selectedCountriesByContinent.value[continentId] = value || []

        const countriesInContinent = getCountriesByContinent(continentId)
        selectAllByContinent.value[continentId] =
            value?.length === countriesInContinent.length && countriesInContinent.length > 0

        updateAvailabilityCountries()
    }

    const toggleAllContinent = (continentId: number, value: boolean) => {
        if (value) {
            const countriesInContinent = getCountriesByContinent(continentId)
            selectedCountriesByContinent.value[continentId] = countriesInContinent.map(
                (c) => c.value
            )
            selectAllByContinent.value[continentId] = true
        } else {
            selectedCountriesByContinent.value[continentId] = []
            selectAllByContinent.value[continentId] = false
        }
        updateAvailabilityCountries()
    }

    const updateAvailabilityCountries = () => {
        const allSelected = Object.values(selectedCountriesByContinent.value).flat()
        formData.value.availabilityCountryIds = [...new Set(allSelected)]

        // Check if all countries from all continents are selected (for isWorldwide checkbox)
        const totalCountries = countries.value.length
        const totalSelected = formData.value.availabilityCountryIds.length
        isWorldwide.value = totalSelected === totalCountries && totalCountries > 0

        emitUpdate()
    }

    const handleIncotermChange = (code: string, value: boolean) => {
        incotermSelections.value[code] = value

        const selectedIds = []
        Object.keys(incotermSelections.value).forEach((key) => {
            if (incotermSelections.value[key]) {
                const incoterm = incotermOptions.value.find((inc) => inc.code === key)
                if (incoterm) {
                    selectedIds.push(incoterm.value)
                }
            }
        })

        formData.value.incotermIds = selectedIds

        // Update selectAllIncoterms checkbox based on selections
        selectAllIncoterms.value =
            selectedIds.length === incotermOptions.value.length && incotermOptions.value.length > 0

        emitUpdate()
    }

    const toggleAllIncoterms = (value: boolean) => {
        incotermOptions.value.forEach((incoterm) => {
            incotermSelections.value[incoterm.code] = value
        })

        if (value) {
            formData.value.incotermIds = incotermOptions.value.map((inc) => inc.value)
        } else {
            formData.value.incotermIds = []
        }

        emitUpdate()
    }

    const emitUpdate = () => {
        isInternalUpdate.value = true
        emit('update', { ...toRaw(formData.value) })
        nextTick(() => {
            isInternalUpdate.value = false
        })
    }

    const validate = () => {
        return validateData('productDelivery', productDeliverySchema, formData.value)
    }

    const initializeFormData = async () => {
        if (!countries.value.length || !continents.value.length || !incotermOptions.value.length) {
            await nextTick()
            setTimeout(() => {
                if (
                    countries.value.length &&
                    continents.value.length &&
                    incotermOptions.value.length
                ) {
                    initializeFormData()
                }
            }, 100)
            return
        }

        const defaultData = getDefaultFormData()

        continents.value.forEach((continent) => {
            if (!selectedCountriesByContinent.value[continent.id]) {
                selectedCountriesByContinent.value[continent.id] = []
            }
            if (selectAllByContinent.value[continent.id] === undefined) {
                selectAllByContinent.value[continent.id] = false
            }
        })

        incotermOptions.value.forEach((incoterm) => {
            if (incotermSelections.value[incoterm.code] === undefined) {
                incotermSelections.value[incoterm.code] = false
            }
        })

        if (props.stepData && Object.keys(props.stepData).length > 0) {
            Object.keys(defaultData).forEach((key) => {
                if (props.stepData[key] !== undefined) {
                    formData.value[key] = props.stepData[key]
                }
            })

            if (
                props.stepData.availabilityCountryIds &&
                props.stepData.availabilityCountryIds.length > 0
            ) {
                const continentsWithSelectedCountries: number[] = []

                continents.value.forEach((continent) => {
                    const countriesInContinent = getCountriesByContinent(continent.id)
                    const selectedInContinent = props.stepData.availabilityCountryIds.filter((id) =>
                        countriesInContinent.some((c) => c.value === id)
                    )

                    if (selectedInContinent.length > 0) {
                        continentsWithSelectedCountries.push(continent.id)
                        selectedCountriesByContinent.value[continent.id] = selectedInContinent

                        selectAllByContinent.value[continent.id] =
                            selectedInContinent.length === countriesInContinent.length &&
                            countriesInContinent.length > 0
                    }
                })

                selectedContinents.value = continentsWithSelectedCountries

                const totalCountries = countries.value.length
                const totalSelected = props.stepData.availabilityCountryIds.length
                isWorldwide.value = totalSelected === totalCountries && totalCountries > 0
            }

            if (props.stepData.incotermIds && props.stepData.incotermIds.length > 0) {
                props.stepData.incotermIds.forEach((id) => {
                    const incoterm = incotermOptions.value.find((inc) => inc.value === id)
                    if (incoterm) {
                        incotermSelections.value[incoterm.code] = true
                    }
                })

                selectAllIncoterms.value =
                    props.stepData.incotermIds.length === incotermOptions.value.length &&
                    incotermOptions.value.length > 0
            }
        }
    }

    watch(
        [countries, continents, incotermOptions],
        ([countriesVal, continentsVal, incotermsVal]) => {
            if (countriesVal.length > 0 && continentsVal.length > 0 && incotermsVal.length > 0) {
                initializeFormData()
            }
        },
        { immediate: true }
    )

    watch(
        () => props.stepData,
        () => {
            // Don't reinitialize if the update came from us
            if (isInternalUpdate.value) {
                return
            }

            if (
                props.stepData &&
                Object.keys(props.stepData).length > 0 &&
                countries.value.length > 0 &&
                continents.value.length > 0 &&
                incotermOptions.value.length > 0
            ) {
                initializeFormData()
            }
        },
        { deep: true }
    )

    onMounted(() => {
        if (
            countries.value.length > 0 &&
            continents.value.length > 0 &&
            incotermOptions.value.length > 0
        ) {
            initializeFormData()
        }
    })

    defineExpose({
        validate,
        formData: readonly(formData),
    })
</script>
