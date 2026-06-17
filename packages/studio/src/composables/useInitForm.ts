import { toTypedSchema } from "@vee-validate/zod";
import * as z from "zod";

export function useInitForm() {
  const localeSchema = z.object({
    code: z.string().min(1, "语言代码不能为空"),
    filename: z.string().optional(),
  });

  const entrySchema = z
    .object({
      dir: z.string(),
      paths: z.array(z.string()),
    })
    .superRefine((entry, ctx) => {
      const dirEmpty = entry.dir.trim() === "";
      const pathsEmpty = entry.paths.length === 0;

      // 两者都为空，视为空记录，忽略校验
      if (dirEmpty && pathsEmpty) {
        return;
      }

      if (dirEmpty) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["dir"],
          message: "目录不能为空",
        });
      }

      if (pathsEmpty) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["paths"],
          message: "至少需要一个路径",
        });
      }
    });

  const schema = toTypedSchema(
    z.object({
      filename: z.string().optional(),

      locales: z
        .array(localeSchema)
        .min(1, "至少需要一个语言")
        .default([
          {
            code: "zh-CN",
            filename: "zh-CN.json",
          },
          {
            code: "en",
            filename: "en.json",
          },
        ])
        .superRefine((locales, ctx) => {
          const codes = new Set<string>();

          locales.forEach((locale, index) => {
            if (codes.has(locale.code)) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: [index, "code"],
                message: "语言代码不能重复",
              });
            }

            codes.add(locale.code);
          });
        }),

      entries: z
        .array(entrySchema)
        .default([])
        .superRefine((entries, ctx) => {
          const dirs = new Set<string>();

          entries.forEach((entry, index) => {
            // 忽略空记录
            if (entry.dir.trim() === "" && entry.paths.length === 0) {
              return;
            }

            if (dirs.has(entry.dir)) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: [index, "dir"],
                message: "目录不能重复",
              });
            }

            dirs.add(entry.dir);
          });
        }),
    }),
  );

  const form = useForm({
    validationSchema: schema,
    validateOnMount: true,
    initialValues: {
      filename: "",
      locales: [
        { code: "zh-CN", filename: "zh-CN.json" },
        { code: "en", filename: "en.json" },
      ],
      entries: [
        {
          dir: "",
          paths: [],
        },
      ],
    },
  });

  return form;
}
