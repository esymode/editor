// import * as React from "react";
import { createElement, useLayoutEffect, PropsWithChildren } from "react";
import { Route, RouteParamsSpec, SpecToType } from "typescript-safe-router";

// type Props<T extends RouteParamsSpec> = {} extends SpecToType<T>
//   ? { to: Route<T>; data?: undefined }
//   : {
//       to: Route<T>;
//       data: SpecToType<T>;
//     };

function pushRoute<T extends RouteParamsSpec>(
  route: Route<T>,
  params: SpecToType<T>
): void {
  const url = route.buildUrl(params);
  // window.history.pushState()
  window.location.hash = url;
}

function replaceByRoute<T extends RouteParamsSpec>(
  route: Route<T>,
  params: SpecToType<T>
): void {
  const url = route.buildUrl(params);
  // window.history.pushState()
  window.location.hash = url;
}

export type LinkProps<T extends RouteParamsSpec> = {
  el?: string;
  to: Route<T>;
  params: SpecToType<T>;
};

export function Link<T extends RouteParamsSpec>({
  to,
  params,
  children,
  el = "a"
}: PropsWithChildren<LinkProps<T>>) {
  return createElement(
    el,
    { href: to.buildUrl(params), onClick: () => pushRoute(to, params) },
    children
  );
}

export type RedirectProps<T extends RouteParamsSpec> = {
  to: Route<T>;
  params: SpecToType<T>;
};

export function Redirect<T extends RouteParamsSpec>({
  to,
  params
}: RedirectProps<T>) {
  useLayoutEffect(() => replaceByRoute(to, params));
  return null;
}
