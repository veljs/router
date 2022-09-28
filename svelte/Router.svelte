<script>
  import { createRouter } from "../lib";
  import { onDestroy, onMount, tick } from "svelte";

  import EmptySlot from "./EmptySlot.svelte";
  import PageEmpty from "./PageEmpty.svelte";
  import Page404 from "./Page404.svelte";

  export let features = [];
  export let plugins = [];

  let routerContainerEl;
  let currentLayoutComponent = EmptySlot;
  let currentPageComponent = PageEmpty;
  let currentRoute;

  const velRouter = createRouter({
    features,
    plugins,
    emptyLayoutComponent: EmptySlot,
    emptyPageComponent: PageEmpty,
    errorPageComponent: Page404,
    async onNewRoute({
      layoutComponent,
      pageComponent,
      route,
      onRouterPageMount,
    }) {
      currentLayoutComponent = layoutComponent;
      currentPageComponent = pageComponent;
      currentRoute = route;
      await tick();
      onRouterPageMount(routerContainerEl, currentRoute);
    },
  });

  let globalNavLinks = [];

  async function init() {
    const velRouterInitialized = await velRouter.init();
    globalNavLinks = velRouterInitialized.globalNavLinks;
  }

  init();

  onMount(() => {
    velRouter.mount(routerContainerEl);
  });

  onDestroy(() => {
    velRouter.destroy(routerContainerEl);
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
