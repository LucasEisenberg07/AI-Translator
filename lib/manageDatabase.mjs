import fs from "fs/promises";
import path from "path";
import chalk from "chalk";

const translationsFilePath = path.resolve("translations.json");

let translations = JSON.parse(
    await fs.readFile(translationsFilePath, "utf-8").catch(() => "{}")
);

export async function fetchTranslation(startingLanguage, language, phrase) {
    try {
        const data = await fs.readFile(translationsFilePath, "utf-8");
        translations = JSON.parse(data);
    } catch (error) {
        if (error.code !== "ENOENT") {
            console.error(chalk.red("Error reading translations database:", error));
        }
    }

    if (
        translations[startingLanguage] &&
        translations[startingLanguage][language] &&
        translations[startingLanguage][language][phrase]
    ) {
        return translations[startingLanguage][language][phrase];
    } else {
        return null;
    }
}

export async function saveTranslations(translationsObject, startingLanguage) {
    try {
        const data = await fs.readFile(translationsFilePath, "utf-8");
        const existingTranslations = JSON.parse(data);

        for (const [language, phrases] of Object.entries(translationsObject)) {
            if (!existingTranslations[startingLanguage]) {
                existingTranslations[startingLanguage] = {};
            }
            if (!existingTranslations[startingLanguage][language]) {
                existingTranslations[startingLanguage][language] = {};
            }
            Object.assign(existingTranslations[startingLanguage][language], phrases);
        }

        await fs.writeFile(translationsFilePath, JSON.stringify(existingTranslations, null, 2), "utf-8");
    } catch (error) {
        if (error.code === "ENOENT") {
            const newTranslations = {
                [startingLanguage]: translationsObject,
            };
            await fs.writeFile(translationsFilePath, JSON.stringify(newTranslations, null, 2), "utf-8");
            console.log(chalk.blue("Translations database created"));
        } else {
            console.error(chalk.red("Error saving translations to the database:", error));
        }
    }
}