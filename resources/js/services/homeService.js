import api from './api';

import { mapHomeResponse } from './mappers/homeMapper';

let pendingHomeRequest = null;
let pendingSiteContentRequest = null;

const homeService = {
    async getHomeData() {
        if (!pendingHomeRequest) {
            pendingHomeRequest = api.get('/home')
                .then((res) => mapHomeResponse(res.data))
                .finally(() => {
                    pendingHomeRequest = null;
                });
        }

        return pendingHomeRequest;
    },

    async getSiteContent() {
        if (!pendingSiteContentRequest) {
            pendingSiteContentRequest = api.get('/site-content')
                .then((res) => {
                    const data = res.data?.data || {};
                    return data.site_content || data.siteContent || data;
                })
                .finally(() => {
                    pendingSiteContentRequest = null;
                });
        }

        return pendingSiteContentRequest;
    },
};

export default homeService;
