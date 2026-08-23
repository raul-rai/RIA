import { TrendingUp, Cpu } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * Vozes do mercado (capitulo 1).
 *
 * REGRA: sao declaracoes publicas sobre IA em geral. Nenhuma delas e endosso da
 * RIA, e o rodape da secao diz isso em voz alta. Nao edite as citacoes para
 * soarem mais favoraveis do que o original.
 *
 * A ordem deste array e o indice de `awarenessChecks` no VulnerabilityContext.
 * Mexer na ordem remarca a caixa errada; incluir ou remover um item exige mudar
 * o estado inicial do contexto (hoje `[false, false, false]`).
 */
export interface Authority {
  name: string;
  title: string;
  quote: string;
  /** Texto da marcacao que reduz o Indice de Vulnerabilidade. */
  checkboxLabel: string;
  videoUrl: string;
  thumbnail: string;
  bio: string;
  icon: LucideIcon;
  /** Recorte do video, em segundos. Sem eles o player toca do inicio ao fim. */
  startTime?: number;
  endTime?: number;
}

export const AUTHORITIES: Authority[] = [
  {
    name: 'Ricardo Amorim',
    title: 'Economista & Estrategista',
    quote:
      'A IA não é o futuro, é a sobrevivência do presente. Quem não se adaptar agora será engolido pelo mercado.',
    checkboxLabel: 'Estou ciente de que a IA não é o futuro, mas sim a sobrevivência do presente.',
    videoUrl: 'https://www.youtube.com/embed/4ZRJCW9CSvE?autoplay=1',
    thumbnail: '/autoridades/ricardo-amorim.webp',
    bio: 'Economista mais influente do Brasil segundo a Forbes, apresentador do Manhattan Connection e LinkedIn Top Voice. Com mais de 20 anos no mercado financeiro global, é a voz mais respeitada sobre transformações econômicas e tecnológicas no país.',
    icon: TrendingUp,
    startTime: 0,
    endTime: 154,
  },
  {
    name: 'Silvio Meira',
    title: 'Cientista Chefe TDS',
    quote:
      'A Inteligência Artificial emerge não como uma simples ferramenta, mas como uma força estratégica - uma nova dimensão da inteligência para os negócios.',
    checkboxLabel: 'Estou ciente de que a IA é uma força estratégica indispensável para os negócios.',
    videoUrl: 'https://www.youtube.com/embed/tcmntVEQr2o?autoplay=1',
    thumbnail: '/autoridades/silvio-meira.webp',
    bio: 'Um dos fundadores do CESAR (Centro de Estudos e Sistemas Avançados do Recife) e Cientista Chefe da TDS Company. Uma das maiores referências em engenharia de software e inovação digital do Brasil.',
    icon: Cpu,
    startTime: 1378,
    endTime: 1438,
  },
  {
    name: 'Flávio Augusto',
    title: 'Fundador Wiser Educação',
    quote:
      'A Inteligência Artificial não é um hype, é a maior alavanca de eficiência do nosso tempo. O mercado recompensa a eficiência e não perdoa a inércia.',
    checkboxLabel: 'Estou ciente de que o mercado recompensa a eficiência e não perdoa a inércia.',
    videoUrl: 'https://www.youtube.com/embed/a1MVf8eGlG8?autoplay=1',
    thumbnail: '/autoridades/flavio-augusto.webp',
    bio: 'Um dos empreendedores mais bem-sucedidos do Brasil, fundador da Wiser Educação (Wise Up) e ex-dono do Orlando City. Referência absoluta em vendas, gestão e escala de negócios no país.',
    icon: TrendingUp,
  },
];
