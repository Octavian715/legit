// server/error-handler.ts
import type { NitroErrorHandler } from 'nitropack'

export default <NitroErrorHandler>function (error, event) {
    console.error('[SSR Error]', {
        path: event.path,
        message: error.message,
        stack: error.stack,
    })

    // Don't expose internal errors to client
    return {
        statusCode: 500,
        statusMessage: 'Internal Server Error',
        message: error.message,
    }
}
