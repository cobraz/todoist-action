import { promises as fs } from 'fs';
import { debug, setOutput } from '@actions/core';
import { Config } from './config';
import { invariant } from './utils';

export enum IssueState {
  /** An issue that is still open */
  Open = 'OPEN',
  /** An issue that has been closed */
  Closed = 'CLOSED',
}

export interface GithubIssue {
  todoistId?: number;
  id: string;
  number: number;
  title: string;
  url: string;
  state: IssueState;
  repo: string;
}

export interface TodoistIssue {
  id: number;
  checked: number;
}

export interface SyncStorage {
  github: GithubIssue[];
  todoist: TodoistIssue[];
}

export class Storage {
  private content: SyncStorage = { github: [], todoist: [] };
  constructor(readonly config: Config) {}

  async get(): Promise<SyncStorage> {
    if (this.config.syncContent) {
      this.content = JSON.parse(this.config.syncContent);
    } else {
      const exists = await this.hasFile(this.getFilePath());
      if (exists) {
        this.content = JSON.parse(
          await fs.readFile(this.getFilePath(), 'utf-8'),
        );
      }
    }
    return this.content;
  }

  private async hasFile(file: string) {
    return fs
      .access(file)
      .then(() => true)
      .catch(() => false);
  }

  async set(data: SyncStorage): Promise<SyncStorage> {
    const jsonData = JSON.stringify(data, null);
    debug(`Storing this object: ${jsonData}`);
    await fs.writeFile(this.getFilePath(), jsonData);
    setOutput('sync-content', jsonData);
    setOutput('has-changed', jsonData === JSON.stringify(this.content));

    return data;
  }

  private getFilePath() {
    invariant(this.config.syncFileName, 'Expect syncFileName');
    return this.config.syncFileName;
  }
}
