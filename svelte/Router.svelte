<script context="module">
  const PLUGIN_METHOD = {
    onRouterPageMount: "onRouterPageMount",
    onMount: "onMount",
    onDestroy: "onDestroy",
  };
</script>

<script>
  import { createRouter } from "radix3";
  import { onDestroy, onMount, tick } from "svelte";
  import { ROUTE_CHANGE_EVENT } from "../lib/constants";

  import EmptySlot from "./EmptySlot.svelte";
  import PageEmpty from "./PageEmpty.svelte";

  export let features = [];
  export let plugins = [];

  function executeFromPlugins(method, ...args) {
    for (const plugin of plugins) {
      plugin[method] && plugin[method](...args);
    }
  }

  let routerContainerEl;

  const router = createRouter({
    routes: {
      "**": {
        layout: () => import("./EmptySlot.svelte"),
        component: () => import("./Page404.svelte"),
      },
    },
  });

  let currentLayoutComponent = EmptySlot;
  let currentPageComponent = PageEmpty;
  let currentRoute;

  function onAppRouteChange(event) {
    const { to } = event.detail;
    //console.log(ROUTE_CHANGE_EVENT, event);
    history.pushState({}, "", to);
    handleURL();
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
      (layout && (await layout())?.default) || EmptySlot;
    const incomingCurrentPageComponent =
      (pageComponent && (await pageComponent())?.default) || PageEmpty;

    if (incomingExec) {
      incomingExec();
    }

    if (middleware) {
      const canAccess = await middleware();
      if (!canAccess) {
        return;
      }
    }

    currentLayoutComponent = incomingCurrentLayoutComponent;
    currentPageComponent = incomingCurrentPageComponent;
    currentRoute = incomingRoute;

    await tick();
    executeFromPlugins(PLUGIN_METHOD.onRouterPageMount, {
      mountEl: routerContainerEl,
      currentRoute,
    });
  }

  let globalNavLinks = [];

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

    // Add feature nav links to global nav links
    if (Array.isArray(featureGlobalNavLinks)) {
      globalNavLinks = [
        ...globalNavLinks,
        ...featureGlobalNavLinks
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
          .filter(Boolean),
      ];
    }
  }

  async function init() {
    await Promise.all(features.map(registerFeature));
    globalNavLinks = globalNavLinks.sort((a, b) =>
      (a?.order || 0) > (b?.order || 0) ? -1 : 1
    );
    handleURL();
  }
  init();

  onMount(() => {
    window.addEventListener("popstate", handleURL);
    document.addEventListener(ROUTE_CHANGE_EVENT, onAppRouteChange);
    executeFromPlugins(PLUGIN_METHOD.onMount, { mountEl: routerContainerEl });
  });

  onDestroy(() => {
    window.removeEventListener("popstate", handleURL);
    document.removeEventListener(ROUTE_CHANGE_EVENT, onAppRouteChange);
    executeFromPlugins(PLUGIN_METHOD.onDestroy, { mountEl: routerContainerEl });
  });
</script>

<div bind:this={routerContainerEl}>
  {#if currentRoute}
    <svelte:component
      this={currentLayoutComponent}
      {globalNavLinks}
      {currentRoute}
    >
      <svelte:component this={currentPageComponent} route={currentRoute} />
    </svelte:component>
  {/if}
</div>
