import type { StarlightTypeDocOptions } from 'starlight-typedoc';

const singlePackagesPath = 'single-packages';
const multiPackagesPath = '../multi-packages';
const basePath = '../packages';

const result: {
  entryPoints: string[];
  name: string;
  readme: string;
}[] = [
    {
      entryPoints: ['src/gridstack.ts'],
      name: 'gridstackjs',
      readme: 'README.md',
    },
    {
      entryPoints: ['src/index.ts'],
      name: 'ms',
      readme: 'readme.md',
    }
  ];

export const typedocPackageConfig: StarlightTypeDocOptions[] = result.map(config => {

  const url = `${basePath}/${singlePackagesPath}/${config.name}`;

  return {
    entryPoints: config.entryPoints.map(entry => {
      return `${url}/${entry}`
    }),
    output: `library-api/${config.name}`,
    pagination: true,
    sidebar: {
      collapsed: true,
      label: config.name,
    },
    tsconfig: `${url}/tsconfig.json`,
    typeDoc: {
      readme: `${url}/${config.readme}`,
    },
    name: config.name,
  };
});
