export const validateData = (data: Record<string, string>) => {
    if (!data.username || typeof data.username !== 'string') return false
    if (!data.age || typeof data.age !== 'number') return false
    if (!data.hobbies || typeof data.hobbies !== 'string') return false
    return true
}
