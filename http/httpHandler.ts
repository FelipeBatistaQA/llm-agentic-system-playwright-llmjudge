import { APIRequestContext } from "@playwright/test";
import { OpenAIAPI } from "./OpenAI-API/openAIAPI";

export class HttpHandler {

    private readonly request: APIRequestContext
    readonly openaiAPI: OpenAIAPI

    constructor(request: APIRequestContext) {
        this.request = request;
        this.openaiAPI = new OpenAIAPI(request);
    }  
}