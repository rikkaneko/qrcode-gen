/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `wrangler dev src/index.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `wrangler publish src/index.ts --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import QRSvg from 'qrcode';
import QRStr from 'qrcode-terminal';

export interface Env {}

export default {
  async fetch(
      request: Request,
      env: Env,
      ctx: ExecutionContext,
  ): Promise<Response> {
    const {url} = request;
    const {
      pathname,
      searchParams,
    } = new URL(url);

    if (pathname === '/favicon.ico') {
      return new Response(null, {
        headers: {
          'cache-control': 'public, max-age=172800',
        },
        status: 404,
      });
    }

    if (!searchParams.has('q')) {
      return new Response(null, {
        status: 400,
      });
    }

    const text = searchParams.get('q')!;
    let encoded: string | undefined;
    const type = searchParams.get('type') ?? '';
    switch (type) {
      case '':
      case 'utf8':
        QRStr.generate(text, {small: true}, res => encoded = res);
        return new Response(encoded!, {
          status: 200,
        });

      case 'svg':
        QRSvg.toString(text, {
          margin: 1,
        }, (err, res) => {
          if (err) {
            return new Response(err.message, {
              status: 400,
            });
          }
          encoded = res;
        });

        return new Response(encoded, {
          headers: {
            'content-type': 'image/svg+xml',
          },
        });

      default:
        return new Response('Invalid type.\n', {
          status: 400,
        });
    }
  },
};
