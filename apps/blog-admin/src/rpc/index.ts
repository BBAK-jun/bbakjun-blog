import configureOpenAPI from './libs/open-api';
import createApp from './libs/create-app';

import uploadHistoryRouter from './routes/upload-history/upload-history.index';
import blobFilesRouter from './routes/blob-files/blob-files.index';
import newsletterRouter from './routes/newsletter/newsletter.index';
import uploadRouter from './routes/upload/upload.index';
import viewsRouter from './routes/views/views.index';
import experienceRouter from './routes/experience/experience.index';

const app = createApp();

configureOpenAPI(app);

// Register routes - uploadHistoryRouter must be first for type inference
app.route('/', uploadHistoryRouter);
app.route('/', blobFilesRouter);
app.route('/', newsletterRouter);
app.route('/', uploadRouter);
app.route('/', viewsRouter);
app.route('/', experienceRouter);

// Union type of all routers for hc client
export type BlogAdminApp = typeof app;
export const rpcApp = app;
export default app;
