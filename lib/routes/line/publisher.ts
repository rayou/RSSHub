import cache from '@/utils/cache';
import got from '@/utils/got';
const { baseUrl, parseList, parseItems } = require('./utils');

export default async (ctx) => {
    const { edition, id } = ctx.req.param();

    const { data: publisherInfo } = await got(`${baseUrl}/webapi/portal/page/setting`, {
        searchParams: {
            entityId: id,
            country: edition,
            pageType: 'CP',
        },
    });

    let cpLatest;
    if (edition === 'th') {
        const { data } = await got(`${baseUrl}/webapi/portal/embedded/page/cplatest`, {
            searchParams: {
                entityId: id,
                pageType: 'CP',
                country: edition,
            },
        });
        cpLatest = data;
    }

    const modules = edition === 'th' ? cpLatest.modules : publisherInfo.modules;
    const mod = modules.find((item) => item.source === 'CP_LATEST');
    const listing = mod.listings[0];

    const { data: listResponse } = await got(`${baseUrl}/webapi/trending/cp/latest/listings/${mod.id}`, {
        searchParams: {
            offset: listing.offset,
            length: listing.length,
            country: edition,
            targetContent: listing.params.targetContent,
            cps: listing.params.cps,
            publishedWithin: listing.params.publishedWithin,
        },
    });

    const list = parseList(listResponse.items);

    const items = await parseItems(list, cache.tryGet);

    ctx.set('data', {
        title: `${publisherInfo.data.name} - Line Today`,
        description: publisherInfo.data.introduction,
        image: publisherInfo.data.icon ? `https://obs.line-scdn.net/${publisherInfo.data.icon.hash}` : undefined,
        link: `${baseUrl}/${edition}/v2/publisher/${id}`,
        item: items,
    });
};
