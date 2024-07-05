class Cf {
  constructor(
    email,
    globalAPIKey,
    workerName = "a",
    uuid = "d342d11e-d424-4583-b36e-524ab1f0afa4",
    nodeName = "worker节点"
  ) {
    this.email = email;
    this.globalAPIKey = globalAPIKey;
    this.workerName = workerName;
    this.uuid = uuid;
    this.nodeName = nodeName;

    this._http = axios.create({
      timeout: 3000,
      baseURL: "https://api.cloudflare.com/client/v4",
      headers: {
        "X-Auth-Email": email,
        "X-Auth-Key": globalAPIKey,
      },
    });
  }

  async getAccount() {
    const { data } = await this._http.get("/accounts");
    console.log(data);
    this.id = data.result[0].id;
  }

  async getSubdomain() {
    const { data } = await this._http
      .get(`/accounts/${this.id}/workers/subdomain`)
      .catch(async (e) => {
        if (e?.response?.data?.errors?.[0]?.code === 10007) {
          const res = await this._http.put(
            `/accounts/${this.id}/workers/subdomain`,
            {
              subdomain: this.email.split("@")[0],
            }
          );
          return res;
        }
      });

    console.log(data);
    this.subdomain = data.result.subdomain;
  }

  async _enableSubdomain() {
    await this._http.post(
      `/accounts/${this.id}/workers/services/${this.workerName}/environments/production/subdomain`,
      {
        enabled: true,
      }
    );
  }

  async createWorker() {
    const { data } = await this._http.put(
      `/accounts/${this.id}/workers/services/${this.workerName}/environments/production?include_subdomain_availability=true`,
      workerFormStr.replace(uuid, this.uuid),
      {
        headers: {
          "Content-Type":
            "multipart/form-data; boundary=----WebKitFormBoundarytvoThhvajRSJKhAT",
        },
      }
    );

    const host = `${this.workerName}.${this.subdomain}.workers.dev`;
    const url = `https://${host}/${this.uuid}`;
    const node = `vless://${this.uuid}@www.visa.com.sg:8880?encryption=none&security=none&type=ws&host=${host}&path=%2F%3Fed%3D2560#${this.nodeName}`;

    console.log({ node, url });
    await this._enableSubdomain();

    return {
      url,
      node,
    };
  }
}

module.exports = {
  Cf,
};
