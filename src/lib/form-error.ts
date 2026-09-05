import { UseFormReturn, FieldValues, Path } from "react-hook-form";

const FIELD_MAP: Record<string, string> = {
  captcha_key: "captcha_value",
};

export const applyBackendErrors = <T extends FieldValues>(
  form: UseFormReturn<T>,
  errors: Record<string, string[] | string> | null,
  fallbackMessage?: string,
) => {
  if (!errors) return;

  Object.entries(errors).forEach(([field, value]) => {
    const message = Array.isArray(value) ? value[0] : value;
    if (!message) return;


    const mappedField = FIELD_MAP[field] || field;


    if (mappedField in form.getValues()) {
      form.setError(mappedField as Path<T>, {
        type: "server",
        message,
      });
    } else {
      form.setError("root" as Path<T>, {
        type: "server",
        message,
      });
    }
  });

  if (fallbackMessage) {
    form.setError("root" as Path<T>, {
      type: "server",
      message: fallbackMessage,
    });
  }
};
