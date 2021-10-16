import { installGlobals } from '@remix-run/node';
import {
  redirectBack,
  parseBody,
  json,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
} from '../src';

installGlobals();

describe('redirectBack', () => {
  it('uses the referer if available', () => {
    const request = new Request('/', {
      headers: { Referer: '/referer' },
    });
    const response = redirectBack(request, { fallback: '/fallback' });
    expect(response.headers.get('Location')).toBe('/referer');
  });

  it('uses the fallback if referer is not available', () => {
    const request = new Request('/');
    const response = redirectBack(request, { fallback: '/fallback' });
    expect(response.headers.get('Location')).toBe('/fallback');
  });
});

describe('catchBoundary', () => {
  it('badRequest', async () => {
    interface RouteData {
      framework: 'Remix';
    }
    try {
      badRequest<RouteData>({ framework: 'Remix' });
    } catch (response) {
      expect(response).toEqual(
        json<RouteData>({ framework: 'Remix' }, { status: 400 })
      );
    }
  });

  it('unauthorized', async () => {
    interface RouteData {
      framework: 'Remix';
    }
    try {
      unauthorized<RouteData>({ framework: 'Remix' });
    } catch (response) {
      expect(response).toEqual(
        json<RouteData>({ framework: 'Remix' }, { status: 401 })
      );
    }
  });

  it('forbidden', async () => {
    interface RouteData {
      framework: 'Remix';
    }
    try {
      forbidden<RouteData>({ framework: 'Remix' });
    } catch (response) {
      expect(response).toEqual(
        json<RouteData>({ framework: 'Remix' }, { status: 403 })
      );
    }
  });

  it('notFound', async () => {
    interface RouteData {
      framework: 'Remix';
    }
    try {
      notFound<RouteData>({ framework: 'Remix' });
    } catch (response) {
      expect(response).toEqual(
        json<RouteData>({ framework: 'Remix' }, { status: 404 })
      );
    }
  });
});

describe('parseBody', () => {
  it('reads the body as a URLSearchParams instance', async () => {
    const request = new Request('/', {
      method: 'POST',
      body: new URLSearchParams({ framework: 'Remix' }).toString(),
    });
    const body = await parseBody(request);
    expect(body).toBeInstanceOf(URLSearchParams);
    expect(body.get('framework')).toBe('Remix');
  });
});

describe('json', () => {
  it('returns a response with the JSON data', async () => {
    interface RouteData {
      framework: 'Remix';
    }
    const response = json<RouteData>({ framework: 'Remix' });
    const body = await response.json();
    expect(body.framework).toBe('Remix');
  });
});
