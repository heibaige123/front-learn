import type {StarlightRouteData} from '@astrojs/starlight/route-data';

export interface StarlightRoute extends StarlightRouteData {
    headerGroup: {
        title: string;
        group: {
            label: string;
            href: string;
        }[];
    }[];

    title: string;
}
