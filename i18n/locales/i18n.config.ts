// i18n/i18n.config.ts
export default {
    legacy: false,
    fallbackLocale: 'en',
    warnHtmlMessage: false,
    escapeParameterHtml: true,
    // prevents use of `Function()`
    messageCompiler: (msg: string) => () => msg,
}
