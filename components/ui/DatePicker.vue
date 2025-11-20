<template>
    <div
        ref="containerRef"
        :class="{
            'date-picker group relative rounded outline-none': true,
            'date-picker--compact': compact,
            'date-picker--disabled': disabled,
            'w-full': !compact,
            'inline-block': compact,
        }"
    >
        <!-- Compact Mode: Icon Button Only -->
        <button
            v-if="compact"
            ref="compactButton"
            class="relative inline-flex items-center justify-center p-2 rounded transition-all duration-200"
            :class="{
                'bg-blue-50 active:scale-95': isPickerVisible && !disabled,
                'cursor-not-allowed opacity-50': disabled,
                'cursor-pointer active:scale-95': !disabled,
            }"
            type="button"
            :disabled="disabled"
            :aria-label="hasSelectedDate ? `Selected: ${formattedDate}` : 'Select date'"
            @click.stop="!disabled && togglePicker()"
        >
            <svg
                class="w-5 h-5 transition-colors"
                :class="{
                    'text-blue-600': isPickerVisible && !disabled,
                    'text-gray-400': disabled,
                    'text-gray-600': !isPickerVisible && !hasSelectedDate && !disabled,
                    'text-gray-700': !isPickerVisible && hasSelectedDate && !disabled,
                }"
            >
                <use xlink:href="/sprite.svg#calendar"></use>
            </svg>
            <!-- Red Badge Indicator when date is selected -->
            <span
                v-if="hasSelectedDate && !disabled"
                class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"
                aria-label="Date selected"
            ></span>
        </button>

        <!-- Standard Mode: Input Field -->
        <div v-else ref="inputField" class="relative">
            <input
                :value="formattedDate"
                class="w-full h-12 px-3 pt-4 pb-1 scroll-pb-10 text-gray-950 text-subtitle2 rounded duration-200 outline-none border transition-colors focus-visible:outline-none"
                :class="{
                    'border-blue-500': (isFocused || isPickerVisible) && !disabled && !error,
                    'border-red-500': error,
                    'border-gray-600 hover:border-gray-800':
                        !(isFocused || isPickerVisible) && !disabled,
                    'border-gray-300 bg-gray-50 text-gray-400 cursor-not-allowed': disabled,
                    'cursor-pointer': !disabled,
                }"
                :disabled="disabled"
                readonly
                type="text"
                @focus="!disabled && (isFocused = true)"
                @blur="isFocused = false"
                @click.stop="!disabled && togglePicker()"
            />

            <label
                :class="{
                    'absolute left-3 text-gray-600 transition-all duration-200 transform origin-[0] pointer-events-none': true,
                    'text-caption1 top-1.5 text-gray-800': hasSelectedDate && !disabled && !error,
                    'text-caption1 top-1.5 text-red-500': hasSelectedDate && error,
                    'text-caption1 top-1.5 text-gray-400': hasSelectedDate && disabled,
                    'text-subtitle2 top-1/2 -translate-y-1/2 text-gray-400':
                        !hasSelectedDate && disabled,
                    'text-subtitle2 top-1/2 -translate-y-1/2 text-red-500':
                        !hasSelectedDate && error,
                    'text-subtitle2 top-1/2 -translate-y-1/2':
                        !hasSelectedDate && !disabled && !error,
                }"
            >
                {{ label || placeholder }}
                <span v-if="required" class="text-red-500">*</span>
            </label>

            <button
                v-if="hasSelectedDate && !disabled"
                class="absolute right-2 top-1/2 -translate-y-1/2 hover:!text-red-500 active:scale-95 active:text-red-700 transition-colors"
                :class="{
                    'text-blue-500': (isFocused || isPickerVisible) && !error,
                    'text-red-500': error,
                    'text-gray-600 group-hover:text-gray-800':
                        !(isFocused || isPickerVisible) && !error,
                }"
                @click.stop="clearSelection"
            >
                &times;
            </button>
            <button
                v-else-if="!disabled"
                class="absolute right-2 top-1/2 -translate-y-1/2"
                @click.stop="togglePicker"
            >
                <svg
                    class="datepicker__icon w-4 h-4 group-hover:text-gray-800 transition-colors"
                    :class="{
                        'text-blue-500 group-hover:text-blue-500':
                            (isFocused || isPickerVisible) && !error,
                        'text-red-500': error,
                        'text-gray-600': !(isFocused || isPickerVisible) && !error,
                    }"
                >
                    <use xlink:href="/sprite.svg#calendar"></use>
                </svg>
            </button>
            <!-- Disabled state icon -->
            <div v-else class="absolute right-2 top-1/2 -translate-y-1/2">
                <svg class="datepicker__icon w-4 h-4 text-gray-400">
                    <use xlink:href="/sprite.svg#calendar"></use>
                </svg>
            </div>
        </div>

        <div v-if="errorMessage && !compact" class="mt-1 text-caption1 text-red-500">
            {{ errorMessage }}
        </div>

        <!-- Date Picker Modal (teleported) -->
        <Teleport to="body">
            <transition name="fade" @after-enter="positionDropdown">
                <div
                    v-if="isPickerVisible && !disabled"
                    ref="pickerModal"
                    :class="[
                        'z-[50] bg-white rounded shadow-lg border border-gray-600',
                        {
                            'date-picker__modal fixed': true,
                            'date-picker__modal--active': isPickerVisible,
                            'date-picker__modal--range': isRangeMode,
                            'date-picker__modal--single': !isRangeMode,
                            'date-picker__modal--compact': compact,
                        },
                    ]"
                    :style="dropdownStyle"
                >
                    <!-- Show selected date in compact mode header -->
                    <div v-if="compact" class="h-12 px-3 scroll-pb-10 text-gray-950 text-subtitle2">
                        <div class="text-caption1 text-gray-600">
                            {{
                                isRangeMode
                                    ? t('date.selectedRange', 'Selected Range')
                                    : t('date.selectedDate', 'Selected Date')
                            }}
                        </div>
                        <div class="text-subtitle3 text-gray-950 font-medium">
                            {{ formattedDate || '' }}
                        </div>
                    </div>

                    <!-- Range Mode Tabs (only show in range mode) -->
                    <div v-if="isRangeMode" class="date-picker__tabs flex gap-2.5 mb-4 w-full">
                        <button
                            v-for="tab in tabs"
                            :key="tab.value"
                            :class="[
                                'date-picker__tab px-2 py-1 text-subtitle3 border text-gray-800 bg-gray-400 rounded cursor-pointer w-full hover:bg-gray-800 hover:text-white active:bg-gray-800 active:text-white active:scale-95',
                                {
                                    'is-active bg-blue-400 text-white hover:bg-blue-700':
                                        isTabActive(tab.value),
                                },
                            ]"
                            @click.stop="setActiveTab(tab.value)"
                        >
                            {{ tab.label }}
                        </button>
                    </div>

                    <!-- Calendars -->
                    <div class="date-picker__calendars flex gap-4">
                        <!-- First Calendar -->
                        <div class="date-picker__calendar min-w-[280px]">
                            <div
                                class="date-picker__calendar-header relative flex justify-center items-center p-2 font-semibold"
                            >
                                <button
                                    class="left-button absolute top-1/2 -translate-y-1/2 left-1"
                                    @click.stop="previousMonth($event)"
                                >
                                    <svg
                                        class="date-picker__arrow w-3 h-3 text-gray-950 hover:text-gray-600 active:text-gray-600 active:scale-95 transition-colors"
                                    >
                                        <use xlink:href="/sprite.svg#arrow2"></use>
                                    </svg>
                                </button>
                                <span
                                    class="date-picker__month text-subtitle3 font-bold text-center text-gray-950"
                                >
                                    {{ formatMonth(currentMonth) }}
                                </span>
                                <button
                                    v-if="!isRangeMode"
                                    class="right-button absolute top-1/2 -translate-y-1/2 right-1 rotate-180"
                                    @click.stop="nextMonth($event)"
                                >
                                    <svg
                                        class="date-picker__arrow w-3 h-3 text-gray-950 hover:text-gray-600 active:text-gray-600 active:scale-95 transition-colors"
                                    >
                                        <use xlink:href="/sprite.svg#arrow2"></use>
                                    </svg>
                                </button>
                            </div>

                            <!-- Weekday Headers -->
                            <div class="date-picker__weekdays grid grid-cols-7 gap-1 mb-2">
                                <div
                                    v-for="day in weekDays"
                                    :key="day"
                                    class="date-picker__weekday text-center text-gray-700 text-caption1 py-0.5"
                                >
                                    {{ day }}
                                </div>
                            </div>

                            <div class="date-picker__calendar-grid grid grid-cols-7">
                                <div
                                    v-for="{ date, isCurrentMonth } in getMonthDays(0)"
                                    :key="date.toISOString()"
                                    :class="getDayClasses(date, isCurrentMonth)"
                                    @mouseenter="handleHover(date)"
                                    @mouseleave="handleHover(null)"
                                    @click="selectDate(date)"
                                >
                                    {{ date.getDate() }}
                                </div>
                            </div>
                        </div>

                        <!-- Second Calendar (only in range mode) -->
                        <div v-if="isRangeMode" class="date-picker__calendar min-w-[280px]">
                            <div
                                class="date-picker__calendar-header relative flex justify-center items-center p-2 font-semibold"
                            >
                                <span
                                    class="date-picker__month text-subtitle3 font-bold text-center text-gray-950"
                                >
                                    {{ formatMonth(addMonths(currentMonth, 1)) }}
                                </span>
                                <button
                                    class="right-button absolute top-1/2 -translate-y-1/2 right-1 rotate-180"
                                    @click.stop="nextMonth($event)"
                                >
                                    <svg
                                        class="date-picker__arrow w-3 h-3 text-gray-950 hover:text-gray-600 active:text-gray-600 active:scale-95 transition-colors"
                                    >
                                        <use xlink:href="/sprite.svg#arrow2"></use>
                                    </svg>
                                </button>
                            </div>

                            <!-- Weekday Headers -->
                            <div class="date-picker__weekdays grid grid-cols-7 gap-1 mb-2">
                                <div
                                    v-for="day in weekDays"
                                    :key="day"
                                    class="date-picker__weekday text-center text-gray-700 text-caption1 py-0.5"
                                >
                                    {{ day }}
                                </div>
                            </div>

                            <div class="date-picker__calendar-grid grid grid-cols-7">
                                <div
                                    v-for="{ date, isCurrentMonth } in getMonthDays(1)"
                                    :key="date.toISOString()"
                                    :class="getDayClasses(date, isCurrentMonth)"
                                    @mouseenter="handleHover(date)"
                                    @mouseleave="handleHover(null)"
                                    @click="selectDate(date)"
                                >
                                    {{ date.getDate() }}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Action Buttons -->
                    <div
                        class="date-picker__actions flex justify-center gap-2.5 mt-3"
                        :class="{
                            'justify-between': compact && hasSelectedDate,
                        }"
                    >
                        <!-- Clear button in compact mode -->
                        <Button
                            v-if="compact && hasSelectedDate"
                            size="lg"
                            color="red"
                            variant="filled"
                            @click="clearSelection"
                        >
                            {{ t('common.clear', 'Clear') }}
                        </Button>

                        <div v-if="isRangeMode" class="flex gap-2.5">
                            <Button size="lg" color="gray" variant="filled" @click="closePicker">
                                {{ t('cancel', 'Cancel') }}
                            </Button>
                            <Button
                                size="lg"
                                color="blue"
                                variant="filled"
                                :disabled="!hasSelectedDate"
                                @click="applySelection"
                            >
                                {{ t('common.apply', 'Apply') }}
                            </Button>
                        </div>
                    </div>
                </div>
            </transition>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
    import { useI18n } from 'vue-i18n'
    import {
        format,
        isSameMonth,
        addMonths,
        subMonths,
        isSameDay,
        startOfWeek,
        endOfWeek,
        startOfMonth,
        endOfMonth,
        eachDayOfInterval,
        subYears,
        subDays,
        addDays,
        addWeeks,
        addYears,
        isBefore,
        isAfter,
        parseISO,
        formatISO,
        startOfDay,
    } from 'date-fns'
    import type { DatePickerProps, DateRange, TabOption } from '~/types/ui/datePicker'

    const props = withDefaults(defineProps<DatePickerProps>(), {
        modelValue: '',
        isRangeMode: false,
        dateFormat: 'dd.MM.yyyy',
        label: '',
        size: 'md',
        placeholder: '',
        required: false,
        compact: false,
        minDate: undefined,
        futureRanges: false,
        disabled: false,
        error: false,
        errorMessage: '',
    })
    const emit = defineEmits<{
        'update:modelValue': [value: string | DateRange]
        'date-selected': [date: string]
        'range-selected': [range: DateRange]
    }>()

    const { t } = useI18n()

    const isPickerVisible = ref(false)
    const selectedDate = ref<Date | null>(null)
    const rangeStart = ref<Date | null>(null)
    const rangeEnd = ref<Date | null>(null)
    const currentMonth = ref(new Date())
    const activeTab = ref<string>('day')
    const pickerModal = ref<HTMLElement | null>(null)
    const inputField = ref<HTMLElement | null>(null)
    const compactButton = ref<HTMLElement | null>(null)
    const hoveredDate = ref<Date | null>(null)
    const isFocused = ref(false)
    const containerRef = ref<HTMLElement | null>(null)
    const dropdownStyle = ref<Record<string, string>>({})

    const parsedMinDate = computed(() => {
        if (!props.minDate) return null
        if (props.minDate instanceof Date) return startOfDay(props.minDate)
        return startOfDay(parseISO(props.minDate))
    })

    watch(
        () => props.modelValue,
        (newVal) => {
            if (props.isRangeMode) {
                const range = newVal as DateRange
                if (
                    range?.start &&
                    range?.end &&
                    !isNaN(Date.parse(range.start)) &&
                    !isNaN(Date.parse(range.end))
                ) {
                    rangeStart.value = parseISO(range.start)
                    rangeEnd.value = parseISO(range.end)
                } else {
                    rangeStart.value = null
                    rangeEnd.value = null
                }
            } else {
                const date = newVal as string
                if (date && !isNaN(Date.parse(date))) {
                    selectedDate.value = parseISO(date)
                } else {
                    selectedDate.value = null
                }
            }
        },
        { immediate: true }
    )

    const hasSelectedDate = computed(() => {
        return props.isRangeMode
            ? rangeStart.value !== null && rangeEnd.value !== null
            : selectedDate.value !== null
    })

    const weekDays = computed(() => {
        const days = [
            t('date.monday', 'Mo'),
            t('date.tuesday', 'Tu'),
            t('date.wednesday', 'We'),
            t('date.thursday', 'Th'),
            t('date.friday', 'Fr'),
            t('date.saturday', 'Sa'),
            t('date.sunday', 'Su'),
        ]
        return days.map((day) => day.slice(0, 2))
    })

    const tabs = computed<TabOption[]>(() => [
        { label: t('date.day', 'Day'), value: 'day' },
        { label: t('date.week', 'Week'), value: 'week' },
        { label: t('date.month', { n: 0 }, 'Month'), value: 'month' },
        { label: t('date.halfYear', 'Half Year'), value: 'halfYear' },
        { label: t('date.year', 'Year'), value: 'year' },
    ])

    const formattedDate = computed(() => {
        if (props.isRangeMode && rangeStart.value && rangeEnd.value) {
            const start = format(rangeStart.value, props.dateFormat)
            const end = format(rangeEnd.value, props.dateFormat)
            return `${start} - ${end}`
        }
        return selectedDate.value ? format(selectedDate.value, props.dateFormat) : ''
    })

    const formatMonth = (date: Date): string => format(date, 'MMMM yyyy')

    const getMonthDays = (monthOffset: number) => {
        const monthStart = startOfMonth(addMonths(currentMonth.value, monthOffset))
        const monthEnd = endOfMonth(monthStart)
        const start = startOfWeek(monthStart, { weekStartsOn: 1 })
        const end = endOfWeek(monthEnd, { weekStartsOn: 1 })

        return eachDayOfInterval({ start, end }).map((date: Date) => ({
            date,
            isCurrentMonth: date.getMonth() === monthStart.getMonth(),
        }))
    }

    const isDateDisabled = (date: Date): boolean => {
        if (!parsedMinDate.value) return false
        return isBefore(startOfDay(date), parsedMinDate.value)
    }

    const getDayClasses = (date: Date, isCurrentMonth: boolean) => {
        const disabled = isDateDisabled(date)

        return [
            'date-picker__day px-2 py-2.5 text-body text-center text-gray-400 active:scale-95',
            {
                'cursor-pointer': !disabled,
                'cursor-not-allowed opacity-30': disabled,
                'is-hovered-in-range':
                    isHoveredInRange(date) &&
                    isCurrentMonth &&
                    props.isRangeMode &&
                    (!rangeEnd.value || !rangeStart.value) &&
                    !disabled,
                'is-selected':
                    (props.isRangeMode ? false : isSelected(date)) && isCurrentMonth && !disabled,
                'is-in-range': isInRange(date) && isCurrentMonth && props.isRangeMode && !disabled,
                'is-today': isToday(date) && isCurrentMonth,
                'is-current-month': isCurrentMonth && !disabled,
                'is-range-start':
                    isRangeStart(date) && isCurrentMonth && props.isRangeMode && !disabled,
                'is-range-end':
                    isRangeEnd(date) && isCurrentMonth && props.isRangeMode && !disabled,
                'is-disabled': disabled,
            },
        ]
    }

    const togglePicker = async () => {
        if (props.disabled) return

        isPickerVisible.value = !isPickerVisible.value
        if (isPickerVisible.value) {
            if (props.isRangeMode) {
                currentMonth.value = rangeStart.value
                    ? startOfMonth(rangeStart.value)
                    : startOfMonth(new Date())
            } else {
                currentMonth.value = selectedDate.value
                    ? startOfMonth(selectedDate.value)
                    : startOfMonth(new Date())
            }
            await nextTick()
            positionDropdown()
        }
    }

    const closePicker = (event?: Event) => {
        if (event) {
            event.preventDefault()
        }
        isPickerVisible.value = false
    }

    const clearSelection = (event?: Event) => {
        if (props.disabled) return

        if (event) {
            event.preventDefault()
            event.stopPropagation()
        }
        selectedDate.value = null
        rangeStart.value = null
        rangeEnd.value = null

        if (props.isRangeMode) {
            const emptyRange = { start: '', end: '' }
            emit('update:modelValue', emptyRange)
            emit('range-selected', emptyRange)
        } else {
            emit('update:modelValue', '')
            emit('date-selected', '')
        }
    }

    const selectDate = (date: Date) => {
        if (isDateDisabled(date) || props.disabled) return

        if (props.isRangeMode) {
            if (!rangeStart.value || (rangeStart.value && rangeEnd.value)) {
                rangeStart.value = date
                rangeEnd.value = null
                currentMonth.value = startOfMonth(date)
            } else {
                if (isBefore(date, rangeStart.value)) {
                    rangeEnd.value = rangeStart.value
                    rangeStart.value = date
                } else {
                    rangeEnd.value = date
                }
                if (!isSameMonth(date, currentMonth.value)) {
                    currentMonth.value = startOfMonth(date)
                }
                if (rangeStart.value && rangeEnd.value) {
                    const formattedRange = {
                        start: formatISO(rangeStart.value, { representation: 'date' }),
                        end: formatISO(rangeEnd.value, { representation: 'date' }),
                    }
                    emit('update:modelValue', formattedRange)
                    emit('range-selected', formattedRange)
                    if (!props.compact) {
                        closePicker()
                    }
                }
            }
        } else {
            selectedDate.value = date
            currentMonth.value = startOfMonth(date)
            const iso = formatISO(date, { representation: 'date' })
            emit('update:modelValue', iso)
            emit('date-selected', iso)
            if (!props.compact) {
                closePicker()
            }
        }
    }

    const isToday = (date: Date) => isSameDay(date, new Date())

    const isSelected = (date: Date) =>
        selectedDate.value !== null && isSameDay(date, selectedDate.value)

    const isRangeStart = (date: Date): boolean =>
        rangeStart.value !== null && isSameDay(date, rangeStart.value)

    const isRangeEnd = (date: Date): boolean =>
        rangeEnd.value !== null && isSameDay(date, rangeEnd.value)

    const isInRange = (date: Date): boolean => {
        if (!rangeStart.value || !rangeEnd.value) return false
        return (
            (isAfter(date, rangeStart.value) || isSameDay(date, rangeStart.value)) &&
            (isBefore(date, rangeEnd.value) || isSameDay(date, rangeEnd.value))
        )
    }

    const previousMonth = (event?: MouseEvent): void => {
        if (props.disabled) return
        event?.preventDefault()
        currentMonth.value = subMonths(currentMonth.value, 1)
    }

    const nextMonth = (event?: MouseEvent): void => {
        if (props.disabled) return
        event?.preventDefault()
        currentMonth.value = addMonths(currentMonth.value, 1)
    }

    const applySelection = (): void => {
        if (props.disabled) return

        if (props.isRangeMode && rangeStart.value && rangeEnd.value) {
            const range = {
                start: formatISO(rangeStart.value, { representation: 'date' }),
                end: formatISO(rangeEnd.value, { representation: 'date' }),
            }
            emit('update:modelValue', range)
            emit('range-selected', range)
            closePicker()
        } else if (selectedDate.value) {
            const iso = formatISO(selectedDate.value, { representation: 'date' })
            emit('update:modelValue', iso)
            emit('date-selected', iso)
            closePicker()
        }
    }

    const isHoveredInRange = (date: Date) => {
        if (!hoveredDate.value || !rangeStart.value || !props.isRangeMode || isDateDisabled(date))
            return false
        const endDate = rangeEnd.value || hoveredDate.value
        const [start, end] = [rangeStart.value, endDate].sort((a, b) => a.getTime() - b.getTime())
        return date >= start && date <= end
    }

    const handleHover = (date: Date | null) => {
        if (props.disabled || (date && isDateDisabled(date))) return
        hoveredDate.value = date
    }

    const setActiveTab = (tab: string) => {
        if (props.disabled) return

        activeTab.value = tab
        const today = new Date()
        let startDate: Date | null = null
        let endDate: Date | null = null

        if (props.futureRanges) {
            switch (tab) {
                case 'day':
                    startDate = today
                    endDate = today
                    break
                case 'week':
                    startDate = today
                    endDate = addDays(today, 6)
                    break
                case 'month':
                    startDate = today
                    endDate = addMonths(today, 1)
                    break
                case 'halfYear':
                    startDate = today
                    endDate = addMonths(today, 6)
                    break
                case 'year':
                    startDate = today
                    endDate = addYears(today, 1)
                    break
            }
        } else {
            switch (tab) {
                case 'day':
                    startDate = today
                    endDate = today
                    break
                case 'week':
                    startDate = subDays(today, 6)
                    endDate = today
                    break
                case 'month':
                    startDate = subMonths(today, 1)
                    endDate = today
                    break
                case 'halfYear':
                    startDate = subMonths(today, 6)
                    endDate = today
                    break
                case 'year':
                    startDate = subYears(today, 1)
                    endDate = today
                    break
            }
        }

        if (startDate && endDate) {
            if (parsedMinDate.value) {
                if (isBefore(startDate, parsedMinDate.value)) {
                    startDate = parsedMinDate.value
                }
                if (isBefore(endDate, parsedMinDate.value)) {
                    endDate = parsedMinDate.value
                }
            }

            rangeStart.value = startDate
            rangeEnd.value = endDate
            const range = {
                start: formatISO(startDate, { representation: 'date' }),
                end: formatISO(endDate, { representation: 'date' }),
            }
            emit('update:modelValue', range)
            emit('range-selected', range)
        }
    }

    const isTabActive = (tab: string) => {
        if (!rangeStart.value || !rangeEnd.value) return false

        const today = new Date()
        let startDate: Date | null = null
        let endDate: Date | null = null

        if (props.futureRanges) {
            switch (tab) {
                case 'day':
                    startDate = today
                    endDate = today
                    break
                case 'week':
                    startDate = today
                    endDate = addDays(today, 6)
                    break
                case 'month':
                    startDate = today
                    endDate = addMonths(today, 1)
                    break
                case 'halfYear':
                    startDate = today
                    endDate = addMonths(today, 6)
                    break
                case 'year':
                    startDate = today
                    endDate = addYears(today, 1)
                    break
            }
        } else {
            switch (tab) {
                case 'day':
                    startDate = today
                    endDate = today
                    break
                case 'week':
                    startDate = subDays(today, 6)
                    endDate = today
                    break
                case 'month':
                    startDate = subMonths(today, 1)
                    endDate = today
                    break
                case 'halfYear':
                    startDate = subMonths(today, 6)
                    endDate = today
                    break
                case 'year':
                    startDate = subYears(today, 1)
                    endDate = today
                    break
            }
        }

        if (parsedMinDate.value && startDate && endDate) {
            if (isBefore(startDate, parsedMinDate.value)) {
                startDate = parsedMinDate.value
            }
            if (isBefore(endDate, parsedMinDate.value)) {
                endDate = parsedMinDate.value
            }
        }

        return (
            startDate !== null &&
            endDate !== null &&
            isSameDay(rangeStart.value, startDate) &&
            isSameDay(rangeEnd.value, endDate)
        )
    }

    const positionDropdown = async () => {
        if (!isPickerVisible.value || props.disabled) return
        await nextTick()

        if (!pickerModal.value) return

        const triggerEl = props.compact ? compactButton.value : inputField.value
        if (!triggerEl) return

        const triggerRect = triggerEl.getBoundingClientRect()
        const modalRect = pickerModal.value.getBoundingClientRect()
        const vw = window.innerWidth
        const vh = window.innerHeight

        let left = triggerRect.left
        let top = triggerRect.bottom + 2
        let width = modalRect.width

        // Match dropdown width to input width on mobile and non-compact mode
        const isMobile = vw < 640
        if (!props.compact && isMobile) {
            width = Math.min(triggerRect.width, vw - 16) // Full width on mobile with padding
            left = 8 // 8px padding from left edge
        } else if (!props.compact) {
            // Match input width on desktop for non-compact mode
            width = Math.max(triggerRect.width, modalRect.width)
        }

        if (props.compact) {
            left = triggerRect.left - modalRect.width / 2 + triggerRect.width / 2
        }

        // Ensure dropdown doesn't overflow viewport
        if (left + width > vw) {
            left = Math.max(8, vw - width - 8)
        }
        if (left < 8) left = 8

        const spaceBelow = vh - triggerRect.bottom
        const spaceAbove = triggerRect.top
        const needsAbove = modalRect.height + 2 > spaceBelow && spaceAbove > spaceBelow

        if (needsAbove) {
            top = triggerRect.top - modalRect.height - 2
        }
        if (top < 0) top = 0

        dropdownStyle.value = {
            position: 'fixed',
            zIndex: '9999',
            top: `${top}px`,
            left: `${left}px`,
            width: `${width}px`,
            maxWidth: `${vw - 16}px`, // Ensure it never exceeds viewport
        }
    }

    const updatePosition = async () => {
        if (!isPickerVisible.value || props.disabled) return
        await positionDropdown()
    }

    const handleClickOutside = (event: MouseEvent) => {
        if (!isPickerVisible.value || props.disabled) return

        const target = event.target as Node
        const clickedInsideModal = pickerModal.value?.contains(target)
        const clickedInsideTrigger = props.compact
            ? compactButton.value?.contains(target)
            : inputField.value?.contains(target)

        if (!clickedInsideModal && !clickedInsideTrigger) {
            closePicker()
        }
    }

    const openPicker = () => {
        if (!isPickerVisible.value && !props.disabled) {
            isPickerVisible.value = true
            nextTick(() => {
                positionDropdown()
            })
        }
    }

    onMounted(() => {
        document.addEventListener('click', handleClickOutside)
        window.addEventListener('resize', updatePosition)
    })

    onBeforeUnmount(() => {
        document.removeEventListener('click', handleClickOutside)
        window.removeEventListener('resize', updatePosition)
    })

    defineExpose({
        togglePicker,
        openPicker,
        closePicker,
        isPickerVisible,
    })
</script>

<style lang="scss" scoped>
    .date-picker {
        &--compact {
            button {
                position: relative;
            }
        }

        &--disabled {
            .date-picker__modal {
                display: none !important;
            }
        }

        &__modal {
            @apply p-3 pb-6 mt-2;
            box-shadow:
                0px 1px 18px 0px rgba(90, 93, 101, 0.12),
                0px 6px 10px 0px rgba(90, 93, 101, 0.14);

            &--active {
                @apply border border-blue-500;
            }

            &--single {
                @apply w-full sm:w-[320px];
                min-width: 280px;
                max-width: 100%;
            }

            &--range {
                @apply w-full;
                min-width: 280px;

                @media (min-width: 640px) {
                    min-width: 600px;
                }
            }

            &--compact {
                @apply pb-3;
            }

            // Mobile responsive styles
            @media (max-width: 639px) {
                @apply p-2 pb-4;
                max-height: calc(100vh - 100px);
                overflow-y: auto;
            }
        }

        &__tabs {
            @apply flex gap-2.5 mb-4 w-full;

            // Mobile: Stack tabs or make them scrollable
            @media (max-width: 639px) {
                @apply gap-1.5 mb-3;
                flex-wrap: wrap;
            }
        }

        &__tab {
            @apply px-2 py-1 text-subtitle3 border text-gray-800 bg-gray-400 rounded cursor-pointer w-full;
            @apply hover:bg-gray-800 hover:text-white;
            @apply active:bg-gray-800 active:text-white active:scale-95;

            &.is-active {
                @apply bg-blue-400 text-white hover:bg-blue-700;
            }

            // Mobile: Smaller text and padding
            @media (max-width: 639px) {
                @apply px-1.5 py-0.5 text-caption1;
                min-width: fit-content;
                flex: 1 1 auto;
            }
        }

        &__calendars {
            @apply flex gap-4;

            // Mobile: Stack calendars vertically
            @media (max-width: 639px) {
                @apply flex-col gap-3;
            }
        }

        &__calendar {
            @apply min-w-[280px];

            // Mobile: Reduce min-width to fit screen
            @media (max-width: 639px) {
                @apply min-w-full;
                width: 100%;
            }
        }

        &__month {
            @apply text-subtitle3 font-bold text-center text-gray-950;
        }

        &__calendar-header {
            @apply relative flex justify-center items-center p-2 font-semibold;

            button {
                @apply absolute top-1/2 -translate-y-1/2;
            }

            .left-button {
                @apply left-1;
            }

            .right-button {
                @apply right-1;
            }
        }

        &__arrow {
            @apply w-3 h-3 text-gray-950 hover:text-gray-600 active:text-gray-600 active:scale-95 transition-colors;
        }

        &__weekdays {
            @apply grid grid-cols-7 gap-1 mb-2;
        }

        &__weekday {
            @apply text-center text-gray-700 text-caption1 py-0.5;

            // Mobile: Smaller text
            @media (max-width: 639px) {
                @apply text-[10px] py-0;
            }
        }

        &__calendar-grid {
            @apply grid grid-cols-7;

            // Mobile: Reduce gap
            @media (max-width: 639px) {
                gap: 1px;
            }
        }

        &__day {
            @apply px-2 py-2.5 text-body text-center text-gray-400 active:scale-95;

            // Mobile: Reduce padding for better fit
            @media (max-width: 639px) {
                @apply px-1 py-2 text-caption1;
            }

            &.is-disabled {
                @apply opacity-30 cursor-not-allowed;
            }

            &.is-current-month {
                @apply text-gray-950;
                @apply hover:text-blue-400 hover:bg-blue-50 hover:rounded;
                @apply active:text-white active:bg-blue-400 hover:rounded;

                &.is-selected {
                    @apply bg-blue-400 text-white rounded;
                }

                &.is-in-range {
                    @apply bg-blue-50;
                }
                &.is-range-start,
                &.is-range-end {
                    @apply bg-blue-400 text-white rounded;
                }

                &.is-hovered-in-range {
                    @apply bg-blue-50;

                    &.is-range-start,
                    &.is-range-end {
                        @apply bg-blue-400 text-white rounded;
                    }

                    &:hover {
                        @apply bg-blue-400 text-white rounded;
                    }
                }

                &.is-disabled {
                    @apply opacity-30 cursor-not-allowed;
                    @apply hover:text-gray-950 hover:bg-transparent;
                    @apply active:text-gray-950 active:bg-transparent;
                }
            }

            &.is-selected {
                @apply bg-blue-400 text-white rounded;
            }
            &.is-in-range {
                @apply bg-blue-50;
            }
            &.is-range-start,
            &.is-range-end {
                @apply bg-blue-400 text-white rounded;
            }

            &.is-today {
                @apply bg-white text-body text-blue-500 border-blue-500 border-dashed border rounded;
                @apply hover:bg-blue-300 hover:text-white active:bg-blue-300 active:text-white;

                &.is-disabled {
                    @apply opacity-30 cursor-not-allowed;
                    @apply hover:bg-white hover:text-blue-500;
                    @apply active:bg-white active:text-blue-500;
                }
            }

            &.is-hovered-in-range {
                @apply bg-blue-50;
            }
        }

        &__actions {
            @apply flex justify-center gap-2.5 mt-3;

            // Mobile: Stack buttons vertically or full width
            @media (max-width: 639px) {
                @apply gap-2 flex-wrap;

                button {
                    @apply flex-1;
                    min-width: 100px;
                }
            }
        }
    }

    .fade-enter-active,
    .fade-leave-active {
        @apply transition-opacity duration-200;
    }

    .fade-enter-from,
    .fade-leave-to {
        @apply opacity-0;
    }
</style>
