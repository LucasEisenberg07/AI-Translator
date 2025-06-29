import express from 'express';
import bodyParser from 'body-parser';
import { translate } from './index.mjs';

const app = express();
const PORT = 3000;
const jsonParser = bodyParser.json();

app.use(jsonParser);
app.use(validateRequestBody);
app.post('/translate', async function (req, res) {
    console.log(req.body);
    const translations = [];
    for (const language of req.body.languages) {
        const translatedText = await translate(req.body.phrase, language, req.body.context, undefined, req.body.startingLanguage);
        translations.push({ language, translatedText });
    }
    res.json({
        translations: translations.reduce((acc, { language, translatedText }) => {
            acc[language.toLowerCase()] = translatedText;
            return acc;
        }, {}),
        languages: req.body.languages,
        startingLanguage: req.body.startingLanguage,
        phrase: req.body.phrase,
        context: req.body.context
    });
});



app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});


const exampleRequestBody = {
    "languages": ["french", "spanish"],
    "starting-language": "english",
    "phrase": "What is the answer to life, the universe, and everything?",
    "context": "This is a philosophical question."
}

function validateRequestBody(req, res, next) {
    const { languages, startingLanguage, phrase, context } = req.body;
    if (!languages || !Array.isArray(languages) || languages.length === 0) {
        return res.status(400).json({ error: "Languages must be a non-empty array.", exampleRequestBody });
    }
    if (languages.length > 20) {
        return res.status(400).json({ error: "Languages array must not exceed 20 languages.", exampleRequestBody });
    }
    if (typeof startingLanguage !== 'string') {
        return res.status(400).json({ error: "Starting language must be a string (default is English).", exampleRequestBody });
    }
    if (!phrase || typeof phrase !== 'string') {
        return res.status(400).json({ error: "Phrase must be a string.", exampleRequestBody });
    }
    if (context && typeof context !== 'string') {
        return res.status(400).json({ error: "Context must be a string.", exampleRequestBody });
    }
    next();
}