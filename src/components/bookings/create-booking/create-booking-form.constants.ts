import {
  BankIcon,
  CurrencyDollarIcon,
  DeviceMobileIcon,
  MoneyIcon,
  PercentIcon,
} from '@phosphor-icons/react'

import { paymentMethodValues } from '@/db/schema/enums'

export const paymentMethodOptions = paymentMethodValues.map((method) => {
  switch (method) {
    case 'CASH':
      return {
        value: method,
        title: 'Cash',
        description: 'Pay in person at the front desk',
        icon: MoneyIcon,
      }
    case 'GCASH':
      return {
        value: method,
        title: 'GCash',
        description: 'Mobile payment — reference number required',
        icon: DeviceMobileIcon,
      }
    case 'BANK_TRANSFER':
      return {
        value: method,
        title: 'Bank transfer',
        description: 'Direct bank deposit — reference number required',
        icon: BankIcon,
      }
  }
})

export const reservationFeeTypeOptions = [
  {
    value: 'PERCENT',
    title: 'Percent of total',
    description: 'Charge a percentage of the stay total',
    icon: PercentIcon,
  },
  {
    value: 'FIXED',
    title: 'Fixed amount',
    description: 'Charge a flat peso amount',
    icon: CurrencyDollarIcon,
  },
] as const
