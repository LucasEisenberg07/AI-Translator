import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import { program } from 'commander';
import readline from 'readline';
import chalk from 'chalk';
import { createTranslator, createApi } from "./translatePhrase.mjs";
import { saveTranslations } from "./manageDatabase.mjs";

const token = process.env["OPEN_AI_KEY"];
const endpoint = "https://api.openai.com/v1";
const model = "gpt-4.1-nano";
let startingLanguage = "English";
let phrases = [];
const sampleLanguages = ["Spanish", "French", "German", "Chinese"];
const samplePhrases = ["Hello, how are you?", "Goodbye!"];
const wrongAnswers = new Map();
const contextMap = new Map();

if (!token) {
    console.error(chalk.red("Please set the OPEN_AI_KEY environment variable."));
    process.exit(1);
}

const client = ModelClient(
    endpoint,
    new AzureKeyCredential(token),
);

function formatLanguage(language) {
    const trimmed = language.trim();
    const lowercased = trimmed.toLowerCase();
    return lowercased.charAt(0).toUpperCase() + lowercased.slice(1);
}

program
    .option('-l, --languages <languages>', 'Comma-separated list of languages to translate into', (value) => value.split(',').map(formatLanguage), sampleLanguages)
    .option('-s, --starting-language <language>', 'Language to translate from', formatLanguage(startingLanguage))
    .option('-p, --phrases <phrases>', 'Comma-separated list of phrases to translate', (value) => value.split(','))
    .option('-c, --context <context>', 'Context for translation', "")
    .option('-j, --json', 'Output in JSON format')
    .option('-r --regenerate', 'Regenerate translations without using the database')
    .parse(process.argv);

phrases = program.opts().phrases;

const globalContext = program.opts().context;

const outputToJson = program.opts().json ? true : false;
const regenerate = program.opts().regenerate ? true : false;

if (!phrases || phrases.length === 0) {
    console.warn(chalk.yellow("No phrases provided. Using the default phrases: " + samplePhrases.join(', ') + "."));
    phrases = samplePhrases;
}

const endingLanguages = program.opts().languages.map(formatLanguage);

if (endingLanguages === sampleLanguages) {
    console.warn(chalk.yellow(`No languages provided. Using default languages: "${sampleLanguages.join(', ')}".`));
}

const translations = new Map();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function translatePhrases() {
    const api = createApi(client, model);
    const translatePhrase = createTranslator(api);

    for (const language of endingLanguages) {
        const languageTranslations = new Map();
        if (!wrongAnswers.has(language)) {
            wrongAnswers.set(language, []);
        }
        if (!contextMap.has(language)) {
            contextMap.set(language, globalContext ? [globalContext] : []);
        }
        for (const phrase of phrases) {
            languageTranslations.set(
                phrase,
                await translatePhrase(phrase, language, wrongAnswers, contextMap, startingLanguage, regenerate)
            );
        }
        translations.set(language, languageTranslations);
    }

    console.log("Translations:");
    printTranslations();

    regenerateTranslations();
}

async function regenerateTranslations() {
    rl.question('Which languages do you want to regenerate (all, specific language, or none): ', async (answer) => {
        if (answer.toLowerCase() === "all") {
            const additionalContext = await new Promise((resolve) => {
                rl.question('Any additional context on what went wrong: ', (answer) => {
                    resolve(answer);
                });
            });
            for (const [language, languageTranslations] of translations.entries()) {
                const wrongAnswersForLanguage = wrongAnswers.get(language) || [];
                for (const [_, translation] of languageTranslations.entries()) {
                    wrongAnswersForLanguage.push(translation);
                }
                wrongAnswers.set(language, wrongAnswersForLanguage);
                if (additionalContext) {
                    const currentContext = contextMap.get(language) || [];
                    currentContext.push(additionalContext);
                    contextMap.set(language, currentContext);
                }
            }

            console.log("Regenerating all translations...\n");
            translations.clear();
            await translatePhrases();
            regenerateTranslations();
        } else if (endingLanguages.includes(answer)) {
            const additionalContext = await new Promise((resolve) => {
                rl.question('Any additional context on what went wrong: ', (answer) => {
                    resolve(answer);
                });
            });
            const wrongAnswersForLanguage = wrongAnswers.get(answer) || [];
            const languageTranslations = translations.get(answer);
            for (const [_, translation] of languageTranslations.entries()) {
                wrongAnswersForLanguage.push(translation);
            }
            wrongAnswers.set(answer, wrongAnswersForLanguage);
            if (additionalContext) {
                const currentContext = contextMap.get(answer) || [];
                currentContext.push(additionalContext);
                contextMap.set(answer, currentContext);
            }
            console.log(`Updated translations:`);
            for (const [phrase, translation] of languageTranslations.entries()) {
                const newTranslation = await translatePhrase(phrase, answer, wrongAnswers, contextMap, startingLanguage, client, model, regenerate);
                languageTranslations.set(phrase, newTranslation);
                console.log(`  "${phrase}" -> "${newTranslation}"`);
            }
            regenerateTranslations();
        } else if (answer.toLowerCase() === "none" || answer.toLowerCase() === "") {
            console.log("No languages selected for regeneration. Final translations:");
            printTranslations();
            const translationsObject = Object.fromEntries([...translations].map(([language, phrases]) => [
                language,
                Object.fromEntries(phrases),
            ]));

            saveTranslations(translationsObject, startingLanguage);

            if (outputToJson) {
                console.log("Outputting translations in JSON format:");
                console.log(JSON.stringify(translationsObject, null, 2));
            }
            rl.close();
        } else {
            console.log(chalk.red("No valid languages selected for regeneration, restarting...\n"));
            regenerateTranslations();
        }
    });
}

function printTranslations() {
    for (const [language, languageTranslations] of translations.entries()) {
        console.log(`\n${language}:`);
        for (const [phrase, translation] of languageTranslations.entries()) {
            console.log(`  "${phrase}" -> "${translation}"`);
        }
    }
}

translatePhrases().catch((error) => {
    console.error("An error occurred during translation:", error);
});
