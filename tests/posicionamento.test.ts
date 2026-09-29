import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { resolve, join } from 'path';

/**
 * Guarda de POSICIONAMENTO.
 *
 * A página deixou de sustentar a tese "IA importa" e passou a fazer uma coisa
 * só: medir o site do visitante em duas notas independentes e oferecer criar
 * ou otimizar. A parede de vídeos 3D ("Vozes do mercado") emprestava autoridade
 * à tese antiga e saiu por decisão de posicionamento, não por defeito — ver
 * docs/superpowers/specs/2026-09-28-foco-em-sites-duas-notas-design.md.
 *
 * Este arquivo trava três coisas: os arquivos que saíram não voltam, a política
 * de privacidade descreve só os terceiros que existem, e o VOCABULÁRIO do
 * produto antigo não reaparece em código de produção (src/, scripts/, api/).
 */

const root = (p: string) => resolve(process.cwd(), p);

/**
 * Comentários fora — sem comer as URLs.
 *
 * Este repositório documenta decisões antigas de propósito: quase todo arquivo
 * de conteúdo tem um comentário contando o que saiu e por quê ("eram três
 * frentes", "o Diagnóstico de Gargalo saiu"). Contar esse histórico como
 * infração transformaria a documentação do defeito em causa de falha. O que a
 * guarda pega é o texto que um visitante, um crawler ou um agente LÊ.
 *
 * O `[^:]` antes do `//` não é detalhe: sem ele o stripper apaga
 * `//exemplo.com` até o fim da linha, porque `https://` também tem duas barras.
 * Os comentários de bloco viram espaços, não somem: os números de linha do
 * relatório continuam apontando para a linha real do arquivo.
 */
function semComentarios(codigo: string): string {
  return codigo
    .replace(/\/\*[\s\S]*?\*\//g, (bloco) => bloco.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

/** Arquivos de código sob `dir`, recursivamente. */
function codigoSob(dir: string, extensoes: RegExp): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return codigoSob(full, extensoes);
    return extensoes.test(entry) ? [full] : [];
  });
}

/** Tudo que vai para o visitante, para o crawler ou para o agente. */
function codigoDeProducao(): string[] {
  return [
    ...codigoSob(root('src'), /\.(ts|tsx)$/),
    ...codigoSob(root('scripts'), /\.(js|ts)$/),
    ...codigoSob(root('api'), /\.ts$/),
    ...(existsSync(root('middleware.ts')) ? [root('middleware.ts')] : []),
  ];
}

const relativo = (f: string) => f.replace(root('.'), '.').replace(/\\/g, '/');

describe('POS: os arquivos removidos não voltam', () => {
  const REMOVIDOS = [
    'src/components/SocialProofSection.tsx',
    'src/components/VideoWall3D.tsx',
    'src/components/AuthorityCard.tsx',
    'src/components/AuthorityAccordion.tsx',
    'src/components/AwarenessCheck.tsx',
    'src/components/VideoModal.tsx',
    'src/components/PotentialDiagnostic.tsx',
    'src/components/FrontsSection.tsx',
    'src/content/proofPanels.ts',
    'src/constants/socialNetworks.ts',
    'src/context/VulnerabilityContext.tsx',
    'src/hooks/useOrbitWall.ts',
    'src/lib/orbit-wall.ts',
    'src/lib/youtube.ts',
    'src/lib/agentic-readiness.ts',
    'public/autoridades',
    // Saíram na Task 11, quando o agent-context.json, o prerender, o MCP e a
    // /sobre deixaram de lê-los: as vozes do mercado (authorities) e as três
    // frentes (content/fronts.ts e lib/fronts.ts, trocadas por content/paths.ts
    // e lib/paths.ts).
    'src/content/authorities.ts',
    'src/content/fronts.ts',
    'src/lib/fronts.ts',
    'tests/fronts.test.ts',
  ];

  it('POS-ARQ: nenhum deles existe', () => {
    expect(REMOVIDOS.filter((p) => existsSync(root(p)))).toEqual([]);
  });
});

describe('POS: privacidade descreve só os terceiros que existem', () => {
  it('POS-PRIV: nenhuma menção a YouTube na política', () => {
    const privacy = readFileSync(root('src/content/privacy.ts'), 'utf-8');
    expect(privacy.toLowerCase()).not.toContain('youtube');
  });

  it('POS-PRIV-2: o Is Agentic entrou na lista de terceiros', () => {
    const privacy = readFileSync(root('src/content/privacy.ts'), 'utf-8').toLowerCase();
    expect(privacy).toContain('is-agentic');
  });
});

describe('POS-VOC: o vocabulário do produto antigo não volta ao código de produção', () => {
  /**
   * Cada padrão é um produto ou uma peça que a página deixou de oferecer. Sem
   * acento e com acento, em qualquer caixa: a mesma frase escrita sem cedilha
   * num comentário de script continua sendo a mesma frase.
   */
  const MORTO: Array<[RegExp, string]> = [
    [/diagn[óo]stico de gargalo/i, 'Diagnóstico de Gargalo'],
    [/tr[êe]s frentes/i, 'três frentes'],
    [/vozes do mercado/i, 'Vozes do mercado'],
    [/[íi]ndice de vulnerabilidade/i, 'índice de vulnerabilidade'],
    [/navega[çc][ãa]o ag[êe]ntica/i, 'Navegação agêntica'],
  ];

  it('POS-VOC-1: nenhum texto de src/, scripts/ ou api/ (fora de comentários) usa o vocabulário morto', () => {
    const infratores: string[] = [];
    for (const arquivo of codigoDeProducao()) {
      const linhas = semComentarios(readFileSync(arquivo, 'utf-8')).split('\n');
      linhas.forEach((linha, i) => {
        for (const [padrao, nome] of MORTO) {
          if (padrao.test(linha)) infratores.push(`${relativo(arquivo)}:${i + 1} → ${nome}`);
        }
      });
    }
    expect(infratores, `vocabulário morto no código:\n${infratores.join('\n')}`).toEqual([]);
  });

  it('POS-VOC-2: os identificadores do produto antigo também não voltam', () => {
    // Nomes que seguiram carregando o produto depois que ele saiu da tela: o
    // preço do diagnóstico, o evento de analytics, a ferramenta MCP, as três
    // frentes como constante e as vozes do mercado como dado.
    const IDENTIFICADORES =
      /\b(DIAGNOSTIC_PRICE|diagnostic_no_website|get_fronts|FRONTS|uncoveredFronts|missingFronts|resolveFirstFront|AUTHORITIES|AUTHORITIES_DISCLAIMER|NO_WEBSITE_INDEX)\b/;
    const infratores: string[] = [];
    for (const arquivo of codigoDeProducao()) {
      semComentarios(readFileSync(arquivo, 'utf-8'))
        .split('\n')
        .forEach((linha, i) => {
          const achou = linha.match(IDENTIFICADORES);
          if (achou) infratores.push(`${relativo(arquivo)}:${i + 1} → ${achou[1]}`);
        });
    }
    expect(infratores, `identificador do produto antigo:\n${infratores.join('\n')}`).toEqual([]);
  });

  it('POS-VOC-3: a guarda enxerga o que deve — texto vivo reprova, comentário não', () => {
    // Trava o próprio teste: uma guarda cujo stripper comesse a linha inteira
    // (ou que nunca casasse) passaria sempre. Estas três amostras fixam os dois
    // lados sem depender do estado do repositório.
    const vivo = semComentarios("const t = 'Diagnóstico de Gargalo';");
    const emComentario = semComentarios('// o Diagnóstico de Gargalo saiu\n/* três frentes */');
    const comUrl = semComentarios("const u = 'https://exemplo.com'; const t = 'Vozes do mercado';");
    expect(MORTO.some(([p]) => p.test(vivo))).toBe(true);
    expect(MORTO.some(([p]) => p.test(emComentario))).toBe(false);
    expect(MORTO.some(([p]) => p.test(comUrl))).toBe(true);
  });
});
