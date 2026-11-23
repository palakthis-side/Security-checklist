import { categories } from '../data/checklistData'

const priorityOrder = ['High', 'Medium', 'Low']

function summarise(matches) {
  const completed = matches.filter((item) => item.completed).length
  return { total: matches.length, completed, remaining: matches.length - completed, percent: matches.length ? Math.round((completed / matches.length) * 100) : 0 }
}

export function getCategoryCoverage(items) {
  return categories.map((category) => ({ name: category.name, ...summarise(items.filter((item) => item.category === category.name)) })).sort((a, b) => b.percent - a.percent || a.name.localeCompare(b.name))
}

export function getPriorityCoverage(items) {
  return priorityOrder.map((priority) => ({ priority, ...summarise(items.filter((item) => item.priority === priority)) })).filter((row) => row.total > 0)
}

export function getOutstandingByCategory(items) {
  return categories.map((category) => {
    const open = items.filter((item) => item.category === category.name && !item.completed)
    return { name: category.name, high: open.filter((item) => item.priority === 'High').length, medium: open.filter((item) => item.priority !== 'High').length, total: open.length }
  }).sort((a, b) => b.high - a.high || b.total - a.total || a.name.localeCompare(b.name))
}
