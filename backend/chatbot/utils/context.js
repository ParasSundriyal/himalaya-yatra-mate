const userContext = Object.create(null);

function resolveUserKey(userId) {
  if (!userId || typeof userId !== 'string') {
    return 'anonymous';
  }
  return userId;
}

export function getLastIntent(userId) {
  const key = resolveUserKey(userId);
  return userContext[key]?.lastIntent || null;
}

export function setLastIntent(userId, intent) {
  const key = resolveUserKey(userId);
  userContext[key] = { lastIntent: intent };
}
