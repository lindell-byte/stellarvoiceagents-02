export const SMS_TEMPLATE_PLACEHOLDER_TOKENS = [
  '[lead_name]',
  '[name]',
  '[company]',
] as const

export type SmsTemplateContext = {
  lead_name: string
  name: string
  company: string
}

export function applySmsTemplatePlaceholders(
  template: string,
  ctx: SmsTemplateContext
): string {
  let out = template
  out = out.replace(/\[lead_name\]/gi, ctx.lead_name)
  out = out.replace(/\[name\]/gi, ctx.name)
  out = out.replace(/\[company\]/gi, ctx.company)
  return out
}
