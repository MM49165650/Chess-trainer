// The report a problem link: a new GitHub issue, filled in with what the user
// was looking at, so the report names the game or puzzle and the move.

import { SOURCE_CODE_URL } from '@/site';

/** What a report is about: a title, and the lines that start its text. */
export type ProblemReport = {
    title: string;
    details: string[];
};

/** The address of a new issue, filled in with the report. */
export function reportUrl(report: ProblemReport): string {
    const body = [...report.details, '', 'What went wrong?', ''].join('\n');
    const query = new URLSearchParams({ title: report.title, body });

    return `${SOURCE_CODE_URL}/issues/new?${query.toString()}`;
}

/** The address of the page the user is on, without its query. */
export function pageAddress(): string {
    return `${window.location.origin}${window.location.pathname}`;
}
