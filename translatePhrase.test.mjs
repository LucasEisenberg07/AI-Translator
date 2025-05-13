import { createTranslator } from './translatePhrase.mjs';
import assert from 'assert';

describe('translatePhrase', () => {
    it('creates the correct querry', async () => {
        const expectedPrompt = `Translate the following phrase from Kobold to Klingon: Hello, how are you?`;
        const content = "Yay! This is Klingon for 'Hello, how are you?'";
        const mockApi = async (prompt) => {
            assert.strictEqual(prompt, expectedPrompt);
            return {
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
        }

        const translatePhrase = createTranslator(mockApi);

        const phrase = 'Hello, how are you?';
        const language = 'Klingon';
        const startingLanguage = 'Kobold';
        const result = await translatePhrase(phrase, language, new Map(), new Map(), startingLanguage, {}, "gpt-3.5-turbo");
        assert.strictEqual(result, content)
    });
});
