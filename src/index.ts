/*
 * This file is part of qrcode-gen.
 * Copyright (c) 2022 Joe Ma <rikkaneko23@gmail.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import QRSvg from 'qrcode';
import QRStr from 'qrcode-terminal';
import { SERVICE_URL } from './constants';

export interface Env {}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const agent = request.headers.get('user-agent') ?? '';
    const is_browser = ['Chrome', 'Mozilla', 'AppleWebKit', 'Safari', 'Gecko', 'Chromium'].some((v) =>
      agent.includes(v)
    );
    const { pathname, searchParams } = new URL(request.url);
    searchParams.set('type', searchParams.get('type') || (is_browser ? 'svg' : 'utf8'));
    const req_key = `https://${SERVICE_URL}/?${searchParams.toString()}`;

    if (pathname === '/favicon.ico') {
      return new Response(null, {
        headers: {
          'cache-control': 'public, max-age=172800',
        },
        status: 404,
      });
    }

    if (!searchParams.has('q')) {
      return new Response('Required input text.\n', {
        status: 400,
      });
    }

    let cache = caches.default;
    let res = await cache.match(req_key);
    if (res == undefined) {
      const text = searchParams.get('q')!;
      let encoded: string | undefined;
      switch (searchParams.get('type')) {
        case 'utf8':
          QRStr.generate(text, { small: true }, (res) => (encoded = res));
          res = new Response(encoded!, {
            headers: {
              'cache-control': 'public, max-age=172800',
            },
          });
          break;

        case 'svg':
          QRSvg.toString(
            text,
            {
              margin: 1,
            },
            (err, res) => {
              if (err) {
                return new Response(err.message, {
                  status: 400,
                });
              }
              encoded = res;
            }
          );

          res = new Response(encoded, {
            headers: {
              'content-type': 'image/svg+xml',
              'cache-control': 'public, max-age=172800',
            },
          });
          break;

        default:
          return new Response('Invalid type.\n', {
            status: 400,
          });
      }

      ctx.waitUntil(cache.put(req_key, res.clone()));
    }

    return res;
  },
};
