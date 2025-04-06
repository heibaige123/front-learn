import {globSync} from 'glob';

export function getPackageMd(packageName: string) {
    const result: {
        type: 'link';
        label: string;
        href: string;
        attrs: {};
        bdage: undefined,
    }[] = [];

    globSync(`./src/content/docs/note/${packageName}/*`).forEach((file) => {
        const fileExt = file.split('/').pop() || '';
        const fileName = fileExt.split('.').shift() || '';

        result.push({
            type: 'link',
            label: fileName,
            href: `/note/${packageName}/${fileName}`,
            attrs: {},
            bdage: undefined,
        });
    });

    return result;
}
