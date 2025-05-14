import ModelClient from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import { program } from 'commander';
import readline from 'readline';
import chalk from 'chalk';
import { createTranslator, createApi } from "./lib/translatePhrase.mjs";
import { saveTranslations } from "./lib/manageDatabase.mjs";

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
let regenerate = program.opts().regenerate ? true : false;

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

    try {
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
    } catch (error) {
        console.error(chalk.red(error + ", aborting..."));
        process.exit(1);
    }

    console.log("Translations:");
    printTranslations();

    regenerateTranslations(translatePhrase);
}

async function regenerateTranslations(translatePhrase) {
    rl.question('Which languages do you want to regenerate (all, specific language, or none): ', async (answer) => {
        if (answer.toLowerCase() === "all") {
            await regenerateAllLanguages();
        } else if (endingLanguages.includes(formatLanguage(answer))) {
            await regenerateForLanguage(answer, translatePhrase);
            console.log(`Regenerated translations for ${answer}:\n`);
            regenerateTranslations();
        } else if (answer.toLowerCase() === "none" || answer.toLowerCase() === "") {
            acceptTranslations();
        } else {
            console.log(chalk.red("No valid languages selected for regeneration, please choose one of: " + endingLanguages.join(', ') + ". Restarting...\n"));
            regenerateTranslations();
        }

    });
}

async function regenerateAllLanguages() {
    const additionalContext = await new Promise((resolve) => {
        rl.question('Any additional context on what went wrong: ', (answer) => {
            resolve(answer);
        });
    });
    for (const [language, languageTranslations] of translations.entries()) {
        const wrongAnswersForLanguage = wrongAnswers.get(language) || [];
        for (const translation of languageTranslations.values()) {
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
    regenerate = true;
    await translatePhrases();
    return;
}

async function regenerateForLanguage(language, translatePhrase) {
    const formattedLanguage = formatLanguage(language);

    const additionalContext = await new Promise((resolve) => {
        rl.question('Any additional context on what went wrong: ', (answer) => {
            resolve(answer);
        });
    });

    const wrongAnswersForLanguage = wrongAnswers.get(formattedLanguage) || [];
    const languageTranslations = translations.get(formattedLanguage);

    if (!languageTranslations) {
        console.error(chalk.red(`No translations found for language: ${formattedLanguage}`));
        return;
    }

    for (const translation of languageTranslations.values()) {
        wrongAnswersForLanguage.push(translation);
    }
    wrongAnswers.set(formattedLanguage, wrongAnswersForLanguage);

    if (additionalContext) {
        const currentContext = contextMap.get(formattedLanguage) || [];
        currentContext.push(additionalContext);
        contextMap.set(formattedLanguage, currentContext);
    }

    regenerate = true;

    console.log(`Updating translations for ${formattedLanguage}:`);
    try {
        for (const phrase of languageTranslations.keys()) {
            const newTranslation = await translatePhrase(
                phrase,
                formattedLanguage,
                wrongAnswers,
                contextMap,
                startingLanguage,
                client,
                model,
                regenerate
            );
            languageTranslations.set(phrase, newTranslation);
            console.log(`  "${phrase}" -> "${newTranslation}"`);
        }
    } catch (error) {
        console.error(chalk.red(`Error regenerating translations for ${formattedLanguage}:`, error));
        process.exit(1);
    }
}

function acceptTranslations() {
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
