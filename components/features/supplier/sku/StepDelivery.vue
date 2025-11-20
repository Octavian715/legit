<template>
    <div class="flex flex-col space-y-5">
        <h3 class="text-gray-950 font-bold text-title3">{{ t('deliveryAvailability') }}</h3>

        <div class="flex flex-col gap-6">
            <div class="flex flex-col gap-4">
                <h4 class="text-gray-800 text-subtitle2">{{ t('product.productAvability') }}</h4>

                <div class="flex flex-col md:flex-row md:space-x-2 space-y-2 md:space-y-0">
                    <div class="flex flex-1 flex-col md:flex-row gap-4 md:gap-2">
                        <Select
                            v-model="selectedContinent"
                            :label="t('product.chooseContinents')"
                            name="continent"
                            size="lg"
                            background="bg-white"
                            class="flex-1"
                            :options="continentOptions"
                            :placeholder="t('product.chooseContinents')"
                            @update:model-value="handleFieldChange"
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
                    :key="continent.code"
                    class="flex flex-col md:flex-row md:space-x-2 space-y-2 md:space-y-0"
                >
                    <MultiSelect
                        :model-value="selectedCountriesByContinent[continent.code] || []"
                        :label="continent.name"
                        :name="continent.code"
                        size="lg"
                        background="bg-white"
                        class="flex-1"
                        :options="getCountriesByContinent(continent.code)"
                        :placeholder="t('multiSelect.placeholder')"
                        :search-placeholder="t('multiSelect.searchPlaceholder')"
                        :no-results-text="t('multiSelect.noResultsText')"
                        @update:model-value="
                            (value) => handleContinentCountriesChange(continent.code, value)
                        "
                    />
                    <div class="flex-1 flex items-start pt-4">
                        <Checkbox
                            :model-value="selectAllByContinent[continent.code] || false"
                            :label="t('selectAll')"
                            :name="`selectAll${continent.code}`"
                            size="md"
                            @update:model-value="toggleAllContinent(continent.code, $event)"
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

    const selectedContinent = ref<string>('')
    const isWorldwide = ref(false)
    const selectAllIncoterms = ref(false)
    const selectedCountriesByContinent = ref<Record<string, number[]>>({})
    const selectAllByContinent = ref<Record<string, boolean>>({})
    const incotermSelections = ref<Record<string, boolean>>({})

    const getDefaultFormData = (): ProductDeliveryFormData => {
        return {
            availabilityCountryIds: [],
            incotermIds: [],
        }
    }

    const formData = ref<ProductDeliveryFormData>(getDefaultFormData())

    const availableContinents = computed(() => {
        if (!selectedContinent.value || selectedContinent.value === '') {
            return continents.value
        }
        return continents.value.filter((c) => c.code === selectedContinent.value)
    })

    const getCountriesByContinent = (continentCode: string) => {
        return countries.value
            .filter((country) => country.continent.code === continentCode)
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

    const handleFieldChange = () => {
        emitUpdate()
    }

    const handleWorldwideChange = (value: boolean) => {
        if (value) {
            continents.value.forEach((continent) => {
                const countriesInContinent = getCountriesByContinent(continent.code)
                selectedCountriesByContinent.value[continent.code] = countriesInContinent.map(
                    (c) => c.value
                )
                selectAllByContinent.value[continent.code] = true
            })
        } else {
            continents.value.forEach((continent) => {
                selectedCountriesByContinent.value[continent.code] = []
                selectAllByContinent.value[continent.code] = false
            })
        }
        updateAvailabilityCountries()
    }

    const handleContinentCountriesChange = (continentCode: string, value: number[]) => {
        selectedCountriesByContinent.value[continentCode] = value || []

        const countriesInContinent = getCountriesByContinent(continentCode)
        selectAllByContinent.value[continentCode] =
            value?.length === countriesInContinent.length && countriesInContinent.length > 0

        updateAvailabilityCountries()
    }

    const toggleAllContinent = (continentCode: string, value: boolean) => {
        if (value) {
            const countriesInContinent = getCountriesByContinent(continentCode)
            selectedCountriesByContinent.value[continentCode] = countriesInContinent.map(
                (c) => c.value
            )
        } else {
            selectedCountriesByContinent.value[continentCode] = []
        }
        updateAvailabilityCountries()
    }

    const updateAvailabilityCountries = () => {
        const allSelected = Object.values(selectedCountriesByContinent.value).flat()
        formData.value.availabilityCountryIds = [...new Set(allSelected)]
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
        emit('update', { ...toRaw(formData.value) })
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
            if (!selectedCountriesByContinent.value[continent.code]) {
                selectedCountriesByContinent.value[continent.code] = []
            }
            if (selectAllByContinent.value[continent.code] === undefined) {
                selectAllByContinent.value[continent.code] = false
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
                continents.value.forEach((continent) => {
                    const countriesInContinent = getCountriesByContinent(continent.code)
                    const selectedInContinent = props.stepData.availabilityCountryIds.filter((id) =>
                        countriesInContinent.some((c) => c.value === id)
                    )
                    selectedCountriesByContinent.value[continent.code] = selectedInContinent

                    selectAllByContinent.value[continent.code] =
                        selectedInContinent.length === countriesInContinent.length &&
                        countriesInContinent.length > 0
                })

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
