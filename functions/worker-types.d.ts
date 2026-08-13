interface PagesFunctionContext<Env = Record<string, unknown>> {
  request: Request;
  env: Env;
  waitUntil: (promise: Promise<unknown>) => void;
}

type PagesFunction<Env = Record<string, unknown>> = (context: PagesFunctionContext<Env>) => Response | Promise<Response>;
