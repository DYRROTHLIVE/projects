const makeModel = () => ({
  findMany: async () => [],
  findUnique: async () => null,
  findFirst: async () => null,
  count: async () => 0,
  groupBy: async () => [],
  create: async () => null,
  update: async () => null,
  delete: async () => null,
  deleteMany: async () => ({ count: 0 }),
  upsert: async () => null,
});

const dbProxy = new Proxy(
  {},
  {
    get(_target, prop) {
      if (prop === "$queryRaw") return async () => [];
      if (prop === "$transaction") return async (callback: (tx: any) => unknown) => callback(dbProxy);
      if (prop === "user" || prop === "project" || prop === "favorite" || prop === "report" || prop === "auditLog" || prop === "category" || prop === "storedFile" || prop === "campaign" || prop === "sponsor" || prop === "siteSettings" || prop === "sEOSettings" || prop === "projectVersion" || prop === "analyticsEvent" || prop === "downloadEvent") {
        return makeModel();
      }
      return (..._args: any[]) => Promise.resolve(null);
    },
  },
);

export const db = dbProxy as any;
