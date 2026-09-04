import { describe, it, expect } from 'vitest';
import { dispatch } from '../api/mcp';

/**
 * Servidor MCP (api/mcp.ts) — o núcleo puro de despacho JSON-RPC.
 *
 * O handshake vivo (HTTP, fetch do agent-context) só existe em produção; aqui
 * trancamos a lógica que decide o QUE cada método responde, com um contexto
 * injetado, sem rede. É o que garante que initialize anuncie o protocolo, que
 * as ferramentas listem e chamem, e que notificações não gerem resposta.
 */
const CONTEXT = {
  positioning: { entryProduct: 'Diagnóstico de Gargalo' },
  fronts: [{ id: 1, label: 'Presença digital pronta para IA' }],
  offer: { implementationRange: 'entre R$ 500 e R$ 5.000/mês' },
  faq: [{ question: 'Como implementar IA?', answer: '...' }],
  contact: { whatsapp: 'https://wa.me/5516997879837' },
};

describe('MCP — dispatch JSON-RPC', () => {
  it('MCP-01: initialize anuncia protocolo, capacidades e serverInfo', () => {
    const res = dispatch({ jsonrpc: '2.0', id: 1, method: 'initialize' }, CONTEXT);
    expect(res?.result).toMatchObject({
      protocolVersion: expect.any(String),
      capabilities: { tools: {}, resources: {} },
      serverInfo: { name: 'ria-mcp' },
    });
  });

  it('MCP-02: notifications/initialized não gera resposta', () => {
    const res = dispatch({ jsonrpc: '2.0', method: 'notifications/initialized' }, CONTEXT);
    expect(res).toBeNull();
  });

  it('MCP-03: tools/list expõe as ferramentas com inputSchema', () => {
    const res = dispatch({ jsonrpc: '2.0', id: 2, method: 'tools/list' }, CONTEXT);
    const tools = (res?.result as { tools: { name: string; inputSchema: unknown }[] }).tools;
    const names = tools.map((t) => t.name);
    expect(names).toContain('get_agent_context');
    expect(names).toContain('get_fronts');
    for (const t of tools) expect(t.inputSchema).toBeTruthy();
  });

  it('MCP-04: tools/call de uma seção devolve só aquela seção', () => {
    const res = dispatch(
      { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'get_fronts' } },
      CONTEXT
    );
    const text = (res?.result as { content: { type: string; text: string }[] }).content[0].text;
    expect(JSON.parse(text)).toEqual(CONTEXT.fronts);
  });

  it('MCP-05: tools/call do contexto inteiro devolve tudo', () => {
    const res = dispatch(
      { jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'get_agent_context' } },
      CONTEXT
    );
    const text = (res?.result as { content: { text: string }[] }).content[0].text;
    expect(JSON.parse(text)).toEqual(CONTEXT);
  });

  it('MCP-06: ferramenta desconhecida vira erro JSON-RPC, não exceção', () => {
    const res = dispatch(
      { jsonrpc: '2.0', id: 5, method: 'tools/call', params: { name: 'drop_table' } },
      CONTEXT
    );
    expect(res?.error?.code).toBe(-32602);
  });

  it('MCP-07: resources/list e resources/read entregam o agent-context', () => {
    const list = dispatch({ jsonrpc: '2.0', id: 6, method: 'resources/list' }, CONTEXT);
    const resources = (list?.result as { resources: { uri: string }[] }).resources;
    expect(resources[0].uri).toBe('ria://agent-context');

    const read = dispatch(
      { jsonrpc: '2.0', id: 7, method: 'resources/read', params: { uri: 'ria://agent-context' } },
      CONTEXT
    );
    const contents = (read?.result as { contents: { text: string }[] }).contents;
    expect(JSON.parse(contents[0].text)).toEqual(CONTEXT);
  });

  it('MCP-08: método desconhecido devolve -32601', () => {
    const res = dispatch({ jsonrpc: '2.0', id: 8, method: 'nao/existe' }, CONTEXT);
    expect(res?.error?.code).toBe(-32601);
  });

  it('MCP-09: contexto indisponível vira erro, não dado inventado', () => {
    const res = dispatch(
      { jsonrpc: '2.0', id: 9, method: 'tools/call', params: { name: 'get_fronts' } },
      null
    );
    expect(res?.error?.code).toBe(-32603);
  });
});
