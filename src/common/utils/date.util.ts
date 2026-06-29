const shanghaiDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const shanghaiMonthFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
});

export function formatShanghaiDate(date: Date) {
  return shanghaiDateFormatter.format(date);
}

export function formatShanghaiMonth(date: Date) {
  const parts = shanghaiMonthFormatter.formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;

  return `${year}-${month}`;
}

export function getCurrentShanghaiDate() {
  return formatShanghaiDate(new Date());
}

export function getCurrentShanghaiMonth() {
  return formatShanghaiMonth(new Date());
}
