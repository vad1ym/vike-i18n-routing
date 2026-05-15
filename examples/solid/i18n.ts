import { createMemo } from 'solid-js'
import { messages } from './messages'

type Locale = keyof typeof messages
type MessageKey = keyof typeof messages.en

export function createTranslator(locale: () => string) {
  const dict = createMemo(() => messages[(locale() in messages ? locale() : 'en') as Locale])

  return (key: MessageKey, params?: Record<string, string>) => {
    const template = dict()[key] ?? messages.en[key]

    if (!params) return template

    return Object.entries(params).reduce((result, [name, value]) => {
      return result.replaceAll(`{${name}}`, value)
    }, template)
  }
}
