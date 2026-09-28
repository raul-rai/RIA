// Quebra de quadros SSE.
//
// Existe separado do consumidor porque e a unica parte do streaming que da para
// testar sem rede: um quadro chega partido em dois `read()` com frequencia, e e
// exatamente ai que um parser ingenuo perde eventos.

export interface SseSplit {
  /** Quadros completos, sem o separador. */
  frames: string[];
  /** O que sobrou depois do ultimo separador — volta no proximo ciclo. */
  rest: string;
}

export function parseSseFrames(buffer: string): SseSplit {
  const normalizado = buffer.replace(/\r\n/g, '\n');
  const frames: string[] = [];
  let rest = normalizado;

  for (;;) {
    const corte = rest.indexOf('\n\n');
    if (corte === -1) break;
    frames.push(rest.slice(0, corte));
    rest = rest.slice(corte + 2);
  }

  return { frames, rest };
}

/** O JSON de um quadro `data: {...}`. `null` quando o quadro nao traz JSON. */
export function sseData(frame: string): unknown {
  const linha = frame.split('\n').find((l) => l.startsWith('data:'));
  if (!linha) return null;
  try {
    return JSON.parse(linha.slice(5).trim());
  } catch {
    return null;
  }
}
