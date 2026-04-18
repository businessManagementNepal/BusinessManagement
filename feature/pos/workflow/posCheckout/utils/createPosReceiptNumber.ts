let lastTimestamp = "";
let sequence = 0;

export const createPosReceiptNumber = (): string => {
  const timestamp = Date.now().toString().slice(-6);

  if (timestamp === lastTimestamp) {
    sequence = (sequence + 1) & 0xffff;
  } else {
    lastTimestamp = timestamp;
    sequence = 0;
  }

  const suffix = sequence.toString(16).padStart(4, "0").toUpperCase();

  return `RCPT-${timestamp}-${suffix}`;
};
