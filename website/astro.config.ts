import {defineConfig} from 'astro/config';
import starlight from '@astrojs/starlight';
import tailwind from '@astrojs/tailwind';

import {getStarlightConfig, typedocPackageConfig} from './src/typedoc';

import react from '@astrojs/react';

const {plugins, sidebar} = getStarlightConfig(typedocPackageConfig);

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'website',
			customCss: ['./src/styles/custom.css'],
			plugins,
			sidebar,
			social: {
				github: 'https://github.com/withastro/starlight',
			},
			routeMiddleware: [
				'./src/route/header.ts'
			],
			components: {
				Header: './src/components/Header.astro',
				Sidebar: './src/components/Sidebar.astro'
			},
		}),
		tailwind({
			applyBaseStyles: false
		}),
		react({
			experimentalDisableStreaming: true
		})
	],
});