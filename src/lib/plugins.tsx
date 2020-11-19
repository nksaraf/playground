import importAll from "import-all.macro";
import { createComponent } from "../api";

export const registeredPlugins = {};
function registerComp(Component) {
  if (typeof Component === "function" && Component?.config?.id) {
    const { id, inputs = {}, outputs = {}, ...metadata } = Component.config;
    registeredPlugins[Component.config.id] = createComponent(
      Component.config,
      Component
    );
  } else if (Component && Component.render && Component.id) {
    registeredPlugins[Component.id] = Component;
  }
}

const plugins = importAll.sync("../plugins/*.tsx");
Object.values(plugins).forEach((plugin) => {
  Object.values(plugin).forEach((comp) => {
    registerComp(comp);
    // a
  });
});
