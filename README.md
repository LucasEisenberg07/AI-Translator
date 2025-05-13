# AI-Translator

This is a console-based application that uses AI to translate phrases into different languages.

## Running the application:

### 1. Set up the AI

- Set the OPEN_AI_KEY enviornment varible to your key
- Change the endpoint if required, right now it is set up for an Open AI Key from https://platform.openai.com/settings/organization/api-keys 
- Change the model if wanted, right now it is set to the cheapest available

### 2. Install files

- Run ```npm install``` into the terminal

### 3. Run program

- Run the program with ```node translate.mjs```, add the phrases in ```-p```, and add the output languages in ```-l``` (put both as a comma-seperated list in quotation marks)

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
- Contains unit tests