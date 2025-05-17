import { translate } from "../index.mjs";
import { saveTranslation } from "../index.mjs";

console.log(await translate("hello", "Spanish"));

saveTranslation("hello", "English", "hola", "Spanish")