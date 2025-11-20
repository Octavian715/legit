import { defineNuxtPlugin } from '#app'
import { io, type Socket } from 'socket.io-client'
import { markRaw } from 'vue'

export default defineNuxtPlugin({
    name: 'socket',
    enforce: 'pre', // Run before other plugins
    setup() {
        // Only run on client side
        if (!process.client) {
            return {
                provide: {
                    socket: {
                        connect: () => null,
                        disconnect: () => {},
                        get: () => null,
                    },
                },
            }
        }

        const config = useRuntimeConfig()
        const socketUrl = config.public.socketUrl || 'http://38.242.255.80:3000'

        let currentSocket: Socket | null = null

        const createSocket = (token: string): Socket => {
            const socket = io(socketUrl, {
                auth: { token },
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                timeout: 10000,
                autoConnect: false,
            })

            socket.on('connect', () => {})

            socket.on('disconnect', (reason) => {})

            socket.on('connect_error', (error) => {
                console.error('[Socket Plugin] Socket connection error:', error.message)
            })

            // Mark socket as non-reactive to prevent SSR serialization
            return markRaw(socket) as Socket
        }

        const connectSocket = (token: string): Socket | null => {
            try {
                if (currentSocket) {
                    currentSocket.removeAllListeners()
                    currentSocket.disconnect()
                    currentSocket = null
                }

                currentSocket = createSocket(token)
                currentSocket.connect()

                return currentSocket
            } catch (error) {
                console.error('[Socket Plugin] Failed to create socket:', error)
                return null
            }
        }

        const disconnectSocket = (): void => {
            if (currentSocket) {
                currentSocket.removeAllListeners()
                currentSocket.disconnect()
                currentSocket = null
            }
        }

        const getSocket = (): Socket | null => {
            return currentSocket
        }

        window.addEventListener('beforeunload', () => {
            disconnectSocket()
        })

        return {
            provide: {
                socket: {
                    connect: connectSocket,
                    disconnect: disconnectSocket,
                    get: getSocket,
                },
            },
        }
    },
})
