const API = {
  async request(path, options = {}) {
    const headers = { ...(options.headers || {}) };
    const isFormData = options.body instanceof FormData;

    if (!isFormData && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(path, {
      ...options,
      headers,
      credentials: "same-origin",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const message = error.error || "请求失败";
      const requestError = new Error(message);
      requestError.status = response.status;
      throw requestError;
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  },

  getSiteData() {
    return this.request("/api/site-data");
  },

  getModuleEntries(moduleId) {
    return this.request(`/api/modules/${moduleId}/entries`);
  },

  createModuleEntry(moduleId, text) {
    return this.request(`/api/modules/${moduleId}/entries`, {
      method: "POST",
      body: JSON.stringify({ text }),
    });
  },

  updateModuleEntry(moduleId, entryId, text) {
    return this.request(`/api/modules/${moduleId}/entries/${entryId}`, {
      method: "PUT",
      body: JSON.stringify({ text }),
    });
  },

  deleteModuleEntry(moduleId, entryId) {
    return this.request(`/api/modules/${moduleId}/entries/${entryId}`, {
      method: "DELETE",
    });
  },

  getModuleImages(moduleId) {
    return this.request(`/api/modules/${moduleId}/images`);
  },

  uploadModuleImage(moduleId, file) {
    const formData = new FormData();
    formData.append("image", file);
    return this.request(`/api/modules/${moduleId}/images`, {
      method: "POST",
      body: formData,
    });
  },

  deleteModuleImage(moduleId, imageId) {
    return this.request(`/api/modules/${moduleId}/images/${imageId}`, {
      method: "DELETE",
    });
  },

  getResearchEntries(topicId) {
    return this.request(`/api/research/${topicId}/entries`);
  },

  createResearchTopic({ tag, title, description }) {
    return this.request("/api/research/topics", {
      method: "POST",
      body: JSON.stringify({ tag, title, description }),
    });
  },

  deleteResearchTopic(topicId) {
    return this.request(`/api/research/topics/${topicId}`, {
      method: "DELETE",
    });
  },

  createResearchEntry(topicId, text) {
    return this.request(`/api/research/${topicId}/entries`, {
      method: "POST",
      body: JSON.stringify({ text }),
    });
  },

  updateResearchEntry(topicId, entryId, text) {
    return this.request(`/api/research/${topicId}/entries/${entryId}`, {
      method: "PUT",
      body: JSON.stringify({ text }),
    });
  },

  deleteResearchEntry(topicId, entryId) {
    return this.request(`/api/research/${topicId}/entries/${entryId}`, {
      method: "DELETE",
    });
  },

  authStatus() {
    return this.request("/api/auth/status");
  },

  login(password) {
    return this.request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ password }),
    });
  },

  logout() {
    return this.request("/api/auth/logout", { method: "POST" });
  },
};
