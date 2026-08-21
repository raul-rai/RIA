import { TrendingUp, Cpu } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * Vozes do mercado (capítulo 2).
 *
 * RESTAURADO em ago/2026, depois de ter sido removido inteiro na auditoria.
 * A remoção errou o alvo: a curadoria dos recortes é trabalho real e o vídeo
 * nunca foi o problema — embed de YouTube é o mecanismo de distribuição que o
 * próprio autor escolheu. O risco estava em três coisas que vinham junto, e
 * que NÃO voltaram:
 *
 *   1. Retratos .webp auto-hospedados em public/autoridades/. Agora a imagem é
 *      a thumbnail do próprio YouTube — um quadro do vídeo, servido pelo
 *      Google, que é a representação canônica de um vídeo em qualquer lugar da
 *      web.
 *
 *   2. Citações entre aspas. Eram transcrições feitas à mão, apresentadas como
 *      fala literal, e a do Flávio Augusto sequer tinha recorte de tempo — ou
 *      seja, ninguém conseguia conferir se a frase existia. No lugar entra
 *      `argument`: uma descrição do que a pessoa sustenta no trecho, escrita
 *      na voz da RIA. Quem quiser a frase exata clica e ouve da boca dela, que
 *      é mais forte do que ler transcrição.
 *
 *   3. O checkbox que reduzia o Índice de Vulnerabilidade por concordância.
 *      Ver a nota em VulnerabilityContext: o índice mede o que a empresa faz,
 *      nunca o que ela concorda.
 *
 * REGRAS QUE CONTINUAM VALENDO:
 *   - São participações públicas sobre IA em geral. Nenhuma é endosso da RIA,
 *     e o rodapé da seção diz isso em voz alta. Diferente de antes, agora esse
 *     rodapé é obrigatório por teste (tests/authorities.test.ts).
 *   - Não edite `argument` para soar como se a pessoa estivesse recomendando a
 *     RIA. Ela não está.
 */
export interface Authority {
  name: string;
  title: string;
  /**
   * O que a pessoa sustenta no trecho recortado. Descrição, não transcrição —
   * nunca entre aspas, nunca em primeira pessoa.
   */
  argument: string;
  /** ID do vídeo no YouTube. Deriva o embed e a thumbnail. */
  videoId: string;
  bio: string;
  icon: LucideIcon;
  /**
   * Recorte do trecho, em segundos. É a curadoria: leva direto ao ponto em vez
   * de largar o visitante numa palestra de 40 minutos.
   */
  startTime?: number;
  endTime?: number;
}

export const AUTHORITIES: Authority[] = [
  {
    name: 'Ricardo Amorim',
    title: 'Economista & Estrategista',
    argument:
      'Trata a adoção de IA como questão de sobrevivência competitiva no presente, não como aposta de futuro — e argumenta que o custo de esperar já está sendo cobrado.',
    videoId: '4ZRJCW9CSvE',
    bio: 'Economista mais influente do Brasil segundo a Forbes, apresentador do Manhattan Connection e LinkedIn Top Voice. Com mais de 20 anos no mercado financeiro global, é uma das vozes mais ouvidas sobre transformações econômicas e tecnológicas no país.',
    icon: TrendingUp,
    startTime: 0,
    endTime: 154,
  },
  {
    name: 'Silvio Meira',
    title: 'Cientista-Chefe da TDS Company',
    argument:
      'Enquadra a IA como uma nova dimensão da inteligência do negócio — algo que muda a estratégia da empresa, e não apenas mais uma ferramenta que se contrata e instala.',
    videoId: 'tcmntVEQr2o',
    bio: 'Um dos fundadores do CESAR (Centro de Estudos e Sistemas Avançados do Recife) e Cientista-Chefe da TDS Company. Uma das maiores referências em engenharia de software e inovação digital do Brasil.',
    icon: Cpu,
    startTime: 1378,
    endTime: 1438,
  },
  {
    name: 'Flávio Augusto',
    title: 'Fundador da Wiser Educação',
    argument:
      'Fala de IA pela ótica da eficiência operacional: o mercado remunera quem produz o mesmo resultado com menos custo, e a inércia é cobrada mesmo de quem já está estabelecido.',
    videoId: 'a1MVf8eGlG8',
    bio: 'Um dos empreendedores mais bem-sucedidos do Brasil, fundador da Wiser Educação (Wise Up) e ex-dono do Orlando City. Referência em vendas, gestão e escala de negócios no país.',
    icon: TrendingUp,
    // SEM RECORTE — e é por isso que este é o único cartão que abre o vídeo do
    // começo. Se o Raul localizar o trecho, preencher startTime/endTime aqui
    // alinha os três. Enquanto não houver, o cartão não finge precisão que não
    // tem: `argument` descreve o tema, não um minuto específico.
  },
];

/** Embed com o recorte aplicado. Fonte única — o modal lê daqui. */
export function embedUrl(a: Authority): string {
  const params = new URLSearchParams({ autoplay: '1' });
  if (a.startTime !== undefined) params.set('start', String(a.startTime));
  if (a.endTime !== undefined) params.set('end', String(a.endTime));
  return `https://www.youtube.com/embed/${a.videoId}?${params.toString()}`;
}

/**
 * Thumbnail servida pelo próprio YouTube.
 *
 * hqdefault existe para todo vídeo público (maxresdefault não — vídeos antigos
 * devolvem 404, e o cartão ficaria com buraco).
 */
export function thumbnailUrl(a: Authority): string {
  return `https://img.youtube.com/vi/${a.videoId}/hqdefault.jpg`;
}

/**
 * O aviso que o commit 4b24851 removeu, de volta — e agora obrigatório por
 * teste. Ele é a diferença entre "três pessoas falando sobre IA" e "três
 * pessoas parecendo recomendar a RIA".
 */
export const AUTHORITIES_DISCLAIMER =
  'São participações públicas sobre inteligência artificial em geral. Nenhuma delas é cliente, parceira ou endossante da RIA, e nenhuma tem relação com este site. Os trechos estão recortados para ir ao ponto; o vídeo completo abre no YouTube.';
