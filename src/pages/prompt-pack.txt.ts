import type { APIRoute } from 'astro';
import { promptPack } from '../data/prompts';
export const GET: APIRoute = () => {
  const text = [
    'Research Review Prompt Pack',
    'Zibin Zhao | https://zibinzhao.com/prompts/',
    '',
    'Replace the running example and bracketed inputs with your own research question. Verify original sources before using a claim.',
    '',
    ...promptPack.stages.flatMap((stage, i) => [
      `${i + 1}. ${stage.title}`,
      `Original tool suggestion: ${stage.tool}`,
      '',
      ...(stage.note ? [stage.note, ''] : []),
      ...stage.blocks.flatMap((block) => [block.label ?? '', block.text, '']),
      ...(stage.afterNote ? [stage.afterNote, ''] : []),
    ]),
  ].join('\n');
  return new Response(text, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': 'attachment; filename="zibin-zhao-review-prompts.txt"',
    },
  });
};
