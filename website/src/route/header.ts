import {defineRouteMiddleware} from '@astrojs/starlight/route-data';
import type {StarlightRoute} from '../../types';
import {getPackageMd} from './utils';

export const onRequest = defineRouteMiddleware((context) => {
    const {sidebar, slug} = context.locals.starlightRoute as StarlightRoute;

    (context.locals.starlightRoute as StarlightRoute).headerGroup =
        (context.locals.starlightRoute as StarlightRoute).headerGroup || [];
    (context.locals.starlightRoute as StarlightRoute).headerGroup.push(getHeaderApiGroup(sidebar));

    const api = slug?.split('/')?.[1];
    for (let i = 0, len = sidebar.length; i < len; i++) {
        const entry = sidebar[i];

        if (entry?.label === api) {
            const md = getPackageMd(entry.label);

            if (md.length && sidebar[i].entries) {
                sidebar[i].entries = md.concat(sidebar[i].entries);
            }

            context.locals.starlightRoute.sidebar = sidebar[i].entries as any;
            break;
        }
    }

    (context.locals.starlightRoute as StarlightRoute).title = api;
});

function getHeaderApiGroup(sidebar: StarlightRoute['sidebar']) {
    const apiGroup: {
        label: string;
        href: string;
    }[] = [];

    sidebar.forEach((entry) => {
        const href = entry?.entries[0]?.entries[0]?.href;

        if (!href) {
            return;
        }

        const {label} = entry;

        apiGroup.push({
            label,
            href
        });
    });

    return {
        title: 'API',
        group: apiGroup
    };
}
