/**
 * Builds the prompt for translation based on the phrase, language, context, and wrong answers.
 * @param {string} phrase - The phrase to translate.
 * @param {string} startingLanguage - The source language for the translation.
 * @param {string} endingLanguage - The target language for translation.
 * @param {string[]} contextForLanguage - Additional context for the translation.
 * @param {string[]} wrongAnswersForLanguage - Previously incorrect translations for the language.
 * @returns {string} - The constructed prompt.
 */
export function buildPrompt(phrase, startingLanguage, endingLanguage, contextForLanguage, wrongAnswersForLanguage) {
    const baseMessage = `Translate the following phrase into the specified language from ${startingLanguage}. Please respond only with the phrase and no other text or context. Make your best judgement for any typos, and make sure to keep the original punctuation and capitalization. Here is the phrase and the language:`;

    const contextPart = contextForLanguage.length > 0
        ? `, here is some additional context for the translation, any context here can fully override anything in the original phrase: ${contextForLanguage.join(', ')}`
        : '';

    const wrongAnswersPart = wrongAnswersForLanguage.length > 0
        ? ` Previously incorrect translations: ${wrongAnswersForLanguage.join(', ')}`
        : '';

    return `${baseMessage} "${phrase}" into ${endingLanguage}${contextPart}.${wrongAnswersPart}`;
}