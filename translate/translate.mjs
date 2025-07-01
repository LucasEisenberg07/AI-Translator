import { translate } from '../index.mjs';

export default async (request, context) => {
    const apiKey = Netlify.env.get("AUTH_TOKEN");
    const body = await request.json();
    const error = validateRequestBody(body);

    if (error) {
        return new Response(JSON.stringify({ error: error.error, exampleRequestBody: error.exampleRequestBody }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    const translations = [];
    for (const language of body.languages) {
        const translatedText = await translate(body.phrase, language, body.context, undefined, body.startingLanguage, undefined, undefined, apiKey);
        translations.push({ language, translatedText });
    }
    return new Response (JSON.stringify({
        translations: translations.reduce((acc, { language, translatedText }) => {
            acc[language.toLowerCase()] = translatedText;
            return acc;
        }, {}),
        languages: body.languages,
        startingLanguage: body.startingLanguage,
        phrase: body.phrase,
        context: body.context
    }));
};


const exampleRequestBody = {
    "languages": ["french", "spanish"],
    "starting-language": "english",
    "phrase": "What is the answer to life, the universe, and everything?",
    "context": "This is a philosophical question."
}

function validateRequestBody(body) {
    const { languages, startingLanguage, phrase, context } = body;
    if (!languages || !Array.isArray(languages) || languages.length === 0) {
        return { error: "Languages must be a non-empty array.", exampleRequestBody };
    }
    if (languages.length > 20) {
        return { error: "Languages array must not exceed 20 languages.", exampleRequestBody };
    }
    if (typeof startingLanguage !== 'string') {
        return { error: "Starting language must be a string (default is English).", exampleRequestBody };
    }
    if (!phrase || typeof phrase !== 'string') {
        return { error: "Phrase must be a string.", exampleRequestBody };
    }
    if (context && typeof context !== 'string') {
        return { error: "Context must be a string.", exampleRequestBody };
    }
    return;
}