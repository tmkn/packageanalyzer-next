import type { AttachmentFn, INpmDownloadStatistic, Url } from "@lib/shared";

export const downloadCount: AttachmentFn<INpmDownloadStatistic> = async ({
    p,
    logger
}): Promise<INpmDownloadStatistic> => {
    const url: Url = `https://api.npmjs.org/downloads/point/last-week/${encodeURIComponent(p.name)}`;
    const response = await fetch(url);
    const data = (await response.json()) as INpmDownloadStatistic;

    logger.info(`Download count for ${p.fullName}: ${data.downloads}`);

    return data;
};
