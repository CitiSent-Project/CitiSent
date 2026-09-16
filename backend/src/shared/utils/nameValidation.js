import { z } from "zod";

export function validateNameString(val, fieldLabel, ctx) {
  if (val.trim().length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `${fieldLabel} cannot be only spaces.`,
    });
    return;
  }

  if (/^\s/.test(val) && /\s$/.test(val)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `${fieldLabel} cannot have leading or trailing spaces.`,
    });
    return;
  }

  if (/^\s/.test(val)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `${fieldLabel} cannot start with a space.`,
    });
    return;
  }

  if (/\s$/.test(val)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `${fieldLabel} cannot end with a space.`,
    });
    return;
  }

  if (/\s{2,}/.test(val)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `${fieldLabel} cannot contain consecutive spaces.`,
    });
    return;
  }

  if (val.length > 120) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `${fieldLabel} must not exceed 120 characters.`,
    });
  }
}

export const requiredNameSchema = (fieldLabel = "Name") => {
  return z
    .string({
      required_error: `${fieldLabel} is required.`,
      invalid_type_error: `${fieldLabel} must be a string.`,
    })
    .superRefine((val, ctx) => {
      if (val === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${fieldLabel} is required.`,
        });
        return;
      }

      validateNameString(val, fieldLabel, ctx);
    });
};

export const optionalNameSchema = (fieldLabel = "Name") => {
  return z
    .preprocess(
      (val) => (val === "" ? null : val),
      z.union([
        z.string().superRefine((val, ctx) => {
          validateNameString(val, fieldLabel, ctx);
        }),
        z.null(),
        z.undefined(),
      ]),
    )
    .optional();
};
