import configureOpenAPI from './libs/open-api';
import createApp from './libs/create-app';

import blobFilesRouter from './routes/blob-files/blob-files.index';
import newsletterRouter from './routes/newsletter/newsletter.index';
import uploadRouter from './routes/upload/upload.index';
import viewsRouter from './routes/views/views.index';
import experienceRouter from './routes/experience/experience.index';

const app = createApp();

configureOpenAPI(app);

const routers = [
  blobFilesRouter,
  newsletterRouter,
  uploadRouter,
  viewsRouter,
  experienceRouter,
] as const;

routers.forEach(router => {
  app.route('/', router);
});

export type BlogAdminApp = (typeof routers)[number];
export const rpcApp = app;
export default app;
