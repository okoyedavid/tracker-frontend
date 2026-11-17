import { api } from "@/api/client";
import { createTrackerApi } from "@/api/tracker";

import { createReportsApi } from "@/api/reports";
import { createReceiptStorageApi } from "@/api/receipt-storage";
export const receiptStorageApi=createReceiptStorageApi({request:api.request.bind(api)});
export const reportsApi=createReportsApi({request:api.request.bind(api)});

export const trackerApi = createTrackerApi({ request: api.request.bind(api) });

import { createAdminApi } from "@/api/admin";
export const adminApi = createAdminApi({ request: api.request.bind(api) });
