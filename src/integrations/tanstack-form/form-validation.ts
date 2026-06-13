import type { StandardSchemaV1, ValidationLogicFn } from '@tanstack/react-form'
import { revalidateLogic } from '@tanstack/react-form'

/** Default: validate on submit only until first submission, then on every change. */
export const defaultValidationLogic = revalidateLogic()

/** Strict: validate on submit only (before and after first submission). */
export const submitOnlyValidationLogic = revalidateLogic({
  mode: 'submit',
  modeAfterSubmission: 'submit',
})

/** Spread into useAppForm for Zod/Standard Schema dynamic validation. */
export function dynamicSchemaValidators<TSchema extends StandardSchemaV1>(
  schema: TSchema,
  options?: { validationLogic?: ValidationLogicFn },
) {
  return {
    validationLogic: options?.validationLogic ?? defaultValidationLogic,
    validators: { onDynamic: schema },
  } as const
}

export { revalidateLogic }
