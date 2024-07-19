/* eslint-disable */

import { AllTypesProps, ReturnTypes, Ops } from './const.js';


export const HOST="Specify host"


export const HEADERS = {}
export const apiSubscription = (options: chainOptions) => (query: string) => {
  try {
    const queryString = options[0] + '?query=' + encodeURIComponent(query);
    const wsString = queryString.replace('http', 'ws');
    const host = (options.length > 1 && options[1]?.websocket?.[0]) || wsString;
    const webSocketOptions = options[1]?.websocket || [host];
    const ws = new WebSocket(...webSocketOptions);
    return {
      ws,
      on: (e: (args: any) => void) => {
        ws.onmessage = (event: any) => {
          if (event.data) {
            const parsed = JSON.parse(event.data);
            const data = parsed.data;
            return e(data);
          }
        };
      },
      off: (e: (args: any) => void) => {
        ws.onclose = e;
      },
      error: (e: (args: any) => void) => {
        ws.onerror = e;
      },
      open: (e: () => void) => {
        ws.onopen = e;
      },
    };
  } catch {
    throw new Error('No websockets implemented');
  }
};
const handleFetchResponse = (response: Response): Promise<GraphQLResponse> => {
  if (!response.ok) {
    return new Promise((_, reject) => {
      response
        .text()
        .then((text) => {
          try {
            reject(JSON.parse(text));
          } catch (err) {
            reject(text);
          }
        })
        .catch(reject);
    });
  }
  return response.json() as Promise<GraphQLResponse>;
};

export const apiFetch =
  (options: fetchOptions) =>
  (query: string, variables: Record<string, unknown> = {}) => {
    const fetchOptions = options[1] || {};
    if (fetchOptions.method && fetchOptions.method === 'GET') {
      return fetch(`${options[0]}?query=${encodeURIComponent(query)}`, fetchOptions)
        .then(handleFetchResponse)
        .then((response: GraphQLResponse) => {
          if (response.errors) {
            throw new GraphQLError(response);
          }
          return response.data;
        });
    }
    return fetch(`${options[0]}`, {
      body: JSON.stringify({ query, variables }),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      ...fetchOptions,
    })
      .then(handleFetchResponse)
      .then((response: GraphQLResponse) => {
        if (response.errors) {
          throw new GraphQLError(response);
        }
        return response.data;
      });
  };

export const InternalsBuildQuery = ({
  ops,
  props,
  returns,
  options,
  scalars,
}: {
  props: AllTypesPropsType;
  returns: ReturnTypesType;
  ops: Operations;
  options?: OperationOptions;
  scalars?: ScalarDefinition;
}) => {
  const ibb = (
    k: string,
    o: InputValueType | VType,
    p = '',
    root = true,
    vars: Array<{ name: string; graphQLType: string }> = [],
  ): string => {
    const keyForPath = purifyGraphQLKey(k);
    const newPath = [p, keyForPath].join(SEPARATOR);
    if (!o) {
      return '';
    }
    if (typeof o === 'boolean' || typeof o === 'number') {
      return k;
    }
    if (typeof o === 'string') {
      return `${k} ${o}`;
    }
    if (Array.isArray(o)) {
      const args = InternalArgsBuilt({
        props,
        returns,
        ops,
        scalars,
        vars,
      })(o[0], newPath);
      return `${ibb(args ? `${k}(${args})` : k, o[1], p, false, vars)}`;
    }
    if (k === '__alias') {
      return Object.entries(o)
        .map(([alias, objectUnderAlias]) => {
          if (typeof objectUnderAlias !== 'object' || Array.isArray(objectUnderAlias)) {
            throw new Error(
              'Invalid alias it should be __alias:{ YOUR_ALIAS_NAME: { OPERATION_NAME: { ...selectors }}}',
            );
          }
          const operationName = Object.keys(objectUnderAlias)[0];
          const operation = objectUnderAlias[operationName];
          return ibb(`${alias}:${operationName}`, operation, p, false, vars);
        })
        .join('\n');
    }
    const hasOperationName = root && options?.operationName ? ' ' + options.operationName : '';
    const keyForDirectives = o.__directives ?? '';
    const query = `{${Object.entries(o)
      .filter(([k]) => k !== '__directives')
      .map((e) => ibb(...e, [p, `field<>${keyForPath}`].join(SEPARATOR), false, vars))
      .join('\n')}}`;
    if (!root) {
      return `${k} ${keyForDirectives}${hasOperationName} ${query}`;
    }
    const varsString = vars.map((v) => `${v.name}: ${v.graphQLType}`).join(', ');
    return `${k} ${keyForDirectives}${hasOperationName}${varsString ? `(${varsString})` : ''} ${query}`;
  };
  return ibb;
};

type UnionOverrideKeys<T, U> = Omit<T, keyof U> & U;

export const Thunder =
  <SCLR extends ScalarDefinition>(fn: FetchFunction, thunderGraphQLOptions?: ThunderGraphQLOptions<SCLR>) =>
  <O extends keyof typeof Ops, OVERRIDESCLR extends SCLR, R extends keyof ValueTypes = GenericOperation<O>>(
    operation: O,
    graphqlOptions?: ThunderGraphQLOptions<OVERRIDESCLR>,
  ) =>
  <Z extends ValueTypes[R]>(
    o: Z & {
      [P in keyof Z]: P extends keyof ValueTypes[R] ? Z[P] : never;
    },
    ops?: OperationOptions & { variables?: Record<string, unknown> },
  ) => {
    const options = {
      ...thunderGraphQLOptions,
      ...graphqlOptions,
    };
    return fn(
      Zeus(operation, o, {
        operationOptions: ops,
        scalars: options?.scalars,
      }),
      ops?.variables,
    ).then((data) => {
      if (options?.scalars) {
        return decodeScalarsInResponse({
          response: data,
          initialOp: operation,
          initialZeusQuery: o as VType,
          returns: ReturnTypes,
          scalars: options.scalars,
          ops: Ops,
        });
      }
      return data;
    }) as Promise<InputType<GraphQLTypes[R], Z, UnionOverrideKeys<SCLR, OVERRIDESCLR>>>;
  };

export const Chain = (...options: chainOptions) => Thunder(apiFetch(options));

export const SubscriptionThunder =
  <SCLR extends ScalarDefinition>(fn: SubscriptionFunction, thunderGraphQLOptions?: ThunderGraphQLOptions<SCLR>) =>
  <O extends keyof typeof Ops, OVERRIDESCLR extends SCLR, R extends keyof ValueTypes = GenericOperation<O>>(
    operation: O,
    graphqlOptions?: ThunderGraphQLOptions<OVERRIDESCLR>,
  ) =>
  <Z extends ValueTypes[R]>(
    o: Z & {
      [P in keyof Z]: P extends keyof ValueTypes[R] ? Z[P] : never;
    },
    ops?: OperationOptions & { variables?: ExtractVariables<Z> },
  ) => {
    const options = {
      ...thunderGraphQLOptions,
      ...graphqlOptions,
    };
    type CombinedSCLR = UnionOverrideKeys<SCLR, OVERRIDESCLR>;
    const returnedFunction = fn(
      Zeus(operation, o, {
        operationOptions: ops,
        scalars: options?.scalars,
      }),
    ) as SubscriptionToGraphQL<Z, GraphQLTypes[R], CombinedSCLR>;
    if (returnedFunction?.on && options?.scalars) {
      const wrapped = returnedFunction.on;
      returnedFunction.on = (fnToCall: (args: InputType<GraphQLTypes[R], Z, CombinedSCLR>) => void) =>
        wrapped((data: InputType<GraphQLTypes[R], Z, CombinedSCLR>) => {
          if (options?.scalars) {
            return fnToCall(
              decodeScalarsInResponse({
                response: data,
                initialOp: operation,
                initialZeusQuery: o as VType,
                returns: ReturnTypes,
                scalars: options.scalars,
                ops: Ops,
              }),
            );
          }
          return fnToCall(data);
        });
    }
    return returnedFunction;
  };

export const Subscription = (...options: chainOptions) => SubscriptionThunder(apiSubscription(options));
export const Zeus = <
  Z extends ValueTypes[R],
  O extends keyof typeof Ops,
  R extends keyof ValueTypes = GenericOperation<O>,
>(
  operation: O,
  o: Z,
  ops?: {
    operationOptions?: OperationOptions;
    scalars?: ScalarDefinition;
  },
) =>
  InternalsBuildQuery({
    props: AllTypesProps,
    returns: ReturnTypes,
    ops: Ops,
    options: ops?.operationOptions,
    scalars: ops?.scalars,
  })(operation, o as VType);

export const ZeusSelect = <T>() => ((t: unknown) => t) as SelectionFunction<T>;

export const Selector = <T extends keyof ValueTypes>(key: T) => key && ZeusSelect<ValueTypes[T]>();

export const TypeFromSelector = <T extends keyof ValueTypes>(key: T) => key && ZeusSelect<ValueTypes[T]>();
export const Gql = Chain(HOST, {
  headers: {
    'Content-Type': 'application/json',
    ...HEADERS,
  },
});

export const ZeusScalars = ZeusSelect<ScalarCoders>();

export const decodeScalarsInResponse = <O extends Operations>({
  response,
  scalars,
  returns,
  ops,
  initialZeusQuery,
  initialOp,
}: {
  ops: O;
  response: any;
  returns: ReturnTypesType;
  scalars?: Record<string, ScalarResolver | undefined>;
  initialOp: keyof O;
  initialZeusQuery: InputValueType | VType;
}) => {
  if (!scalars) {
    return response;
  }
  const builder = PrepareScalarPaths({
    ops,
    returns,
  });

  const scalarPaths = builder(initialOp as string, ops[initialOp], initialZeusQuery);
  if (scalarPaths) {
    const r = traverseResponse({ scalarPaths, resolvers: scalars })(initialOp as string, response, [ops[initialOp]]);
    return r;
  }
  return response;
};

export const traverseResponse = ({
  resolvers,
  scalarPaths,
}: {
  scalarPaths: { [x: string]: `scalar.${string}` };
  resolvers: {
    [x: string]: ScalarResolver | undefined;
  };
}) => {
  const ibb = (k: string, o: InputValueType | VType, p: string[] = []): unknown => {
    if (Array.isArray(o)) {
      return o.map((eachO) => ibb(k, eachO, p));
    }
    if (o == null) {
      return o;
    }
    const scalarPathString = p.join(SEPARATOR);
    const currentScalarString = scalarPaths[scalarPathString];
    if (currentScalarString) {
      const currentDecoder = resolvers[currentScalarString.split('.')[1]]?.decode;
      if (currentDecoder) {
        return currentDecoder(o);
      }
    }
    if (typeof o === 'boolean' || typeof o === 'number' || typeof o === 'string' || !o) {
      return o;
    }
    const entries = Object.entries(o).map(([k, v]) => [k, ibb(k, v, [...p, purifyGraphQLKey(k)])] as const);
    const objectFromEntries = entries.reduce<Record<string, unknown>>((a, [k, v]) => {
      a[k] = v;
      return a;
    }, {});
    return objectFromEntries;
  };
  return ibb;
};

export type AllTypesPropsType = {
  [x: string]:
    | undefined
    | `scalar.${string}`
    | 'enum'
    | {
        [x: string]:
          | undefined
          | string
          | {
              [x: string]: string | undefined;
            };
      };
};

export type ReturnTypesType = {
  [x: string]:
    | {
        [x: string]: string | undefined;
      }
    | `scalar.${string}`
    | undefined;
};
export type InputValueType = {
  [x: string]: undefined | boolean | string | number | [any, undefined | boolean | InputValueType] | InputValueType;
};
export type VType =
  | undefined
  | boolean
  | string
  | number
  | [any, undefined | boolean | InputValueType]
  | InputValueType;

export type PlainType = boolean | number | string | null | undefined;
export type ZeusArgsType =
  | PlainType
  | {
      [x: string]: ZeusArgsType;
    }
  | Array<ZeusArgsType>;

export type Operations = Record<string, string>;

export type VariableDefinition = {
  [x: string]: unknown;
};

export const SEPARATOR = '|';

export type fetchOptions = Parameters<typeof fetch>;
type websocketOptions = typeof WebSocket extends new (...args: infer R) => WebSocket ? R : never;
export type chainOptions = [fetchOptions[0], fetchOptions[1] & { websocket?: websocketOptions }] | [fetchOptions[0]];
export type FetchFunction = (query: string, variables?: Record<string, unknown>) => Promise<any>;
export type SubscriptionFunction = (query: string) => any;
type NotUndefined<T> = T extends undefined ? never : T;
export type ResolverType<F> = NotUndefined<F extends [infer ARGS, any] ? ARGS : undefined>;

export type OperationOptions = {
  operationName?: string;
};

export type ScalarCoder = Record<string, (s: unknown) => string>;

export interface GraphQLResponse {
  data?: Record<string, any>;
  errors?: Array<{
    message: string;
  }>;
}
export class GraphQLError extends Error {
  constructor(public response: GraphQLResponse) {
    super('');
    console.error(response);
  }
  toString() {
    return 'GraphQL Response Error';
  }
}
export type GenericOperation<O> = O extends keyof typeof Ops ? typeof Ops[O] : never;
export type ThunderGraphQLOptions<SCLR extends ScalarDefinition> = {
  scalars?: SCLR | ScalarCoders;
};

const ExtractScalar = (mappedParts: string[], returns: ReturnTypesType): `scalar.${string}` | undefined => {
  if (mappedParts.length === 0) {
    return;
  }
  const oKey = mappedParts[0];
  const returnP1 = returns[oKey];
  if (typeof returnP1 === 'object') {
    const returnP2 = returnP1[mappedParts[1]];
    if (returnP2) {
      return ExtractScalar([returnP2, ...mappedParts.slice(2)], returns);
    }
    return undefined;
  }
  return returnP1 as `scalar.${string}` | undefined;
};

export const PrepareScalarPaths = ({ ops, returns }: { returns: ReturnTypesType; ops: Operations }) => {
  const ibb = (
    k: string,
    originalKey: string,
    o: InputValueType | VType,
    p: string[] = [],
    pOriginals: string[] = [],
    root = true,
  ): { [x: string]: `scalar.${string}` } | undefined => {
    if (!o) {
      return;
    }
    if (typeof o === 'boolean' || typeof o === 'number' || typeof o === 'string') {
      const extractionArray = [...pOriginals, originalKey];
      const isScalar = ExtractScalar(extractionArray, returns);
      if (isScalar?.startsWith('scalar')) {
        const partOfTree = {
          [[...p, k].join(SEPARATOR)]: isScalar,
        };
        return partOfTree;
      }
      return {};
    }
    if (Array.isArray(o)) {
      return ibb(k, k, o[1], p, pOriginals, false);
    }
    if (k === '__alias') {
      return Object.entries(o)
        .map(([alias, objectUnderAlias]) => {
          if (typeof objectUnderAlias !== 'object' || Array.isArray(objectUnderAlias)) {
            throw new Error(
              'Invalid alias it should be __alias:{ YOUR_ALIAS_NAME: { OPERATION_NAME: { ...selectors }}}',
            );
          }
          const operationName = Object.keys(objectUnderAlias)[0];
          const operation = objectUnderAlias[operationName];
          return ibb(alias, operationName, operation, p, pOriginals, false);
        })
        .reduce((a, b) => ({
          ...a,
          ...b,
        }));
    }
    const keyName = root ? ops[k] : k;
    return Object.entries(o)
      .filter(([k]) => k !== '__directives')
      .map(([k, v]) => {
        // Inline fragments shouldn't be added to the path as they aren't a field
        const isInlineFragment = originalKey.match(/^...\s*on/) != null;
        return ibb(
          k,
          k,
          v,
          isInlineFragment ? p : [...p, purifyGraphQLKey(keyName || k)],
          isInlineFragment ? pOriginals : [...pOriginals, purifyGraphQLKey(originalKey)],
          false,
        );
      })
      .reduce((a, b) => ({
        ...a,
        ...b,
      }));
  };
  return ibb;
};

export const purifyGraphQLKey = (k: string) => k.replace(/\([^)]*\)/g, '').replace(/^[^:]*\:/g, '');

const mapPart = (p: string) => {
  const [isArg, isField] = p.split('<>');
  if (isField) {
    return {
      v: isField,
      __type: 'field',
    } as const;
  }
  return {
    v: isArg,
    __type: 'arg',
  } as const;
};

type Part = ReturnType<typeof mapPart>;

export const ResolveFromPath = (props: AllTypesPropsType, returns: ReturnTypesType, ops: Operations) => {
  const ResolvePropsType = (mappedParts: Part[]) => {
    const oKey = ops[mappedParts[0].v];
    const propsP1 = oKey ? props[oKey] : props[mappedParts[0].v];
    if (propsP1 === 'enum' && mappedParts.length === 1) {
      return 'enum';
    }
    if (typeof propsP1 === 'string' && propsP1.startsWith('scalar.') && mappedParts.length === 1) {
      return propsP1;
    }
    if (typeof propsP1 === 'object') {
      if (mappedParts.length < 2) {
        return 'not';
      }
      const propsP2 = propsP1[mappedParts[1].v];
      if (typeof propsP2 === 'string') {
        return rpp(
          `${propsP2}${SEPARATOR}${mappedParts
            .slice(2)
            .map((mp) => mp.v)
            .join(SEPARATOR)}`,
        );
      }
      if (typeof propsP2 === 'object') {
        if (mappedParts.length < 3) {
          return 'not';
        }
        const propsP3 = propsP2[mappedParts[2].v];
        if (propsP3 && mappedParts[2].__type === 'arg') {
          return rpp(
            `${propsP3}${SEPARATOR}${mappedParts
              .slice(3)
              .map((mp) => mp.v)
              .join(SEPARATOR)}`,
          );
        }
      }
    }
  };
  const ResolveReturnType = (mappedParts: Part[]) => {
    if (mappedParts.length === 0) {
      return 'not';
    }
    const oKey = ops[mappedParts[0].v];
    const returnP1 = oKey ? returns[oKey] : returns[mappedParts[0].v];
    if (typeof returnP1 === 'object') {
      if (mappedParts.length < 2) return 'not';
      const returnP2 = returnP1[mappedParts[1].v];
      if (returnP2) {
        return rpp(
          `${returnP2}${SEPARATOR}${mappedParts
            .slice(2)
            .map((mp) => mp.v)
            .join(SEPARATOR)}`,
        );
      }
    }
  };
  const rpp = (path: string): 'enum' | 'not' | `scalar.${string}` => {
    const parts = path.split(SEPARATOR).filter((l) => l.length > 0);
    const mappedParts = parts.map(mapPart);
    const propsP1 = ResolvePropsType(mappedParts);
    if (propsP1) {
      return propsP1;
    }
    const returnP1 = ResolveReturnType(mappedParts);
    if (returnP1) {
      return returnP1;
    }
    return 'not';
  };
  return rpp;
};

export const InternalArgsBuilt = ({
  props,
  ops,
  returns,
  scalars,
  vars,
}: {
  props: AllTypesPropsType;
  returns: ReturnTypesType;
  ops: Operations;
  scalars?: ScalarDefinition;
  vars: Array<{ name: string; graphQLType: string }>;
}) => {
  const arb = (a: ZeusArgsType, p = '', root = true): string => {
    if (typeof a === 'string') {
      if (a.startsWith(START_VAR_NAME)) {
        const [varName, graphQLType] = a.replace(START_VAR_NAME, '$').split(GRAPHQL_TYPE_SEPARATOR);
        const v = vars.find((v) => v.name === varName);
        if (!v) {
          vars.push({
            name: varName,
            graphQLType,
          });
        } else {
          if (v.graphQLType !== graphQLType) {
            throw new Error(
              `Invalid variable exists with two different GraphQL Types, "${v.graphQLType}" and ${graphQLType}`,
            );
          }
        }
        return varName;
      }
    }
    const checkType = ResolveFromPath(props, returns, ops)(p);
    if (checkType.startsWith('scalar.')) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_, ...splittedScalar] = checkType.split('.');
      const scalarKey = splittedScalar.join('.');
      return (scalars?.[scalarKey]?.encode?.(a) as string) || JSON.stringify(a);
    }
    if (Array.isArray(a)) {
      return `[${a.map((arr) => arb(arr, p, false)).join(', ')}]`;
    }
    if (typeof a === 'string') {
      if (checkType === 'enum') {
        return a;
      }
      return `${JSON.stringify(a)}`;
    }
    if (typeof a === 'object') {
      if (a === null) {
        return `null`;
      }
      const returnedObjectString = Object.entries(a)
        .filter(([, v]) => typeof v !== 'undefined')
        .map(([k, v]) => `${k}: ${arb(v, [p, k].join(SEPARATOR), false)}`)
        .join(',\n');
      if (!root) {
        return `{${returnedObjectString}}`;
      }
      return returnedObjectString;
    }
    return `${a}`;
  };
  return arb;
};

export const resolverFor = <X, T extends keyof ResolverInputTypes, Z extends keyof ResolverInputTypes[T]>(
  type: T,
  field: Z,
  fn: (
    args: Required<ResolverInputTypes[T]>[Z] extends [infer Input, any] ? Input : any,
    source: any,
  ) => Z extends keyof ModelTypes[T] ? ModelTypes[T][Z] | Promise<ModelTypes[T][Z]> | X : never,
) => fn as (args?: any, source?: any) => ReturnType<typeof fn>;

export type UnwrapPromise<T> = T extends Promise<infer R> ? R : T;
export type ZeusState<T extends (...args: any[]) => Promise<any>> = NonNullable<UnwrapPromise<ReturnType<T>>>;
export type ZeusHook<
  T extends (...args: any[]) => Record<string, (...args: any[]) => Promise<any>>,
  N extends keyof ReturnType<T>,
> = ZeusState<ReturnType<T>[N]>;

export type WithTypeNameValue<T> = T & {
  __typename?: boolean;
  __directives?: string;
};
export type AliasType<T> = WithTypeNameValue<T> & {
  __alias?: Record<string, WithTypeNameValue<T>>;
};
type DeepAnify<T> = {
  [P in keyof T]?: any;
};
type IsPayLoad<T> = T extends [any, infer PayLoad] ? PayLoad : T;
export type ScalarDefinition = Record<string, ScalarResolver>;

type IsScalar<S, SCLR extends ScalarDefinition> = S extends 'scalar' & { name: infer T }
  ? T extends keyof SCLR
    ? SCLR[T]['decode'] extends (s: unknown) => unknown
      ? ReturnType<SCLR[T]['decode']>
      : unknown
    : unknown
  : S;
type IsArray<T, U, SCLR extends ScalarDefinition> = T extends Array<infer R>
  ? InputType<R, U, SCLR>[]
  : InputType<T, U, SCLR>;
type FlattenArray<T> = T extends Array<infer R> ? R : T;
type BaseZeusResolver = boolean | 1 | string | Variable<any, string>;

type IsInterfaced<SRC extends DeepAnify<DST>, DST, SCLR extends ScalarDefinition> = FlattenArray<SRC> extends
  | ZEUS_INTERFACES
  | ZEUS_UNIONS
  ? {
      [P in keyof SRC]: SRC[P] extends '__union' & infer R
        ? P extends keyof DST
          ? IsArray<R, '__typename' extends keyof DST ? DST[P] & { __typename: true } : DST[P], SCLR>
          : IsArray<R, '__typename' extends keyof DST ? { __typename: true } : Record<string, never>, SCLR>
        : never;
    }[keyof SRC] & {
      [P in keyof Omit<
        Pick<
          SRC,
          {
            [P in keyof DST]: SRC[P] extends '__union' & infer R ? never : P;
          }[keyof DST]
        >,
        '__typename'
      >]: IsPayLoad<DST[P]> extends BaseZeusResolver ? IsScalar<SRC[P], SCLR> : IsArray<SRC[P], DST[P], SCLR>;
    }
  : {
      [P in keyof Pick<SRC, keyof DST>]: IsPayLoad<DST[P]> extends BaseZeusResolver
        ? IsScalar<SRC[P], SCLR>
        : IsArray<SRC[P], DST[P], SCLR>;
    };

export type MapType<SRC, DST, SCLR extends ScalarDefinition> = SRC extends DeepAnify<DST>
  ? IsInterfaced<SRC, DST, SCLR>
  : never;
// eslint-disable-next-line @typescript-eslint/ban-types
export type InputType<SRC, DST, SCLR extends ScalarDefinition = {}> = IsPayLoad<DST> extends { __alias: infer R }
  ? {
      [P in keyof R]: MapType<SRC, R[P], SCLR>[keyof MapType<SRC, R[P], SCLR>];
    } & MapType<SRC, Omit<IsPayLoad<DST>, '__alias'>, SCLR>
  : MapType<SRC, IsPayLoad<DST>, SCLR>;
export type SubscriptionToGraphQL<Z, T, SCLR extends ScalarDefinition> = {
  ws: WebSocket;
  on: (fn: (args: InputType<T, Z, SCLR>) => void) => void;
  off: (fn: (e: { data?: InputType<T, Z, SCLR>; code?: number; reason?: string; message?: string }) => void) => void;
  error: (fn: (e: { data?: InputType<T, Z, SCLR>; errors?: string[] }) => void) => void;
  open: () => void;
};

// eslint-disable-next-line @typescript-eslint/ban-types
export type FromSelector<SELECTOR, NAME extends keyof GraphQLTypes, SCLR extends ScalarDefinition = {}> = InputType<
  GraphQLTypes[NAME],
  SELECTOR,
  SCLR
>;

export type ScalarResolver = {
  encode?: (s: unknown) => string;
  decode?: (s: unknown) => unknown;
};

export type SelectionFunction<V> = <Z extends V>(
  t: Z & {
    [P in keyof Z]: P extends keyof V ? Z[P] : never;
  },
) => Z;

type BuiltInVariableTypes = {
  ['String']: string;
  ['Int']: number;
  ['Float']: number;
  ['ID']: unknown;
  ['Boolean']: boolean;
};
type AllVariableTypes = keyof BuiltInVariableTypes | keyof ZEUS_VARIABLES;
type VariableRequired<T extends string> = `${T}!` | T | `[${T}]` | `[${T}]!` | `[${T}!]` | `[${T}!]!`;
type VR<T extends string> = VariableRequired<VariableRequired<T>>;

export type GraphQLVariableType = VR<AllVariableTypes>;

type ExtractVariableTypeString<T extends string> = T extends VR<infer R1>
  ? R1 extends VR<infer R2>
    ? R2 extends VR<infer R3>
      ? R3 extends VR<infer R4>
        ? R4 extends VR<infer R5>
          ? R5
          : R4
        : R3
      : R2
    : R1
  : T;

type DecomposeType<T, Type> = T extends `[${infer R}]`
  ? Array<DecomposeType<R, Type>> | undefined
  : T extends `${infer R}!`
  ? NonNullable<DecomposeType<R, Type>>
  : Type | undefined;

type ExtractTypeFromGraphQLType<T extends string> = T extends keyof ZEUS_VARIABLES
  ? ZEUS_VARIABLES[T]
  : T extends keyof BuiltInVariableTypes
  ? BuiltInVariableTypes[T]
  : any;

export type GetVariableType<T extends string> = DecomposeType<
  T,
  ExtractTypeFromGraphQLType<ExtractVariableTypeString<T>>
>;

type UndefinedKeys<T> = {
  [K in keyof T]-?: T[K] extends NonNullable<T[K]> ? never : K;
}[keyof T];

type WithNullableKeys<T> = Pick<T, UndefinedKeys<T>>;
type WithNonNullableKeys<T> = Omit<T, UndefinedKeys<T>>;

type OptionalKeys<T> = {
  [P in keyof T]?: T[P];
};

export type WithOptionalNullables<T> = OptionalKeys<WithNullableKeys<T>> & WithNonNullableKeys<T>;

export type Variable<T extends GraphQLVariableType, Name extends string> = {
  ' __zeus_name': Name;
  ' __zeus_type': T;
};

export type ExtractVariablesDeep<Query> = Query extends Variable<infer VType, infer VName>
  ? { [key in VName]: GetVariableType<VType> }
  : Query extends string | number | boolean | Array<string | number | boolean>
  ? // eslint-disable-next-line @typescript-eslint/ban-types
    {}
  : UnionToIntersection<{ [K in keyof Query]: WithOptionalNullables<ExtractVariablesDeep<Query[K]>> }[keyof Query]>;

export type ExtractVariables<Query> = Query extends Variable<infer VType, infer VName>
  ? { [key in VName]: GetVariableType<VType> }
  : Query extends [infer Inputs, infer Outputs]
  ? ExtractVariablesDeep<Inputs> & ExtractVariables<Outputs>
  : Query extends string | number | boolean | Array<string | number | boolean>
  ? // eslint-disable-next-line @typescript-eslint/ban-types
    {}
  : UnionToIntersection<{ [K in keyof Query]: WithOptionalNullables<ExtractVariables<Query[K]>> }[keyof Query]>;

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

export const START_VAR_NAME = `$ZEUS_VAR`;
export const GRAPHQL_TYPE_SEPARATOR = `__$GRAPHQL__`;

export const $ = <Type extends GraphQLVariableType, Name extends string>(name: Name, graphqlType: Type) => {
  return (START_VAR_NAME + name + GRAPHQL_TYPE_SEPARATOR + graphqlType) as unknown as Variable<Type, Name>;
};
type ZEUS_INTERFACES = GraphQLTypes["MongoStored"]
export type ScalarCoders = {
	Vars?: ScalarResolver;
	Image?: ScalarResolver;
}
type ZEUS_UNIONS = never

export type ValueTypes = {
    /** Main query */
["Query"]: AliasType<{
	/** query to use with "Key" and "Team" headers */
	ai?:ValueTypes["AIQuery"],
getFilePutURL?: [{	fileInput: ValueTypes["FileInput"] | Variable<any, string>},ValueTypes["UploadFileResponse"]],
getFileURL?: [{	fileKey: string | Variable<any, string>},boolean | `@${string}`],
	apiKeys?:ValueTypes["APIKey"],
styleTemplate?: [{	styleTemplateId: string | Variable<any, string>},ValueTypes["StyleTemplate"]],
	styleTemplates?:ValueTypes["StyleTemplate"],
		__typename?: boolean | `@${string}`
}>;
	["Mutation"]: AliasType<{
createStyleTemplate?: [{	style: ValueTypes["CreateStyleTemplate"] | Variable<any, string>},boolean | `@${string}`],
editStyleTemplate?: [{	style: ValueTypes["EditStyleTemplate"] | Variable<any, string>,	_id: string | Variable<any, string>},boolean | `@${string}`],
deleteStyleTemplate?: [{	_id: string | Variable<any, string>},boolean | `@${string}`],
generateAPIKey?: [{	key: ValueTypes["CreateAPIKey"] | Variable<any, string>},boolean | `@${string}`],
deleteAPIKey?: [{	_id: string | Variable<any, string>},boolean | `@${string}`],
		__typename?: boolean | `@${string}`
}>;
	["CreateStyleTemplate"]: {
	name: string | Variable<any, string>,
	/** system message with variables preceded with $ sign
e.g. "Hello $name" */
	prompt: string | Variable<any, string>,
	negative_prompt: string | Variable<any, string>,
	description?: string | undefined | null | Variable<any, string>,
	variables: Array<string> | Variable<any, string>
};
	["EditStyleTemplate"]: {
	name?: string | undefined | null | Variable<any, string>,
	/** system message with variables preceded with $ sign
e.g. "Hello $name" */
	prompt?: string | undefined | null | Variable<any, string>,
	negative_prompt?: string | undefined | null | Variable<any, string>,
	description?: string | undefined | null | Variable<any, string>,
	variables?: Array<string> | undefined | null | Variable<any, string>
};
	["Vars"]:unknown;
	["FileInput"]: {
	fileKey: string | Variable<any, string>,
	contentType: string | Variable<any, string>
};
	["UploadFileResponse"]: AliasType<{
	fileKey?:boolean | `@${string}`,
	putUrl?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Text Generation Task:
Use to continue text from a prompt. This is a very generic task. */
["TextGenerationTask_Input"]: {
	/** The maximum number of tokens to generate in the completion. Max is 4096 */
	max_tokens?: number | undefined | null | Variable<any, string>,
	/** The temperature of the sampling operation. 1 means regular sampling, 0 means always take the highest score, 2.0 is getting closer to uniform probability. Default is 0.7 */
	temperature?: number | undefined | null | Variable<any, string>,
	/** Float to define the tokens that are within the sample operation of text generation. Add tokens in the sample for more probable to least probable until the sum of the probabilities is greater than top_p. */
	top_p?: number | undefined | null | Variable<any, string>,
	/** Number between -2.0 and 2.0. Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim. */
	frequency_penalty?: number | undefined | null | Variable<any, string>,
	/** Number between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear in the text so far, increasing the model's likelihood to talk about new topics. */
	presence_penalty?: number | undefined | null | Variable<any, string>
};
	["ImageGeneration_Input"]: {
	/** a string to be generated from */
	prompt: string | Variable<any, string>,
	negative_prompt?: string | undefined | null | Variable<any, string>,
	width?: number | undefined | null | Variable<any, string>,
	height?: number | undefined | null | Variable<any, string>,
	seed?: number | undefined | null | Variable<any, string>
};
	["AladirikImageEdition_Input"]: {
	/** a string to be generated from */
	prompt: string | Variable<any, string>,
	negative_prompt?: string | undefined | null | Variable<any, string>,
	width?: number | undefined | null | Variable<any, string>,
	height?: number | undefined | null | Variable<any, string>,
	random_seed?: number | undefined | null | Variable<any, string>,
	image?: string | undefined | null | Variable<any, string>,
	scheduler?: ValueTypes["SchedulerForAladirik"] | undefined | null | Variable<any, string>,
	max_tokens?: number | undefined | null | Variable<any, string>
};
	["ImageEdition_Input"]: {
	/** a string to be generated from */
	prompt: string | Variable<any, string>,
	negative_prompt?: string | undefined | null | Variable<any, string>,
	width?: number | undefined | null | Variable<any, string>,
	height?: number | undefined | null | Variable<any, string>,
	seed?: number | undefined | null | Variable<any, string>,
	image?: string | undefined | null | Variable<any, string>,
	scheduler?: ValueTypes["SchedulerFotTimothybrooks"] | undefined | null | Variable<any, string>,
	max_tokens?: number | undefined | null | Variable<any, string>
};
	["SchedulerFotTimothybrooks"]:SchedulerFotTimothybrooks;
	["SchedulerForAladirik"]:SchedulerForAladirik;
	["Image"]:unknown;
	/** Every generated image is stored on S3 Like back-end */
["GeneratedImage"]: AliasType<{
	createdAt?:boolean | `@${string}`,
	prompt?:boolean | `@${string}`,
	_id?:boolean | `@${string}`,
	creatorId?:boolean | `@${string}`,
	model?:boolean | `@${string}`,
	url?:boolean | `@${string}`,
	thumbnailUrl?:boolean | `@${string}`,
	placeholderBase64?:boolean | `@${string}`,
	key?:boolean | `@${string}`,
	thumbnailKey?:boolean | `@${string}`,
	imageType?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ImageType"]:ImageType;
	/** Filter for searching history of generated prompts and images */
["PromptFilter"]: {
	/** Date in ISO format */
	from?: string | undefined | null | Variable<any, string>,
	/** Date in ISO format */
	to?: string | undefined | null | Variable<any, string>,
	query?: string | undefined | null | Variable<any, string>
};
	["StyleTemplate"]: AliasType<{
	_id?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	/** system message with variables preceded with $ sign
e.g. "Hello $name" */
	prompt?:boolean | `@${string}`,
	negative_prompt?:boolean | `@${string}`,
	/** keys of the variables used in the message
e.g. ["name"] */
	description?:boolean | `@${string}`,
	variables?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** queries for different models responsible for image generation */
["ImageGenerationQuery"]: AliasType<{
anythingv4dot0?: [{	input: ValueTypes["ImageGeneration_Input"] | Variable<any, string>},boolean | `@${string}`],
stableDiffusion21?: [{	input: ValueTypes["ImageGeneration_Input"] | Variable<any, string>},boolean | `@${string}`],
openJourney?: [{	input: ValueTypes["ImageGeneration_Input"] | Variable<any, string>},boolean | `@${string}`],
dalle?: [{	input: ValueTypes["ImageGeneration_Input"] | Variable<any, string>},boolean | `@${string}`],
kandinsky2?: [{	input: ValueTypes["ImageGeneration_Input"] | Variable<any, string>},boolean | `@${string}`],
swinir?: [{	input: ValueTypes["ImageRestoration_Input"] | Variable<any, string>},boolean | `@${string}`],
qr2aiOutline?: [{	input: ValueTypes["ImageEdition_Input"] | Variable<any, string>},boolean | `@${string}`],
alaradirikDepthMidas?: [{	input: ValueTypes["AladirikImageEdition_Input"] | Variable<any, string>},boolean | `@${string}`],
alaradirikLineart?: [{	input: ValueTypes["AladirikImageEdition_Input"] | Variable<any, string>},boolean | `@${string}`],
timothybrooksPix2pix?: [{	input: ValueTypes["ImageEdition_Input"] | Variable<any, string>},boolean | `@${string}`],
		__typename?: boolean | `@${string}`
}>;
	["ImageRestoration_Input"]: {
	name: string | Variable<any, string>,
	fileURL: string | Variable<any, string>,
	taskType: ValueTypes["TaskType"] | Variable<any, string>
};
	["TaskType"]:TaskType;
	["ConversationalQuery"]: AliasType<{
chatGPT35Turbo?: [{	input: ValueTypes["GPT35_Input"] | Variable<any, string>},ValueTypes["GPT35_Response"]],
	/** Set of queries for isolated contexts */
	isolatedGPT35Turbo?:ValueTypes["IsolatedGPT35TurboQuery"],
	isolatedGPT35TurboMutation?:ValueTypes["IsolatedGPT35TurboMutation"],
	/** Set of queries for networks */
	isolatedNetworkOps?:ValueTypes["IsolatedGPTNetworkQuery"],
llamaV2?: [{	input: ValueTypes["LLamaV2Input"] | Variable<any, string>},boolean | `@${string}`],
		__typename?: boolean | `@${string}`
}>;
	["OngoingConversation"]: AliasType<{
	messages?:ValueTypes["ConversationMessage"],
	createdAt?:boolean | `@${string}`,
	_id?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ConversationMessage"]: AliasType<{
	message?:boolean | `@${string}`,
	role?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Dialog"]: AliasType<{
	_id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	contextId?:boolean | `@${string}`,
	creatorId?:boolean | `@${string}`,
	dialogName?:boolean | `@${string}`,
	messages?:ValueTypes["GPT35_MessageResponse"],
	editedContext?:ValueTypes["GPT35_MessageResponse"],
		__typename?: boolean | `@${string}`
}>;
	["TextDocument"]: AliasType<{
	content?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	_id?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["GPT35_Message"]: {
	content: string | Variable<any, string>,
	role: ValueTypes["GPT35_Role"] | Variable<any, string>
};
	["GPT35_Role"]:GPT35_Role;
	["GPT35_Input"]: {
	messages: Array<ValueTypes["GPT35_Message"]> | Variable<any, string>,
	user?: string | undefined | null | Variable<any, string>,
	options?: ValueTypes["TextGenerationTask_Input"] | undefined | null | Variable<any, string>
};
	["GPT35_MessageResponse"]: AliasType<{
	content?:boolean | `@${string}`,
	role?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["GPT35_Response"]: AliasType<{
	createdAt?:boolean | `@${string}`,
	message?:ValueTypes["GPT35_MessageResponse"],
		__typename?: boolean | `@${string}`
}>;
	["APIKey"]: AliasType<{
	name?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	_id?:boolean | `@${string}`,
	openAiKey?:boolean | `@${string}`,
	replicateKey?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["MongoStored"]:AliasType<{
		_id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`;
		['...on GeneratedImage']?: Omit<ValueTypes["GeneratedImage"],keyof ValueTypes["MongoStored"]>;
		['...on StyleTemplate']?: Omit<ValueTypes["StyleTemplate"],keyof ValueTypes["MongoStored"]>;
		['...on OngoingConversation']?: Omit<ValueTypes["OngoingConversation"],keyof ValueTypes["MongoStored"]>;
		['...on Dialog']?: Omit<ValueTypes["Dialog"],keyof ValueTypes["MongoStored"]>;
		['...on TextDocument']?: Omit<ValueTypes["TextDocument"],keyof ValueTypes["MongoStored"]>;
		['...on APIKey']?: Omit<ValueTypes["APIKey"],keyof ValueTypes["MongoStored"]>;
		['...on FineTuneJob']?: Omit<ValueTypes["FineTuneJob"],keyof ValueTypes["MongoStored"]>;
		['...on IsolatedContextNetwork']?: Omit<ValueTypes["IsolatedContextNetwork"],keyof ValueTypes["MongoStored"]>;
		__typename?: boolean | `@${string}`
}>;
	["AIQuery"]: AliasType<{
	/** queries responsible for generation of images */
	imageGeneration?:ValueTypes["ImageGenerationQuery"],
	/** All conversational queries */
	conversational?:ValueTypes["ConversationalQuery"],
	/** queries to fetch assets from backend */
	assets?:ValueTypes["AssetsQuery"],
		__typename?: boolean | `@${string}`
}>;
	["AssetsQuery"]: AliasType<{
images?: [{	creatorId?: string | undefined | null | Variable<any, string>,	promptFilter?: ValueTypes["PromptFilter"] | undefined | null | Variable<any, string>},ValueTypes["GeneratedImage"]],
	conversations?:ValueTypes["OngoingConversation"],
	textDocuments?:ValueTypes["TextDocument"],
removeImage?: [{	_id: string | Variable<any, string>},boolean | `@${string}`],
		__typename?: boolean | `@${string}`
}>;
	["CreateAPIKey"]: {
	name: string | Variable<any, string>,
	openAiKey: string | Variable<any, string>,
	replicateKey: string | Variable<any, string>
};
	/** Isolated conversation means that you will get conversation Id on the first call and then  */
["IsolatedGPT35TurboMutation"]: AliasType<{
createIsolatedContext?: [{	input: ValueTypes["CreateIsolatedContext"] | Variable<any, string>},boolean | `@${string}`],
fineTuningIsolatedContext?: [{	_id: string | Variable<any, string>},boolean | `@${string}`],
addDialog?: [{	input: ValueTypes["AddDialogInput"] | Variable<any, string>},boolean | `@${string}`],
updateDialog?: [{	_id: string | Variable<any, string>,	input: ValueTypes["UpdateDialogInput"] | Variable<any, string>},boolean | `@${string}`],
removeDialog?: [{	_id: string | Variable<any, string>},boolean | `@${string}`],
fineTuningWithFile?: [{	_id: string | Variable<any, string>,	file?: ValueTypes["FileInput"] | undefined | null | Variable<any, string>},boolean | `@${string}`],
deleteFineTuneModel?: [{	_id: string | Variable<any, string>},boolean | `@${string}`],
updateFineTuneModel?: [{	_id: string | Variable<any, string>,	model_name: string | Variable<any, string>},boolean | `@${string}`],
updateIsolatedContext?: [{	input: ValueTypes["UpdateIsolatedContext"] | Variable<any, string>,	_id: string | Variable<any, string>},boolean | `@${string}`],
removeIsolatedContext?: [{	_id: string | Variable<any, string>},boolean | `@${string}`],
		__typename?: boolean | `@${string}`
}>;
	["IsolatedGPT35TurboQuery"]: AliasType<{
	getFineTuneJobs?:ValueTypes["FineTuneJob"],
retrieveJob?: [{	_id?: string | undefined | null | Variable<any, string>},ValueTypes["FineTuneJob"]],
useIsolatedContext?: [{	input: ValueTypes["GPT35_Input"] | Variable<any, string>,	useOwnModel?: boolean | undefined | null | Variable<any, string>,	contextId: string | Variable<any, string>,	dialogId?: string | undefined | null | Variable<any, string>},ValueTypes["GPT35_Response"]],
previewIsolatedContext?: [{	_id: string | Variable<any, string>},ValueTypes["IsolatedConversationalContext"]],
	listIsolatedContexts?:ValueTypes["IsolatedConversationalContext"],
	listDialogs?:ValueTypes["Dialog"],
chatGPT35TurboInformationFeed?: [{	input: ValueTypes["GPT35_Input"] | Variable<any, string>},ValueTypes["GPT35_Response"]],
		__typename?: boolean | `@${string}`
}>;
	["IsolatedConversationalContext"]: AliasType<{
	messages?:ValueTypes["GPT35_MessageResponse"],
	createdAt?:boolean | `@${string}`,
	_id?:boolean | `@${string}`,
	creatorId?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	options?:ValueTypes["TextGenerationTask"],
	ftModel?:boolean | `@${string}`,
	testDialogs?:ValueTypes["Dialog"],
		__typename?: boolean | `@${string}`
}>;
	["TextGenerationTask"]: AliasType<{
	/** The maximum number of tokens to generate in the completion. Max is 4096 */
	max_tokens?:boolean | `@${string}`,
	/** The temperature of the sampling operation. 1 means regular sampling, 0 means always take the highest score, 2.0 is getting closer to uniform probability. Default is 0.7 */
	temperature?:boolean | `@${string}`,
	/** Float to define the tokens that are within the sample operation of text generation. Add tokens in the sample for more probable to least probable until the sum of the probabilities is greater than top_p. */
	top_p?:boolean | `@${string}`,
	/** Number between -2.0 and 2.0. Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim. */
	frequency_penalty?:boolean | `@${string}`,
	/** Number between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear in the text so far, increasing the model's likelihood to talk about new topics. */
	presence_penalty?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["CreateIsolatedContext"]: {
	gpt: ValueTypes["GPT35_Input"] | Variable<any, string>,
	name: string | Variable<any, string>
};
	["AddDialogInput"]: {
	messages: Array<ValueTypes["GPT35_Message"]> | Variable<any, string>,
	editedContext?: Array<ValueTypes["GPT35_Message"]> | undefined | null | Variable<any, string>,
	dialogName: string | Variable<any, string>,
	contextId: string | Variable<any, string>
};
	["UpdateDialogInput"]: {
	messages?: Array<ValueTypes["GPT35_Message"]> | undefined | null | Variable<any, string>,
	editedContext?: Array<ValueTypes["GPT35_Message"]> | undefined | null | Variable<any, string>,
	dialogName?: string | undefined | null | Variable<any, string>,
	contextId?: string | undefined | null | Variable<any, string>
};
	["UpdateIsolatedContext"]: {
	gpt?: ValueTypes["GPT35_Input"] | undefined | null | Variable<any, string>,
	name?: string | undefined | null | Variable<any, string>
};
	["FineTuneJob"]: AliasType<{
	_id?:boolean | `@${string}`,
	contextId?:boolean | `@${string}`,
	contextName?:boolean | `@${string}`,
	job_id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	training_file_id?:boolean | `@${string}`,
	model_name?:boolean | `@${string}`,
	model_id?:boolean | `@${string}`,
	status?:boolean | `@${string}`,
	org_id?:boolean | `@${string}`,
	n_epochs?:boolean | `@${string}`,
	job_error?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["IsolatedContextNetwork"]: AliasType<{
	contexts?:ValueTypes["IsolatedConversationalContext"],
	_id?:boolean | `@${string}`,
	creatorId?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	networks?:ValueTypes["IsolatedContextNetwork"],
	name?:boolean | `@${string}`,
	system?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["CreateIsolatedNetwork"]: {
	contexts?: Array<string> | undefined | null | Variable<any, string>,
	networks?: Array<string> | undefined | null | Variable<any, string>,
	name: string | Variable<any, string>,
	system?: string | undefined | null | Variable<any, string>
};
	["IsolatedGPTNetworkQuery"]: AliasType<{
createIsolatedNetwork?: [{	network: ValueTypes["CreateIsolatedNetwork"] | Variable<any, string>},boolean | `@${string}`],
removeIsolatedNetwork?: [{	_id: string | Variable<any, string>},boolean | `@${string}`],
	listIsolatedNetworks?:ValueTypes["IsolatedContextNetwork"],
queryIsolatedNetwork?: [{	_id: string | Variable<any, string>,	input: ValueTypes["GPT35_Input"] | Variable<any, string>,	/** When in test mode, query will reply with answers from all contexts. when test mode is off (deafault) You will get the best answer only */
	testMode?: boolean | undefined | null | Variable<any, string>},ValueTypes["NetworkResponse"]],
updateIsolatedNetwork?: [{	_id: string | Variable<any, string>,	network: ValueTypes["UpdateIsolatedNetwork"] | Variable<any, string>},boolean | `@${string}`],
previewIsolatedNetwork?: [{	_id: string | Variable<any, string>},ValueTypes["IsolatedContextNetwork"]],
		__typename?: boolean | `@${string}`
}>;
	["UpdateIsolatedNetwork"]: {
	contexts?: Array<string> | undefined | null | Variable<any, string>,
	networks?: Array<string> | undefined | null | Variable<any, string>,
	name?: string | undefined | null | Variable<any, string>,
	system?: string | undefined | null | Variable<any, string>
};
	/** Response from gpt network */
["NetworkResponse"]: AliasType<{
	/** Response from orchestrator */
	gpt?:ValueTypes["GPT35_Response"],
	/** response with raw data same as received by network orchestrator */
	rawResponse?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["FineTuneJobStatus"]:FineTuneJobStatus;
	["LLamaV2Input"]: {
	userMessage: string | Variable<any, string>,
	options?: ValueTypes["LLamaV2_Options"] | undefined | null | Variable<any, string>
};
	/** LLama v2 Options */
["LLamaV2_Options"]: {
	/** The maximum number of tokens to generate in the completion. Max is 4096 */
	max_length?: number | undefined | null | Variable<any, string>,
	/** The temperature of the sampling operation. 1 means regular sampling, 0 means always take the highest score, 2.0 is getting closer to uniform probability. Default is 0.7 */
	temperature?: number | undefined | null | Variable<any, string>,
	/** Float to define the tokens that are within the sample operation of text generation. Add tokens in the sample for more probable to least probable until the sum of the probabilities is greater than top_p. */
	top_p?: number | undefined | null | Variable<any, string>,
	/** Number between -2.0 and 2.0. Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim. */
	repetition_penalty?: number | undefined | null | Variable<any, string>
}
  }

export type ResolverInputTypes = {
    /** Main query */
["Query"]: AliasType<{
	/** query to use with "Key" and "Team" headers */
	ai?:ResolverInputTypes["AIQuery"],
getFilePutURL?: [{	fileInput: ResolverInputTypes["FileInput"]},ResolverInputTypes["UploadFileResponse"]],
getFileURL?: [{	fileKey: string},boolean | `@${string}`],
	apiKeys?:ResolverInputTypes["APIKey"],
styleTemplate?: [{	styleTemplateId: string},ResolverInputTypes["StyleTemplate"]],
	styleTemplates?:ResolverInputTypes["StyleTemplate"],
		__typename?: boolean | `@${string}`
}>;
	["Mutation"]: AliasType<{
createStyleTemplate?: [{	style: ResolverInputTypes["CreateStyleTemplate"]},boolean | `@${string}`],
editStyleTemplate?: [{	style: ResolverInputTypes["EditStyleTemplate"],	_id: string},boolean | `@${string}`],
deleteStyleTemplate?: [{	_id: string},boolean | `@${string}`],
generateAPIKey?: [{	key: ResolverInputTypes["CreateAPIKey"]},boolean | `@${string}`],
deleteAPIKey?: [{	_id: string},boolean | `@${string}`],
		__typename?: boolean | `@${string}`
}>;
	["CreateStyleTemplate"]: {
	name: string,
	/** system message with variables preceded with $ sign
e.g. "Hello $name" */
	prompt: string,
	negative_prompt: string,
	description?: string | undefined | null,
	variables: Array<string>
};
	["EditStyleTemplate"]: {
	name?: string | undefined | null,
	/** system message with variables preceded with $ sign
e.g. "Hello $name" */
	prompt?: string | undefined | null,
	negative_prompt?: string | undefined | null,
	description?: string | undefined | null,
	variables?: Array<string> | undefined | null
};
	["Vars"]:unknown;
	["FileInput"]: {
	fileKey: string,
	contentType: string
};
	["UploadFileResponse"]: AliasType<{
	fileKey?:boolean | `@${string}`,
	putUrl?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Text Generation Task:
Use to continue text from a prompt. This is a very generic task. */
["TextGenerationTask_Input"]: {
	/** The maximum number of tokens to generate in the completion. Max is 4096 */
	max_tokens?: number | undefined | null,
	/** The temperature of the sampling operation. 1 means regular sampling, 0 means always take the highest score, 2.0 is getting closer to uniform probability. Default is 0.7 */
	temperature?: number | undefined | null,
	/** Float to define the tokens that are within the sample operation of text generation. Add tokens in the sample for more probable to least probable until the sum of the probabilities is greater than top_p. */
	top_p?: number | undefined | null,
	/** Number between -2.0 and 2.0. Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim. */
	frequency_penalty?: number | undefined | null,
	/** Number between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear in the text so far, increasing the model's likelihood to talk about new topics. */
	presence_penalty?: number | undefined | null
};
	["ImageGeneration_Input"]: {
	/** a string to be generated from */
	prompt: string,
	negative_prompt?: string | undefined | null,
	width?: number | undefined | null,
	height?: number | undefined | null,
	seed?: number | undefined | null
};
	["AladirikImageEdition_Input"]: {
	/** a string to be generated from */
	prompt: string,
	negative_prompt?: string | undefined | null,
	width?: number | undefined | null,
	height?: number | undefined | null,
	random_seed?: number | undefined | null,
	image?: string | undefined | null,
	scheduler?: ResolverInputTypes["SchedulerForAladirik"] | undefined | null,
	max_tokens?: number | undefined | null
};
	["ImageEdition_Input"]: {
	/** a string to be generated from */
	prompt: string,
	negative_prompt?: string | undefined | null,
	width?: number | undefined | null,
	height?: number | undefined | null,
	seed?: number | undefined | null,
	image?: string | undefined | null,
	scheduler?: ResolverInputTypes["SchedulerFotTimothybrooks"] | undefined | null,
	max_tokens?: number | undefined | null
};
	["SchedulerFotTimothybrooks"]:SchedulerFotTimothybrooks;
	["SchedulerForAladirik"]:SchedulerForAladirik;
	["Image"]:unknown;
	/** Every generated image is stored on S3 Like back-end */
["GeneratedImage"]: AliasType<{
	createdAt?:boolean | `@${string}`,
	prompt?:boolean | `@${string}`,
	_id?:boolean | `@${string}`,
	creatorId?:boolean | `@${string}`,
	model?:boolean | `@${string}`,
	url?:boolean | `@${string}`,
	thumbnailUrl?:boolean | `@${string}`,
	placeholderBase64?:boolean | `@${string}`,
	key?:boolean | `@${string}`,
	thumbnailKey?:boolean | `@${string}`,
	imageType?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ImageType"]:ImageType;
	/** Filter for searching history of generated prompts and images */
["PromptFilter"]: {
	/** Date in ISO format */
	from?: string | undefined | null,
	/** Date in ISO format */
	to?: string | undefined | null,
	query?: string | undefined | null
};
	["StyleTemplate"]: AliasType<{
	_id?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	/** system message with variables preceded with $ sign
e.g. "Hello $name" */
	prompt?:boolean | `@${string}`,
	negative_prompt?:boolean | `@${string}`,
	/** keys of the variables used in the message
e.g. ["name"] */
	description?:boolean | `@${string}`,
	variables?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** queries for different models responsible for image generation */
["ImageGenerationQuery"]: AliasType<{
anythingv4dot0?: [{	input: ResolverInputTypes["ImageGeneration_Input"]},boolean | `@${string}`],
stableDiffusion21?: [{	input: ResolverInputTypes["ImageGeneration_Input"]},boolean | `@${string}`],
openJourney?: [{	input: ResolverInputTypes["ImageGeneration_Input"]},boolean | `@${string}`],
dalle?: [{	input: ResolverInputTypes["ImageGeneration_Input"]},boolean | `@${string}`],
kandinsky2?: [{	input: ResolverInputTypes["ImageGeneration_Input"]},boolean | `@${string}`],
swinir?: [{	input: ResolverInputTypes["ImageRestoration_Input"]},boolean | `@${string}`],
qr2aiOutline?: [{	input: ResolverInputTypes["ImageEdition_Input"]},boolean | `@${string}`],
alaradirikDepthMidas?: [{	input: ResolverInputTypes["AladirikImageEdition_Input"]},boolean | `@${string}`],
alaradirikLineart?: [{	input: ResolverInputTypes["AladirikImageEdition_Input"]},boolean | `@${string}`],
timothybrooksPix2pix?: [{	input: ResolverInputTypes["ImageEdition_Input"]},boolean | `@${string}`],
		__typename?: boolean | `@${string}`
}>;
	["ImageRestoration_Input"]: {
	name: string,
	fileURL: string,
	taskType: ResolverInputTypes["TaskType"]
};
	["TaskType"]:TaskType;
	["ConversationalQuery"]: AliasType<{
chatGPT35Turbo?: [{	input: ResolverInputTypes["GPT35_Input"]},ResolverInputTypes["GPT35_Response"]],
	/** Set of queries for isolated contexts */
	isolatedGPT35Turbo?:ResolverInputTypes["IsolatedGPT35TurboQuery"],
	isolatedGPT35TurboMutation?:ResolverInputTypes["IsolatedGPT35TurboMutation"],
	/** Set of queries for networks */
	isolatedNetworkOps?:ResolverInputTypes["IsolatedGPTNetworkQuery"],
llamaV2?: [{	input: ResolverInputTypes["LLamaV2Input"]},boolean | `@${string}`],
		__typename?: boolean | `@${string}`
}>;
	["OngoingConversation"]: AliasType<{
	messages?:ResolverInputTypes["ConversationMessage"],
	createdAt?:boolean | `@${string}`,
	_id?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ConversationMessage"]: AliasType<{
	message?:boolean | `@${string}`,
	role?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Dialog"]: AliasType<{
	_id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	contextId?:boolean | `@${string}`,
	creatorId?:boolean | `@${string}`,
	dialogName?:boolean | `@${string}`,
	messages?:ResolverInputTypes["GPT35_MessageResponse"],
	editedContext?:ResolverInputTypes["GPT35_MessageResponse"],
		__typename?: boolean | `@${string}`
}>;
	["TextDocument"]: AliasType<{
	content?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	_id?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["GPT35_Message"]: {
	content: string,
	role: ResolverInputTypes["GPT35_Role"]
};
	["GPT35_Role"]:GPT35_Role;
	["GPT35_Input"]: {
	messages: Array<ResolverInputTypes["GPT35_Message"]>,
	user?: string | undefined | null,
	options?: ResolverInputTypes["TextGenerationTask_Input"] | undefined | null
};
	["GPT35_MessageResponse"]: AliasType<{
	content?:boolean | `@${string}`,
	role?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["GPT35_Response"]: AliasType<{
	createdAt?:boolean | `@${string}`,
	message?:ResolverInputTypes["GPT35_MessageResponse"],
		__typename?: boolean | `@${string}`
}>;
	["APIKey"]: AliasType<{
	name?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	_id?:boolean | `@${string}`,
	openAiKey?:boolean | `@${string}`,
	replicateKey?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["MongoStored"]:AliasType<{
		_id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`;
		['...on GeneratedImage']?: Omit<ResolverInputTypes["GeneratedImage"],keyof ResolverInputTypes["MongoStored"]>;
		['...on StyleTemplate']?: Omit<ResolverInputTypes["StyleTemplate"],keyof ResolverInputTypes["MongoStored"]>;
		['...on OngoingConversation']?: Omit<ResolverInputTypes["OngoingConversation"],keyof ResolverInputTypes["MongoStored"]>;
		['...on Dialog']?: Omit<ResolverInputTypes["Dialog"],keyof ResolverInputTypes["MongoStored"]>;
		['...on TextDocument']?: Omit<ResolverInputTypes["TextDocument"],keyof ResolverInputTypes["MongoStored"]>;
		['...on APIKey']?: Omit<ResolverInputTypes["APIKey"],keyof ResolverInputTypes["MongoStored"]>;
		['...on FineTuneJob']?: Omit<ResolverInputTypes["FineTuneJob"],keyof ResolverInputTypes["MongoStored"]>;
		['...on IsolatedContextNetwork']?: Omit<ResolverInputTypes["IsolatedContextNetwork"],keyof ResolverInputTypes["MongoStored"]>;
		__typename?: boolean | `@${string}`
}>;
	["AIQuery"]: AliasType<{
	/** queries responsible for generation of images */
	imageGeneration?:ResolverInputTypes["ImageGenerationQuery"],
	/** All conversational queries */
	conversational?:ResolverInputTypes["ConversationalQuery"],
	/** queries to fetch assets from backend */
	assets?:ResolverInputTypes["AssetsQuery"],
		__typename?: boolean | `@${string}`
}>;
	["AssetsQuery"]: AliasType<{
images?: [{	creatorId?: string | undefined | null,	promptFilter?: ResolverInputTypes["PromptFilter"] | undefined | null},ResolverInputTypes["GeneratedImage"]],
	conversations?:ResolverInputTypes["OngoingConversation"],
	textDocuments?:ResolverInputTypes["TextDocument"],
removeImage?: [{	_id: string},boolean | `@${string}`],
		__typename?: boolean | `@${string}`
}>;
	["CreateAPIKey"]: {
	name: string,
	openAiKey: string,
	replicateKey: string
};
	/** Isolated conversation means that you will get conversation Id on the first call and then  */
["IsolatedGPT35TurboMutation"]: AliasType<{
createIsolatedContext?: [{	input: ResolverInputTypes["CreateIsolatedContext"]},boolean | `@${string}`],
fineTuningIsolatedContext?: [{	_id: string},boolean | `@${string}`],
addDialog?: [{	input: ResolverInputTypes["AddDialogInput"]},boolean | `@${string}`],
updateDialog?: [{	_id: string,	input: ResolverInputTypes["UpdateDialogInput"]},boolean | `@${string}`],
removeDialog?: [{	_id: string},boolean | `@${string}`],
fineTuningWithFile?: [{	_id: string,	file?: ResolverInputTypes["FileInput"] | undefined | null},boolean | `@${string}`],
deleteFineTuneModel?: [{	_id: string},boolean | `@${string}`],
updateFineTuneModel?: [{	_id: string,	model_name: string},boolean | `@${string}`],
updateIsolatedContext?: [{	input: ResolverInputTypes["UpdateIsolatedContext"],	_id: string},boolean | `@${string}`],
removeIsolatedContext?: [{	_id: string},boolean | `@${string}`],
		__typename?: boolean | `@${string}`
}>;
	["IsolatedGPT35TurboQuery"]: AliasType<{
	getFineTuneJobs?:ResolverInputTypes["FineTuneJob"],
retrieveJob?: [{	_id?: string | undefined | null},ResolverInputTypes["FineTuneJob"]],
useIsolatedContext?: [{	input: ResolverInputTypes["GPT35_Input"],	useOwnModel?: boolean | undefined | null,	contextId: string,	dialogId?: string | undefined | null},ResolverInputTypes["GPT35_Response"]],
previewIsolatedContext?: [{	_id: string},ResolverInputTypes["IsolatedConversationalContext"]],
	listIsolatedContexts?:ResolverInputTypes["IsolatedConversationalContext"],
	listDialogs?:ResolverInputTypes["Dialog"],
chatGPT35TurboInformationFeed?: [{	input: ResolverInputTypes["GPT35_Input"]},ResolverInputTypes["GPT35_Response"]],
		__typename?: boolean | `@${string}`
}>;
	["IsolatedConversationalContext"]: AliasType<{
	messages?:ResolverInputTypes["GPT35_MessageResponse"],
	createdAt?:boolean | `@${string}`,
	_id?:boolean | `@${string}`,
	creatorId?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	options?:ResolverInputTypes["TextGenerationTask"],
	ftModel?:boolean | `@${string}`,
	testDialogs?:ResolverInputTypes["Dialog"],
		__typename?: boolean | `@${string}`
}>;
	["TextGenerationTask"]: AliasType<{
	/** The maximum number of tokens to generate in the completion. Max is 4096 */
	max_tokens?:boolean | `@${string}`,
	/** The temperature of the sampling operation. 1 means regular sampling, 0 means always take the highest score, 2.0 is getting closer to uniform probability. Default is 0.7 */
	temperature?:boolean | `@${string}`,
	/** Float to define the tokens that are within the sample operation of text generation. Add tokens in the sample for more probable to least probable until the sum of the probabilities is greater than top_p. */
	top_p?:boolean | `@${string}`,
	/** Number between -2.0 and 2.0. Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim. */
	frequency_penalty?:boolean | `@${string}`,
	/** Number between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear in the text so far, increasing the model's likelihood to talk about new topics. */
	presence_penalty?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["CreateIsolatedContext"]: {
	gpt: ResolverInputTypes["GPT35_Input"],
	name: string
};
	["AddDialogInput"]: {
	messages: Array<ResolverInputTypes["GPT35_Message"]>,
	editedContext?: Array<ResolverInputTypes["GPT35_Message"]> | undefined | null,
	dialogName: string,
	contextId: string
};
	["UpdateDialogInput"]: {
	messages?: Array<ResolverInputTypes["GPT35_Message"]> | undefined | null,
	editedContext?: Array<ResolverInputTypes["GPT35_Message"]> | undefined | null,
	dialogName?: string | undefined | null,
	contextId?: string | undefined | null
};
	["UpdateIsolatedContext"]: {
	gpt?: ResolverInputTypes["GPT35_Input"] | undefined | null,
	name?: string | undefined | null
};
	["FineTuneJob"]: AliasType<{
	_id?:boolean | `@${string}`,
	contextId?:boolean | `@${string}`,
	contextName?:boolean | `@${string}`,
	job_id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	training_file_id?:boolean | `@${string}`,
	model_name?:boolean | `@${string}`,
	model_id?:boolean | `@${string}`,
	status?:boolean | `@${string}`,
	org_id?:boolean | `@${string}`,
	n_epochs?:boolean | `@${string}`,
	job_error?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["IsolatedContextNetwork"]: AliasType<{
	contexts?:ResolverInputTypes["IsolatedConversationalContext"],
	_id?:boolean | `@${string}`,
	creatorId?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	networks?:ResolverInputTypes["IsolatedContextNetwork"],
	name?:boolean | `@${string}`,
	system?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["CreateIsolatedNetwork"]: {
	contexts?: Array<string> | undefined | null,
	networks?: Array<string> | undefined | null,
	name: string,
	system?: string | undefined | null
};
	["IsolatedGPTNetworkQuery"]: AliasType<{
createIsolatedNetwork?: [{	network: ResolverInputTypes["CreateIsolatedNetwork"]},boolean | `@${string}`],
removeIsolatedNetwork?: [{	_id: string},boolean | `@${string}`],
	listIsolatedNetworks?:ResolverInputTypes["IsolatedContextNetwork"],
queryIsolatedNetwork?: [{	_id: string,	input: ResolverInputTypes["GPT35_Input"],	/** When in test mode, query will reply with answers from all contexts. when test mode is off (deafault) You will get the best answer only */
	testMode?: boolean | undefined | null},ResolverInputTypes["NetworkResponse"]],
updateIsolatedNetwork?: [{	_id: string,	network: ResolverInputTypes["UpdateIsolatedNetwork"]},boolean | `@${string}`],
previewIsolatedNetwork?: [{	_id: string},ResolverInputTypes["IsolatedContextNetwork"]],
		__typename?: boolean | `@${string}`
}>;
	["UpdateIsolatedNetwork"]: {
	contexts?: Array<string> | undefined | null,
	networks?: Array<string> | undefined | null,
	name?: string | undefined | null,
	system?: string | undefined | null
};
	/** Response from gpt network */
["NetworkResponse"]: AliasType<{
	/** Response from orchestrator */
	gpt?:ResolverInputTypes["GPT35_Response"],
	/** response with raw data same as received by network orchestrator */
	rawResponse?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["FineTuneJobStatus"]:FineTuneJobStatus;
	["LLamaV2Input"]: {
	userMessage: string,
	options?: ResolverInputTypes["LLamaV2_Options"] | undefined | null
};
	/** LLama v2 Options */
["LLamaV2_Options"]: {
	/** The maximum number of tokens to generate in the completion. Max is 4096 */
	max_length?: number | undefined | null,
	/** The temperature of the sampling operation. 1 means regular sampling, 0 means always take the highest score, 2.0 is getting closer to uniform probability. Default is 0.7 */
	temperature?: number | undefined | null,
	/** Float to define the tokens that are within the sample operation of text generation. Add tokens in the sample for more probable to least probable until the sum of the probabilities is greater than top_p. */
	top_p?: number | undefined | null,
	/** Number between -2.0 and 2.0. Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim. */
	repetition_penalty?: number | undefined | null
};
	["schema"]: AliasType<{
	query?:ResolverInputTypes["Query"],
	mutation?:ResolverInputTypes["Mutation"],
		__typename?: boolean | `@${string}`
}>
  }

export type ModelTypes = {
    /** Main query */
["Query"]: {
		/** query to use with "Key" and "Team" headers */
	ai: ModelTypes["AIQuery"],
	getFilePutURL: ModelTypes["UploadFileResponse"],
	getFileURL?: string | undefined,
	apiKeys?: Array<ModelTypes["APIKey"]> | undefined,
	styleTemplate?: ModelTypes["StyleTemplate"] | undefined,
	styleTemplates?: Array<ModelTypes["StyleTemplate"]> | undefined
};
	["Mutation"]: {
		createStyleTemplate: string,
	editStyleTemplate?: boolean | undefined,
	deleteStyleTemplate?: boolean | undefined,
	generateAPIKey: string,
	/** Delete and revokes the API Key. */
	deleteAPIKey?: boolean | undefined
};
	["CreateStyleTemplate"]: {
	name: string,
	/** system message with variables preceded with $ sign
e.g. "Hello $name" */
	prompt: string,
	negative_prompt: string,
	description?: string | undefined,
	variables: Array<string>
};
	["EditStyleTemplate"]: {
	name?: string | undefined,
	/** system message with variables preceded with $ sign
e.g. "Hello $name" */
	prompt?: string | undefined,
	negative_prompt?: string | undefined,
	description?: string | undefined,
	variables?: Array<string> | undefined
};
	["Vars"]:any;
	["FileInput"]: {
	fileKey: string,
	contentType: string
};
	["UploadFileResponse"]: {
		fileKey: string,
	putUrl: string
};
	/** Text Generation Task:
Use to continue text from a prompt. This is a very generic task. */
["TextGenerationTask_Input"]: {
	/** The maximum number of tokens to generate in the completion. Max is 4096 */
	max_tokens?: number | undefined,
	/** The temperature of the sampling operation. 1 means regular sampling, 0 means always take the highest score, 2.0 is getting closer to uniform probability. Default is 0.7 */
	temperature?: number | undefined,
	/** Float to define the tokens that are within the sample operation of text generation. Add tokens in the sample for more probable to least probable until the sum of the probabilities is greater than top_p. */
	top_p?: number | undefined,
	/** Number between -2.0 and 2.0. Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim. */
	frequency_penalty?: number | undefined,
	/** Number between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear in the text so far, increasing the model's likelihood to talk about new topics. */
	presence_penalty?: number | undefined
};
	["ImageGeneration_Input"]: {
	/** a string to be generated from */
	prompt: string,
	negative_prompt?: string | undefined,
	width?: number | undefined,
	height?: number | undefined,
	seed?: number | undefined
};
	["AladirikImageEdition_Input"]: {
	/** a string to be generated from */
	prompt: string,
	negative_prompt?: string | undefined,
	width?: number | undefined,
	height?: number | undefined,
	random_seed?: number | undefined,
	image?: string | undefined,
	scheduler?: ModelTypes["SchedulerForAladirik"] | undefined,
	max_tokens?: number | undefined
};
	["ImageEdition_Input"]: {
	/** a string to be generated from */
	prompt: string,
	negative_prompt?: string | undefined,
	width?: number | undefined,
	height?: number | undefined,
	seed?: number | undefined,
	image?: string | undefined,
	scheduler?: ModelTypes["SchedulerFotTimothybrooks"] | undefined,
	max_tokens?: number | undefined
};
	["SchedulerFotTimothybrooks"]:SchedulerFotTimothybrooks;
	["SchedulerForAladirik"]:SchedulerForAladirik;
	["Image"]:any;
	/** Every generated image is stored on S3 Like back-end */
["GeneratedImage"]: {
		createdAt: string,
	prompt: string,
	_id: string,
	creatorId?: string | undefined,
	model?: string | undefined,
	url?: string | undefined,
	thumbnailUrl?: string | undefined,
	placeholderBase64?: string | undefined,
	key: string,
	thumbnailKey?: string | undefined,
	imageType?: ModelTypes["ImageType"] | undefined
};
	["ImageType"]:ImageType;
	/** Filter for searching history of generated prompts and images */
["PromptFilter"]: {
	/** Date in ISO format */
	from?: string | undefined,
	/** Date in ISO format */
	to?: string | undefined,
	query?: string | undefined
};
	["StyleTemplate"]: {
		_id: string,
	name: string,
	/** system message with variables preceded with $ sign
e.g. "Hello $name" */
	prompt: string,
	negative_prompt: string,
	/** keys of the variables used in the message
e.g. ["name"] */
	description?: string | undefined,
	variables: Array<string>,
	createdAt: string
};
	/** queries for different models responsible for image generation */
["ImageGenerationQuery"]: {
		/** ## Model Description

Welcome to Anything V4 - a latent diffusion model for weebs. 
The newest version of Anything. This model is intended to produce high-quality, highly detailed anime style 
with just a few prompts. Like other anime-style Stable Diffusion models, 
it also supports danbooru tags to generate images.

e.g. 1girl, white hair, golden eyes, beautiful eyes, detail, flower meadow, cumulonimbus clouds, lighting, 
detailed sky, garden */
	anythingv4dot0: ModelTypes["Image"],
	/** ## Model Description

This is a model that can be used to generate and modify images based on text prompts. 
It is a Latent Diffusion Model that uses a fixed, pretrained text encoder (OpenCLIP-ViT/H). */
	stableDiffusion21: ModelTypes["Image"],
	/** ## Model Description

Openjourney is an open source Stable Diffusion fine tuned model on Midjourney images, by PromptHero */
	openJourney: ModelTypes["Image"],
	/** ## Model Description

Dalle is a first class model from OpenAI */
	dalle: ModelTypes["Image"],
	/** ## Model Description

text2img model trained on LAION HighRes and fine-tuned on internal datasets */
	kandinsky2: ModelTypes["Image"],
	/** ## Model Description

Image Restoration Using Swin Transformer */
	swinir: ModelTypes["Image"],
	/** ## Models Description

Models for Archrenderer */
	qr2aiOutline: ModelTypes["Image"],
	alaradirikDepthMidas: ModelTypes["Image"],
	alaradirikLineart: ModelTypes["Image"],
	timothybrooksPix2pix: ModelTypes["Image"]
};
	["ImageRestoration_Input"]: {
	name: string,
	fileURL: string,
	taskType: ModelTypes["TaskType"]
};
	["TaskType"]:TaskType;
	["ConversationalQuery"]: {
		/** Receive immediate response from GTP 35 turbo API */
	chatGPT35Turbo: ModelTypes["GPT35_Response"],
	/** Set of queries for isolated contexts */
	isolatedGPT35Turbo: ModelTypes["IsolatedGPT35TurboQuery"],
	isolatedGPT35TurboMutation: ModelTypes["IsolatedGPT35TurboMutation"],
	/** Set of queries for networks */
	isolatedNetworkOps: ModelTypes["IsolatedGPTNetworkQuery"],
	llamaV2?: string | undefined
};
	["OngoingConversation"]: {
		messages: Array<ModelTypes["ConversationMessage"]>,
	createdAt: string,
	_id: string
};
	["ConversationMessage"]: {
		message: string,
	role: string,
	createdAt: string
};
	["Dialog"]: {
		_id: string,
	createdAt: string,
	updatedAt: string,
	contextId: string,
	creatorId?: string | undefined,
	dialogName: string,
	messages?: Array<ModelTypes["GPT35_MessageResponse"]> | undefined,
	editedContext?: Array<ModelTypes["GPT35_MessageResponse"]> | undefined
};
	["TextDocument"]: {
		content: string,
	createdAt: string,
	updatedAt: string,
	_id: string
};
	["GPT35_Message"]: {
	content: string,
	role: ModelTypes["GPT35_Role"]
};
	["GPT35_Role"]:GPT35_Role;
	["GPT35_Input"]: {
	messages: Array<ModelTypes["GPT35_Message"]>,
	user?: string | undefined,
	options?: ModelTypes["TextGenerationTask_Input"] | undefined
};
	["GPT35_MessageResponse"]: {
		content: string,
	role: ModelTypes["GPT35_Role"]
};
	["GPT35_Response"]: {
		createdAt: string,
	message: ModelTypes["GPT35_MessageResponse"]
};
	["APIKey"]: {
		name: string,
	createdAt: string,
	_id: string,
	openAiKey: string,
	replicateKey: string
};
	["MongoStored"]: ModelTypes["GeneratedImage"] | ModelTypes["StyleTemplate"] | ModelTypes["OngoingConversation"] | ModelTypes["Dialog"] | ModelTypes["TextDocument"] | ModelTypes["APIKey"] | ModelTypes["FineTuneJob"] | ModelTypes["IsolatedContextNetwork"];
	["AIQuery"]: {
		/** queries responsible for generation of images */
	imageGeneration: ModelTypes["ImageGenerationQuery"],
	/** All conversational queries */
	conversational: ModelTypes["ConversationalQuery"],
	/** queries to fetch assets from backend */
	assets: ModelTypes["AssetsQuery"]
};
	["AssetsQuery"]: {
		/** Images generated from multiple image models, stored in S3 Digital Ocean Spaces. */
	images?: Array<ModelTypes["GeneratedImage"]> | undefined,
	conversations?: Array<ModelTypes["OngoingConversation"]> | undefined,
	textDocuments?: Array<ModelTypes["TextDocument"]> | undefined,
	removeImage?: boolean | undefined
};
	["CreateAPIKey"]: {
	name: string,
	openAiKey: string,
	replicateKey: string
};
	/** Isolated conversation means that you will get conversation Id on the first call and then  */
["IsolatedGPT35TurboMutation"]: {
		createIsolatedContext: string,
	/** use context created with createIsolatedContext. Useful for creating knowledge bases */
	fineTuningIsolatedContext: string,
	addDialog: string,
	updateDialog: boolean,
	removeDialog: boolean,
	fineTuningWithFile: string,
	deleteFineTuneModel: boolean,
	updateFineTuneModel: boolean,
	updateIsolatedContext?: boolean | undefined,
	removeIsolatedContext?: boolean | undefined
};
	["IsolatedGPT35TurboQuery"]: {
		getFineTuneJobs?: Array<ModelTypes["FineTuneJob"]> | undefined,
	retrieveJob: ModelTypes["FineTuneJob"],
	useIsolatedContext: ModelTypes["GPT35_Response"],
	previewIsolatedContext: ModelTypes["IsolatedConversationalContext"],
	listIsolatedContexts: Array<ModelTypes["IsolatedConversationalContext"]>,
	listDialogs?: Array<ModelTypes["Dialog"]> | undefined,
	/** This is used for feeding the information to GPT contexts and this is its only function */
	chatGPT35TurboInformationFeed: ModelTypes["GPT35_Response"]
};
	["IsolatedConversationalContext"]: {
		messages: Array<ModelTypes["GPT35_MessageResponse"]>,
	createdAt: string,
	_id: string,
	creatorId?: string | undefined,
	name: string,
	options?: ModelTypes["TextGenerationTask"] | undefined,
	ftModel?: string | undefined,
	testDialogs?: Array<ModelTypes["Dialog"]> | undefined
};
	["TextGenerationTask"]: {
		/** The maximum number of tokens to generate in the completion. Max is 4096 */
	max_tokens?: number | undefined,
	/** The temperature of the sampling operation. 1 means regular sampling, 0 means always take the highest score, 2.0 is getting closer to uniform probability. Default is 0.7 */
	temperature?: number | undefined,
	/** Float to define the tokens that are within the sample operation of text generation. Add tokens in the sample for more probable to least probable until the sum of the probabilities is greater than top_p. */
	top_p?: number | undefined,
	/** Number between -2.0 and 2.0. Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim. */
	frequency_penalty?: number | undefined,
	/** Number between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear in the text so far, increasing the model's likelihood to talk about new topics. */
	presence_penalty?: number | undefined
};
	["CreateIsolatedContext"]: {
	gpt: ModelTypes["GPT35_Input"],
	name: string
};
	["AddDialogInput"]: {
	messages: Array<ModelTypes["GPT35_Message"]>,
	editedContext?: Array<ModelTypes["GPT35_Message"]> | undefined,
	dialogName: string,
	contextId: string
};
	["UpdateDialogInput"]: {
	messages?: Array<ModelTypes["GPT35_Message"]> | undefined,
	editedContext?: Array<ModelTypes["GPT35_Message"]> | undefined,
	dialogName?: string | undefined,
	contextId?: string | undefined
};
	["UpdateIsolatedContext"]: {
	gpt?: ModelTypes["GPT35_Input"] | undefined,
	name?: string | undefined
};
	["FineTuneJob"]: {
		_id: string,
	contextId: string,
	contextName?: string | undefined,
	job_id?: string | undefined,
	createdAt: string,
	training_file_id: string,
	model_name?: string | undefined,
	model_id?: string | undefined,
	status: ModelTypes["FineTuneJobStatus"],
	org_id?: string | undefined,
	n_epochs?: number | undefined,
	job_error?: string | undefined
};
	["IsolatedContextNetwork"]: {
		contexts?: Array<ModelTypes["IsolatedConversationalContext"]> | undefined,
	_id: string,
	creatorId?: string | undefined,
	createdAt: string,
	networks?: Array<ModelTypes["IsolatedContextNetwork"]> | undefined,
	name: string,
	system?: string | undefined
};
	["CreateIsolatedNetwork"]: {
	contexts?: Array<string> | undefined,
	networks?: Array<string> | undefined,
	name: string,
	system?: string | undefined
};
	["IsolatedGPTNetworkQuery"]: {
		createIsolatedNetwork?: string | undefined,
	removeIsolatedNetwork?: boolean | undefined,
	listIsolatedNetworks?: Array<ModelTypes["IsolatedContextNetwork"]> | undefined,
	/** Query isolated network of isolated contexts to get the right data from information context cloud */
	queryIsolatedNetwork: ModelTypes["NetworkResponse"],
	updateIsolatedNetwork?: boolean | undefined,
	previewIsolatedNetwork: ModelTypes["IsolatedContextNetwork"]
};
	["UpdateIsolatedNetwork"]: {
	contexts?: Array<string> | undefined,
	networks?: Array<string> | undefined,
	name?: string | undefined,
	system?: string | undefined
};
	/** Response from gpt network */
["NetworkResponse"]: {
		/** Response from orchestrator */
	gpt?: ModelTypes["GPT35_Response"] | undefined,
	/** response with raw data same as received by network orchestrator */
	rawResponse?: string | undefined
};
	["FineTuneJobStatus"]:FineTuneJobStatus;
	["LLamaV2Input"]: {
	userMessage: string,
	options?: ModelTypes["LLamaV2_Options"] | undefined
};
	/** LLama v2 Options */
["LLamaV2_Options"]: {
	/** The maximum number of tokens to generate in the completion. Max is 4096 */
	max_length?: number | undefined,
	/** The temperature of the sampling operation. 1 means regular sampling, 0 means always take the highest score, 2.0 is getting closer to uniform probability. Default is 0.7 */
	temperature?: number | undefined,
	/** Float to define the tokens that are within the sample operation of text generation. Add tokens in the sample for more probable to least probable until the sum of the probabilities is greater than top_p. */
	top_p?: number | undefined,
	/** Number between -2.0 and 2.0. Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim. */
	repetition_penalty?: number | undefined
};
	["schema"]: {
	query?: ModelTypes["Query"] | undefined,
	mutation?: ModelTypes["Mutation"] | undefined
}
    }

export type GraphQLTypes = {
    /** Main query */
["Query"]: {
	__typename: "Query",
	/** query to use with "Key" and "Team" headers */
	ai: GraphQLTypes["AIQuery"],
	getFilePutURL: GraphQLTypes["UploadFileResponse"],
	getFileURL?: string | undefined,
	apiKeys?: Array<GraphQLTypes["APIKey"]> | undefined,
	styleTemplate?: GraphQLTypes["StyleTemplate"] | undefined,
	styleTemplates?: Array<GraphQLTypes["StyleTemplate"]> | undefined
};
	["Mutation"]: {
	__typename: "Mutation",
	createStyleTemplate: string,
	editStyleTemplate?: boolean | undefined,
	deleteStyleTemplate?: boolean | undefined,
	generateAPIKey: string,
	/** Delete and revokes the API Key. */
	deleteAPIKey?: boolean | undefined
};
	["CreateStyleTemplate"]: {
		name: string,
	/** system message with variables preceded with $ sign
e.g. "Hello $name" */
	prompt: string,
	negative_prompt: string,
	description?: string | undefined,
	variables: Array<string>
};
	["EditStyleTemplate"]: {
		name?: string | undefined,
	/** system message with variables preceded with $ sign
e.g. "Hello $name" */
	prompt?: string | undefined,
	negative_prompt?: string | undefined,
	description?: string | undefined,
	variables?: Array<string> | undefined
};
	["Vars"]: "scalar" & { name: "Vars" };
	["FileInput"]: {
		fileKey: string,
	contentType: string
};
	["UploadFileResponse"]: {
	__typename: "UploadFileResponse",
	fileKey: string,
	putUrl: string
};
	/** Text Generation Task:
Use to continue text from a prompt. This is a very generic task. */
["TextGenerationTask_Input"]: {
		/** The maximum number of tokens to generate in the completion. Max is 4096 */
	max_tokens?: number | undefined,
	/** The temperature of the sampling operation. 1 means regular sampling, 0 means always take the highest score, 2.0 is getting closer to uniform probability. Default is 0.7 */
	temperature?: number | undefined,
	/** Float to define the tokens that are within the sample operation of text generation. Add tokens in the sample for more probable to least probable until the sum of the probabilities is greater than top_p. */
	top_p?: number | undefined,
	/** Number between -2.0 and 2.0. Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim. */
	frequency_penalty?: number | undefined,
	/** Number between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear in the text so far, increasing the model's likelihood to talk about new topics. */
	presence_penalty?: number | undefined
};
	["ImageGeneration_Input"]: {
		/** a string to be generated from */
	prompt: string,
	negative_prompt?: string | undefined,
	width?: number | undefined,
	height?: number | undefined,
	seed?: number | undefined
};
	["AladirikImageEdition_Input"]: {
		/** a string to be generated from */
	prompt: string,
	negative_prompt?: string | undefined,
	width?: number | undefined,
	height?: number | undefined,
	random_seed?: number | undefined,
	image?: string | undefined,
	scheduler?: GraphQLTypes["SchedulerForAladirik"] | undefined,
	max_tokens?: number | undefined
};
	["ImageEdition_Input"]: {
		/** a string to be generated from */
	prompt: string,
	negative_prompt?: string | undefined,
	width?: number | undefined,
	height?: number | undefined,
	seed?: number | undefined,
	image?: string | undefined,
	scheduler?: GraphQLTypes["SchedulerFotTimothybrooks"] | undefined,
	max_tokens?: number | undefined
};
	["SchedulerFotTimothybrooks"]: SchedulerFotTimothybrooks;
	["SchedulerForAladirik"]: SchedulerForAladirik;
	["Image"]: "scalar" & { name: "Image" };
	/** Every generated image is stored on S3 Like back-end */
["GeneratedImage"]: {
	__typename: "GeneratedImage",
	createdAt: string,
	prompt: string,
	_id: string,
	creatorId?: string | undefined,
	model?: string | undefined,
	url?: string | undefined,
	thumbnailUrl?: string | undefined,
	placeholderBase64?: string | undefined,
	key: string,
	thumbnailKey?: string | undefined,
	imageType?: GraphQLTypes["ImageType"] | undefined
};
	["ImageType"]: ImageType;
	/** Filter for searching history of generated prompts and images */
["PromptFilter"]: {
		/** Date in ISO format */
	from?: string | undefined,
	/** Date in ISO format */
	to?: string | undefined,
	query?: string | undefined
};
	["StyleTemplate"]: {
	__typename: "StyleTemplate",
	_id: string,
	name: string,
	/** system message with variables preceded with $ sign
e.g. "Hello $name" */
	prompt: string,
	negative_prompt: string,
	/** keys of the variables used in the message
e.g. ["name"] */
	description?: string | undefined,
	variables: Array<string>,
	createdAt: string
};
	/** queries for different models responsible for image generation */
["ImageGenerationQuery"]: {
	__typename: "ImageGenerationQuery",
	/** ## Model Description

Welcome to Anything V4 - a latent diffusion model for weebs. 
The newest version of Anything. This model is intended to produce high-quality, highly detailed anime style 
with just a few prompts. Like other anime-style Stable Diffusion models, 
it also supports danbooru tags to generate images.

e.g. 1girl, white hair, golden eyes, beautiful eyes, detail, flower meadow, cumulonimbus clouds, lighting, 
detailed sky, garden */
	anythingv4dot0: GraphQLTypes["Image"],
	/** ## Model Description

This is a model that can be used to generate and modify images based on text prompts. 
It is a Latent Diffusion Model that uses a fixed, pretrained text encoder (OpenCLIP-ViT/H). */
	stableDiffusion21: GraphQLTypes["Image"],
	/** ## Model Description

Openjourney is an open source Stable Diffusion fine tuned model on Midjourney images, by PromptHero */
	openJourney: GraphQLTypes["Image"],
	/** ## Model Description

Dalle is a first class model from OpenAI */
	dalle: GraphQLTypes["Image"],
	/** ## Model Description

text2img model trained on LAION HighRes and fine-tuned on internal datasets */
	kandinsky2: GraphQLTypes["Image"],
	/** ## Model Description

Image Restoration Using Swin Transformer */
	swinir: GraphQLTypes["Image"],
	/** ## Models Description

Models for Archrenderer */
	qr2aiOutline: GraphQLTypes["Image"],
	alaradirikDepthMidas: GraphQLTypes["Image"],
	alaradirikLineart: GraphQLTypes["Image"],
	timothybrooksPix2pix: GraphQLTypes["Image"]
};
	["ImageRestoration_Input"]: {
		name: string,
	fileURL: string,
	taskType: GraphQLTypes["TaskType"]
};
	["TaskType"]: TaskType;
	["ConversationalQuery"]: {
	__typename: "ConversationalQuery",
	/** Receive immediate response from GTP 35 turbo API */
	chatGPT35Turbo: GraphQLTypes["GPT35_Response"],
	/** Set of queries for isolated contexts */
	isolatedGPT35Turbo: GraphQLTypes["IsolatedGPT35TurboQuery"],
	isolatedGPT35TurboMutation: GraphQLTypes["IsolatedGPT35TurboMutation"],
	/** Set of queries for networks */
	isolatedNetworkOps: GraphQLTypes["IsolatedGPTNetworkQuery"],
	llamaV2?: string | undefined
};
	["OngoingConversation"]: {
	__typename: "OngoingConversation",
	messages: Array<GraphQLTypes["ConversationMessage"]>,
	createdAt: string,
	_id: string
};
	["ConversationMessage"]: {
	__typename: "ConversationMessage",
	message: string,
	role: string,
	createdAt: string
};
	["Dialog"]: {
	__typename: "Dialog",
	_id: string,
	createdAt: string,
	updatedAt: string,
	contextId: string,
	creatorId?: string | undefined,
	dialogName: string,
	messages?: Array<GraphQLTypes["GPT35_MessageResponse"]> | undefined,
	editedContext?: Array<GraphQLTypes["GPT35_MessageResponse"]> | undefined
};
	["TextDocument"]: {
	__typename: "TextDocument",
	content: string,
	createdAt: string,
	updatedAt: string,
	_id: string
};
	["GPT35_Message"]: {
		content: string,
	role: GraphQLTypes["GPT35_Role"]
};
	["GPT35_Role"]: GPT35_Role;
	["GPT35_Input"]: {
		messages: Array<GraphQLTypes["GPT35_Message"]>,
	user?: string | undefined,
	options?: GraphQLTypes["TextGenerationTask_Input"] | undefined
};
	["GPT35_MessageResponse"]: {
	__typename: "GPT35_MessageResponse",
	content: string,
	role: GraphQLTypes["GPT35_Role"]
};
	["GPT35_Response"]: {
	__typename: "GPT35_Response",
	createdAt: string,
	message: GraphQLTypes["GPT35_MessageResponse"]
};
	["APIKey"]: {
	__typename: "APIKey",
	name: string,
	createdAt: string,
	_id: string,
	openAiKey: string,
	replicateKey: string
};
	["MongoStored"]: {
	__typename:"GeneratedImage" | "StyleTemplate" | "OngoingConversation" | "Dialog" | "TextDocument" | "APIKey" | "FineTuneJob" | "IsolatedContextNetwork",
	_id: string,
	createdAt?: string | undefined
	['...on GeneratedImage']: '__union' & GraphQLTypes["GeneratedImage"];
	['...on StyleTemplate']: '__union' & GraphQLTypes["StyleTemplate"];
	['...on OngoingConversation']: '__union' & GraphQLTypes["OngoingConversation"];
	['...on Dialog']: '__union' & GraphQLTypes["Dialog"];
	['...on TextDocument']: '__union' & GraphQLTypes["TextDocument"];
	['...on APIKey']: '__union' & GraphQLTypes["APIKey"];
	['...on FineTuneJob']: '__union' & GraphQLTypes["FineTuneJob"];
	['...on IsolatedContextNetwork']: '__union' & GraphQLTypes["IsolatedContextNetwork"];
};
	["AIQuery"]: {
	__typename: "AIQuery",
	/** queries responsible for generation of images */
	imageGeneration: GraphQLTypes["ImageGenerationQuery"],
	/** All conversational queries */
	conversational: GraphQLTypes["ConversationalQuery"],
	/** queries to fetch assets from backend */
	assets: GraphQLTypes["AssetsQuery"]
};
	["AssetsQuery"]: {
	__typename: "AssetsQuery",
	/** Images generated from multiple image models, stored in S3 Digital Ocean Spaces. */
	images?: Array<GraphQLTypes["GeneratedImage"]> | undefined,
	conversations?: Array<GraphQLTypes["OngoingConversation"]> | undefined,
	textDocuments?: Array<GraphQLTypes["TextDocument"]> | undefined,
	removeImage?: boolean | undefined
};
	["CreateAPIKey"]: {
		name: string,
	openAiKey: string,
	replicateKey: string
};
	/** Isolated conversation means that you will get conversation Id on the first call and then  */
["IsolatedGPT35TurboMutation"]: {
	__typename: "IsolatedGPT35TurboMutation",
	createIsolatedContext: string,
	/** use context created with createIsolatedContext. Useful for creating knowledge bases */
	fineTuningIsolatedContext: string,
	addDialog: string,
	updateDialog: boolean,
	removeDialog: boolean,
	fineTuningWithFile: string,
	deleteFineTuneModel: boolean,
	updateFineTuneModel: boolean,
	updateIsolatedContext?: boolean | undefined,
	removeIsolatedContext?: boolean | undefined
};
	["IsolatedGPT35TurboQuery"]: {
	__typename: "IsolatedGPT35TurboQuery",
	getFineTuneJobs?: Array<GraphQLTypes["FineTuneJob"]> | undefined,
	retrieveJob: GraphQLTypes["FineTuneJob"],
	useIsolatedContext: GraphQLTypes["GPT35_Response"],
	previewIsolatedContext: GraphQLTypes["IsolatedConversationalContext"],
	listIsolatedContexts: Array<GraphQLTypes["IsolatedConversationalContext"]>,
	listDialogs?: Array<GraphQLTypes["Dialog"]> | undefined,
	/** This is used for feeding the information to GPT contexts and this is its only function */
	chatGPT35TurboInformationFeed: GraphQLTypes["GPT35_Response"]
};
	["IsolatedConversationalContext"]: {
	__typename: "IsolatedConversationalContext",
	messages: Array<GraphQLTypes["GPT35_MessageResponse"]>,
	createdAt: string,
	_id: string,
	creatorId?: string | undefined,
	name: string,
	options?: GraphQLTypes["TextGenerationTask"] | undefined,
	ftModel?: string | undefined,
	testDialogs?: Array<GraphQLTypes["Dialog"]> | undefined
};
	["TextGenerationTask"]: {
	__typename: "TextGenerationTask",
	/** The maximum number of tokens to generate in the completion. Max is 4096 */
	max_tokens?: number | undefined,
	/** The temperature of the sampling operation. 1 means regular sampling, 0 means always take the highest score, 2.0 is getting closer to uniform probability. Default is 0.7 */
	temperature?: number | undefined,
	/** Float to define the tokens that are within the sample operation of text generation. Add tokens in the sample for more probable to least probable until the sum of the probabilities is greater than top_p. */
	top_p?: number | undefined,
	/** Number between -2.0 and 2.0. Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim. */
	frequency_penalty?: number | undefined,
	/** Number between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear in the text so far, increasing the model's likelihood to talk about new topics. */
	presence_penalty?: number | undefined
};
	["CreateIsolatedContext"]: {
		gpt: GraphQLTypes["GPT35_Input"],
	name: string
};
	["AddDialogInput"]: {
		messages: Array<GraphQLTypes["GPT35_Message"]>,
	editedContext?: Array<GraphQLTypes["GPT35_Message"]> | undefined,
	dialogName: string,
	contextId: string
};
	["UpdateDialogInput"]: {
		messages?: Array<GraphQLTypes["GPT35_Message"]> | undefined,
	editedContext?: Array<GraphQLTypes["GPT35_Message"]> | undefined,
	dialogName?: string | undefined,
	contextId?: string | undefined
};
	["UpdateIsolatedContext"]: {
		gpt?: GraphQLTypes["GPT35_Input"] | undefined,
	name?: string | undefined
};
	["FineTuneJob"]: {
	__typename: "FineTuneJob",
	_id: string,
	contextId: string,
	contextName?: string | undefined,
	job_id?: string | undefined,
	createdAt: string,
	training_file_id: string,
	model_name?: string | undefined,
	model_id?: string | undefined,
	status: GraphQLTypes["FineTuneJobStatus"],
	org_id?: string | undefined,
	n_epochs?: number | undefined,
	job_error?: string | undefined
};
	["IsolatedContextNetwork"]: {
	__typename: "IsolatedContextNetwork",
	contexts?: Array<GraphQLTypes["IsolatedConversationalContext"]> | undefined,
	_id: string,
	creatorId?: string | undefined,
	createdAt: string,
	networks?: Array<GraphQLTypes["IsolatedContextNetwork"]> | undefined,
	name: string,
	system?: string | undefined
};
	["CreateIsolatedNetwork"]: {
		contexts?: Array<string> | undefined,
	networks?: Array<string> | undefined,
	name: string,
	system?: string | undefined
};
	["IsolatedGPTNetworkQuery"]: {
	__typename: "IsolatedGPTNetworkQuery",
	createIsolatedNetwork?: string | undefined,
	removeIsolatedNetwork?: boolean | undefined,
	listIsolatedNetworks?: Array<GraphQLTypes["IsolatedContextNetwork"]> | undefined,
	/** Query isolated network of isolated contexts to get the right data from information context cloud */
	queryIsolatedNetwork: GraphQLTypes["NetworkResponse"],
	updateIsolatedNetwork?: boolean | undefined,
	previewIsolatedNetwork: GraphQLTypes["IsolatedContextNetwork"]
};
	["UpdateIsolatedNetwork"]: {
		contexts?: Array<string> | undefined,
	networks?: Array<string> | undefined,
	name?: string | undefined,
	system?: string | undefined
};
	/** Response from gpt network */
["NetworkResponse"]: {
	__typename: "NetworkResponse",
	/** Response from orchestrator */
	gpt?: GraphQLTypes["GPT35_Response"] | undefined,
	/** response with raw data same as received by network orchestrator */
	rawResponse?: string | undefined
};
	["FineTuneJobStatus"]: FineTuneJobStatus;
	["LLamaV2Input"]: {
		userMessage: string,
	options?: GraphQLTypes["LLamaV2_Options"] | undefined
};
	/** LLama v2 Options */
["LLamaV2_Options"]: {
		/** The maximum number of tokens to generate in the completion. Max is 4096 */
	max_length?: number | undefined,
	/** The temperature of the sampling operation. 1 means regular sampling, 0 means always take the highest score, 2.0 is getting closer to uniform probability. Default is 0.7 */
	temperature?: number | undefined,
	/** Float to define the tokens that are within the sample operation of text generation. Add tokens in the sample for more probable to least probable until the sum of the probabilities is greater than top_p. */
	top_p?: number | undefined,
	/** Number between -2.0 and 2.0. Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim. */
	repetition_penalty?: number | undefined
}
    }
export const enum SchedulerFotTimothybrooks {
	DDIM = "DDIM",
	K_EULER = "K_EULER",
	DPMSolverMultistep = "DPMSolverMultistep",
	K_EULER_ANCESTRAL = "K_EULER_ANCESTRAL",
	PNDM = "PNDM",
	KLMS = "KLMS"
}
export const enum SchedulerForAladirik {
	DDIM = "DDIM",
	DPMSolverMultistep = "DPMSolverMultistep",
	HeunDiscrete = "HeunDiscrete",
	KarrasDPM = "KarrasDPM",
	K_EULER_ANCESTRAL = "K_EULER_ANCESTRAL",
	K_EULER = "K_EULER",
	PNDM = "PNDM",
	LMSDiscrete = "LMSDiscrete"
}
export const enum ImageType {
	GENERATED = "GENERATED",
	UPSCALED = "UPSCALED"
}
export const enum TaskType {
	RESOLUTION_LARGE = "RESOLUTION_LARGE",
	RESOLUTION_MEDIUM = "RESOLUTION_MEDIUM"
}
export const enum GPT35_Role {
	system = "system",
	user = "user",
	assistant = "assistant"
}
export const enum FineTuneJobStatus {
	uploading = "uploading",
	validating_files = "validating_files",
	created = "created",
	queued = "queued",
	running = "running",
	succeeded = "succeeded",
	error = "error"
}

type ZEUS_VARIABLES = {
	["CreateStyleTemplate"]: ValueTypes["CreateStyleTemplate"];
	["EditStyleTemplate"]: ValueTypes["EditStyleTemplate"];
	["Vars"]: ValueTypes["Vars"];
	["FileInput"]: ValueTypes["FileInput"];
	["TextGenerationTask_Input"]: ValueTypes["TextGenerationTask_Input"];
	["ImageGeneration_Input"]: ValueTypes["ImageGeneration_Input"];
	["AladirikImageEdition_Input"]: ValueTypes["AladirikImageEdition_Input"];
	["ImageEdition_Input"]: ValueTypes["ImageEdition_Input"];
	["SchedulerFotTimothybrooks"]: ValueTypes["SchedulerFotTimothybrooks"];
	["SchedulerForAladirik"]: ValueTypes["SchedulerForAladirik"];
	["Image"]: ValueTypes["Image"];
	["ImageType"]: ValueTypes["ImageType"];
	["PromptFilter"]: ValueTypes["PromptFilter"];
	["ImageRestoration_Input"]: ValueTypes["ImageRestoration_Input"];
	["TaskType"]: ValueTypes["TaskType"];
	["GPT35_Message"]: ValueTypes["GPT35_Message"];
	["GPT35_Role"]: ValueTypes["GPT35_Role"];
	["GPT35_Input"]: ValueTypes["GPT35_Input"];
	["CreateAPIKey"]: ValueTypes["CreateAPIKey"];
	["CreateIsolatedContext"]: ValueTypes["CreateIsolatedContext"];
	["AddDialogInput"]: ValueTypes["AddDialogInput"];
	["UpdateDialogInput"]: ValueTypes["UpdateDialogInput"];
	["UpdateIsolatedContext"]: ValueTypes["UpdateIsolatedContext"];
	["CreateIsolatedNetwork"]: ValueTypes["CreateIsolatedNetwork"];
	["UpdateIsolatedNetwork"]: ValueTypes["UpdateIsolatedNetwork"];
	["FineTuneJobStatus"]: ValueTypes["FineTuneJobStatus"];
	["LLamaV2Input"]: ValueTypes["LLamaV2Input"];
	["LLamaV2_Options"]: ValueTypes["LLamaV2_Options"];
}