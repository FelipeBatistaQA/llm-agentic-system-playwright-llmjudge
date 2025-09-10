import { APIResponse, expect } from "@playwright/test"

export class HttpSupport {

    static async checkStatusCode(response: APIResponse, expectedStatusCode?: number) {
        if (!expectedStatusCode) {
            expectedStatusCode = 200
            expect.soft(response.status()).toBe(expectedStatusCode)
        } else if (expectedStatusCode) {
            expect.soft(response.status()).toBe(expectedStatusCode)
        }
    }

}

