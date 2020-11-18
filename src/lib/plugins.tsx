import importAll from "import-all.macro";

export const registeredPlugins = {};
function registerComp(Component) {
  const { id, inputs = {}, outputs = {}, ...metadata } = Component.config;
  registeredPlugins[Component.config.id] = {
    render: Component,
    id,
    pins: [
      ...Object.keys(inputs).map((i) => ({
        ...inputs[i],
        name: i,
        role: "input",
      })),
      ...Object.keys(outputs).map((i) => ({
        ...outputs[i],
        name: i,
        role: "output",
      })),
    ],
    type: "component",
    metadata,
  };
}

const plugins = importAll.sync("../plugins/*.tsx");
Object.values(plugins).forEach((plugin) => {
  Object.values(plugin).forEach((comp) => {
    registerComp(comp);
    // a
  });
});
