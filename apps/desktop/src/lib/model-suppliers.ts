/** Supplier naming for GATEWAY providers (magpie et al).
 *
 *  A gateway serves several vendors behind ONE OpenAI-compatible endpoint, so
 *  Hermes' picker shows them all under a single provider row and — because
 *  `modelBaseId` drops everything before the last `/` — every same-named model
 *  from two vendors collapsed to one identical row label. Here the leading id
 *  segment is promoted to the supplier the row reads:
 *
 *      workbuddy/deepseek-v4.1-flash    ->  DeepSeek V4.1 Flash · WorkBuddy
 *      workbuddy-ai/deepseek-v4.1-flash ->  DeepSeek V4.1 Flash · WorkBuddy AI
 *
 *  The supplier also supplies the row's mark (an icon, or a monogram when no
 *  icon is known), so the two rows are told apart before the text is read. */

import type { SupplierNamer } from '@/lib/model-status-label'

export interface Supplier {
  /** Icon spec for the row's leading slot. A `codicon` name renders the app's
   *  own glyph set (scalable, theme-aware, no asset files); `mark` is the
   *  fallback monogram when neither fits. */
  codicon?: string
  /** Two-letter fallback, used when a supplier has no icon. */
  mark: string
  /** Full name, shown after the model name on the row and in the pill. */
  name: string
}

/** Known magpie suppliers. A prefix that is not listed still qualifies — it
 *  falls back to a title-cased name plus its initials — so a provider added to
 *  magpie tomorrow reads correctly without editing this file. */
const SUPPLIERS: Readonly<Record<string, Supplier>> = {
  workbuddy: { codicon: 'rocket', mark: 'WB', name: 'WorkBuddy' },
  'workbuddy-ai': { codicon: 'sparkle', mark: 'WA', name: 'WorkBuddy AI' },
  qoder: { codicon: 'code', mark: 'QD', name: 'Qoder' },
  'qoder-cn': { codicon: 'globe', mark: 'QC', name: 'Qoder CN' },
  'trae-cn': { codicon: 'terminal', mark: 'TC', name: 'Trae CN' },
  'trae-gateway': { codicon: 'server-process', mark: 'TG', name: 'Trae Gateway' },
  codearts: { codicon: 'symbol-class', mark: 'CA', name: 'CodeArts' }
}

const ACRONYMS = new Set(['ai', 'cn', 'api', 'gpt', 'glm', 'llm', 'vl', 'it'])

function titleWords(text: string): string {
  return text
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map(word => (ACRONYMS.has(word.toLowerCase()) ? word.toUpperCase() : word[0].toUpperCase() + word.slice(1)))
    .join(' ')
}

/** The supplier a model id's leading segment names, or null for a bare id. */
export function supplierOf(model: string): Supplier | null {
  const id = String(model || '').trim()
  const slash = id.indexOf('/')

  if (slash <= 0) {
    return null
  }

  const segment = id.slice(0, slash)
  const known = SUPPLIERS[segment.toLowerCase()]

  if (known) {
    return known
  }

  const initials = segment
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return { mark: initials || '?', name: titleWords(segment) }
}

/** `SupplierNamer` for `modelDisplayParts` / `displayModelName`. */
export const supplierNamer: SupplierNamer = segment => supplierOf(`${segment}/x`)?.name ?? titleWords(segment)

/** Whether a segment names a supplier this build knows (the gateway gate). */
export function isKnownSupplier(segment: string): boolean {
  return Boolean(SUPPLIERS[String(segment || '').trim().toLowerCase()])
}

/** `SupplierNamer` for surfaces that hold only the model id — the composer
 *  pill, a session row — with no provider row to ask. It answers only for a
 *  KNOWN gateway supplier, so `anthropic/claude-sonnet-5` on a normal provider
 *  keeps core's label instead of growing a spurious "· Anthropic". */
export const knownSupplierNamer: SupplierNamer = segment =>
  SUPPLIERS[String(segment || '').toLowerCase()]?.name ?? ''
