// Servidor MCP da RIA — handshake vivo em /api/mcp (transporte Streamable HTTP).
//
// POR QUE EXISTE
//
// O manifesto em /.well-known/mcp (gerado por scripts/prerender.js) anuncia
// este endpoint. Ele deixa Claude, ChatGPT e outros agentes lerem o contexto da
// RIA por chamada nativa de ferramenta, em vez de raspar HTML. As ferramentas
// não inventam dados: todas leem o MESMO /agent-context.json que o resto do
// site publica, buscado em tempo de requisição — então uma mudança de
// posicionamento no site chega ao MCP no mesmo deploy, sem cópia à mão.
//
// ESCOPO, DE PROPÓSITO
//
// Só leitura, e sem sessão (stateless). Este site não transaciona nada por API;
// o produto é consultoria e o primeiro contato é humano (ver llms.txt). Expor
// escrita aqui afirmaria uma capacidade que não existe. Uma única resposta
// JSON-RPC por POST em application/json — o modo mais simples que o Streamable
// HTTP admite; sem SSE, porque não há streaming a fazer numa leitura.

export const config = { runtime: 'edge' };

const PROTOCOL_VERSION = '2025-06-18';
const SERVER_INFO = { name: 'ria-mcp', version: '1.0.0' } as const;

type Json = Record<string, unknown>;

interface RpcMessage {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Json;
}

interface RpcResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string };
}

/** Ferramentas expostas: cada uma é um recorte do agent-context. */
const TOOLS = [
  {
    name: 'get_agent_context',
    description:
      'Retorna todo o contexto estruturado da RIA (posicionamento, frentes, oferta, FAQ, evidências, casos, consultor e contato).',
    section: null as string | null,
  },
  {
    name: 'get_positioning',
    description: 'Posicionamento e produto de entrada (Diagnóstico de Gargalo) da RIA.',
    section: 'positioning',
  },
  {
    name: 'get_fronts',
    description: 'As três frentes de implementação da RIA (presença digital, agente SDR, automação).',
    section: 'fronts',
  },
  {
    name: 'get_offer',
    description: 'Termos da oferta: como começa, o produto, investimento e o que não acontece.',
    section: 'offer',
  },
  {
    name: 'get_faq',
    description: 'Perguntas frequentes respondidas sobre implementar IA em empresas.',
    section: 'faq',
  },
  {
    name: 'get_contact',
    description: 'Canal de contato da RIA (WhatsApp).',
    section: 'contact',
  },
] as const;

const RESOURCES = [
  {
    uri: 'ria://agent-context',
    name: 'agent-context',
    title: 'Contexto do agente (RIA)',
    mimeType: 'application/json',
    description: 'Posicionamento, frentes, oferta, FAQ, evidências e casos, em JSON estável.',
  },
] as const;

function ok(id: RpcMessage['id'], result: unknown): RpcResponse {
  return { jsonrpc: '2.0', id: id ?? null, result };
}

function err(id: RpcMessage['id'], code: number, message: string): RpcResponse {
  return { jsonrpc: '2.0', id: id ?? null, error: { code, message } };
}

function textResult(value: unknown) {
  return { content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] };
}

/**
 * Núcleo puro e testável: mapeia uma mensagem JSON-RPC + o agent-context para a
 * resposta. Devolve `null` para notificações (mensagens sem `id`), que não têm
 * resposta. Ver tests/mcp-server.test.ts.
 */
export function dispatch(message: RpcMessage, context: Json | null): RpcResponse | null {
  const { method, id } = message;
  const isNotification = id === undefined || id === null;

  switch (method) {
    case 'initialize':
      return ok(id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: {}, resources: {} },
        serverInfo: SERVER_INFO,
        instructions:
          'Servidor somente-leitura da RIA. Use get_agent_context para o panorama, ou as ferramentas específicas por seção. O contato comercial é humano, por WhatsApp.',
      });

    case 'notifications/initialized':
    case 'notifications/cancelled':
      return null; // notificação: sem resposta

    case 'ping':
      return ok(id, {});

    case 'tools/list':
      return ok(id, {
        tools: TOOLS.map((t) => ({
          name: t.name,
          description: t.description,
          inputSchema: { type: 'object', properties: {}, additionalProperties: false },
        })),
      });

    case 'tools/call': {
      const name = message.params?.name as string | undefined;
      const tool = TOOLS.find((t) => t.name === name);
      if (!tool) return err(id, -32602, `Ferramenta desconhecida: ${name ?? '(vazio)'}`);
      if (!context) return err(id, -32603, 'Contexto do agente indisponível.');
      const value = tool.section ? context[tool.section] : context;
      return ok(id, textResult(value ?? null));
    }

    case 'resources/list':
      return ok(id, { resources: RESOURCES });

    case 'resources/read': {
      const uri = message.params?.uri as string | undefined;
      if (uri !== 'ria://agent-context') return err(id, -32602, `Recurso desconhecido: ${uri ?? '(vazio)'}`);
      if (!context) return err(id, -32603, 'Contexto do agente indisponível.');
      return ok(id, {
        contents: [
          { uri, mimeType: 'application/json', text: JSON.stringify(context, null, 2) },
        ],
      });
    }

    default:
      if (isNotification) return null;
      return err(id, -32601, `Método não encontrado: ${method ?? '(vazio)'}`);
  }
}

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, MCP-Protocol-Version, Mcp-Session-Id',
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (request.method !== 'POST') {
    // Streamable HTTP usa GET para abrir um fluxo SSE; este servidor não faz
    // streaming, então recusa educadamente e aponta o método aceito.
    return jsonResponse(err(null, -32000, 'Use POST com uma mensagem JSON-RPC.'), 405);
  }

  let message: RpcMessage;
  try {
    message = (await request.json()) as RpcMessage;
  } catch {
    return jsonResponse(err(null, -32700, 'JSON inválido.'), 400);
  }

  let context: Json | null = null;
  try {
    const res = await fetch(new URL('/agent-context.json', request.url));
    if (res.ok) context = (await res.json()) as Json;
  } catch {
    context = null;
  }

  const response = dispatch(message, context);
  if (response === null) {
    // Notificação: sem corpo. 202 é o que o Streamable HTTP espera aqui.
    return new Response(null, { status: 202, headers: CORS_HEADERS });
  }
  return jsonResponse(response);
}
