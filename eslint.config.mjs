import { nextJsConfig } from "@becklyn/eslint/next-js";

/** @type {import("eslint").Linter.Config} */
export default [
    ...nextJsConfig,
    {
        rules: {
            "@typescript-eslint/no-empty-object-type": "off",
        },
    },
    {
        ignores: [".next", ".turbo"],
    },
];
