import Notification from '../models/Notification.js';

// Fire-and-forget: a failed notification must never break the request that triggered it
export const notify = async (recipient, { type = 'info', title, body, link }) => {
  if (!recipient) return;
  try {
    await Notification.create({ recipient, type, title, body, link });
  } catch (err) {
    console.error('Notification failed:', err.message);
  }
};

export const notifyMany = (recipients, payload) => Promise.all(recipients.map((r) => notify(r, payload)));
