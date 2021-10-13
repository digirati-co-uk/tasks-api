import { TestcontainersEnvironment } from '@trendyol/jest-testcontainers';
import { createPool, DatabasePoolType } from 'slonik';
import { Migration, setupSlonikMigrator, SlonikMigrator } from '@slonik/migrator';
import getPort from 'get-port';
import path from 'path';
import { Server, IncomingMessage } from 'http';
import { createApp } from './src/app';
import Koa, { Response } from 'koa';
import { mockJWT } from './src/utility/mock-jwt';
import { Transform } from 'stream';
// @ts-ignore
import MockReq from 'mock-req';
// @ts-ignore
import MockRes from 'mock-res';
import compose from 'koa-compose';

type NewIncomingMessage = IncomingMessage & Transform;

type MiniApi = {
  get(endpoint: string): Promise<Response>;
  delete(endpoint: string): Promise<Response>;
  post(endpoint: string, data?: any): Promise<Response>;
  put(endpoint: string, data?: any): Promise<Response>;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Global {
      postgres: DatabasePoolType;
      makeRequest: (
        requestOptions: {
          method: string;
          url: string;
          headers?: Record<string, string>;
        },
        user?: Partial<{ name: string; scope: string; iss: string; sub: string }>,
        cb?: (req: NewIncomingMessage) => void | Promise<void>
      ) => Promise<Koa.Response>;
      setApp: (setup: (config: any) => Koa | Promise<Koa>) => Promise<void>;
      asAdmin: MiniApi;
      asUser: (user: Partial<{ name: string; scope: string; iss: string; sub: string }>) => MiniApi;
      __TESTCONTAINERS__: Array<any>;
      __TESTCONTAINERS_POSTGRES_IP__: string;
      __TESTCONTAINERS_POSTGRES_NAME__: string;
      __TESTCONTAINERS_POSTGRES_PORT_5432__: number;
    }
  }
}

class TaskAPIEnvironment extends TestcontainersEnvironment {
  migrator?: SlonikMigrator;
  serverListener?: Server;
  migrations: Migration[] = [];
  app?: Koa;
  postgresUri!: string;

  async setup() {
    await super.setup();

    const host = this.global.__TESTCONTAINERS_POSTGRES_IP__;
    const port = this.global.__TESTCONTAINERS_POSTGRES_PORT_5432__;

    // @ts-ignore
    this.postgresUri = `postgresql://postgres:postgres@${host}:${port}/postgres`;
    const slonik = createPool(this.postgresUri);

    this.migrator = setupSlonikMigrator({
      migrationsPath: path.join(process.cwd(), '/migrations'),
      slonik,
      mainModule: module,
      log: () => {
        //...
      },
    });

    this.migrations = await this.migrator.up();

    this.global.setApp = async cb => {
      await this.setApp(
        await cb({
          postgres: this.postgresUri,
          env: 'test',
          queueList: [],
          migrate: false,
        })
      );
    };

    // Set up globals.
    this.global.postgres = slonik;
    this.global.makeRequest = async (
      requestOptions: {
        method: string;
        url: string;
      },
      user?: Partial<{ name: string; scope: string; iss: string; sub: string }>,
      cb?: (req: NewIncomingMessage) => void | Promise<void>
    ) => {
      const req = new MockReq(requestOptions);
      req.headers.Accept = req.headers.accept = 'application/json';
      req.headers['content-type'] = req.headers['Content-Type'] = 'application/json';
      req.headers['transfer-encoding'] = req.headers['Transfer-Encoding'] = 'chunked';
      req.headers.authorization = req.headers.Authorization = `Bearer ${mockJWT({
        name: 'admin',
        scope: 'tasks.admin',
        iss: 'urn:madoc:site:456',
        sub: 'urn:madoc:user:123',
        ...(user || {}),
      })}`;
      const res = new MockRes();

      req.rawHeaders.push('Authorization', 'Content-Type', 'Accept', 'Transfer-Encoding');

      if (cb) {
        await cb(req as NewIncomingMessage);
      }

      const app = await this.getApp();

      const fn = compose(app.middleware);
      const ctx = app.createContext(req, res);
      await (app as any).handleRequest(ctx, fn);

      if (ctx.response.body && ctx.response.is('application/json')) {
        ctx.response.body = JSON.parse(ctx.response.body);
      }

      return ctx.response;
    };

    this.global.asUser = (user: Partial<{ name: string; scope: string; iss: string; sub: string }>) => {
      return {
        get: (url: string) => {
          return this.global.makeRequest(
            {
              method: 'GET',
              url,
            },
            user
          );
        },
        put: (url: string, data?: any) => {
          return this.global.makeRequest(
            {
              method: 'PUT',
              url,
            },
            user,
            req => {
              if (data) {
                req.write(data);
              }
              req.end();
            }
          );
        },
        post: (url: string, data?: any) => {
          return this.global.makeRequest(
            {
              method: 'POST',
              url,
            },
            user,
            req => {
              if (data) {
                req.write(data);
              }
              req.end();
            }
          );
        },
        delete: (url: string) => {
          return this.global.makeRequest(
            {
              method: 'DELETE',
              url,
            },
            user
          );
        },
      };
    };

    this.global.asAdmin = this.global.asUser({});
  }

  async setApp(app: Koa) {
    // Stop existing
    await this.stopApp();
    const tasksPort = await getPort();
    this.serverListener = app.listen(tasksPort);
    this.global.tasksPort = tasksPort;
    this.global.tasksApp = app;
    this.app = app;
  }

  async getApp() {
    if (!this.app) {
      const app = await createApp({
        postgres: this.postgresUri,
        env: 'test',
        queueList: [],
        migrate: false,
      });

      await this.setApp(app);

      return app;
    }

    return this.app as Koa;
  }

  async stopApp() {
    await new Promise(resolve => {
      if (this.serverListener) {
        this.serverListener.close(() => {
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  async teardown() {
    await super.teardown();

    await this.stopApp();
    if (this.migrator) {
      for (const migration of this.migrations.reverse()) {
        await this.migrator.down(migration.file);
      }
    }
  }
}

module.exports = TaskAPIEnvironment;
