import api from './api';

import { mapHomeResponse } from './mappers/homeMapper';

const homeService = {
    async getHomeData() {
        const res = await api.get('/home');
        return mapHomeResponse(res.data);
    },
};

export default homeService;
