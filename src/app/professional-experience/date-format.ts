export function calculateDuration(start: string, end?: string) {
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : new Date();

    let months =
        (endDate.getFullYear() - startDate.getFullYear()) * 12 +
        (endDate.getMonth() - startDate.getMonth());

    if (months < 0) return "";

    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    const yearLabel =
        years > 0 ? `${years}y` : "";

    const monthLabel =
        remainingMonths > 0
            ? `${remainingMonths}m`
            : "";

    return [yearLabel, monthLabel].filter(Boolean).join(" ");
}

export function formatDateRange(start: string, end?: string) {
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : null;

    const options: Intl.DateTimeFormatOptions = {
        month: "short",
        year: "numeric",
    };

    const startFormatted = startDate.toLocaleDateString("en-US", options);

    const endFormatted = endDate
        ? endDate.toLocaleDateString("en-US", options)
        : "Present";

    return `${startFormatted} — ${endFormatted}`;
}