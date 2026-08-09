// src/config.ts
// Fonte unica dos endpoints externos. Nenhuma URL de servico deve existir
// em qualquer outro arquivo de src/ — tests/config.test.ts garante isso.

function readEnv(value: string | undefined, name: string): string {
  if (!value) {
    console.warn(`[RIA] Variavel de ambiente ausente: ${name}`);
    return '';
  }
  return value;
}

export const config = {
  chatWebhook: readEnv(
    import.meta.env.VITE_N8N_CHAT_WEBHOOK_URL,
    'VITE_N8N_CHAT_WEBHOOK_URL'
  ),
  diagnosticWebhook: readEnv(
    import.meta.env.VITE_N8N_DIAGNOSTIC_WEBHOOK_URL,
    'VITE_N8N_DIAGNOSTIC_WEBHOOK_URL'
  ),
} as const;
