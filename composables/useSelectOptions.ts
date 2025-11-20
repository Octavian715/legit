import type { Country, SelectOption } from '@/types/staticData'

export const useSelectOptions = () => {
    const transformToSelectOptions = <T>(
        data: T[],
        config: {
            value: keyof T | ((item: T) => any)
            label: keyof T | ((item: T) => string)
            code: keyof T | ((item: T) => string)
            [key: string]: any
        }
    ): SelectOption[] => {
        return data.map((item) => {
            const getValue = (field: keyof T | ((item: T) => any)) => {
                return typeof field === 'function' ? field(item) : item[field]
            }

            return {
                code: getValue(config.code),
                label: getValue(config.label),
                value: getValue(config.value),
                ...Object.keys(config)
                    .filter((key) => !['value', 'label', 'code'].includes(key))
                    .reduce((acc, key) => {
                        acc[key] = getValue(config[key])
                        return acc
                    }, {} as any),
            }
        })
    }

    const formatCountryOptions = (countries: Country[]): SelectOption[] => {
        return transformToSelectOptions(countries, {
            code: 'code',
            label: 'name',
            value: 'id',
            phoneCode: 'phone_code',
            nativeName: 'native_name',
            flagUrl: 'flag_url',
        })
    }

    const formatCountryWithPhoneOptions = (countries: Country[]): SelectOption[] => {
        return transformToSelectOptions(countries, {
            code: 'code',
            label: (country: Country) => `${country.name} (${country.phone_code})`,
            value: 'id',
            phoneCode: 'phone_code',
            nativeName: 'native_name',
            flag: (country: Country) => getFlagEmoji(country.code),
        })
    }

    const formatPhoneCodeOptions = (countries: Country[]): SelectOption[] => {
        return transformToSelectOptions(countries, {
            code: 'code',
            label: 'phone_code',
            value: 'id',
            phoneCode: 'phone_code',
            flag: (country: Country) => getFlagEmoji(country.code),
            displayName: 'name',
        })
    }

    const getFlagEmoji = (countryCode: string): string => {
        const flagMap: Record<string, string> = {
            DE: '🇩🇪',
            FR: '🇫🇷',
            US: '🇺🇸',
            CA: '🇨🇦',
            BR: '🇧🇷',
            CN: '🇨🇳',
            IN: '🇮🇳',
            AU: '🇦🇺',
            ZA: '🇿🇦',
            MD: '🇲🇩',
            RO: '🇷🇴',
            IT: '🇮🇹',
            ES: '🇪🇸',
            GB: '🇬🇧',
            NL: '🇳🇱',
            BE: '🇧🇪',
            CH: '🇨🇭',
            AT: '🇦🇹',
            PL: '🇵🇱',
            SE: '🇸🇪',
            NO: '🇳🇴',
            DK: '🇩🇰',
            FI: '🇫🇮',
        }

        return flagMap[countryCode] || '🌍'
    }

    const formatBusinessTypeOptions = (businessTypes: any[]) => {
        return transformToSelectOptions(businessTypes, {
            code: 'code',
            label: 'name',
            value: 'id',
        })
    }

    const formatCurrencyOptions = (currencies: any[]) => {
        return transformToSelectOptions(currencies, {
            code: 'code',
            label: (currency: any) => `${currency.name} (${currency.symbol})`,
            value: 'id',
            symbol: 'symbol',
        })
    }

    const formatContactPositionOptions = (positions: any[]) => {
        return transformToSelectOptions(positions, {
            code: 'code',
            label: 'name',
            value: 'id',
        })
    }

    const formatDocumentStatusOptions = (statuses: any[]) => {
        return transformToSelectOptions(statuses, {
            code: 'code',
            label: 'name',
            value: 'id',
        })
    }

    const formatDocumentPaymentStatusOptions = (statuses: any[]) => {
        return transformToSelectOptions(statuses, {
            code: 'code',
            label: 'name',
            value: 'id',
        })
    }

    return {
        transformToSelectOptions,
        formatCountryOptions,
        formatCountryWithPhoneOptions,
        formatPhoneCodeOptions,
        formatBusinessTypeOptions,
        formatCurrencyOptions,
        formatContactPositionOptions,
        formatDocumentStatusOptions,
        formatDocumentPaymentStatusOptions,
        getFlagEmoji,
    }
}
