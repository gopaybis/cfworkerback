// const express = require("express");
import { Cf } from "./worker";

const workerUrl = 'https://raw.githubusercontent.com/gopaybis/cf/refs/heads/main/worker.js';

/**
 * Generates a multipart form data string for uploading a worker script and its metadata.
 * 
 * @param {string} workerCode - The JavaScript code of the worker to be uploaded.
 * @returns {string} - A formatted multipart form data string containing the worker code and metadata.
 */
function generateFormData(workerCode) {
  const metadata = JSON.stringify({
    compatibility_date: "2024-04-17",
    bindings: [],
    main_module: "worker.js"
  });

  return [
    '------WebKitFormBoundarytvoThhvajRSJKhAT',
    'Content-Disposition: form-data; name="worker.js"; filename="worker.js"',
    'Content-Type: application/javascript+module',
    '',
    workerCode,
    '------WebKitFormBoundarytvoThhvajRSJKhAT',
    'Content-Disposition: form-data; name="metadata"; filename="blob"',
    'Content-Type: application/json',
    '',
    metadata,
    '------WebKitFormBoundarytvoThhvajRSJKhAT--'
  ].join('\n');
}

export default async (req, res) => {
  if (req.method === 'POST') {
    try {
      const { email, globalAPIKey, workerName, uuid, nodeName } = req.body;
      console.log(req.body);

      // 获取远程 worker 代码
      const workerResponse = await fetch(workerUrl);
      if (!workerResponse.ok) {
        throw new Error(`HTTP error! status: ${workerResponse.status}`);
      }
      const workerCode = await workerResponse.text();

      // 使用新函数生成 workerFormStr
      const workerFormStr = generateFormData(workerCode);

      const cf = new Cf(email, globalAPIKey, workerName, uuid, nodeName, workerFormStr);
      await cf.getAccount();
      await cf.getSubdomain();
      const { url, node } = await cf.createWorker();
      res.status(200).json({ url, node });
    } catch (error) {
      console.error("Error in createWorker:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};
