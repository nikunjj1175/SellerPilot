import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

/** ESLint flat config — do NOT use FlatCompat with eslint-config-next v16+ */
const eslintConfig = [...nextCoreWebVitals, ...nextTypescript];

export default eslintConfig;
