import { request } from 'http';
import { createTranslator} from './translatePhrase.mjs';

import assert from 'assert';

describe('translatePhrase', () => {
    it('creates the correct querry', async () => {
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
        assert.strictEqual(result, content)
    });
});
