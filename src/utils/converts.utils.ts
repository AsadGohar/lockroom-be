export function formatBytes(bytes: number): string {
  const kilobyte = 1024;
  const megabyte = kilobyte * 1024;
  const gigabyte = megabyte * 1024;

  if (bytes < kilobyte) {
    return `${bytes} Bytes`;
  } else if (bytes < megabyte) {
    return `${(bytes / kilobyte).toFixed(2)} KB`;
  } else if (bytes < gigabyte) {
    return `${(bytes / megabyte).toFixed(2)} MB`;
  } else {
    return `${(bytes / gigabyte).toFixed(2)} GB`;
  }
}

export function getNextDate(days) {
  const currentDate = new Date();
  currentDate.setDate(currentDate.getDate() + days);
  return currentDate;
}

export function isDateMoreThanSubscription(targetDate, subscriptionPeriodInDays) {
  const currentDate: any = new Date();
  const difference = currentDate.getTime() - targetDate.getTime();
  const daysDifference = Math.round(difference / (1000 * 60 * 60 * 24));
  return daysDifference >= subscriptionPeriodInDays;
}

export function generateRandomEmail() {
  const domains = ["example.com", "test.com", "fake.com"];
  const chars = "abcdefghijklmnopqrstuvwxyz1234567890";

  let username = "";
  for (let i = 0; i < 8; i++) {
    username += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  const domain = domains[Math.floor(Math.random() * domains.length)];
  const email = `${username}@${domain}`;
  return email;
}
