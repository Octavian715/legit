export interface UploadImage {
    id: number
    src: string
}

export interface UploadImageProps {
    modelValue?: UploadImage[] | File | File[] | null
    title?: string
    description?: string
    icon?: string | object
    accept?: string
    multiple?: boolean
    selectPrimary?: boolean
    error?: string
    ariaLabel?: string
    showButton?: boolean
    buttonTitle?: string
    buttonLoading?: boolean
    maxFiles?: undefined | number
}
