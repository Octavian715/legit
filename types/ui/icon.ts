type ColorVariant = 'gray' | 'green' | 'yellow' | 'blue' | 'red'
type SizeVariant = 'base' | 'sm' | 'md' | 'lg' | 'xl'
type BadgeType = 'count' | 'label' | 'dot'

export interface IconType {
    icon?: string
    isButton?: boolean
    spritePath?: string
    background?: string | boolean
    textColor?: string
    label?: string
    count?: number | string
    maxCount?: number
    size?: SizeVariant
    color?: ColorVariant
    activeColor?: ColorVariant
    badgeColor?: ColorVariant
    badgeType?: BadgeType
    tooltip?: string
    disabled?: boolean
    loading?: boolean
    test?: string
}
