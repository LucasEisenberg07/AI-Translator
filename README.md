# AI-Translator

This is a console-based application that uses AI to translate phrases into different languages.

## Running the application though npx:

- Run ```npx @lucasberg/ai-translator``` and provide some of the following arguments as comma-separated lists in quotation marks:
- ```-l``` for languages
- ```-p``` for phrases
- ```-s``` for starting language
- ```-c``` for context
- ```-j``` to output a json at the end
- ```-r``` to regenerate the translation and not take it from a database

- The translation automatically saves to a local json file

## To import this as a JavaScript project:

- Add `import { translator } from ‘@lucasberg/ai-translator'` to the top of the file
- The two avalible functions are:
    1. `translate`
    2. `saveTranslation`

### Examples of proper use:

`translate("Hello, how are you doing?", "Spanish", "Make it formal", "¿Hola cómo estás?", "English")`
`saveTranslation("Hello, how are you doing?", "English", "¿Hola, qué tal?", "Spanish")`

## Running the application locally:

### 1. Set up the AI

- Set the AUTH_TOKEN enviornment varible to your key
- Change the endpoint if required, right now it is set up for an Open AI Key from https://platform.openai.com/settings/organization/api-keys (you may need to add credtis to the token, as creating a key from this website does not give any free credits)
- Change the model if wanted, right now it is set to the cheapest available

### 2. Install files

- Run ```npm install``` into the terminal

### 3. Run program

- Run the program with ```node index.mjs```, add the phrases in ```-p```, and add the output languages in ```-l``` (put both as a comma-seperated list in quotation marks)

### 4. Follow the prompts

- Regenerate all or one language as many times as you want
- To keep the translations, entre ```none``` or just press entre to see the final answers



## Additional features:

- Ability to add context with ```-c```
- Ability to change the starting language with ```-s```, default is English
- Ability to output a JSON with ```-j```
- Ability to store context independently for each language, ensuring that adding context to one translation does not affect the others when regenerating all languages
- Ability to remember all incorrect answers separately for each language
- Ability to store to a database, currently using a JSON file
- Contains unit tests and error handling