export interface StarlightRoute {
    sidebar: {
        label: string;
        entries: {
            entries: {
                href: string;

            }[];
        }[];
    }[];
    headerGroup: {
        title: string;
        group: {
            label: string;
            href: string;
        }[];
    }[];
}
