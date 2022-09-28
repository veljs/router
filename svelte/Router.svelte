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
    tick,
    emptyLayoutComponent: EmptySlot,
    emptyPageComponent: PageEmpty,
    errorPageComponent: Page404,
    onNewRoute({ layoutComponent, pageComponent, route }) {
      currentLayoutComponent = layoutComponent;
      currentPageComponent = pageComponent;
      currentRoute = route;
    },
  });

  let globalNavLinks = [];

  async function init() {
    const velRouterInitialized = velRouter.init();
    globalNavLinks = velRouterInitialized.globalNavLinks;
  }

  init();

  onMount(() => {
    velRouter.mount();
  });

  onDestroy(() => {
    velRouter.destroy();
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
