import { createFormHook } from '@tanstack/react-form'

import {
  CheckboxField,
  NumberField,
  RadioGroupField,
  SelectField,
  TextField,
  TextareaField,
} from '@/components/form/form-fields'
import { ResetButton, SubmitButton } from '@/components/form/form-components'

import { fieldContext, formContext } from './form-context'

export const { useAppForm, withForm, withFieldGroup } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    TextField,
    TextareaField,
    CheckboxField,
    SelectField,
    NumberField,
    RadioGroupField,
  },
  formComponents: {
    SubmitButton,
    ResetButton,
  },
})

export { formOptions } from '@tanstack/react-form'
export { DateRangeField } from '@/components/form/form-fields'
