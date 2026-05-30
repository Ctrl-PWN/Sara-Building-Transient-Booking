import { createFormHook, formOptions } from '@tanstack/react-form'

import {
  CheckboxField,
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
  },
  formComponents: {
    SubmitButton,
    ResetButton,
  },
})

export { formOptions }
