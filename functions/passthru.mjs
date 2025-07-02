import { createApi } from "../lib/translatePhrase.mjs";
import chalk from "chalk";
import ModelClient from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import { isUnexpected } from "@azure-rest/ai-inference";

export default async (request, context) => {
    const apiKey = Netlify.env.get("AUTH_TOKEN");
    const body = await request.json();
    const client = ModelClient(
        "https://api.openai.com/v1",
        new AzureKeyCredential(apiKey),
    );
    const api = await createApi(client, "gpt-4.1-nano");
    const response = await api(body.prompt);

    if (!response.isTest && isUnexpected(response)) {
        console.error(chalk.red(`Error querrying the API`));
        if (response.body.error.code == "invalid_api_key") {
            console.error(chalk.red("Invalid API key. Please check your OpenAI API key. This could also mean that the API key did not have enough credits to complete the request."));
        }
        if (response.body.error.code == "model_not_found") {
            console.error(chalk.red("Model not found. Please check the model name."));
        }
        if (response.body.error.code == "rate_limit_exceeded") {
            console.error(chalk.red("Rate limit exceeded. Please try again later."));
        }
        if (response.body.error.code == "internal_server_error") {
            console.error(chalk.red("Internal server error. Please try again later."));
        }
        if (response.body.error.code == "timeout") {
            console.error(chalk.red("Request timed out. Please try again later."));
        }
        throw new Error(response.body.error.code);
    }

    if (!response.body || !response.body.choices || response.body.choices.length === 0) {
        console.error(chalk.red("Unexpected API response: ", response.body));
        return "";
    }
    const finalResponse = response.body.choices[0].message.content.trim();
    return new Response (JSON.stringify({
        response: finalResponse
    }));
};