import { createTranslator } from '../lib/translatePhrase.mjs';
import assert from 'assert';

describe('translatePhrase', () => {
    it('creates the correct query', async () => {
        const expectedPrompt = `Translate the following phrase into the specified language from Kobold. Please respond only with the phrase and no other text or context. Make your best judgement for any typos. Here is the phrase and the language: "Hello, how are you?" into Klingon.`;
        const content = "Yay! This is Klingon for 'Hello, how are you?'";
        const mockApi = async (prompt) => {
            assert.strictEqual(prompt, expectedPrompt);
            return {
                isTest: true,
                body: {
                    choices: [
                        {
                            message: {
                                content,
                            }
                        }
                    ]
                }
            };
        };

        const translatePhrase = createTranslator(mockApi);

        const phrase = 'Hello, how are you?';
        const language = 'Klingon';
        const startingLanguage = 'Kobold';
        const result = await translatePhrase(phrase, language, new Map(), new Map(), startingLanguage, {}, "gpt-3.5-turbo");
        assert.strictEqual(result, content);
    });

    it('handles missing context correctly', async () => {
        const expectedPrompt = `Translate the following phrase into the specified language from Kobold. Please respond only with the phrase and no other text or context. Make your best judgement for any typos. Here is the phrase and the language: "Hello, how are you?" into Klingon.`;
        const content = "Yay! This is Klingon for 'Hello, how are you?'";
        const mockApi = async (prompt) => {
            assert.strictEqual(prompt, expectedPrompt);
            return {
                isTest: true,
                body: {
                    choices: [
                        {
                            message: {
                                content,
                            }
                        }
                    ]
                }
            };
        };

        const translatePhrase = createTranslator(mockApi);

        const phrase = 'Hello, how are you?';
        const language = 'Klingon';
        const startingLanguage = 'Kobold';
        const contextMap = new Map();
        const result = await translatePhrase(phrase, language, new Map(), contextMap, startingLanguage, {}, "gpt-3.5-turbo");
        assert.strictEqual(result, content);
    });

    it('handles wrong answers correctly', async () => {
        const expectedPrompt = `Translate the following phrase into the specified language from Kobold. Please respond only with the phrase and no other text or context. Make your best judgement for any typos. Here is the phrase and the language: "Hello, how are you?" into Klingon. Previously incorrect translations: Wrong answer 1, Wrong answer 2`;
        const content = "Yay! This is Klingon for 'Hello, how are you?'";
        const mockApi = async (prompt) => {
            assert.strictEqual(prompt, expectedPrompt);
            return {
                isTest: true,
                body: {
                    choices: [
                        {
                            message: {
                                content,
                            }
                        }
                    ]
                }
            };
        };

        const translatePhrase = createTranslator(mockApi);

        const phrase = 'Hello, how are you?';
        const language = 'Klingon';
        const startingLanguage = 'Kobold';
        const wrongAnswers = new Map();
        wrongAnswers.set(language, ['Wrong answer 1', 'Wrong answer 2']);
        const result = await translatePhrase(phrase, language, wrongAnswers, new Map(), startingLanguage, {}, "gpt-3.5-turbo");
        assert.strictEqual(result, content);
    });

    it('throws an error when the API fails', async () => {
        const mockApi = async () => {
            throw new Error('API error');
        };

        const translatePhrase = createTranslator(mockApi);

        const phrase = 'Hello, how are you?';
        const language = 'Klingon';
        const startingLanguage = 'Kobold';

        try {
            await translatePhrase(phrase, language, new Map(), new Map(), startingLanguage, {}, "gpt-3.5-turbo");
            assert.fail('Expected an error to be thrown');
        } catch (error) {
            assert.strictEqual(error.message, 'API error');
        }
    });

    it('returns an empty string when the API response is unexpected', async () => {
        const mockApi = async () => {
            return {
                isTest: true,
                body: null
            };
        };

        const translatePhrase = createTranslator(mockApi);

        const phrase = 'Hello, how are you?';
        const language = 'Klingon';
        const startingLanguage = 'Kobold';
        const result = await translatePhrase(phrase, language, new Map(), new Map(), startingLanguage, {}, "gpt-3.5-turbo");
        assert.strictEqual(result, '');
    });
});