// Endereco do player YouTube, montado a partir do videoUrl da autoridade.
//
// IFRAME PURO, SEM A IFRAME API. Dominio -nocookie e nenhum script de terceiro:
// nada do YouTube e pedido antes de o iframe existir. `start`/`end` sao nativos
// do embed, entao o recorte e exato sem JavaScript de terceiro. Ver a nota longa
// no historico de VideoModal.tsx, de onde isto foi extraido para ser reusado
// tambem pela parede de videos 3d.
export function playerSrc(videoUrl: string, startTime?: number, endTime?: number): string {
  const videoId = videoUrl.match(/(?:embed\/|v=)([^?&]+)/)?.[1] ?? '';
  const params = new URLSearchParams({
    autoplay: '1',
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
    start: String(startTime ?? 0),
  });
  if (endTime) params.set('end', String(endTime));
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}
