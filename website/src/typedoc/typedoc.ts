import type { StarlightPlugin } from '@astrojs/starlight/types';
import { createStarlightTypeDocPlugin } from 'starlight-typedoc'
import type {
  StarlightTypeDocOptions
} from 'starlight-typedoc'

export function getStarlightConfig(packageConfig: StarlightTypeDocOptions[]) {

  const plugins: StarlightPlugin[] = [];
  const sidebar: Array<ReturnType<typeof createStarlightTypeDocPlugin>[1]> = [];

  packageConfig.forEach((config) => {
    const [starlightTypeDoc, typeDocSidebarGroup] = createStarlightTypeDocPlugin();

    plugins.push(starlightTypeDoc(config));
    sidebar.push(typeDocSidebarGroup);
  });

  return {
    plugins,
    sidebar
  }
}
