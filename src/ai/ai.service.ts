import {
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';

@Injectable()
export class AiService {
  async chat(message: string) {
    let response: Response;

    try {
      response = await fetch('http://127.0.0.1:11434/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'persian-realtor',
          messages: [{ role: 'user', content: message }],
          stream: false,
        }),
        signal: AbortSignal.timeout(120000),
      });
    } catch {
      throw new ServiceUnavailableException(
        'ارتباط با Ollama برقرار نشد. مطمئن شو Ollama روی همین سیستم در حال اجراست.',
      );
    }

    if (!response.ok) {
      throw new ServiceUnavailableException(
        `سرویس Ollama با خطای HTTP ${response.status} پاسخ داد.`,
      );
    }

    const data: { message?: { content?: string } } = await response.json();

    return {
      reply: data.message?.content ?? '',
    };
  }
}
