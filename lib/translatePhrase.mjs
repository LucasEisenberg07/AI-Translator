import { isUnexpected } from "@azure-rest/ai-inference";
import chalk from "chalk";
import { buildPrompt } from "./promptBuilder.mjs";
import { fetchTranslation } from "./manageDatabase.mjs";


export function createTranslator(api) {
    /**
     * Translates a phrase into the specified language using the OpenAI API.
     * @param {string} phrase - The phrase to translate.
     * @param {string} language - The target language for translation.
     * @param {Map} wrongAnswers - Map of wrong answers for each language.
     * @param {Map} contextMap - Map of additional context for each language.
     * @param {string} startingLanguage - The source language for translation.
     * @param {boolean} regenerate - Flag to indicate if the translation should not be taken from the database.
     * @returns {Promise<string>} - The translated phrase.
     */
    async function translatePhrase(phrase, language, wrongAnswers, contextMap, startingLanguage, regenerate) {
        let translations = {};

        if (!regenerate) {
            translations = await fetchTranslation(startingLanguage, language, phrase);
            if (translations) {
                return translations;
            }
        }

        const wrongAnswersForLanguage = wrongAnswers.get(language) || [];
        const contextForLanguage = contextMap.get(language) || [];
        const prompt = buildPrompt(
            phrase,
            startingLanguage,
            language,
            contextForLanguage,
            wrongAnswersForLanguage
        );

        const response = await api(prompt);
        if (!response.isTest && isUnexpected(response)) {
            console.error(chalk.red(`Error translating phrase "${phrase}" to ${language}`));
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
        const translatedPhrase = response.body.choices[0].message.content.trim();

        return translatedPhrase;
    }

    return translatePhrase;
}

export function createApi(client, model) {
    return async function (prompt) {
        return await client.path("/chat/completions", { model }).post({
            body: {
                messages: [
                    { role: "system", content: "" },
                    { role: "user", content: prompt },
                ],
                temperature: 0.5,
                model: model,
                top_p: 0.9,
                max_tokens: 100,
            },
        });
    };
}
