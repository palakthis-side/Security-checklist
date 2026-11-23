import { checklistItems } from '../data/checklistData'

export const getChecklist = async () => checklistItems
export const getUserProgress = async () => checklistItems
export const updateChecklistProgress = async (itemId, completed) => ({ itemId, completed })
export const getRecommendations = async () => checklistItems.filter((item) => !item.completed)
export const getProfile = async () => ({ name: 'Palak', email: 'palak@example.com', created: 'March 2025' })
