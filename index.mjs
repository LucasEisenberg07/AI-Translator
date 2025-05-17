import { createApi, createTranslator } from "./lib/translatePhrase.mjs";
import chalk from "chalk";
import ModelClient from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import { saveTranslations } from "./lib/manageDatabase.mjs";

export async function translate(phrase, language, context, wrongAnswers, startingLanguage, regenerate, API) {
    if (API === null || API === undefined) {
        const client = ModelClient(
            "https://api.openai.com/v1",
            new AzureKeyCredential(process.env["AUTH_TOKEN"]),
        );
        API = await createApi(client, "gpt-4.1-nano");
    }

    if (!phrase || !language) {
        throw new Error("Phrase and language are required.");
    }

    if (!startingLanguage) {
        startingLanguage = "English";
    }

    if (!context) {
        context = "";
    }

    if (!regenerate) {
        regenerate = false;
    }

    let contextMap = new Map();
    if (!Array.isArray(context)) {
        context = [context];
    }
    contextMap.set(language, context);

    let wrongAnswersMap = new Map();
    if (!Array.isArray(wrongAnswers)) {
        wrongAnswers = [wrongAnswers];
    }
    wrongAnswersMap.set(language, wrongAnswers);
    const translatePhrase = createTranslator(API);

    return Promise.resolve(translatePhrase(phrase, language, wrongAnswersMap, contextMap, startingLanguage, regenerate))
        .then((translation) => {
            if (translation) {
                return translation;
            } else {
                throw new Error("Translation not found");
            }
        })
        .catch((error) => {
            console.error(chalk.red("Error translating phrase:", error));
            throw error;
        });
}

export async function saveTranslation(phrase, startingLanguage, translation, language) {
    const translationsObject = {
        [language]: {
            [phrase]: translation,
        },
    };
    await saveTranslations(translationsObject, startingLanguage)
}