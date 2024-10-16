class Cf {
  constructor(
    email,
    globalAPIKey,
    workerName = "a",
    uuid = "d342d11e-d424-4583-b36e-524ab1f0afa4",
    nodeName = "worker节点",
    workerFormStr
  ) {
    this.email = email;
    this.globalAPIKey = globalAPIKey;
    this.workerName = workerName;
    this.uuid = uuid;
    this.nodeName = nodeName;
    this.workerFormStr = workerFormStr;
    this.baseURL = "https://api.cloudflare.com/client/v4";
  }

  async _fetch(url, options = {}) {
    const defaultOptions = {
      headers: {
        "X-Auth-Email": this.email,
        "X-Auth-Key": this.globalAPIKey,
        "Content-Type": "application/json",
      },
    };
    const mergedOptions = {
      ...defaultOptions,
      ...options,
      headers: { ...defaultOptions.headers, ...options.headers },
    };
    const response = await fetch(this.baseURL + url, mergedOptions);
    if (!response.ok) {
      const errorData = await response.json();
      console.error('API request failed:', response.status, errorData);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  async getAccount() {
    try {
      const data = await this._fetch("/accounts");
      console.log(data);
      this.id = data.result[0].id;
    } catch (error) {
      console.error('Error in getAccount:', error.message);
      throw error;
    }
  }

  async getSubdomain() {
    try {
      const data = await this._fetch(`/accounts/${this.id}/workers/subdomain`);
      console.log(data);
      this.subdomain = data.result.subdomain;
    } catch (error) {
      if (error.message.includes('status: 404')) {
        const res = await this._fetch(`/accounts/${this.id}/workers/subdomain`, {
          method: 'PUT',
          body: JSON.stringify({ subdomain: this.email.split("@")[0] }),
          headers: { 'Content-Type': 'application/json' }
        });
        console.log(res);
        this.subdomain = res.result.subdomain;
      } else {
        throw error;
      }
    }
  }

  async _enableSubdomain() {
    await this._fetch(
      `/accounts/${this.id}/workers/services/${this.workerName}/environments/production/subdomain`,
      {
        method: 'POST',
        body: JSON.stringify({ enabled: true }),
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  async createWorker() {
    // 使用传入的 uuid 替换 workerFormStr 中的 UUID
    const updatedWorkerFormStr = this.workerFormStr.replace(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      this.uuid
    );

    const result = await this._fetch(
      `/accounts/${this.id}/workers/services/${this.workerName}/environments/production?include_subdomain_availability=true`,
      {
        method: 'PUT',
        body: updatedWorkerFormStr,
        headers: {
          "Content-Type": "multipart/form-data; boundary=----WebKitFormBoundarytvoThhvajRSJKhAT",
        },
      }
    );

    const host = `${this.workerName}.${this.subdomain}.workers.dev`;
    const url = `https://${host}/${this.uuid}`;
    const node = `vless://${this.uuid}@www.visa.com.sg:8880?encryption=none&security=none&type=ws&host=${host}&path=%2F%3Fed%3D2560#${this.nodeName}`;

    console.log({ node, url, result });
    await this._enableSubdomain();

    return {
      url,
      node,
    };
  }
}

export { Cf };
