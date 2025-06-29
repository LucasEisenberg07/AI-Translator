import { buildPrompt } from '../lib/promptBuilder.mjs';
import assert from 'assert';

describe('buildPrompt', () => {
    const startingLanguage = 'English';
    const endingLanguage = 'Spanish';

    it('should build a basic prompt without context or wrong answers', () => {
        const phrase = 'Hello, how are you?';
        const contextForLanguage = [];
        const wrongAnswersForLanguage = [];

        const result = buildPrompt(phrase, startingLanguage, endingLanguage, contextForLanguage, wrongAnswersForLanguage);

        const expected = `Translate the following phrase into the specified language from English. Please respond only with the phrase and no other text or context. Make your best judgement for any typos, and make sure to keep the original punctuation and capitalization. Here is the phrase and the language: "Hello, how are you?" into Spanish.`;
        assert.strictEqual(result, expected);
    });

    it('should include context in the prompt when provided', () => {
        const phrase = 'Hello, how are you?';
        const contextForLanguage = ['This is a greeting', 'Use formal tone'];
        const wrongAnswersForLanguage = [];

        const result = buildPrompt(phrase, startingLanguage, endingLanguage, contextForLanguage, wrongAnswersForLanguage);

        const expected = `Translate the following phrase into the specified language from English. Please respond only with the phrase and no other text or context. Make your best judgement for any typos, and make sure to keep the original punctuation and capitalization. Here is the phrase and the language: "Hello, how are you?" into Spanish, here is some additional context for the translation, any context here can fully override anything in the original phrase: This is a greeting, Use formal tone.`;
        assert.strictEqual(result, expected);
    });

    it('should include wrong answers in the prompt when provided', () => {
        const phrase = 'Hello, how are you?';
        const contextForLanguage = [];
        const wrongAnswersForLanguage = ['Hola, cómo estás?', 'Qué tal?'];

        const result = buildPrompt(phrase, startingLanguage, endingLanguage, contextForLanguage, wrongAnswersForLanguage);

        const expected = `Translate the following phrase into the specified language from English. Please respond only with the phrase and no other text or context. Make your best judgement for any typos, and make sure to keep the original punctuation and capitalization. Here is the phrase and the language: "Hello, how are you?" into Spanish. Previously incorrect translations: Hola, cómo estás?, Qué tal?`;
        assert.strictEqual(result, expected);
    });

    it('should include both context and wrong answers in the prompt when provided', () => {
        const phrase = 'Hello, how are you?';
        const contextForLanguage = ['This is a greeting', 'Use formal tone'];
        const wrongAnswersForLanguage = ['Hola, cómo estás?', 'Qué tal?'];

        const result = buildPrompt(phrase, startingLanguage, endingLanguage, contextForLanguage, wrongAnswersForLanguage);

        const expected = `Translate the following phrase into the specified language from English. Please respond only with the phrase and no other text or context. Make your best judgement for any typos, and make sure to keep the original punctuation and capitalization. Here is the phrase and the language: "Hello, how are you?" into Spanish, here is some additional context for the translation, any context here can fully override anything in the original phrase: This is a greeting, Use formal tone. Previously incorrect translations: Hola, cómo estás?, Qué tal?`;
        assert.strictEqual(result, expected);
    });

    it('should handle an empty phrase correctly', () => {
        const phrase = '';
        const contextForLanguage = [];
        const wrongAnswersForLanguage = [];

        const result = buildPrompt(phrase, startingLanguage, endingLanguage, contextForLanguage, wrongAnswersForLanguage);

        const expected = `Translate the following phrase into the specified language from English. Please respond only with the phrase and no other text or context. Make your best judgement for any typos, and make sure to keep the original punctuation and capitalization. Here is the phrase and the language: "" into Spanish.`;
        assert.strictEqual(result, expected);
    });
});