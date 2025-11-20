// types/ui/textarea.ts
export interface TextareaType {
    modelValue?: string | number | null | undefined
    name?: string
    label?: string
    size?: 'sm' | 'md' | 'lg'
    rows?: number
    maxlength?: number
    explain?: string
    error?: string | boolean
    errorMessage?: string
    copy?: boolean
    background?: string
    disabled?: boolean
    required?: boolean
}
