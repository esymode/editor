// TODO remove it with version 0.8
declare module "@cloudflare/kv-asset-handler" {
  export type CacheControl = {
    browserTTL: number;
    edgeTTL: number;
    bypassCache: boolean;
  };

  export type Options = {
    cacheControl:
      | ((req: Request) => Partial<CacheControl>)
      | Partial<CacheControl>;
    ASSET_NAMESPACE: any;
    ASSET_MANIFEST: any;
    mapRequestToAsset: (req: Request) => Request;
  };

  export class KVError extends Error {
    constructor(message?: string, status?: number);
    status: number;
  }

  export class MethodNotAllowedError extends KVError {
    constructor(message?: string, status?: number);
  }

  export class NotFoundError extends KVError {
    constructor(message?: string, status?: number);
  }
  export class InternalError extends KVError {
    constructor(message?: string, status?: number);
  }

  //   import * as mime from "mime";

  global {
    var __STATIC_CONTENT: any, __STATIC_CONTENT_MANIFEST: any;
  }
  /**
   * maps the path of incoming request to the request pathKey to look up
   * in bucket and in cache
   * e.g.  for a path '/' returns '/index.html' which serves
   * the content of bucket/index.html
   * @param {Request} request incoming request
   */
  const mapRequestToAsset: (request: Request) => Request;

  /**
   * maps the path of incoming request to /index.html if it evaluates to
   * any html file.
   * @param {Request} request incoming request
   */
  function serveSinglePageApp(request: Request): Request;
  //    {
  // // First apply the default handler, which already has logic to detect
  // // paths that should map to HTML files.
  // request = mapRequestToAsset(request);

  // // Detect if the default handler decided to map to
  // // a HTML file in some specific directory.
  // if (request.url.endsWith(".html")) {
  //   // If expected HTML file was missing, just return the root index.html
  //   return new Request(`${new URL(request.url).origin}/index.html`, request);
  // } else {
  //   // The default handler decided this is not an HTML page. It's probably
  //   // an image, CSS, or JS file. Leave it as-is.
  //   return request;
  // }
  //   }

  /**
   * takes the path of the incoming request, gathers the approriate cotent from KV, and returns
   * the response
   *
   * @param {FetchEvent} event the fetch event of the triggered request
   * @param {{mapRequestToAsset: (string: Request) => Request, cacheControl: {bypassCache:boolean, edgeTTL: number, browserTTL:number}, ASSET_NAMESPACE: any, ASSET_MANIFEST:any}} [options] configurable options
   * @param {CacheControl} [options.cacheControl] determine how to cache on Cloudflare and the browser
   * @param {typeof(options.mapRequestToAsset)} [options.mapRequestToAsset]  maps the path of incoming request to the request pathKey to look up
   * @param {any} [options.ASSET_NAMESPACE] the binding to the namespace that script references
   * @param {any} [options.ASSET_MANIFEST] the map of the key to cache and store in KV
   * */
  const getAssetFromKV: (
    event: FetchEvent,
    options?: Partial<Options>
  ) => Promise<Response>;

  export { getAssetFromKV, mapRequestToAsset, serveSinglePageApp };
}
