import { translatePhrase } from './translatePhrase.mjs';
import { buildPrompt } from './promptBuilder.mjs';
import assert from 'assert';

describe('translatePhrase', () => {
    it('creates the correct querry', async () => {
        const phrase = 'Hello, how are you?';
        const language = 'this is a test phrase';
        const startingLanguage = 'English';
        const prompt = buildPrompt(
            phrase,
            startingLanguage,
            language,
            [],
            []
        );
        const result = await translatePhrase(phrase, language, new Map(), new Map(), startingLanguage, {}, "gpt-3.5-turbo");
        assert.strictEqual(result, prompt)
    });
});
