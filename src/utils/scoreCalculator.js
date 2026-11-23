export function getStats(items) {
  const completed = items.filter((item) => item.completed).length
  const total = items.length
  const score = total ? Math.round((completed / total) * 100) : 0
  return { completed, total, remaining: total - completed, score }
}

export function getScoreLabel(score) {
  if (score >= 85) return { label: 'Secure', tone: 'secure' }
  if (score >= 60) return { label: 'Needs Attention', tone: 'attention' }
  return { label: 'At Risk', tone: 'risk' }
}
