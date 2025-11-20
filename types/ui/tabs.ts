export interface Tab {
    id: number | string
    name: string
    label: string
    active: boolean
}

export interface TabsType {
    tabs: Tab[]
    disabled: boolean
    defaultActive?: number | string | undefined
}
