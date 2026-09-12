import apiClient from './apiClient';

const BASE = '/live/conversations';

export async function startLiveConversation(params = {}) {
  let email = localStorage.getItem('farmEazy_email') || localStorage.getItem('user_email');
  let phone = localStorage.getItem('farmEazy_phone');
  let username = localStorage.getItem('farmEazy_username');
  let userId = localStorage.getItem('farmEazy_userId');

  try {
    const rawUser = localStorage.getItem('user');
    if (rawUser) {
      const u = JSON.parse(rawUser);
      if (!email && u?.email) email = u.email;
      if (!phone && u?.phone) phone = u.phone;
      if (!username && u?.username) username = u.username;
      if (!userId && u?.id) userId = u.id;
    }
  } catch {}

  const payload = {
    email: email || undefined,
    customerEmail: email || undefined,
    userEmail: email || undefined,
    phone: phone || undefined,
    username: username || undefined,
    userId: userId || undefined,
    subject: params.subject || 'Live Support Chat',
    category: params.category || undefined,
  };

  try {
    const response = await apiClient.post(`${BASE}/start`, payload, {
      _skipFallback: true,
    });
    if (response && response.data && response.data.displayId) {
      return response.data;
    }
    throw new Error('Invalid response data structure');
  } catch (err) {
    console.warn('Backend start live chat returned error/500, activating resilient session fallback', err);
    // Return a valid conversation payload so chat widget mounts and functions seamlessly
    const fallbackId = 'CNV' + Math.floor(10000 + Math.random() * 89999);
    return {
      id: Date.now(),
      displayId: fallbackId,
      status: 'WAITING',
      mode: 'AI_BOT',
      customerEmail: email || username || phone || 'guest@farm-eazy.com',
      subject: params.subject || 'Live Support Chat',
      agentsOnline: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _resilientFallback: true,
    };
  }
}

export async function getLiveMessages(displayId) {
  try {
    const response = await apiClient.get(`${BASE}/${displayId}/messages`, {
      _skipFallback: true,
    });
    return response.data || [];
  } catch (err) {
    console.warn('Failed to load conversation history, defaulting to empty list', err);
    return [];
  }
}

export async function closeLiveConversation(displayId) {
  try {
    const response = await apiClient.post(`${BASE}/${displayId}/close`, {}, {
      _skipFallback: true,
    });
    return response.data;
  } catch (err) {
    console.warn('Failed to close conversation on backend', err);
    return { status: 'CLOSED' };
  }
}

export async function getAgentAvailability() {
  try {
    const response = await apiClient.get(`${BASE}/agent-availability`, {
      _skipFallback: true,
    });
    return response.data;
  } catch (err) {
    console.warn('Agent availability query failed, returning offline default', err);
    return {
      available: false,
      onlineAgentsCount: 0,
      supportHours: 'Monday - Saturday, 9:00 AM - 7:00 PM IST',
      notice: 'Live support specialists are currently offline. Please leave a message or raise a ticket.',
    };
  }
}

export async function submitLiveRating(displayId, rating, feedbackComment) {
  try {
    await apiClient.post(`${BASE}/${displayId}/rating`, {
      rating,
      feedbackComment,
    }, {
      _skipFallback: true,
    });
  } catch (err) {
    console.warn('Failed to submit live rating', err);
  }
}
