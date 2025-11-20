export interface LinkProps {
    title?: string
    to?: string
    size?: 'sm' | 'base' | 'md' | 'lg' | 'custom'
    color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'gray'
    activeClass?: string
    type?: 'link' | 'tel' | 'email' | 'button'
    wrap?: boolean
    containerClass?: string
}
