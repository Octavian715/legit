// composables/usePhoneValidation.ts
import { useI18n } from 'vue-i18n'

const DEFAULT_PHONE_PATTERN = {
    mask: '### ### ### ###',
    minLength: 7,
    maxLength: 15,
    regex: /^\d{7,15}$/,
    example: '123 456 7890',
    mobilePatterns: [/^\d{7,15}$/],
    landlinePatterns: [/^\d{7,15}$/],
}

// Comprehensive phone patterns with validation rules for each country
const phonePatterns: Record<
    string,
    {
        mask: string
        minLength: number
        maxLength: number
        regex: RegExp
        example: string
        mobilePatterns?: RegExp[]
        landlinePatterns?: RegExp[]
    }
> = {
    '1': {
        mask: '(###) ###-####',
        minLength: 10,
        maxLength: 10,
        regex: /^\d{10}$/,
        example: '(555) 123-4567',
        mobilePatterns: [/^[2-9]\d{2}[2-9]\d{6}$/],
        landlinePatterns: [/^[2-9]\d{2}[2-9]\d{6}$/],
    },
    '44': {
        mask: '#### ### ####',
        minLength: 10,
        maxLength: 10,
        regex: /^\d{10}$/,
        example: '7700 900123',
        mobilePatterns: [/^7[4-9]\d{8}$/],
        landlinePatterns: [/^[12]\d{9}$/, /^2\d{9}$/],
    },
    '49': {
        mask: '### ### ####',
        minLength: 10,
        maxLength: 11,
        regex: /^\d{10,11}$/,
        example: '030 12345678',
        mobilePatterns: [/^1[5-7]\d+$/, /^16\d+$/],
        landlinePatterns: [/^[2-9]\d+$/],
    },
    '33': {
        mask: '## ## ## ## ##',
        minLength: 9,
        maxLength: 9,
        regex: /^\d{9}$/,
        example: '01 23 45 67 89',
        mobilePatterns: [/^[67]\d{8}$/],
        landlinePatterns: [/^[1-5]\d{8}$/],
    },
    '39': {
        mask: '### ### ####',
        minLength: 9,
        maxLength: 10,
        regex: /^\d{9,10}$/,
        example: '06 1234 5678',
        mobilePatterns: [/^3\d{8,9}$/],
        landlinePatterns: [/^0[1-9]\d{7,8}$/],
    },
    '34': {
        mask: '### ### ###',
        minLength: 9,
        maxLength: 9,
        regex: /^\d{9}$/,
        example: '612 345 678',
        mobilePatterns: [/^[67]\d{8}$/],
        landlinePatterns: [/^[89]\d{8}$/],
    },
    '31': {
        mask: '## ### ####',
        minLength: 9,
        maxLength: 9,
        regex: /^\d{9}$/,
        example: '06 12345678',
        mobilePatterns: [/^6\d{8}$/],
        landlinePatterns: [/^[1-5]\d{8}$/],
    },
    '32': {
        mask: '### ## ## ##',
        minLength: 8,
        maxLength: 9,
        regex: /^\d{8,9}$/,
        example: '0470 12 34 56',
        mobilePatterns: [/^4[5-9]\d+$/, /^46[0-9]\d+$/],
        landlinePatterns: [/^[1-9]\d+$/],
    },
    '41': {
        mask: '## ### ## ##',
        minLength: 9,
        maxLength: 9,
        regex: /^\d{9}$/,
        example: '78 123 45 67',
        mobilePatterns: [/^7[5-9]\d{7}$/],
        landlinePatterns: [/^[1-6]\d{8}$/],
    },
    '43': {
        mask: '### ### ####',
        minLength: 10,
        maxLength: 11,
        regex: /^\d{10,11}$/,
        example: '0664 1234567',
        mobilePatterns: [/^6[5-9]\d+$/],
        landlinePatterns: [/^[1-9]\d+$/],
    },
    '45': {
        mask: '## ## ## ##',
        minLength: 8,
        maxLength: 8,
        regex: /^\d{8}$/,
        example: '12 34 56 78',
        mobilePatterns: [/^[2-9]\d{7}$/],
        landlinePatterns: [/^[3-9]\d{7}$/],
    },
    '46': {
        mask: '##-### ## ##',
        minLength: 9,
        maxLength: 9,
        regex: /^\d{9}$/,
        example: '70-123 45 67',
        mobilePatterns: [/^7[0-9]\d{7}$/],
        landlinePatterns: [/^[1-6]\d{8}$/],
    },
    '47': {
        mask: '### ## ###',
        minLength: 8,
        maxLength: 8,
        regex: /^\d{8}$/,
        example: '412 34 567',
        mobilePatterns: [/^[49]\d{7}$/],
        landlinePatterns: [/^[235-8]\d{7}$/],
    },
    '358': {
        mask: '## ### ####',
        minLength: 8,
        maxLength: 9,
        regex: /^\d{8,9}$/,
        example: '40 123 4567',
        mobilePatterns: [/^4[0-6]\d+$/, /^5[0]\d+$/],
        landlinePatterns: [/^[1-3]\d+$/, /^[6-9]\d+$/],
    },
    '48': {
        mask: '### ### ###',
        minLength: 9,
        maxLength: 9,
        regex: /^\d{9}$/,
        example: '501 234 567',
        mobilePatterns: [/^[4-8]\d{8}$/],
        landlinePatterns: [/^[1-3]\d{8}$/],
    },
    '420': {
        mask: '### ### ###',
        minLength: 9,
        maxLength: 9,
        regex: /^\d{9}$/,
        example: '601 234 567',
        mobilePatterns: [/^[67]\d{8}$/],
        landlinePatterns: [/^[2-5]\d{8}$/],
    },
    '421': {
        mask: '### ### ###',
        minLength: 9,
        maxLength: 9,
        regex: /^\d{9}$/,
        example: '901 234 567',
        mobilePatterns: [/^9\d{8}$/],
        landlinePatterns: [/^[2-5]\d{8}$/],
    },
    '36': {
        mask: '## ### ####',
        minLength: 8,
        maxLength: 9,
        regex: /^\d{8,9}$/,
        example: '30 123 4567',
        mobilePatterns: [/^[237]\d{7,8}$/],
        landlinePatterns: [/^[1456-9]\d{7,8}$/],
    },
    '40': {
        mask: '### ### ###',
        minLength: 9,
        maxLength: 9,
        regex: /^\d{9}$/,
        example: '721 234 567',
        mobilePatterns: [/^7[2-8]\d{7}$/],
        landlinePatterns: [/^[2-3]\d{8}$/],
    },
    '373': {
        mask: '## ### ###',
        minLength: 8,
        maxLength: 8,
        regex: /^\d{8}$/,
        example: '69 123 456',
        mobilePatterns: [/^[67]\d{7}$/],
        landlinePatterns: [/^[2-5]\d{7}$/],
    },
    '91': {
        mask: '##### #####',
        minLength: 10,
        maxLength: 10,
        regex: /^\d{10}$/,
        example: '98765 43210',
        mobilePatterns: [/^[6-9]\d{9}$/],
        landlinePatterns: [/^[1-5]\d{9}$/],
    },
    '86': {
        mask: '### #### ####',
        minLength: 11,
        maxLength: 11,
        regex: /^\d{11}$/,
        example: '138 0013 8000',
        mobilePatterns: [/^1[3-9]\d{9}$/],
        landlinePatterns: [/^[2-8]\d{10}$/],
    },
    '81': {
        mask: '##-####-####',
        minLength: 10,
        maxLength: 11,
        regex: /^\d{10,11}$/,
        example: '90-1234-5678',
        mobilePatterns: [/^[789]\d{9,10}$/],
        landlinePatterns: [/^[1-6]\d{9,10}$/],
    },
    '82': {
        mask: '##-####-####',
        minLength: 9,
        maxLength: 11,
        regex: /^\d{9,11}$/,
        example: '10-1234-5678',
        mobilePatterns: [/^1[0-9]\d{7,9}$/],
        landlinePatterns: [/^[2-6]\d{8,10}$/],
    },
    '61': {
        mask: '### ### ###',
        minLength: 9,
        maxLength: 9,
        regex: /^\d{9}$/,
        example: '412 345 678',
        mobilePatterns: [/^4\d{8}$/],
        landlinePatterns: [/^[2378]\d{8}$/],
    },
    '64': {
        mask: '##-### ####',
        minLength: 8,
        maxLength: 9,
        regex: /^\d{8,9}$/,
        example: '21-123 4567',
        mobilePatterns: [/^2[1-9]\d{6,7}$/],
        landlinePatterns: [/^[3-9]\d{7,8}$/],
    },
    '55': {
        mask: '## #####-####',
        minLength: 10,
        maxLength: 11,
        regex: /^\d{10,11}$/,
        example: '11 91234-5678',
        mobilePatterns: [/^\d{2}9\d{8}$/],
        landlinePatterns: [/^\d{2}[2-8]\d{7}$/],
    },
    '52': {
        mask: '## #### ####',
        minLength: 10,
        maxLength: 10,
        regex: /^\d{10}$/,
        example: '55 1234 5678',
        mobilePatterns: [/^\d{2}[1]\d{7}$/],
        landlinePatterns: [/^\d{2}[2-9]\d{7}$/],
    },
    '54': {
        mask: '##-####-####',
        minLength: 10,
        maxLength: 11,
        regex: /^\d{10,11}$/,
        example: '11-1234-5678',
        mobilePatterns: [/^\d{2}[15]\d{7,8}$/],
        landlinePatterns: [/^\d{2}[2-4]\d{7,8}$/],
    },
    '56': {
        mask: '# #### ####',
        minLength: 8,
        maxLength: 9,
        regex: /^\d{8,9}$/,
        example: '9 1234 5678',
        mobilePatterns: [/^[89]\d{7,8}$/],
        landlinePatterns: [/^[2-7]\d{7,8}$/],
    },
    '57': {
        mask: '### ### ####',
        minLength: 10,
        maxLength: 10,
        regex: /^\d{10}$/,
        example: '300 123 4567',
        mobilePatterns: [/^3[0-5]\d{8}$/],
        landlinePatterns: [/^[1-8]\d{9}$/],
    },
    '58': {
        mask: '###-#######',
        minLength: 10,
        maxLength: 10,
        regex: /^\d{10}$/,
        example: '412-1234567',
        mobilePatterns: [/^4[1-2]\d{8}$/],
        landlinePatterns: [/^[2-3]\d{9}$/],
    },
    '27': {
        mask: '## ### ####',
        minLength: 9,
        maxLength: 9,
        regex: /^\d{9}$/,
        example: '82 123 4567',
        mobilePatterns: [/^[6-8]\d{8}$/],
        landlinePatterns: [/^[1-5]\d{8}$/],
    },
}

export interface PhoneValidationResult {
    isValid: boolean
    message: string
    suggestions?: string[]
    phoneOnly?: string
    formattedPhone?: string
}

export interface PhoneValidationState {
    state: 'empty' | 'invalid' | 'incomplete' | 'valid'
    message: string
    progress: number
}

export interface PhoneMetadata {
    countryCode: string | null
    countryName: string | null
    phoneOnly: string
    formattedInternational: string
    formattedNational: string
    isValid: boolean
    type: 'mobile' | 'landline' | 'unknown'
    carrier: string | null
}

export interface CountryInfo {
    code: string
    phoneCode: string
    pattern: {
        mask: string
        minLength: number
        maxLength: number
        example: string
    }
}

export interface DetailedValidation {
    isValid: boolean
    errors: string[]
    warnings: string[]
    suggestions: string[]
    metadata: PhoneMetadata
}

export const usePhoneValidation = () => {
    const { t } = useI18n()
    const { findCountryByPhoneCode } = useStaticData()

    const getCountryNameByPhoneCode = (phoneCode: string): string | null => {
        const country = findCountryByPhoneCode(phoneCode)
        return country ? country.name : null
    }

    const getPhonePattern = (phoneCode: string) => {
        const code = phoneCode.replace('+', '')
        return phonePatterns[code] || DEFAULT_PHONE_PATTERN
    }

    const extractPhoneNumberOnly = (fullPhoneNumber: string, phoneCode: string): string => {
        if (!fullPhoneNumber) return ''

        const code = phoneCode.replace('+', '')
        const cleanNumber = fullPhoneNumber.replace(/\D/g, '')

        if (cleanNumber.startsWith(code)) {
            return cleanNumber.substring(code.length)
        }

        return cleanNumber
    }

    const detectCountryCode = (phoneNumber: string): string | null => {
        if (!phoneNumber) return null

        const digits = phoneNumber.replace(/\D/g, '')

        for (let length = 4; length >= 1; length--) {
            const prefix = digits.substring(0, length)
            if (phonePatterns[prefix]) {
                return `+${prefix}`
            }
        }

        return null
    }

    const formatPhoneNumber = (phoneNumber: string, phoneCode: string): string => {
        if (!phoneNumber || !phoneCode) return phoneNumber

        const pattern = getPhonePattern(phoneCode)
        const phoneOnly = extractPhoneNumberOnly(phoneNumber, phoneCode)
        if (!phoneOnly) return phoneCode + ' '

        let formatted = pattern.mask
        let digitIndex = 0

        for (let i = 0; i < formatted.length && digitIndex < phoneOnly.length; i++) {
            if (formatted[i] === '#') {
                formatted =
                    formatted.substring(0, i) + phoneOnly[digitIndex] + formatted.substring(i + 1)
                digitIndex++
            }
        }

        formatted = formatted.replace(/#/g, '')

        return `${phoneCode} ${formatted}`
    }

    const validatePhoneNumber = (
        phoneNumber: string,
        phoneCode?: string
    ): PhoneValidationResult => {
        if (!phoneNumber || phoneNumber.trim().length === 0) {
            return {
                isValid: false,
                message: t('validation.phoneRequired', 'Phone number is required'),
            }
        }

        let detectedPhoneCode = phoneCode
        if (!detectedPhoneCode) {
            detectedPhoneCode = detectCountryCode(phoneNumber)
            if (!detectedPhoneCode) {
                return {
                    isValid: false,
                    message: t(
                        'validation.phoneInvalidCountryCode',
                        'Unable to detect country code'
                    ),
                    suggestions: [
                        t('validation.phoneSelectCountry', 'Please select a country first'),
                    ],
                }
            }
        }

        const pattern = getPhonePattern(detectedPhoneCode)
        const phoneOnly = extractPhoneNumberOnly(phoneNumber, detectedPhoneCode)

        if (!phoneOnly || phoneOnly.length === 0) {
            return {
                isValid: false,
                message: t('validation.phoneEnterDigits', 'Please enter phone number digits'),
                suggestions: [t('validation.phoneExample', `Example: ${pattern.example}`)],
            }
        }

        if (phoneOnly.length < pattern.minLength) {
            return {
                isValid: false,
                message: t(
                    'validation.phoneTooShort',
                    `Phone number too short (minimum ${pattern.minLength} digits)`
                ),
                phoneOnly,
                suggestions: [t('validation.phoneExample', `Example: ${pattern.example}`)],
            }
        }

        if (phoneOnly.length > pattern.maxLength) {
            return {
                isValid: false,
                message: t(
                    'validation.phoneTooLong',
                    `Phone number too long (maximum ${pattern.maxLength} digits)`
                ),
                phoneOnly,
                suggestions: [t('validation.phoneRemoveExtraDigits', 'Please remove extra digits')],
            }
        }

        if (!pattern.regex.test(phoneOnly)) {
            return {
                isValid: false,
                message: t('validation.phoneInvalidFormat', 'Invalid phone number format'),
                phoneOnly,
                suggestions: [t('validation.phoneExample', `Example: ${pattern.example}`)],
            }
        }

        const formattedPhone = formatPhoneNumber(phoneNumber, detectedPhoneCode)

        return {
            isValid: true,
            message: t('validation.phoneValid', 'Valid phone number'),
            phoneOnly,
            formattedPhone,
        }
    }
    const getValidationState = (phoneNumber: string, phoneCode?: string): PhoneValidationState => {
        if (!phoneNumber || phoneNumber.trim().length === 0) {
            return {
                state: 'empty',
                message: t('validation.phoneEnterNumber', 'Enter phone number'),
                progress: 0,
            }
        }

        const validation = validatePhoneNumber(phoneNumber, phoneCode)

        if (!phoneCode && !detectCountryCode(phoneNumber)) {
            return {
                state: 'invalid',
                message: t('validation.phoneSelectCountry', 'Select country first'),
                progress: 10,
            }
        }

        const detectedCode = phoneCode || detectCountryCode(phoneNumber)
        const pattern = getPhonePattern(detectedCode!)
        const phoneOnly = extractPhoneNumberOnly(phoneNumber, detectedCode!)
        const progress = Math.min((phoneOnly.length / pattern.maxLength) * 100, 100)

        if (validation.isValid) {
            return {
                state: 'valid',
                message: t('validation.phoneValid', 'Valid phone number'),
                progress: 100,
            }
        }

        if (phoneOnly.length > 0 && phoneOnly.length < pattern.minLength) {
            // Build message with actual numbers
            const baseMessage = t('validation.phoneContinueTyping', 'Continue typing')
            const countMessage = `${baseMessage} (${phoneOnly.length}/${pattern.minLength})`

            return {
                state: 'incomplete',
                message: countMessage,
                progress,
            }
        }

        if (phoneOnly.length === 0) {
            return {
                state: 'incomplete',
                message: t('validation.phoneEnterDigits', 'Please enter phone number digits'),
                progress: 0,
            }
        }

        return {
            state: 'invalid',
            message: validation.message,
            progress,
        }
    }
    const detectPhoneType = (
        phoneOnly: string,
        phoneCode: string | null
    ): 'mobile' | 'landline' | 'unknown' => {
        if (!phoneOnly || !phoneCode) return 'unknown'

        const code = phoneCode.replace('+', '')
        const pattern = phonePatterns[code]

        if (!pattern) return 'unknown'

        if (pattern.mobilePatterns) {
            const isMobile = pattern.mobilePatterns.some((regex) => regex.test(phoneOnly))
            if (isMobile) return 'mobile'
        }

        if (pattern.landlinePatterns) {
            const isLandline = pattern.landlinePatterns.some((regex) => regex.test(phoneOnly))
            if (isLandline) return 'landline'
        }

        return 'unknown'
    }

    const getPhoneMetadata = (phoneNumber: string, phoneCode?: string): PhoneMetadata => {
        const detectedCode = phoneCode || detectCountryCode(phoneNumber)
        const phoneOnly = detectedCode ? extractPhoneNumberOnly(phoneNumber, detectedCode) : ''

        return {
            countryCode: detectedCode,
            countryName: detectedCode ? getCountryNameByPhoneCode(detectedCode) : null,
            phoneOnly,
            formattedInternational: detectedCode
                ? formatPhoneNumber(phoneNumber, detectedCode)
                : phoneNumber,
            formattedNational: formatForDisplay(phoneNumber, detectedCode, {
                international: false,
                showCountryCode: false,
            }),
            isValid: validatePhoneNumber(phoneNumber, detectedCode).isValid,
            type: detectPhoneType(phoneOnly, detectedCode),
            carrier: null,
        }
    }

    const parsePhoneNumber = (
        phoneNumber: string
    ): {
        countryCode: string | null
        phoneOnly: string
        isValid: boolean
        formatted: string
    } => {
        if (!phoneNumber) {
            return {
                countryCode: null,
                phoneOnly: '',
                isValid: false,
                formatted: '',
            }
        }

        const detectedCode = detectCountryCode(phoneNumber)
        if (!detectedCode) {
            return {
                countryCode: null,
                phoneOnly: cleanPhoneNumber(phoneNumber),
                isValid: false,
                formatted: phoneNumber,
            }
        }

        const phoneOnly = extractPhoneNumberOnly(phoneNumber, detectedCode)
        const validation = validatePhoneNumber(phoneNumber, detectedCode)
        const formatted = validation.formattedPhone || phoneNumber

        return {
            countryCode: detectedCode,
            phoneOnly,
            isValid: validation.isValid,
            formatted,
        }
    }

    const generatePhoneSuggestion = (partialPhone: string, phoneCode: string): string => {
        const pattern = getPhonePattern(phoneCode)

        if (!partialPhone || partialPhone.trim().length === 0) {
            return `${phoneCode} ${pattern.example}`
        }

        const phoneOnly = extractPhoneNumberOnly(partialPhone, phoneCode)
        if (phoneOnly.length >= pattern.maxLength) {
            return formatPhoneNumber(partialPhone, phoneCode)
        }

        const exampleDigits = pattern.example.replace(/\D/g, '')
        const suggestion = phoneOnly + exampleDigits.substring(phoneOnly.length, pattern.maxLength)

        return formatPhoneNumber(`${phoneCode}${suggestion}`, phoneCode)
    }

    const formatForDisplay = (
        phoneNumber: string,
        phoneCode?: string,
        options?: {
            international?: boolean
            showCountryCode?: boolean
            separator?: string
        }
    ): string => {
        const opts = {
            international: true,
            showCountryCode: true,
            separator: ' ',
            ...options,
        }

        if (!phoneNumber) return ''

        const detectedCode = phoneCode || detectCountryCode(phoneNumber)
        if (!detectedCode) return phoneNumber

        const phoneOnly = extractPhoneNumberOnly(phoneNumber, detectedCode)
        if (!phoneOnly) return detectedCode

        if (opts.international) {
            return formatPhoneNumber(phoneNumber, detectedCode)
        }

        const pattern = getPhonePattern(detectedCode)

        let formatted = pattern.mask
        let digitIndex = 0

        for (let i = 0; i < formatted.length && digitIndex < phoneOnly.length; i++) {
            if (formatted[i] === '#') {
                formatted =
                    formatted.substring(0, i) + phoneOnly[digitIndex] + formatted.substring(i + 1)
                digitIndex++
            }
        }

        formatted = formatted.replace(/#/g, '')
        return opts.showCountryCode ? `${detectedCode}${opts.separator}${formatted}` : formatted
    }

    const getCountryInfo = (phoneCode: string): CountryInfo | null => {
        const pattern = getPhonePattern(phoneCode)

        return {
            code: phoneCode.replace('+', ''),
            phoneCode,
            pattern: {
                mask: pattern.mask,
                minLength: pattern.minLength,
                maxLength: pattern.maxLength,
                example: pattern.example,
            },
        }
    }

    const getSupportedCountries = (): CountryInfo[] => {
        return Object.entries(phonePatterns).map(([code, pattern]) => ({
            code,
            phoneCode: `+${code}`,
            pattern: {
                mask: pattern.mask,
                minLength: pattern.minLength,
                maxLength: pattern.maxLength,
                example: pattern.example,
            },
        }))
    }

    const validatePhoneNumbers = (
        phones: Array<{ phoneNumber: string; countryCode?: string }>
    ): Array<PhoneValidationResult & { index: number }> => {
        return phones.map((phone, index) => ({
            ...validatePhoneNumber(phone.phoneNumber, phone.countryCode),
            index,
        }))
    }

    const isPhoneComplete = (phoneNumber: string, phoneCode: string): boolean => {
        const validation = validatePhoneNumber(phoneNumber, phoneCode)
        return validation.isValid
    }

    const getMaskPattern = (phoneCode: string): string => {
        const pattern = getPhonePattern(phoneCode)
        return `${phoneCode} ${pattern.mask}`
    }

    const cleanPhoneNumber = (phoneNumber: string): string => {
        if (!phoneNumber) return ''

        let cleaned = phoneNumber.replace(/[^\d+]/g, '')

        if (cleaned.includes('+')) {
            const plusIndex = cleaned.indexOf('+')
            if (plusIndex === 0) {
                cleaned = '+' + cleaned.substring(1).replace(/\+/g, '')
            } else {
                cleaned = cleaned.replace(/\+/g, '')
            }
        }

        return cleaned
    }

    const normalizePhoneNumber = (phoneNumber: string, phoneCode?: string): string => {
        if (!phoneNumber) return ''

        let detectedPhoneCode = phoneCode
        if (!detectedPhoneCode) {
            detectedPhoneCode = detectCountryCode(phoneNumber)
        }

        if (!detectedPhoneCode) return cleanPhoneNumber(phoneNumber)

        const phoneOnly = extractPhoneNumberOnly(phoneNumber, detectedPhoneCode)
        if (!phoneOnly) return detectedPhoneCode

        return `${detectedPhoneCode}${phoneOnly}`
    }

    const arePhoneNumbersEqual = (phone1: string, phone2: string): boolean => {
        if (!phone1 && !phone2) return true
        if (!phone1 || !phone2) return false

        const normalized1 = normalizePhoneNumber(phone1)
        const normalized2 = normalizePhoneNumber(phone2)

        return normalized1 === normalized2
    }

    const validateWithDetails = (phoneNumber: string, phoneCode?: string): DetailedValidation => {
        const errors: string[] = []
        const warnings: string[] = []
        const suggestions: string[] = []

        if (!phoneNumber || phoneNumber.trim().length === 0) {
            errors.push(t('validation.phoneRequired', 'Phone number is required'))
        }

        const validation = validatePhoneNumber(phoneNumber, phoneCode)
        const metadata = getPhoneMetadata(phoneNumber, phoneCode)

        if (!validation.isValid) {
            errors.push(validation.message)
            if (validation.suggestions) {
                suggestions.push(...validation.suggestions)
            }
        }

        if (metadata.type === 'unknown') {
            warnings.push(
                t('validation.phoneTypeUnknown', 'Could not determine if mobile or landline')
            )
        }

        if (metadata.countryCode && !metadata.countryName) {
            warnings.push(t('validation.phoneCountryUnknown', 'Country not recognized'))
        }

        return {
            isValid: validation.isValid,
            errors,
            warnings,
            suggestions,
            metadata,
        }
    }

    return {
        validatePhoneNumber,
        validatePhoneNumbers,
        validateWithDetails,
        getPhonePattern,
        extractPhoneNumberOnly,
        detectCountryCode,
        formatPhoneNumber,
        isPhoneComplete,
        getMaskPattern,
        cleanPhoneNumber,
        normalizePhoneNumber,
        parsePhoneNumber,
        generatePhoneSuggestion,
        formatForDisplay,
        getValidationState,
        arePhoneNumbersEqual,
        getCountryInfo,
        getSupportedCountries,
        getPhoneMetadata,
        detectPhoneType,
        getCountryNameByPhoneCode,
        phonePatterns,
    }
}
