// ~/types/chart.ts

export type ChartType = 'line' | 'bar' | 'doughnut' | 'pie'
export type PeriodType =
    | 'today'
    | 'yesterday'
    | 'thisWeek'
    | 'lastWeek'
    | 'thisMonth'
    | 'lastMonth'
    | 'last30Days'
    | 'last90Days'
    | 'thisYear'
    | 'lastYear'
    | 'custom'

export interface DateRange {
    start: string
    end: string
}

export interface ChartDataPoint {
    date: string
    count: number
    label: string
    value: number
    metadata: Record<string, any>
}

export interface ChartDataset {
    label: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string | string[]
    borderWidth?: number
    fill?: boolean
    tension?: number
    pointRadius?: number
    pointHoverRadius?: number
    pointBorderWidth?: number
    pointBorderColor?: string
    pointBackgroundColor?: string
    borderRadius?: number
    borderSkipped?: boolean | string
    barThickness?: number
    maxBarThickness?: number
    hoverBorderWidth?: number
    hoverOffset?: number
    cutout?: string
}

export interface ChartData {
    labels: string[]
    datasets: ChartDataset[]
}

export interface LegendTab {
    value: string
    label: string
    count?: number
}

export interface LegendItem {
    id: string
    label: string
    value: number
    percentage: number
    color: string
    isActive?: boolean
}

export interface Currency {
    id: number
    code: string
    symbol: string
}

export interface CountryOrderData {
    country: string
    countryCode: string
    orders: number
    percentage: number
    color?: string
}

export interface DoughnutChartData {
    countries: CountryOrderData[]
    total: number
    currency?: Currency
}
