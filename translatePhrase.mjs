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
     * @param {string} model - The model to use for translation.
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

        if (isUnexpected(response)) {
            console.error(chalk.red(`Error translating phrase "${phrase}" to ${language}:`, response.body));
            return "";
        }

        const translatedPhrase = response.body.choices[0].message.content.trim();

        return translatedPhrase;
    }

    return translatePhrase;
}

export function createApi(client, model) {
    return async function (prompt) {
        await client.path("/chat/completions", { model }).post({
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
