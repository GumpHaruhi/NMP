import { BASE_URL, CONFIG } from './config.js'

class ApiClient {
    constructor() {
        this.baseURL = BASE_URL
        this.timeout = CONFIG.TIMEOUT
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            timeout: this.timeout,
            ...options
        }

        if (CONFIG.DEBUG) {
            console.log(`[API Request] ${options.method || 'GET'} ${url}`, options.body || '')
        }

        try {
            const response = await fetch(url, config)

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`)
            }

            // 处理非JSON响应（如文件流）
            const contentType = response.headers.get('content-type')
            if (contentType && contentType.includes('application/json')) {
                return await response.json()
            } else {
                return await response.text()
            }
        } catch (error) {
            if (CONFIG.DEBUG) {
                console.error('[API Error]', error)
            }
            throw error
        }
    }

    get(endpoint, params = null) {
        let url = endpoint
        if (params) {
            const query = new URLSearchParams(params).toString()
            url = `${endpoint}?${query}`
        }
        return this.request(url, { method: 'GET' })
    }

    post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        })
    }
}

export const apiClient = new ApiClient()