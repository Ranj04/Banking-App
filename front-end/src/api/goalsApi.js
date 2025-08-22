import idOf from '../utils/idOf';

export async function listGoals() {
  try {
    const res = await fetch('/goals/list', { credentials: 'include' });
    
    if (!res.ok) {
      console.error('Failed to load goals:', res.status);
      return [];
    }
    
    const json = await res.json();
    
    if (json.success === false) {
      console.error('Failed to load goals:', json.message);
      return [];
    }
    
    const rawContainer = json?.data != null ? json.data : json; // unwrap one level
    const raw = Array.isArray(rawContainer) ? rawContainer : (Array.isArray(rawContainer?.data) ? rawContainer.data : []);
    
    return raw.map(g => {
      const name = g.name || g.goal?.name || (typeof g.goal === 'string' ? g.goal : '');
      return {
        ...g,
        name, // flatten
        _id: idOf(g._id),
        id: idOf(g._id || g.id || g),
        accountId: idOf(g.accountId || g.account?._id || g.account),
        allocatedAmount: Number(g.allocatedAmount ?? 0),
        targetAmount: g.targetAmount != null && g.targetAmount !== '' ? Number(g.targetAmount) : null,
      };
    });
  } catch (error) {
    console.error('Error loading goals:', error);
    return [];
  }
}
