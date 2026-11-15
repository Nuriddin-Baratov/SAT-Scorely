import { defineConfig } from "steiger";
import fsd from "@feature-sliced/steiger-plugin";

export default defineConfig([
  ...fsd.configs.recommended,
  {
    // Loyiha boshida slice'lar bir martadan ishlatiladi — bu normal holat.
    rules: { "fsd/insignificant-slice": "off" },
  },
  {
    // `app/providers` — FSD hujjatlaridagi odatiy segment nomi.
    files: ["./src/app/**"],
    rules: { "fsd/segments-by-purpose": "off" },
  },
]);
