import { createRouter as createRadixRouter } from "radix3";
import { ROUTE_CHANGE_EVENT } from "./constants";

const PLUGIN_METHOD = {
  onRouterPageMount: "onRouterPageMount",
  onMount: "onMount",
  onDestroy: "onDestroy",
};

export default function createRouter({
  features,
  plugins,
  emptyLayoutComponent,
  emptyPageComponent,
  errorPageComponent,
  onNewRoute,
}) {
  const router = createRadixRouter({
    routes: {
      "**": {
        layout: emptyLayoutComponent,
        component: errorPageComponent,
      },
    },
  });

  function onAppRouteChange(event) {
    const { to } = event.detail;
    //console.log(ROUTE_CHANGE_EVENT, event);
    history.pushState({}, "", to);
    handleURL();
  }

  function executeFromPlugins(method, ...args) {
    for (const plugin of plugins) {
      plugin[method] && plugin[method](...args);
    }
  }

  async function handleURL() {
    const incomingRoute = router.lookup(location.pathname);
    console.info("incomingRoute", incomingRoute);
    if (!incomingRoute) {
      throw new Error("No route found for path: " + location.pathname);
    }

    const {
      exec,
      layout,
      component: pageComponent,
      middleware,
    } = incomingRoute;

    const incomingExec = exec;
    const incomingCurrentLayoutComponent =
      (layout && (await layout())?.default) || emptyLayoutComponent;
    const incomingCurrentPageComponent =
      (pageComponent && (await pageComponent())?.default) || emptyPageComponent;

    if (incomingExec) {
      incomingExec();
    }

    if (middleware) {
      const canAccess = await middleware();
      if (!canAccess) {
        return;
      }
    }

    onNewRoute({
      layoutComponent: incomingCurrentLayoutComponent,
      pageComponent: incomingCurrentPageComponent,
      route: incomingRoute,
      onRouterPageMount(routerContainerEl, currentRoute) {
        executeFromPlugins(PLUGIN_METHOD.onRouterPageMount, {
          mountEl: routerContainerEl,
          currentRoute,
        });
      },
    });
  }

  async function registerFeature(feature) {
    const {
      routes,
      layout,
      globalNavLinks: featureGlobalNavLinks,
      middleware,
    } = await feature();

    // Add feature routes to router
    for (const route of routes) {
      router.insert(route.path, { layout, middleware, ...route });
    }

    const navLinks = Array.isArray(featureGlobalNavLinks)
      ? featureGlobalNavLinks
          .map((navLink) => {
            const matchRoute = router.lookup(navLink.href);
            if (matchRoute) {
              return {
                ...navLink,
                routeId: matchRoute.id,
              };
            } else {
              console.warn(`No route found for nav link: ${navLink.href}`);
            }
          })
          .filter(Boolean)
      : [];

    return {
      navLinks,
    };
  }

  return {
    async init() {
      const featureResults = await Promise.all(features.map(registerFeature));

      const globalNavLinks = featureResults
        .reduce((acc, { navLinks }) => [...acc, ...navLinks], [])
        .sort((a, b) => ((a?.order || 0) > (b?.order || 0) ? -1 : 1));
      console.log({ globalNavLinks });
      handleURL();

      return { globalNavLinks };
    },
    mount(routerContainerEl) {
      window.addEventListener("popstate", handleURL);
      document.addEventListener(ROUTE_CHANGE_EVENT, onAppRouteChange);
      executeFromPlugins(PLUGIN_METHOD.onMount, { mountEl: routerContainerEl });
    },
    destroy(routerContainerEl) {
      window.removeEventListener("popstate", handleURL);
      document.removeEventListener(ROUTE_CHANGE_EVENT, onAppRouteChange);
      executeFromPlugins(PLUGIN_METHOD.onDestroy, {
        mountEl: routerContainerEl,
      });
    },
  };
}
