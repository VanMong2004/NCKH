import api from './api';

import { mapHomeResponse } from './mappers/homeMapper';

const HOME_CACHE_TTL = 60 * 1000;
const SITE_CONTENT_CACHE_TTL = 5 * 60 * 1000;

let pendingHomeRequest = null;
let pendingSiteContentRequest = null;
let homeCache = null;
let homeCacheAt = 0;
let siteContentCache = null;
let siteContentCacheAt = 0;

const homeService = {
    async getHomeData() {
        if (homeCache && Date.now() - homeCacheAt < HOME_CACHE_TTL) {
            return homeCache;
        }

        if (!pendingHomeRequest) {
            pendingHomeRequest = api.get('/home')
                .then((res) => {
                    const data = mapHomeResponse(res.data);

                    homeCache = data;
                    homeCacheAt = Date.now();

                    return data;
                })
                .finally(() => {
                    pendingHomeRequest = null;
                });
        }

        return pendingHomeRequest;
    },

    async getSiteContent() {
        if (siteContentCache && Date.now() - siteContentCacheAt < SITE_CONTENT_CACHE_TTL) {
            return siteContentCache;
        }

        if (!pendingSiteContentRequest) {
            pendingSiteContentRequest = api.get('/site-content')
                .then((res) => {
                    const data = res.data?.data || {};
                    const mapped = data.site_content || data.siteContent || data;

                    siteContentCache = mapped;
                    siteContentCacheAt = Date.now();

                    return mapped;
                })
                .finally(() => {
                    pendingSiteContentRequest = null;
                });
        }

        return pendingSiteContentRequest;
    },
};

export default homeService;
